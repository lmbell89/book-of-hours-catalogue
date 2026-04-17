import { useState } from 'react'
import { SOULS } from '../constants'

export default function SoulEditor({ value, onChange }) {
  // value: { [soul]: number }
  const entries = Object.entries(value)

  function updateSoul(oldSoul, newSoul) {
    const next = {}
    for (const [k, v] of Object.entries(value)) {
      next[k === oldSoul ? newSoul : k] = v
    }
    onChange(next)
  }

  function updateVal(soul, val) {
    onChange({ ...value, [soul]: Number(val) || 1 })
  }

  function removeSoul(soul) {
    const next = { ...value }
    delete next[soul]
    onChange(next)
  }

  function addSoul() {
    const available = SOULS.find(s => !(s in value)) || SOULS[0]
    onChange({ ...value, [available]: 1 })
  }

  return (
    <div className="soul-editor">
      {entries.map(([soul, val]) => (
        <div key={soul} className="soul-row">
          <select value={soul} onChange={e => updateSoul(soul, e.target.value)}>
            {SOULS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="number"
            min={1}
            value={val}
            onChange={e => updateVal(soul, e.target.value)}
          />
          <button type="button" className="btn-icon delete" onClick={() => removeSoul(soul)}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-add-row" onClick={addSoul}>+ Add soul</button>
    </div>
  )
}
