import { useState, useEffect } from 'react'
import { SOULS } from '../constants'
import { SoulTag } from './SoulTags'
import Modal from './Modal'

export default function RecipesTab({ recipes, items, onAdd, onUpdate, onDelete, navState, onNavHandled }) {
  const [filterItemId, setFilterItemId] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | recipe (for edit)

  useEffect(() => {
    if (!navState) return
    if (navState.itemId) setFilterItemId(navState.itemId)
    onNavHandled()
  }, [navState])

  const list = filterItemId ? recipes.filter(r => r.itemId === filterItemId) : recipes
  const filterItem = filterItemId ? items.find(i => i.id === filterItemId) : null

  return (
    <section>
      <div className="section-header">
        <h2>Recipes</h2>
        <button className="btn-primary" onClick={() => setModal('add')}>+ Add Recipe</button>
      </div>

      {filterItemId && (
        <div className="filter-bar">
          <span style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>
            Filtered by item: {filterItem?.name || filterItemId}
          </span>
          <button className="btn-secondary btn-sm" onClick={() => setFilterItemId('')}>Clear</button>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Skill</th>
              <th>Soul</th>
              <th>Qty</th>
              <th>Item Produced</th>
              <th>Note</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(recipe => {
              const item = recipe.itemId ? items.find(i => i.id === recipe.itemId) : null
              return (
                <tr key={recipe.id}>
                  <td>{recipe.skill || '—'}</td>
                  <td>{recipe.soul ? <SoulTag soul={recipe.soul} /> : '—'}</td>
                  <td>{recipe.quantity ?? '—'}</td>
                  <td>
                    {item
                      ? <a className="item-link" onClick={() => {}}>{item.name}</a>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {recipe.note
                      ? <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{recipe.note}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-icon" title="Edit" onClick={() => setModal(recipe)}>✎</button>
                      <button className="btn-icon delete" title="Delete" onClick={() => onDelete(recipe.id, recipe.skill)}>✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {recipes.length === 0 && (
        <p className="empty-msg">No recipes recorded yet.</p>
      )}

      {modal && (
        <RecipeModal
          recipe={modal === 'add' ? null : modal}
          items={items}
          onSave={body => {
            if (modal === 'add') onAdd(body)
            else onUpdate(modal.id, body)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  )
}

function RecipeModal({ recipe, items, onSave, onClose }) {
  const [skill, setSkill] = useState(recipe?.skill || '')
  const [soul, setSoul] = useState(recipe?.soul || '')
  const [quantity, setQuantity] = useState(recipe?.quantity ?? '')
  const [itemId, setItemId] = useState(recipe?.itemId || '')
  const [itemSearch, setItemSearch] = useState('')
  const [note, setNote] = useState(recipe?.note || '')

  // Sync item search display value
  useEffect(() => {
    const item = items.find(i => i.id === itemId)
    setItemSearch(item?.name || '')
  }, [])

  const itemMatches = itemSearch.length >= 3
    ? items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase())).slice(0, 12)
    : []

  function handleSave() {
    if (!skill.trim()) return false
    onSave({
      skill: skill.trim(),
      soul: soul || null,
      quantity: quantity !== '' ? Number(quantity) : null,
      itemId: itemId || null,
      note: note.trim() || null,
    })
    return true
  }

  return (
    <Modal title={recipe ? 'Edit Recipe' : 'Add Recipe'} onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Skill</label>
        <input type="text" value={skill} onChange={e => setSkill(e.target.value)} autoFocus />
      </div>
      <div className="form-group">
        <label>Soul</label>
        <select value={soul} onChange={e => setSoul(e.target.value)}>
          <option value="">— select —</option>
          {SOULS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Quantity</label>
        <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} />
      </div>
      <div className="form-group" style={{ position: 'relative' }}>
        <label>Item produced</label>
        <div className="autocomplete-wrap">
          <input
            type="text"
            placeholder="Search items…"
            value={itemSearch}
            onChange={e => { setItemSearch(e.target.value); setItemId('') }}
          />
          {itemMatches.length > 0 && (
            <ul className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 1000 }}>
              {itemMatches.map(i => (
                <li
                  key={i.id}
                  className="autocomplete-item"
                  onMouseDown={e => {
                    e.preventDefault()
                    setItemSearch(i.name)
                    setItemId(i.id)
                  }}
                >
                  {i.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="form-group">
        <label>Note</label>
        <input type="text" placeholder="Optional note…" value={note} onChange={e => setNote(e.target.value)} />
      </div>
    </Modal>
  )
}
