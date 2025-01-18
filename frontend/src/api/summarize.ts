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
          ? `You are a helpful assistant that skims books chapter by chapter to help readers quickly grasp the content.
          Focus on identifying key plot points, character developments, and important details.
          When skimming books, always quote the text verbatim without adding, omitting, or altering any words.
          Always process one chapter at a time. If the user requests a specific chapter, skim only that chapter.
          Skimmed content should be self-contained and not reference other chapters.`
            : "You are a helpful assistant that skims text based on user queries.",
        },
        {
          role: "user",
          content: type === "book"
          ? `Book Text: ${text}\n\nQuery: ${query}\n\nPlease skim ${query.includes("chapter") ? "the requested chapter" : "each chapter one by one"}, quoting the text verbatim without adding, omitting, or altering any words.`
          : `Text: ${text}\n\nQuery: ${query}\n\nPlease skim the text, replacing lengthy or less relevant sections with "[...]" while preserving key points and context.`,
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
