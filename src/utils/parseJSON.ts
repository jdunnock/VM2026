export function safeParseJSON<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function tryParseJSON<T>(json: string): { ok: boolean; value: T | null } {
  try {
    return { ok: true, value: JSON.parse(json) as T }
  } catch {
    return { ok: false, value: null }
  }
}
