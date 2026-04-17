const MUTED = <span style={{ color: 'var(--text-muted)' }}>—</span>

export function SoulTag({ soul, val }) {
  const cls = `tag soul soul-${soul}`
  if (val !== undefined) {
    return (
      <span className={cls}>
        <span className="soul-pair">
          {soul} <span className="soul-val">{val}</span>
        </span>
      </span>
    )
  }
  return <span className={cls}>{soul}</span>
}

export function SoulsDisplay({ souls }) {
  if (!souls || Object.keys(souls).length === 0) return MUTED
  return (
    <div className="tags">
      {Object.entries(souls).map(([soul, val]) => (
        <SoulTag key={soul} soul={soul} val={val} />
      ))}
    </div>
  )
}

export function SoulArrayDisplay({ souls }) {
  if (!souls || souls.length === 0) return MUTED
  return (
    <div className="tags">
      {souls.map(s => <SoulTag key={s} soul={s} />)}
    </div>
  )
}

export function TagsDisplay({ tags }) {
  if (!tags || tags.length === 0) return MUTED
  return (
    <div className="tags">
      {tags.map(t => <span key={t} className="tag">{t}</span>)}
    </div>
  )
}
