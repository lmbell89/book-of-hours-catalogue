import { useState, useRef, useEffect } from 'react'
import { SOULS } from '../constants'
import { SoulArrayDisplay, TagsDisplay } from './SoulTags'
import Modal from './Modal'
import AutocompleteInput from './AutocompleteInput'
import MultiSelect from './MultiSelect'
import { searchWorkstations, lookupWorkstation } from '../storage'

export default function StationsTab({ stations, onDiscover, onDelete }) {
  const [filterName, setFilterName] = useState('')
  const [filterSouls, setFilterSouls] = useState([])
  const [filterWisdom, setFilterWisdom] = useState([])
  const [filterProps, setFilterProps] = useState([])
  const [sortDir, setSortDir] = useState('asc')
  const [modal, setModal] = useState(false)

  const allWisdom = [...new Set(stations.map(s => s.wisdom).filter(Boolean))].sort()
  const allProps = [...new Set(stations.flatMap(s => [...(s.slot4 || []), ...(s.slot5 || []), ...(s.slot6 || [])]))].sort()

  let list = stations
  if (filterName) { const q = filterName.toLowerCase(); list = list.filter(s => s.name.toLowerCase().includes(q)) }
  if (filterSouls.length) list = list.filter(s => filterSouls.some(soul => (s.souls || []).includes(soul)))
  if (filterWisdom.length) list = list.filter(s => filterWisdom.includes(s.wisdom))
  if (filterProps.length) list = list.filter(s => filterProps.some(p => [...(s.slot4 || []), ...(s.slot5 || []), ...(s.slot6 || [])].includes(p)))
  list = [...list].sort((a, b) => {
    const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    return sortDir === 'asc' ? cmp : -cmp
  })

  const hasFilters = !!(filterName || filterSouls.length || filterWisdom.length || filterProps.length)

  function clearFilters() {
    setFilterName(''); setFilterSouls([]); setFilterWisdom([]); setFilterProps([])
  }

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-bar-controls">
          {hasFilters && <button className="btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
        </div>
        <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Workstation</button>
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
              <th>Wisdom</th>
              <th>Aspects</th>
              <th>Properties</th>
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
                <MultiSelect options={allWisdom} value={filterWisdom} onChange={setFilterWisdom} placeholder="Any Wisdom" />
              </th>
              <th>
                <MultiSelect options={SOULS} value={filterSouls} onChange={setFilterSouls} placeholder="Any Aspect" />
              </th>
              <th>
                <MultiSelect options={allProps} value={filterProps} onChange={setFilterProps} placeholder="Any Property" />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(station => (
              <tr key={station.id}>
                <td>{station.name}</td>
                <td>{station.wisdom ? <span className="tag">{station.wisdom}</span> : '—'}</td>
                <td><SoulArrayDisplay souls={station.souls} /></td>
                <td>
                  <TagsDisplay tags={[...new Set([...(station.slot4 || []), ...(station.slot5 || []), ...(station.slot6 || [])])].sort()} />
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon delete" title="Remove" onClick={() => onDelete(station.id, station.name)}>✕</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stations.length === 0 && (
        <p className="empty-msg">No stations discovered yet.</p>
      )}

      {modal && (
        <AddStationModal
          onSave={onDiscover}
          onClose={() => setModal(false)}
        />
      )}
    </section>
  )
}

function AddStationModal({ onSave, onClose }) {
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
    const result = lookupWorkstation(name)
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
      p = lookupWorkstation(name)
      if (!p) { setStatusOk(false); setStatus('Not found in game files. Check the spelling.'); return false }
      setPending(p)
    }
    onSave(p.id)
    onClose()
    return true
  }

  return (
    <Modal title="Discover Station" onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Station name</label>
        <AutocompleteInput
          placeholder="e.g. Altar: Ascite"
          searchFn={searchWorkstations}
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
          {preview.wisdom && (
            <div style={{ marginBottom: '0.4rem' }}>
              <span className="tag">{preview.wisdom}</span>
            </div>
          )}
          <SoulArrayDisplay souls={preview.souls} />
          {(preview.slot4?.length > 0 || preview.slot5?.length > 0 || preview.slot6?.length > 0) && (
            <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {preview.slot4?.length > 0 && <div><span style={{ color: 'var(--text-dim)', marginRight: '0.4rem' }}>Slot 4:</span><TagsDisplay tags={preview.slot4} /></div>}
              {preview.slot5?.length > 0 && <div><span style={{ color: 'var(--text-dim)', marginRight: '0.4rem' }}>Slot 5:</span><TagsDisplay tags={preview.slot5} /></div>}
              {preview.slot6?.length > 0 && <div><span style={{ color: 'var(--text-dim)', marginRight: '0.4rem' }}>Slot 6:</span><TagsDisplay tags={preview.slot6} /></div>}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
