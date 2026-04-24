import { useState, useEffect, useRef } from 'react'
import { searchBeasts, lookupBeast, gameItems } from '../storage'
import { SOULS } from '../constants'
import { SoulsDisplay, SoulTag } from './SoulTags'
import Modal from './Modal'
import ItemInfoModal from './ItemInfoModal'
import AutocompleteInput from './AutocompleteInput'
import MultiSelect from './MultiSelect'

export default function BeastsTab({ beasts, discoveredItemIds = [], onDiscover, onDiscoverItem, onDelete }) {
  const [filterName, setFilterName] = useState('')
  const [filterSouls, setFilterSouls] = useState([])
  const [filterCooperative, setFilterCooperative] = useState('')
  const [filterRevealed, setFilterRevealed] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal] = useState(false)
  const [itemModal, setItemModal] = useState(null)

  const discoveredItemIdSet = new Set(discoveredItemIds)

  function filtered() {
    let list = [...beasts]
    if (filterName) {
      const q = filterName.toLowerCase()
      list = list.filter(b => b.name.toLowerCase().includes(q))
    }
    if (filterSouls.length) {
      list = list.filter(b => filterSouls.some(s => b.souls && b.souls[s] !== undefined))
    }
    if (filterCooperative === 'yes') list = list.filter(b => b.cooperative)
    else if (filterCooperative === 'no') list = list.filter(b => !b.cooperative)
    if (filterRevealed === 'revealed') {
      list = list.filter(b => b.talkResultId && discoveredItemIdSet.has(b.talkResultId))
    } else if (filterRevealed === 'hidden') {
      list = list.filter(b => b.talkResultId && !discoveredItemIdSet.has(b.talkResultId))
    }
    const cmp = (a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    list.sort((a, b) => sortDir === 'asc' ? cmp(a, b) : cmp(b, a))
    return list
  }

  function clearFilters() {
    setFilterName('')
    setFilterSouls([])
    setFilterCooperative('')
    setFilterRevealed('')
  }

  function openItemModal(name) {
    const item = gameItems.find(i => i.name === name)
    if (item) setItemModal(item)
  }

  const list = filtered()
  const hasFilter = !!(filterName || filterSouls.length || filterCooperative || filterRevealed)

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-bar-controls">
          {hasFilter && <button className="btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Beast</button>
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
              <th>Aspects</th>
              <th>Cooperative</th>
              <th>Talk Reward</th>
              <th>Scrutiny Reward</th>
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
                <select
                  className={`filter-select${!filterCooperative ? ' is-placeholder' : ''}`}
                  value={filterCooperative}
                  onChange={e => setFilterCooperative(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="yes">Cooperative</option>
                  <option value="no">Hungry / Wild</option>
                </select>
              </th>
              <th>
                <select
                  className={`filter-select${!filterRevealed ? ' is-placeholder' : ''}`}
                  value={filterRevealed}
                  onChange={e => setFilterRevealed(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="revealed">Revealed</option>
                  <option value="hidden">Hidden</option>
                </select>
              </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(beast => {
              const talkRevealed = beast.talkResultId && discoveredItemIdSet.has(beast.talkResultId)
              const inspectRevealed = beast.inspectResultId && discoveredItemIdSet.has(beast.inspectResultId)
              return (
                <tr key={beast.id}>
                  <td>{beast.name}</td>
                  <td><SoulsDisplay souls={beast.souls} /></td>
                  <td>
                    {beast.cooperative
                      ? <span className="tag">Yes</span>
                      : <span style={{ color: 'var(--text-muted)' }}>No</span>}
                  </td>
                  <td>
                    {beast.talkResult ? (
                      talkRevealed ? (
                        <a className="item-link" onClick={() => openItemModal(beast.talkResult)}>
                          {beast.talkResult}
                        </a>
                      ) : (
                        <button className="btn-secondary btn-sm" onClick={() => onDiscoverItem(beast.talkResultId)}>
                          Reveal
                        </button>
                      )
                    ) : <span style={{ color: 'var(--text-muted)' }} title="Not cooperative — feed it first">—</span>}
                  </td>
                  <td>
                    {beast.inspectResult ? (
                      inspectRevealed ? (
                        <a className="item-link" onClick={() => openItemModal(beast.inspectResult)}>
                          {beast.inspectResult}
                        </a>
                      ) : (
                        <button className="btn-secondary btn-sm" onClick={() => onDiscoverItem(beast.inspectResultId)}>
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
                        onClick={() => onDelete(beast.id, beast.name)}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && hasFilter && beasts.length > 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.5rem' }}>
                  No beasts match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {beasts.length === 0 && (
        <p className="empty-msg">No beasts recorded yet.</p>
      )}

      {modal && (
        <AddBeastModal
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

function AddBeastModal({ onSave, onClose }) {
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
    const result = lookupBeast(name)
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
      p = lookupBeast(name)
      if (!p) { setStatusOk(false); setStatus('Not found in game files. Check the spelling.'); return false }
      setPending(p)
    }
    onSave(p.id)
    onClose()
    return true
  }

  return (
    <Modal title="Add Beast" onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Beast name</label>
        <AutocompleteInput
          placeholder="e.g. Loyal Dog"
          searchFn={searchBeasts}
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
          {preview.cooperative && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Cooperative — will respond to a Soul card
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
