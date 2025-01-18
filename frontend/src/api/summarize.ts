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
  apiKey: string
) {
  console.log(123, previousSummary, chapter);
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
          content: `
            You are a helpful assistant that summarizes books to help readers quickly grasp the content.
            Your responsibilities include:
            - Identifying key plot points
            - Tracking character developments
            - Highlighting important details
            
            You will be provided:
            - Summaries of previous chapters
            - Full text of the current chapter to summarize
            
            If the provided text is not a chapter, return exactly "NOT A CHAPTER".
            Otherwise, return a JSON object with:
            - "chapter": The chapter name/title
            - "summary": The chapter summary
            
            Example:
            {
              "chapter": "Chapter 1: The Beginning",
              "summary": "The story begins with..."
            }
          `.trim(),
        },
        {
          role: "user",
          content: `
            ### Previous Chapters Summary
            <previous_chapters_summary>
            ${previousSummary}
            </previous_chapters_summary>
            
            ### Current Chapter Text
            <current_chapter_text>
            ${chapter}
            </current_chapter_text>
            
            ### Summarization of current chapter
          `.trim(),
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const result = completion.choices[0].message.content?.trim();
    if (result?.toUpperCase() === "NOT A CHAPTER") {
      return { chapter: "", summary: "" };
    }
    
    try {
      const parsed = JSON.parse(result || "{}");
      return {
        chapter: parsed.chapter || "",
        summary: parsed.summary || ""
      };
    } catch (error) {
      throw new Error(`Failed to parse summary: ${error instanceof Error ? error.message : "Invalid JSON format"}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error("Failed to generate summary");
  }
}
