import { useQuery } from '@tanstack/react-query'
import { apiClient } from './api/client'
import './App.css'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  const { data, error, isFetching, isLoading, refetch } = useQuery({
    queryKey: ['api-health'],
    queryFn: async () => {
      const response = await apiClient.get('/health/')
      return response.data
    },
    retry: false,
  })

  const status = data?.status === 'ok' ? 'Connected' : 'Waiting'

  return (
    <main className="app-shell">
      <section className="workspace-header">
        <div>
          <p className="eyebrow">B2C Ebook Ecommerce</p>
          <h1>Project Setup Dashboard</h1>
          <p className="summary">
            Django, PostgreSQL, and React are wired together for local
            development.
          </p>
        </div>
        <button
          type="button"
          className="refresh-button"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Checking' : 'Check API'}
        </button>
      </section>

      <section className="status-grid" aria-label="Setup status">
        <div className="status-card">
          <span className="status-label">Backend API</span>
          <strong>{isLoading ? 'Checking' : status}</strong>
          <p>{data?.message || error?.message || 'Waiting for Django API.'}</p>
        </div>
        <div className="status-card">
          <span className="status-label">API Base URL</span>
          <strong>{apiBaseUrl}</strong>
          <p>Configured through frontend .env.</p>
        </div>
        <div className="status-card">
          <span className="status-label">Admin Panel</span>
          <strong>Ready</strong>
          <p>Open Django admin after the backend server is running.</p>
        </div>
      </section>

      <section className="next-panel">
        <h2>Next build area</h2>
        <p>
          The next step is creating catalog models and API endpoints for books,
          authors, publishers, categories, ebook files, and search filters.
        </p>
      </section>
    </main>
  )
}

export default App
