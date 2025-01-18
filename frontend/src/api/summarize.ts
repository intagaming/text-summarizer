import OpenAI from "openai";

export async function summarizeText(
  text: string,
  query: string,
  apiKey: string,
  type: "book" | "general" = "general"
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
            type === "book"
              ? `You are a helpful assistant that summarizes books chapter by chapter to help readers resume reading.
              Focus on key plot points, character developments, and important details for one chapter at a time.
              Always output only one chapter summary at a time. If the user requests a specific chapter, summarize only that chapter.
              Chapter summaries should be self-contained and not reference other chapters.`
              : "You are a helpful assistant that summarizes text based on user queries.",
        },
        {
          role: "user",
          content: type === "book"
            ? `Book Text: ${text}\n\nQuery: ${query}\n\nPlease provide a concise summary of ${query.includes("chapter") ? "the requested chapter" : "each chapter one by one"}.`
            : `Text: ${text}\n\nQuery: ${query}\n\nPlease provide a concise summary based on the query.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 256,
    });

    return completion.choices[0].message.content;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
    throw new Error("Failed to generate summary");
  }
}
