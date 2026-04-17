import { useState, useEffect, useRef } from 'react'
import { SOULS } from '../constants'
import { searchItems, lookupItem, gameSkills } from '../storage'
import { SoulsDisplay, TagsDisplay, SoulTag } from './SoulTags'
import Modal from './Modal'
import MultiSelect from './MultiSelect'
import AutocompleteInput from './AutocompleteInput'

const skillNameById = new Map(gameSkills.map(s => [s.id, s.name]))

export default function ItemsTab({ items, books, skillRecipes = [], discoveredCraftingResults = [], revealedBookResults = [], onDiscover, onDelete, navigate, navState, onNavHandled }) {
  const [filterName, setFilterName] = useState('')
  const [filterSouls, setFilterSouls] = useState([])
  const [filterProps, setFilterProps] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [sortSoul, setSortSoul] = useState('')
  const [modal, setModal] = useState(false)
  const [booksModal, setBooksModal] = useState(null) // { itemName, books }
  const [skillsModal, setSkillsModal] = useState(null) // { itemName, recipes }

  // Derived: all unique properties (only from discovered items — undiscovered ones hide their data)
  const allProps = [...new Set(items.filter(i => !i.undiscovered).flatMap(i => i.properties || []))].sort()

  // Handle nav instructions from parent
  useEffect(() => {
    if (!navState) return
    if (navState.id) {
      setFilterName(''); setFilterSouls([]); setFilterProps([])
      requestAnimationFrame(() => {
        const row = document.getElementById(`item-row-${navState.id}`)
        if (row) {
          row.classList.add('highlighted')
          row.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setTimeout(() => row.classList.remove('highlighted'), 2500)
        }
      })
    } else if (navState.name) {
      setFilterName(navState.name)
      setFilterSouls([]); setFilterProps([])
    }
    onNavHandled()
  }, [navState])

  function filtered() {
    let list = [...items]
    if (filterName) {
      const q = filterName.toLowerCase()
      list = list.filter(i => i.name.toLowerCase().includes(q))
    }
    if (filterSouls.length) {
      list = list.filter(i => !i.undiscovered && filterSouls.some(s => i.souls && i.souls[s] !== undefined))
    }
    if (filterProps.length) {
      list = list.filter(i => !i.undiscovered && filterProps.some(p => (i.properties || []).includes(p)))
    }
    list.sort((a, b) => {
      if (sortBy === 'soul' && sortSoul) {
        // Push undiscovered items to the bottom regardless of direction
        if (a.undiscovered && !b.undiscovered) return 1
        if (!a.undiscovered && b.undiscovered) return -1
        const av = (a.souls && a.souls[sortSoul]) || 0
        const bv = (b.souls && b.souls[sortSoul]) || 0
        const cmp = av - bv
        if (cmp !== 0) return sortDir === 'asc' ? cmp : -cmp
        return a.name.localeCompare(b.name)
      }
      const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }

  function toggleSort(col) {
    if (col === 'soul' && !sortSoul) return
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir(col === 'soul' ? 'desc' : 'asc') }
  }

  function sortInd(col) {
    const active = sortBy === col && (col !== 'soul' || sortSoul)
    return active ? (sortDir === 'asc' ? '▲' : '▼') : ''
  }

  function clearFilters() {
    setFilterName(''); setFilterSouls([]); setFilterProps([])
    setSortBy('name'); setSortDir('asc'); setSortSoul('')
  }

  function handleSoulSortChange(e) {
    const soul = e.target.value
    setSortSoul(soul)
    if (soul) { setSortBy('soul'); setSortDir('desc') }
    else { setSortBy('name'); setSortDir('asc') }
  }

  const list = filtered()
  const hasFilter = !!(filterName || filterSouls.length || filterProps.length)

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-bar-controls">
          {hasFilter && <button className="btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Item</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th
                className={`col-name sortable${sortBy === 'name' ? ' sort-' + sortDir : ''}`}
                onClick={() => toggleSort('name')}
              >
                Name <span className="sort-indicator">{sortInd('name')}</span>
              </th>
              <th>Aspects</th>
              <th>Properties</th>
              <th>Books</th>
              <th>Skills</th>
              <th className="col-actions">Actions</th>
            </tr>
            <tr className="filter-row">
              <th>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter"
                  value={filterName}
                  onChange={e => setFilterName(e.target.value)}
                  autoComplete="off"
                />
              </th>
              <th>
                <MultiSelect options={SOULS} value={filterSouls} onChange={setFilterSouls} placeholder="Any Aspect" />
              </th>
              <th>
                <MultiSelect options={allProps} value={filterProps} onChange={setFilterProps} placeholder="Any Property" />
              </th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(item => {
              const itemBooks = books.filter(b => b.rereadResult === item.name && revealedBookResults.includes(b.id))
              // All discovered recipes that produce this item
              const craftingRecipes = skillRecipes.filter(r => r.outputId === item.id && discoveredCraftingResults.includes(r.id))
              // Unique skills (for display count)
              const craftingSkillCount = new Set(craftingRecipes.map(r => r.skillId)).size
              return (
                <tr key={item.id} id={`item-row-${item.id}`} className={item.undiscovered ? 'item-row-undiscovered' : ''}>
                  <td>{item.name}</td>
                  <td>
                    {item.undiscovered
                      ? <span className="undiscovered-text" title="Revealed by a discovered recipe; not yet acquired">Undiscovered</span>
                      : <SoulsDisplay souls={item.souls} />}
                  </td>
                  <td>
                    {item.undiscovered
                      ? <span className="undiscovered-text">Undiscovered</span>
                      : <TagsDisplay tags={item.properties} />}
                  </td>
                  <td>
                    {itemBooks.length ? (
                      <a className="item-link" onClick={() => setBooksModal({ itemName: item.name, books: itemBooks })}>
                        {itemBooks.length === 1 ? itemBooks[0].name : <span style={{ whiteSpace: 'nowrap' }}>{itemBooks.length} books</span>}
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {craftingRecipes.length ? (
                      <a className="item-link" onClick={() => setSkillsModal({ itemName: item.name, recipes: craftingRecipes })}>
                        {craftingSkillCount === 1
                          ? craftingRecipes[0].skillName
                          : <span style={{ whiteSpace: 'nowrap' }}>{craftingSkillCount} skills</span>}
                      </a>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <div className="actions-cell">
                      {item.undiscovered ? (
                        <button
                          className="btn-secondary btn-sm"
                          title="Mark as discovered"
                          onClick={() => onDiscover(item.id)}
                        >Reveal</button>
                      ) : (
                        <button
                          className="btn-icon delete"
                          title="Delete"
                          onClick={() => onDelete(item.id, item.name)}
                        >✕</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && hasFilter && items.length > 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.5rem' }}>
                  No items match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p className="empty-msg">No items recorded yet.</p>
      )}

      {modal && (
        <AddItemModal
          onSave={onDiscover}
          onClose={() => setModal(false)}
        />
      )}

      {booksModal && (
        <BooksInfoModal
          itemName={booksModal.itemName}
          books={booksModal.books}
          onClose={() => setBooksModal(null)}
        />
      )}

      {skillsModal && (
        <SkillsInfoModal
          itemName={skillsModal.itemName}
          recipes={skillsModal.recipes}
          onClose={() => setSkillsModal(null)}
        />
      )}
    </section>
  )
}

function AddItemModal({ onSave, onClose }) {
  const [status, setStatus] = useState('')
  const [statusOk, setStatusOk] = useState(false)
  const [preview, setPreview] = useState(null)
  const [pending, setPending] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function doLookup(name) {
    if (!name) return
    setStatus('')
    setPreview(null)
    setPending(null)
    const result = lookupItem(name)
    if (result) {
      setPending(result)
      setStatusOk(true)
      setStatus(`Found: ${result.name}`)
      setPreview(result)
      if (inputRef.current) inputRef.current.value = result.name
    } else {
      setStatusOk(false)
      setStatus('Not found in game files. Check the spelling.')
    }
  }

  function handleSave() {
    const name = inputRef.current?.value.trim()
    if (!name) { inputRef.current?.focus(); return false }
    let p = pending
    if (!p) {
      p = lookupItem(name)
      if (!p) { setStatusOk(false); setStatus('Not found in game files. Check the spelling.'); return false }
      setPending(p)
    }
    onSave(p.id)
    onClose()
    return true
  }

  return (
    <Modal title="Add Item" onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Item name</label>
        <AutocompleteInput
          placeholder="e.g. Catwink"
          searchFn={searchItems}
          onSelect={r => doLookup(r.name)}
          inputRef={inputRef}
        />
        <p className="hint">Type at least 3 characters to search</p>
      </div>
      {status && (
        <p className="hint" style={{ color: statusOk ? 'var(--gold)' : '#f08080' }}>{status}</p>
      )}
      {preview && (
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.7rem 0.9rem', marginTop: '0.5rem', fontSize: '0.88rem' }}>
          <div style={{ marginBottom: '0.4rem' }}>
            <div className="tags">
              {Object.entries(preview.souls || {}).map(([s, v]) => (
                <SoulTag key={s} soul={s} val={v} />
              ))}
            </div>
          </div>
          <TagsDisplay tags={preview.properties} />
        </div>
      )}
    </Modal>
  )
}

const TIER_LABEL = { prentice: 'Prentice', scholar: 'Scholar', keeper: 'Keeper' }

function SkillsInfoModal({ itemName, recipes, onClose }) {
  // Group recipes by skill
  const bySkill = {}
  for (const r of recipes) {
    if (!bySkill[r.skillId]) bySkill[r.skillId] = { skillName: r.skillName, recipes: [] }
    bySkill[r.skillId].recipes.push(r)
  }
  return (
    <Modal title={`Recipes — ${itemName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {Object.values(bySkill).map(({ skillName, recipes: skillRecipes }) => (
          <div key={skillName} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.6rem 0.8rem' }}>
            <div style={{ fontWeight: 500, marginBottom: '0.4rem' }}>{skillName}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {skillRecipes.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontVariant: 'small-caps', minWidth: '4.5rem', textAlign: 'right', flexShrink: 0 }}>
                    {TIER_LABEL[r.tier] ?? r.tier}
                  </span>
                  <SoulTag soul={r.soul} val={r.soulAmount} />
                  {r.ingredient && (
                    <>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>+</span>
                      <span className="tag">{r.ingredient}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function BooksInfoModal({ itemName, books, onClose }) {
  return (
    <Modal title={`Books — ${itemName}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {books.map(book => {
          const skillName = book.skillId ? skillNameById.get(book.skillId) : null
          return (
            <div key={book.id} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.6rem 0.8rem' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.35rem' }}>{book.name}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                <SoulsDisplay souls={book.souls} />
                {book.language && <span className="tag">{book.language}</span>}
                {skillName && <span className="tag">{skillName}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
