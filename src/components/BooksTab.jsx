import { useState, useEffect, useRef } from 'react'
import { searchBooks, lookupBook, gameSkills, gameLanguages } from '../storage'
import { SOULS } from '../constants'
import { SoulsDisplay, SoulTag } from './SoulTags'
import Modal from './Modal'
import ItemInfoModal from './ItemInfoModal'
import AutocompleteInput from './AutocompleteInput'
import MultiSelect from './MultiSelect'
import { gameItems } from '../storage'

// Build a skill name lookup once
const skillNameById = new Map(gameSkills.map(s => [s.id, s.name]))

const KNOWN = '— Known Languages —'
const UNKNOWN = '— Unknown Languages —'

export default function BooksTab({ books, revealedBookResults = [], discoveredLanguageIds = [], learnedLanguageIds = [], onDiscover, onRevealResult, onDelete, navigate, navState, onNavHandled }) {
  const [filterName, setFilterName] = useState('')
  const [filterSouls, setFilterSouls] = useState([])
  const [filterLanguages, setFilterLanguages] = useState([])
  const [filterSkill, setFilterSkill] = useState('')
  const [filterDiscovered, setFilterDiscovered] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal] = useState(false)
  const [itemModal, setItemModal] = useState(null) // item object to show in modal

  // "Known" = default languages + languages the user has marked as learned.
  // Books with no language tag (English) are always known.
  const learnedLanguageNames = new Set(
    gameLanguages
      .filter(l => l.isDefault || learnedLanguageIds.includes(l.id))
      .map(l => l.name)
  )
  const isLangKnown = (lang) => !lang || learnedLanguageNames.has(lang)

  // Build language filter options: groupings + each language present in books
  const presentLangs = [...new Set(books.map(b => b.language).filter(Boolean))].sort()
  const languageOptions = [KNOWN, UNKNOWN, ...presentLangs]


  useEffect(() => {
    if (!navState) return
    onNavHandled()
  }, [navState])

  function filtered() {
    let list = [...books]
    if (filterName) {
      const q = filterName.toLowerCase()
      list = list.filter(b => b.name.toLowerCase().includes(q))
    }
    if (filterSouls.length) {
      list = list.filter(b => filterSouls.some(soul => b.souls && b.souls[soul] !== undefined))
    }
    if (filterLanguages.length) {
      list = list.filter(b => {
        const lang = b.language
        return filterLanguages.some(opt => {
          if (opt === KNOWN) return isLangKnown(lang)
          if (opt === UNKNOWN) return !isLangKnown(lang)
          return lang === opt
        })
      })
    }
    if (filterSkill) {
      const q = filterSkill.toLowerCase()
      list = list.filter(b => {
        const name = b.skillId ? (skillNameById.get(b.skillId) || '') : ''
        return name.toLowerCase().includes(q)
      })
    }
    if (filterDiscovered === 'revealed') {
      list = list.filter(b => revealedBookResults.includes(b.id))
    } else if (filterDiscovered === 'hidden') {
      list = list.filter(b => b.rereadResult && !revealedBookResults.includes(b.id))
    }
    const cmp = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    list.sort((a, b) => sortDir === 'asc' ? cmp(a, b) : cmp(b, a))
    return list
  }

  function clearFilters() {
    setFilterName('')
    setFilterSouls([])
    setFilterLanguages([])
    setFilterSkill('')
    setFilterDiscovered('')
  }

  function openItemModal(rereadResult) {
    const item = gameItems.find(i => i.name === rereadResult)
    if (item) setItemModal(item)
  }

  const list = filtered()
  const hasFilter = !!(filterName || filterSouls.length || filterLanguages.length || filterSkill || filterDiscovered)

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-bar-controls">
          {hasFilter && <button className="btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Book</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th
                className={`col-name sortable sort-${sortDir}`}
                onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              >
                Name <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
              </th>
              <th>Mystery</th>
              <th>Language</th>
              <th>Skill</th>
              <th>Item Produced</th>
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
                <MultiSelect options={languageOptions} value={filterLanguages} onChange={setFilterLanguages} placeholder="Any Language" />
              </th>
              <th>
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Filter"
                  value={filterSkill}
                  onChange={e => setFilterSkill(e.target.value)}
                  autoComplete="off"
                />
              </th>
              <th>
                <select
                  className={`filter-select${!filterDiscovered ? ' is-placeholder' : ''}`}
                  value={filterDiscovered}
                  onChange={e => setFilterDiscovered(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="revealed">Memory Revealed</option>
                  <option value="hidden">Memory Hidden</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(book => {
              const resultRevealed = revealedBookResults.includes(book.id)
              const skillName = book.skillId ? skillNameById.get(book.skillId) : null
              return (
                <tr key={book.id}>
                  <td>{book.name}</td>
                  <td><SoulsDisplay souls={book.souls} /></td>
                  <td>
                    {book.language
                      ? <span className="tag">{book.language}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {skillName
                      ? <span className="tag">{skillName}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {book.rereadResult ? (
                      resultRevealed ? (
                        <a className="item-link" onClick={() => openItemModal(book.rereadResult)}>
                          {book.rereadResult}
                        </a>
                      ) : (
                        <button className="btn-secondary btn-sm" onClick={() => onRevealResult(book.id)}>
                          Reveal
                        </button>
                      )
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon delete"
                        title="Delete"
                        onClick={() => onDelete(book.id, book.name)}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && hasFilter && books.length > 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.5rem' }}>
                  No books match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {books.length === 0 && (
        <p className="empty-msg">No books recorded yet.</p>
      )}

      {modal && (
        <AddBookModal
          onSave={onDiscover}
          onClose={() => setModal(false)}
        />
      )}

      {itemModal && (
        <ItemInfoModal
          item={itemModal}
          onClose={() => setItemModal(null)}
        />
      )}
    </section>
  )
}

function AddBookModal({ onSave, onClose }) {
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
    const result = lookupBook(name)
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
      p = lookupBook(name)
      if (!p) { setStatusOk(false); setStatus('Not found in game files. Check the spelling.'); return false }
      setPending(p)
    }
    onSave(p.id)
    onClose()
    return true
  }

  return (
    <Modal title="Add Book" onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Book name</label>
        <AutocompleteInput
          placeholder="e.g. Unctuous Parable"
          searchFn={searchBooks}
          onSelect={r => doLookup(r.name)}
          inputRef={inputRef}
        />
        <p className="hint">Type at least 3 characters to search</p>
      </div>
      {status && (
        <p className="hint" style={{ color: statusOk ? 'var(--gold)' : '#f08080' }}>{status}</p>
      )}
      {preview && (
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.7rem 0.9rem', marginTop: '0.5rem' }}>
          <div style={{ marginBottom: '0.35rem' }}>
            <div className="tags">
              {Object.entries(preview.souls || {}).map(([s, v]) => (
                <SoulTag key={s} soul={s} val={v} />
              ))}
            </div>
          </div>
          {preview.language && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
              Language: <span className="tag">{preview.language}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
