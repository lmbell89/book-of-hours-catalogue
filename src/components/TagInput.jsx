import { useState } from 'react'

export default function TagInput({ value, onChange, placeholder = 'Add tag, press Enter' }) {
  const [input, setInput] = useState('')

  function addTag(tag) {
    tag = tag.trim().replace(/,$/, '')
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  function removeTag(i) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  function onBlur() {
    if (input.trim()) addTag(input)
  }

  return (
    <div
      className="tag-input-wrap"
      onClick={e => { if (e.target === e.currentTarget) e.currentTarget.querySelector('input')?.focus() }}
    >
      {value.map((tag, i) => (
        <span key={i} className="tag">
          {tag}{' '}
          <button type="button" aria-label="Remove" onClick={() => removeTag(i)}>&times;</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    </div>
  )
}
