export interface HealthStatus {
  status: 'ok' | 'degraded'
  db: 'connected' | 'unavailable'
  timestamp: string
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`)
  if (!response.ok) {
    throw new Error(`API ${path} responded with ${response.status}`)
  }
  return (await response.json()) as T
}

export function getHealth(): Promise<HealthStatus> {
  return request<HealthStatus>('/health')
}
