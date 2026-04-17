import { useState, useEffect, useRef } from 'react'

export default function MultiSelect({ options, value, onChange, placeholder = 'None selected', className }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapRef = useRef(null)
  const dropRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        dropRef.current && !dropRef.current.contains(e.target)
      ) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const [dropStyle, setDropStyle] = useState({})
  function openDropdown() {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect()
      setDropStyle({
        position: 'fixed',
        left: rect.left + 'px',
        top: (rect.bottom + 3) + 'px',
        minWidth: rect.width + 'px',
      })
    }
    setOpen(true)
    // Focus the search input on next paint
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  function closeDropdown() {
    setOpen(false)
    setSearch('')
  }

  function toggle(opt) {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt))
    } else {
      onChange([...value, opt])
    }
  }

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <>
      <div className={`multi-select-wrap${className ? ' ' + className : ''}`} ref={wrapRef}>
        <div
          className={`multi-select-display${value.length > 1 ? ' has-many' : ''}`}
          onClick={() => open ? closeDropdown() : openDropdown()}
        >
          {value.length === 0 ? (
            <span className="multi-select-placeholder">{placeholder}</span>
          ) : (
            value.map(v => (
              <span key={v} className="tag tag-removable" onClick={e => { e.stopPropagation(); toggle(v) }}>
                {v}{' '}
                <button type="button" tabIndex={-1}>×</button>
              </span>
            ))
          )}
          <span className="multi-select-arrow">▾</span>
        </div>
      </div>
      {open && (
        <div className="multi-select-dropdown" ref={dropRef} style={dropStyle}>
          {options.length > 6 && (
            <div className="multi-select-search">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter…"
                onKeyDown={e => e.key === 'Escape' && closeDropdown()}
              />
            </div>
          )}
          {filtered.length > 0 ? filtered.map(opt => (
            <div
              key={opt}
              className={`multi-select-option${value.includes(opt) ? ' selected' : ''}`}
              onMouseDown={e => { e.preventDefault(); toggle(opt) }}
            >
              {opt}
            </div>
          )) : (
            <div className="multi-select-option" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No matches
            </div>
          )}
        </div>
      )}
    </>
  )
}
