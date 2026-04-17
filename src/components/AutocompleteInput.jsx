import { useState, useRef, useEffect } from 'react'

export default function AutocompleteInput({ placeholder, searchFn, onSelect, inputRef: externalRef }) {
  const [value, setValue] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState({})
  const internalRef = useRef(null)
  const inputRef = externalRef || internalRef
  const timer = useRef(null)

  function positionDropdown() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropStyle({
        position: 'fixed',
        left: rect.left + 'px',
        top: (rect.bottom + 3) + 'px',
        width: rect.width + 'px',
      })
    }
  }

  function onInput(e) {
    const q = e.target.value
    setValue(q)
    clearTimeout(timer.current)
    if (q.trim().length < 3) { setOpen(false); return }
    timer.current = setTimeout(() => {
      const res = searchFn(q.trim())
      setResults(res)
      positionDropdown()
      setOpen(res.length > 0)
    }, 150)
  }

  function select(item) {
    setValue(item.name)
    setOpen(false)
    onSelect(item)
  }

  return (
    <div className="autocomplete-wrap">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={onInput}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul className="autocomplete-dropdown" style={dropStyle}>
          {results.map(r => (
            <li
              key={r.id}
              className="autocomplete-item"
              onMouseDown={e => { e.preventDefault(); select(r) }}
            >
              {r.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
