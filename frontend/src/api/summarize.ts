import OpenAI from "openai";

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
  summarizeUntilChapter: string
) {
  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
    });

    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-nemo",
      messages: [
        {
          role: "system",
          content: `
            You are a helpful assistant that summarizes books to help readers quickly grasp the content.
            Your responsibilities include:
            - Identifying key plot points
            - Tracking character developments
            - Highlighting important details
            - Including the specified chapter in the summary (summarizeUntilChapter)
            
            You will be provided:
            - Summaries of previous chapters
            - Full text of the current chapter to summarize
            - The chapter at which to stop summarization (summarizeUntilChapter)
            
            If the provided text is not a chapter (e.g., Table of Contents, Dedication, Preface, Acknowledgments, Index, or other non-story content), return raw JSON: {"notAChapter": true}.
            
            When comparing chapters, focus on understanding the semantic meaning rather than exact text matching:
            - Consider synonyms and alternative phrasings
            - Understand that different wordings may refer to the same chapter
            - Focus on the core meaning and context rather than exact wording
            - Be flexible with chapter numbering formats (e.g., "Chapter 5", "Five", "V")
            - Recognize abbreviated chapter titles
            - Handle partial matches (e.g., "Chapter Twenty" matches "Chapter 20: Accusations")
            - Match chapter numbers regardless of their format (e.g., "20", "Twenty", "XX")
            - Ignore additional descriptive text after chapter numbers
            
            If the normalized current chapter matches the normalized summarizeUntilChapter, include "stop": true in the response.
            Otherwise, return raw JSON with:
            - "chapter": The chapter name/title
            - "summary": The chapter summary
            - "stop": boolean (true if this is the last chapter to summarize)
            Always return JSON in a code block that starts with "\`\`\`json" and ends with "\`\`\`".
            
            Example:
            <example>
            \`\`\`json
            {
              "chapter": "Chapter 1: The Beginning",
              "summary": "The story begins with...",
              "stop": false
            }
            \`\`\`
            </example>
          `.trim(),
        },
        {
          role: "user",
          content: `
            ### Stop After Chapter
            <stop_after_chapter>
            ${summarizeUntilChapter}
            </stop_after_chapter>

            ### Previous Chapters Summary
            <previous_chapters_summary>
            ${previousSummary}
            </previous_chapters_summary>
            
            ### Current Chapter Text
            <current_chapter_text>
            ${chapter}
            </current_chapter_text>
            
            ### Summarization of current chapter
            
            Here is the summarization of the current chapter, adhering to the requirements:
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
      return {
        chapter: parsed.chapter || "",
        summary: parsed.summary || "",
        stop: parsed.stop || false,
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
