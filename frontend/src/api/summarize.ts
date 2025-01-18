import OpenAI from "openai";
import { isChapterMatch } from "../lib/utils";

export async function summarizeText(
  text: string,
  query: string,
  apiKey: string
) {
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemini-flash-1.5",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that skims text based on user queries.",
        },
        {
          role: "user",
          content: `Text: ${text}\n\nQuery: ${query}\n\nPlease skim the text, replacing lengthy or less relevant sections with "[...]" while preserving key points and context.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error("Failed to generate summary");
  }
}

export async function summarizeChapter(
  previousSummary: string,
  chapter: string,
  apiKey: string,
  summarizeUntilChapter: string,
  tableOfContents: string[]
) {
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemini-flash-1.5-8b",
      messages: [
        {
          role: "system",
          content: `
You are a book summarization assistant. Your responsibilities:
- Identify key plot points, character developments, and important details
- Use the provided table of contents as the source of truth for chapter names
- Return the chapter name exactly as written in the Table Of Contents. If the
chapter name from the chapter text only match partially what is in the Table Of
Contents, choose the whole thing from Table Of Contents.

Inputs provided:
- Previous chapters' summary
- Current chapter text
- Table of contents

If text is not a chapter (e.g., TOC, Preface, or lacks narrative elements), return: {"notAChapter": true}

For valid chapters, return JSON in code block:
<example>
\`\`\`json
{
  "chapter": "Exact chapter name from TOC",
  "summary": "Concise chapter summary"
}
\`\`\`
</example>

Example:
<example>
\`\`\`json
{
  "chapter": "Chapter 1: The Beginning",
  "summary": "The story begins with..."
}
\`\`\`
<example>
          `.trim(),
        },
        {
          role: "user",
          content: `
### Input Data
<TableOfContents>
${tableOfContents.map(chapter => `<chapter_name>${chapter}</chapter_name>`).join("\n")}
</TableOfContents>

<PreviousSummary>
${previousSummary}
</PreviousSummary>

<CurrentChapter>
${chapter}
</CurrentChapter>

### Instructions
1. Generate a concise summary (150-300 words) of the current chapter
2. Maintain narrative flow and key plot points
3. Use exact chapter names from TableOfContents
4. Return JSON in code block:
<example>
\`\`\`json
{
  "chapter": "Exact chapter name",
  "summary": "Your summary here"
}
\`\`\`
</example>
          `.trim(),
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const result = completion.choices[0].message.content?.trim();
    try {
      // Extract JSON from code block
      if (!result) {
        throw new Error("No response content found");
      }

      const jsonStart = result.indexOf("```json");
      const jsonEnd = result.lastIndexOf("```");
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        throw new Error("No valid JSON code block found");
      }

      const jsonContent = result.slice(jsonStart + 7, jsonEnd).trim();
      const parsed = JSON.parse(jsonContent || "{}");
      if (parsed.notAChapter) {
        return { chapter: "", summary: "" };
      }

      // Determine if we should stop based on our local matching
      const shouldStop = isChapterMatch(parsed.chapter, summarizeUntilChapter);

      return {
        chapter: parsed.chapter || "",
        summary: parsed.summary || "",
        stop: shouldStop,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse summary: ${
          error instanceof Error ? error.message : "Invalid JSON format"
        }`
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error("Failed to generate summary");
  }
}
