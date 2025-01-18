import { useState } from 'react'
import { summarizeText } from './api/summarize'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import './App.css'

const schema = z.object({
  file: z.instanceof(File),
  query: z.string().min(1, 'Query is required'),
})

function App() {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  type FormData = {
    file: File;
    query: string;
  };

  const onSubmit = async (data: FormData) => {
    if (!apiKey) {
      setError('Please set your OpenAI API key in settings')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const text = await data.file.text()
      const summary = await summarizeText(text, data.query, apiKey)
      setSummary(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Text Summarizer</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            ⚙️
          </button>
        </div>

        {showSettings && (
          <div className="mb-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Settings</h2>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter OpenAI API key"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Document
            </label>
            <input
              type="file"
              {...register('file')}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {errors.file && (
              <p className="mt-2 text-sm text-red-600">{errors.file.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Query
            </label>
            <textarea
              {...register('query')}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter your query for summarization..."
            />
            {errors.query && (
              <p className="mt-2 text-sm text-red-600">{errors.query.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {summary && (
          <div className="mt-6 p-6 bg-white rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
