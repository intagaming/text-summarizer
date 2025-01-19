export const PROVIDERS = [
  { 
    value: 'OpenAI', 
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1'
  },
  { 
    value: 'DeepSeek', 
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1'
  },
  { 
    value: 'OpenRouter', 
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1'
  },
] as const;

export type Provider = typeof PROVIDERS[number];