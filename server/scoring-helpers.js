/**
 * Pure text normalization and key-building utilities for the scoring subsystem.
 * No database or external dependencies — safe to use anywhere.
 */

/**
 * Trim and collapse whitespace in a string value.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeText(value) {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim().replace(/\s+/g, ' ')
}

/**
 * Normalize a string to lower-case for case-insensitive comparison.
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeComparableText(value) {
    return normalizeText(value).toLowerCase()
}

/**
 * Normalize a group code to upper-case (e.g. "a" → "A").
 * @param {unknown} groupCode
 * @returns {string}
 */
export function normalizeGroupCode(groupCode) {
    if (typeof groupCode !== 'string') {
        return ''
    }

    return groupCode.trim().toUpperCase()
}

/**
 * Normalize a match label (delegates to normalizeText).
 * @param {unknown} matchLabel
 * @returns {string}
 */
export function normalizeMatchLabel(matchLabel) {
    return normalizeText(matchLabel)
}

/**
 * Extract a single-letter group code from a label like "Grupp A".
 * @param {unknown} groupLabel
 * @returns {string} Upper-case letter or empty string.
 */
export function extractGroupCode(groupLabel) {
    const normalized = normalizeText(groupLabel)
    const match = normalized.match(/^Grupp\s+([A-L])$/i)
    return match ? match[1].toUpperCase() : ''
}

/**
 * De-duplicate an array of strings by their normalized (lower-case) form,
 * preserving the first occurrence's casing.
 * @param {string[]} values
 * @returns {string[]}
 */
export function uniqueNormalizedTexts(values) {
    const uniqueValues = new Map()
    for (const value of values) {
        const normalizedValue = normalizeText(value)
        const normalizedKey = normalizeComparableText(normalizedValue)
        if (!normalizedKey || uniqueValues.has(normalizedKey)) {
            continue
        }

        uniqueValues.set(normalizedKey, normalizedValue)
    }

    return [...uniqueValues.values()]
}

/**
 * Build a lookup key from group code, match label, and kickoff date.
 * @param {string} groupCode
 * @param {string} matchLabel
 * @param {string} kickoffAt
 * @returns {string}
 */
export function buildGroupMatchDateKey(groupCode, matchLabel, kickoffAt) {
    return `${normalizeGroupCode(groupCode)}|${normalizeMatchLabel(matchLabel)}|${normalizeText(kickoffAt)}`
}

/**
 * Build a lookup key from group code and match label (without date).
 * @param {string} groupCode
 * @param {string} matchLabel
 * @returns {string}
 */
export function buildGroupMatchKey(groupCode, matchLabel) {
    return `${normalizeGroupCode(groupCode)}|${normalizeMatchLabel(matchLabel)}`
}
