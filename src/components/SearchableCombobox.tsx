import { useState, useRef, useEffect, useMemo } from 'react'
import { bigramSimilarity } from '../utils'

type SearchableComboboxProps = {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    fuzzyMatch?: boolean
    allowFreeText?: boolean
}

const FUZZY_THRESHOLD = 0.3

export function SearchableCombobox({
    options,
    value,
    onChange,
    placeholder = 'Sök…',
    disabled = false,
    className = '',
    fuzzyMatch = false,
    allowFreeText = false,
}: SearchableComboboxProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const { items, hasFuzzy, hasFreeText } = useMemo(() => {
        if (!query) {
            return { items: options.map((o) => ({ label: o, value: o })), hasFuzzy: false, hasFreeText: false }
        }
        const q = query.toLowerCase()
        const exact = options.filter((o) => o.toLowerCase().includes(q))

        if (exact.length > 0) {
            return { items: exact.map((o) => ({ label: o, value: o })), hasFuzzy: false, hasFreeText: false }
        }

        let fuzzyItems: Array<{ label: string; value: string }> = []
        if (fuzzyMatch) {
            fuzzyItems = options
                .map((o) => ({ option: o, score: bigramSimilarity(q, o.toLowerCase()) }))
                .filter((r) => r.score >= FUZZY_THRESHOLD)
                .sort((a, b) => b.score - a.score)
                .slice(0, 20)
                .map((r) => ({ label: `${r.option}`, value: r.option }))
        }

        const result = [...fuzzyItems]
        const showFreeText = allowFreeText && query.trim().length > 0
        if (showFreeText) {
            result.push({ label: `Använd "${query.trim()}" som svar`, value: query.trim() })
        }

        return { items: result, hasFuzzy: fuzzyItems.length > 0, hasFreeText: showFreeText }
    }, [query, options, fuzzyMatch, allowFreeText])

    const displayItems = items.slice(0, 50)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (highlightIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightIndex] as HTMLElement | undefined
            item?.scrollIntoView({ block: 'nearest' })
        }
    }, [highlightIndex])

    function handleSelect(option: string) {
        onChange(option)
        setQuery('')
        setIsOpen(false)
        setHighlightIndex(-1)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!isOpen && e.key === 'ArrowDown') {
            setIsOpen(true)
            setHighlightIndex(0)
            e.preventDefault()
            return
        }
        if (!isOpen) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex((i) => Math.min(i + 1, displayItems.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (highlightIndex >= 0 && highlightIndex < displayItems.length) {
                handleSelect(displayItems[highlightIndex].value)
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false)
            setHighlightIndex(-1)
        }
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        setQuery(e.target.value)
        setIsOpen(true)
        setHighlightIndex(0)
    }

    function handleFocus() {
        setIsOpen(true)
        setHighlightIndex(-1)
    }

    function handleClear() {
        onChange('')
        setQuery('')
        setIsOpen(false)
        inputRef.current?.focus()
    }

    const displayValue = value && !isOpen ? value : query

    return (
        <div className={`searchable-combobox ${className}`} ref={wrapperRef}>
            <div className="searchable-combobox-input-wrap">
                <input
                    ref={inputRef}
                    className="special-input"
                    type="text"
                    value={displayValue}
                    placeholder={value ? value : placeholder}
                    disabled={disabled}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-autocomplete="list"
                    autoComplete="off"
                />
                {value && !disabled && (
                    <button
                        type="button"
                        className="searchable-combobox-clear"
                        onClick={handleClear}
                        aria-label="Rensa val"
                        tabIndex={-1}
                    >
                        ×
                    </button>
                )}
            </div>
            {isOpen && displayItems.length > 0 && (
                <ul className="searchable-combobox-list" ref={listRef} role="listbox">
                    {hasFuzzy && <li className="fuzzy-hint">Menade du:</li>}
                    {displayItems.map((item, i) => (
                        <li
                            key={`${item.value}-${i}`}
                            role="option"
                            aria-selected={item.value === value}
                            className={
                                (i === highlightIndex ? 'highlighted ' : '') +
                                (item.value === value ? 'selected ' : '') +
                                (hasFreeText && i === displayItems.length - 1 ? 'free-text-option' : '')
                            }
                            onMouseDown={(e) => {
                                e.preventDefault()
                                handleSelect(item.value)
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                        >
                            {item.label}
                        </li>
                    ))}
                </ul>
            )}
            {isOpen && displayItems.length === 0 && query && (
                <ul className="searchable-combobox-list" role="listbox">
                    <li className="no-results">Inga matchningar</li>
                </ul>
            )}
        </div>
    )
}
