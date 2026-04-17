import { useEffect } from 'react'

export default function ConfirmDialog({ msg, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-overlay">
      <div className="modal modal-sm" role="dialog">
        <div className="modal-header">
          <h3>Confirm Delete</h3>
        </div>
        <div className="modal-body">
          <p>{msg}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
