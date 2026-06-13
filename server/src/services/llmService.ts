export interface LlmMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmInfo {
  provider: string
  model: string
  configured: boolean
}

export class LlmError extends Error {}

interface ProviderPreset {
  baseURL: string
  defaultModel: string
}

/**
 * Известные провайдеры с OpenAI-совместимым /chat/completions.
 * Для любого другого провайдера (включая локальные модели) укажите LLM_PROVIDER=custom
 * и задайте LLM_BASE_URL + LLM_MODEL вручную.
 */
const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: { baseURL: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  deepseek: { baseURL: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  groq: { baseURL: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  openrouter: { baseURL: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
  ollama: { baseURL: 'http://localhost:11434/v1', defaultModel: 'llama3.1' },
}

interface LlmConfig {
  provider: string
  baseURL: string
  model: string
  apiKey: string
}

function resolveConfig(): LlmConfig {
  const provider = (process.env.LLM_PROVIDER ?? 'openai').toLowerCase()
  const preset = PROVIDER_PRESETS[provider]
  const baseURL = (process.env.LLM_BASE_URL || preset?.baseURL || '').replace(/\/+$/, '')
  const model = process.env.LLM_MODEL || preset?.defaultModel || ''
  const apiKey = process.env.LLM_API_KEY ?? ''
  return { provider, baseURL, model, apiKey }
}

/** Текущий провайдер/модель и признак готовности — для отображения в UI (например, ProfilePage). */
export function getLlmInfo(): LlmInfo {
  const { provider, model, baseURL } = resolveConfig()
  return { provider, model, configured: Boolean(baseURL && model) }
}

interface StreamChunk {
  choices?: { delta?: { content?: string } }[]
}

/**
 * Потоковый чат-комплишн через OpenAI-совместимый /chat/completions.
 * Провайдер выбирается переменной LLM_PROVIDER (см. PROVIDER_PRESETS) — модель и/или
 * адрес можно переопределить через LLM_MODEL / LLM_BASE_URL, ключ — через LLM_API_KEY.
 */
export async function* streamChatCompletion(
  messages: LlmMessage[],
  options: { temperature?: number; maxTokens?: number; signal?: AbortSignal } = {},
): AsyncGenerator<string> {
  const { provider, baseURL, model, apiKey } = resolveConfig()
  if (!baseURL || !model) {
    throw new LlmError(
      `LLM не настроен: укажите LLM_PROVIDER (${Object.keys(PROVIDER_PRESETS).join(', ')}) ` +
      `или LLM_BASE_URL + LLM_MODEL для произвольного провайдера`,
    )
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = process.env.FRONTEND_URL ?? 'https://investanalitic.ru'
    headers['X-Title'] = 'InvestAnalitic'
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    }),
    signal: options.signal ?? AbortSignal.timeout(120_000),
  })

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new LlmError(`Запрос к LLM (${provider}) завершился ошибкой ${res.status}: ${body.slice(0, 500)}`)
  }

  const decoder = new TextDecoder()
  let buffer = ''
  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') return
      try {
        const parsed = JSON.parse(payload) as StreamChunk
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // пропускаем не-JSON строки (keep-alive комментарии и т.п.)
      }
    }
  }
}

/** Нестриминговая обёртка: дожидается полного ответа модели и возвращает его одной строкой. */
export async function chatCompletion(
  messages: LlmMessage[],
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal },
): Promise<string> {
  let result = ''
  for await (const piece of streamChatCompletion(messages, options)) result += piece
  return result
}
