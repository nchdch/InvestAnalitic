import { useEffect, useState } from 'react'
import { getHealth, type HealthStatus } from '@/api/client'

interface UsePortfolioResult {
  apiStatus: HealthStatus | null
  isLoading: boolean
  error: string | null
}

/**
 * Временный хук для проверки связки frontend → backend на этапе инициализации.
 * По мере реализации функций учёта здесь появятся данные портфеля
 * (счета, позиции, сделки) — интерфейс хука уже типизирован через src/types.
 */
export function usePortfolio(): UsePortfolioResult {
  const [apiStatus, setApiStatus] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getHealth()
      .then((status) => {
        if (!cancelled) setApiStatus(status)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { apiStatus, isLoading, error }
}
