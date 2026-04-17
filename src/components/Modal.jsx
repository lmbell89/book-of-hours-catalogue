import { useEffect } from 'react'

export default function Modal({ title, onClose, onSave, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="modal-body">{children}</div>
        {onSave ? (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onSave}>Save</button>
          </div>
        ) : (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
