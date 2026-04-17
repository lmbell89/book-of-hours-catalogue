import { useState, useEffect, useRef } from 'react'
import { gameLanguages, searchLanguages, lookupLanguage } from '../storage'
import Modal from './Modal'
import AutocompleteInput from './AutocompleteInput'

export default function LanguagesTab({ discoveredLanguageIds = [], learnedLanguageIds = [], onDiscover, onLearn, onUnlearn, onDelete }) {
  const [filterName, setFilterName] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLearned, setFilterLearned] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal] = useState(false)

  const discoveredSet = new Set(discoveredLanguageIds)
  const learnedSet = new Set(learnedLanguageIds)
  const isLearned = (l) => l.isDefault || learnedSet.has(l.id)
  // Defaults always show, plus any discovered non-default languages
  let list = gameLanguages.filter(l => l.isDefault || discoveredSet.has(l.id))
  if (filterName) {
    const q = filterName.toLowerCase()
    list = list.filter(l => l.name.toLowerCase().includes(q))
  }
  if (filterType === 'normal') list = list.filter(l => l.isDefault)
  else if (filterType === 'special') list = list.filter(l => !l.isDefault)
  if (filterLearned === 'yes') list = list.filter(l => isLearned(l))
  else if (filterLearned === 'no') list = list.filter(l => !isLearned(l))
  list = [...list].sort((a, b) => {
    const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalVisible = gameLanguages.filter(l => l.isDefault || discoveredSet.has(l.id)).length
  const hasFilter = !!(filterName || filterType || filterLearned)
  function clearFilters() { setFilterName(''); setFilterType(''); setFilterLearned('') }

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-bar-controls">
          {hasFilter && <button className="btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Language</button>
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
              <th>Type</th>
              <th>Learned</th>
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
                <select
                  className={`filter-select${!filterType ? ' is-placeholder' : ''}`}
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="normal">Normal</option>
                  <option value="special">Special</option>
                </select>
              </th>
              <th>
                <select
                  className={`filter-select${!filterLearned ? ' is-placeholder' : ''}`}
                  value={filterLearned}
                  onChange={e => setFilterLearned(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="yes">Learned</option>
                  <option value="no">Not Learned</option>
                </select>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(lang => {
              const learned = isLearned(lang)
              return (
                <tr key={lang.id}>
                  <td>{lang.name}</td>
                  <td>{lang.isDefault ? 'Normal' : 'Special'}</td>
                  <td>
                    <div className="toggle-cell">
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={learned}
                          disabled={lang.isDefault}
                          onChange={() => learned ? onUnlearn(lang.id) : onLearn(lang.id)}
                        />
                        <span className="toggle-slider" />
                      </label>
                      <span className="toggle-label" style={{ color: learned ? 'var(--gold)' : 'var(--text-dim)' }}>
                        {learned ? 'Learned' : 'Not Learned'}
                      </span>
                    </div>
                  </td>
                  <td>
                    {!lang.isDefault && (
                      <div className="actions-cell">
                        <button
                          className="btn-icon delete"
                          title="Remove"
                          onClick={() => onDelete(lang.id, lang.name)}
                        >✕</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.5rem' }}>
                  No languages match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <AddLanguageModal
          existingIds={discoveredSet}
          onSave={onDiscover}
          onClose={() => setModal(false)}
        />
      )}
    </section>
  )
}

function AddLanguageModal({ existingIds, onSave, onClose }) {
  const [status, setStatus] = useState('')
  const [statusOk, setStatusOk] = useState(false)
  const [pending, setPending] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function doLookup(name) {
    if (!name) return
    setStatus('')
    setPending(null)
    const result = lookupLanguage(name)
    if (!result) {
      setStatusOk(false); setStatus('Not found in game files. Check the spelling.')
      return
    }
    if (result.isDefault) {
      setStatusOk(false); setStatus(`${result.name} is a default language and is always shown.`)
      return
    }
    if (existingIds.has(result.id)) {
      setStatusOk(false); setStatus(`${result.name} has already been added.`)
      return
    }
    setPending(result); setStatusOk(true); setStatus(`Found: ${result.name}`)
    if (inputRef.current) inputRef.current.value = result.name
  }

  function handleSave() {
    const name = inputRef.current?.value.trim()
    if (!name) { inputRef.current?.focus(); return false }
    let p = pending
    if (!p) {
      p = lookupLanguage(name)
      if (!p) { setStatusOk(false); setStatus('Not found in game files. Check the spelling.'); return false }
      if (p.isDefault) { setStatusOk(false); setStatus(`${p.name} is a default language.`); return false }
      if (existingIds.has(p.id)) { setStatusOk(false); setStatus(`${p.name} already added.`); return false }
    }
    onSave(p.id)
    onClose()
    return true
  }

  return (
    <Modal title="Add Language" onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Language name</label>
        <AutocompleteInput
          placeholder="e.g. Latin"
          searchFn={searchLanguages}
          onSelect={r => doLookup(r.name)}
          inputRef={inputRef}
        />
        <p className="hint">Type at least 3 characters to search</p>
      </div>
      {status && (
        <p className="hint" style={{ color: statusOk ? 'var(--gold)' : '#f08080' }}>{status}</p>
      )}
    </Modal>
  )
}
