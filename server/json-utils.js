export function parseJsonOrNull(value) {
    if (typeof value !== 'string' || value.length === 0) {
        return null
    }

    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

export function parseJsonOrArray(value) {
    const parsed = parseJsonOrNull(value)
    return Array.isArray(parsed) ? parsed : []
}
