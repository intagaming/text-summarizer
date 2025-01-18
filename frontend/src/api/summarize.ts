import OpenAI from 'openai'

export async function summarizeText(text: string, query: string, apiKey: string) {
  try {
    const openai = new OpenAI({
      apiKey: apiKey
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes text based on user queries.'
        },
        {
          role: 'user',
          content: `Text: ${text}\n\nQuery: ${query}\n\nPlease provide a concise summary based on the query.`
        }
      ],
      temperature: 0.7,
      max_tokens: 256
    })

    return completion.choices[0].message.content
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate summary: ${error.message}`)
    }
    throw new Error('Failed to generate summary')
  }
}