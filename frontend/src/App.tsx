import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

import { apiClient } from './api/client'

type HealthResponse = {
  status: string
}

const queryClient = new QueryClient()

function HealthStatus() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get<HealthResponse>('/health')
      return response.data
    },
    retry: false,
  })

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-cyan-950/30">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
          AquaTrace
        </p>
        <h1 className="mt-3 text-3xl font-semibold">System health</h1>
        <div className="mt-8 flex items-center gap-3 rounded-xl bg-slate-950/70 p-4">
          <span
            className={`h-3 w-3 rounded-full ${
              health.isSuccess
                ? 'bg-emerald-400'
                : health.isError
                  ? 'bg-rose-400'
                  : 'animate-pulse bg-amber-300'
            }`}
            aria-hidden="true"
          />
          <span className="font-mono text-lg" aria-live="polite">
            {health.isPending
              ? 'checking…'
              : health.isError
                ? 'unavailable'
                : health.data.status}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Live status from Postgres through the AquaTrace API.
        </p>
      </section>
    </main>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HealthStatus />
    </QueryClientProvider>
  )
}

export default App
