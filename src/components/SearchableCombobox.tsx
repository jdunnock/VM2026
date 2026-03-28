import { useState, useRef, useEffect } from 'react'

type SearchableComboboxProps = {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function SearchableCombobox({
    options,
    value,
    onChange,
    placeholder = 'Sök…',
    disabled = false,
    className = '',
}: SearchableComboboxProps) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const filtered = query
        ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
        : options

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
            setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (highlightIndex >= 0 && highlightIndex < filtered.length) {
                handleSelect(filtered[highlightIndex])
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
            {isOpen && filtered.length > 0 && (
                <ul className="searchable-combobox-list" ref={listRef} role="listbox">
                    {filtered.slice(0, 50).map((option, i) => (
                        <li
                            key={option}
                            role="option"
                            aria-selected={option === value}
                            className={
                                (i === highlightIndex ? 'highlighted ' : '') +
                                (option === value ? 'selected' : '')
                            }
                            onMouseDown={(e) => {
                                e.preventDefault()
                                handleSelect(option)
                            }}
                            onMouseEnter={() => setHighlightIndex(i)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
            {isOpen && filtered.length === 0 && query && (
                <ul className="searchable-combobox-list" role="listbox">
                    <li className="no-results">Inga matchningar</li>
                </ul>
            )}
        </div>
    )
}
