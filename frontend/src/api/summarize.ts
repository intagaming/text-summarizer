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
  chapter: string,
  previousSummary: string,
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
          content: `You are a helpful assistant that summarizes books to help readers quickly grasp the content.
          Focus on identifying key plot points, character developments, and important details.
          You will be provided the summaries of previous chapters and the full text of the chapter the reader wants to summarize.`,
        },
        {
          role: "user",
          content: `Previous chapters summary: ${previousSummary}\n\nCurrent chapter: ${chapter}\n\nPlease provide a comprehensive summary of this book chapter, including key plot points and character developments`,
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
