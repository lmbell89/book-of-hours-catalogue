import { useEffect, useRef } from 'react'

export default function NotesTab({ notes, onChange }) {
  const ref = useRef(null)

  // Auto-resize on mount and whenever content changes
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [notes])

  return (
    <div className="notes-tab">
      <textarea
        ref={ref}
        className="notes-textarea"
        value={notes}
        rows={6}
        onChange={e => onChange(e.target.value)}
        placeholder="Write anything here — spoilers, plans, reminders…"
        spellCheck={true}
      />
    </div>
  )
}
