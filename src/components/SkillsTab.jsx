import { useState, useEffect, useRef } from 'react'
import { SOULS } from '../constants'
import { searchSkills, lookupSkill, gameItems, lookupWisdomCommitment, gameWisdomCommitments } from '../storage'
import { SoulsDisplay, SoulTag, TagsDisplay } from './SoulTags'
import Modal from './Modal'
import ItemInfoModal from './ItemInfoModal'
import MultiSelect from './MultiSelect'
import AutocompleteInput from './AutocompleteInput'

const TIER_ORDER = ['prentice', 'scholar', 'keeper']
const TIER_LABEL = { prentice: 'Prentice', scholar: 'Scholar', keeper: 'Keeper' }

export default function SkillsTab({ skills, onDiscover, onDelete, onSetLevel, onSetCommitment, onSetFulfilled, skillRecipes = [], discoveredCraftingResults = [], discoveredItems = [], onDiscoverResult, navigate, navState, onNavHandled }) {
  const [filterName, setFilterName] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [filterSouls, setFilterSouls] = useState([])
  const [filterWisdoms, setFilterWisdoms] = useState([])
  const [filterProps, setFilterProps] = useState([])
  const [filterLevel, setFilterLevel] = useState('')
  const [filterCommitment, setFilterCommitment] = useState([])
  const [modal, setModal] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [itemModal, setItemModal] = useState(null) // { item, discovered }

  // Handle navigation to a specific skill
  useEffect(() => {
    if (!navState) return
    if (navState.skillId) {
      setExpanded(prev => new Set([...prev, navState.skillId]))
      requestAnimationFrame(() => {
        const row = document.getElementById(`skill-row-${navState.skillId}`)
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    onNavHandled()
  }, [navState])

  function filtered() {
    let list = [...skills]
    if (filterName) {
      const q = filterName.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    if (filterSouls.length) {
      list = list.filter(s => filterSouls.some(soul => s.souls && s.souls[soul] !== undefined))
    }
    if (filterWisdoms.length) {
      const set = new Set(filterWisdoms)
      list = list.filter(s => {
        // Skill must have at least one matching wisdom
        if (!(s.wisdoms || []).some(w => set.has(w))) return false
        // If committed to a wisdom not in the filter, exclude it
        if (s.committedWisdom && !set.has(s.committedWisdom)) return false
        return true
      })
    }
    if (filterProps.length) {
      const set = new Set(filterProps)
      list = list.filter(s => (s.properties || []).some(p => set.has(p)))
    }
    if (filterLevel) {
      const lvl = parseInt(filterLevel, 10)
      list = list.filter(s => (s.level || 1) === lvl)
    }
    if (filterCommitment.length) {
      list = list.filter(s => {
        const commitment = s.committedWisdom ? lookupWisdomCommitment(s.id, s.committedWisdom) : null
        return filterCommitment.some(f => {
          if (f === 'Uncommitted') return !s.committedWisdom
          if (f === 'Committed') return s.committedWisdom && !s.commitmentFulfilled
          if (f === 'Fulfilled') return s.committedWisdom && s.commitmentFulfilled
          // Soul type filter (e.g. "Shapt", "Fet")
          return commitment && commitment.abilityLabel === f
        })
      })
    }
    list.sort((a, b) => {
      const cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }

  // All wisdoms appearing across the (discovered) skill list
  const allWisdoms = [...new Set(skills.flatMap(s => s.wisdoms || []))].sort()
  const allProps = [...new Set(skills.flatMap(s => s.properties || []))].sort()

  const list = filtered()
  // Soul type options for the committed filter
  const allSoulTypes = [...new Set(gameWisdomCommitments.map(c => c.abilityLabel))].sort()
  const commitmentOptions = ['Uncommitted', 'Committed', 'Fulfilled', ...allSoulTypes]

  const hasFilter = !!(filterName || filterSouls.length || filterWisdoms.length || filterProps.length || filterLevel || filterCommitment.length)

  function clearFilters() {
    setFilterName(''); setFilterSouls([]); setFilterWisdoms([]); setFilterProps([]); setFilterLevel(''); setFilterCommitment([])
  }

  function toggleExpand(skillId) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(skillId)) next.delete(skillId)
      else next.add(skillId)
      return next
    })
  }

  // Group recipes by skillId for quick lookup
  const recipesBySkill = {}
  for (const r of skillRecipes) {
    if (!recipesBySkill[r.skillId]) recipesBySkill[r.skillId] = []
    recipesBySkill[r.skillId].push(r)
  }

  const skillsWithRecipes = list.filter(s => (recipesBySkill[s.id] || []).length > 0)
  const allExpanded = skillsWithRecipes.length > 0 && skillsWithRecipes.every(s => expanded.has(s.id))

  function toggleExpandAll() {
    if (allExpanded) {
      setExpanded(new Set())
    } else {
      setExpanded(new Set(skillsWithRecipes.map(s => s.id)))
    }
  }

  return (
    <section>
      <div className="filter-bar">
        <div className="filter-bar-controls">
          {hasFilter && <button className="btn-secondary btn-sm" onClick={clearFilters}>Clear Filters</button>}
        </div>
        <div className="filter-bar-right">
          {skillsWithRecipes.length > 0 && (
            <button className="btn-secondary btn-sm" onClick={toggleExpandAll}>
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          )}
          <button className="btn-primary btn-sm" onClick={() => setModal(true)}>+ Add Skill</button>
        </div>
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
              <th>Level</th>
              <th>Aspects</th>
              <th>Wisdoms</th>
              <th className="col-committed">Soul</th>
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
                <input
                  type="number"
                  className="filter-input filter-input-number filter-input-no-arrows"
                  placeholder="Any"
                  value={filterLevel}
                  min={1}
                  max={9}
                  onChange={e => setFilterLevel(e.target.value)}
                />
              </th>
              <th>
                <MultiSelect options={SOULS} value={filterSouls} onChange={setFilterSouls} placeholder="Any Aspect" />
              </th>
              <th>
                <MultiSelect options={allWisdoms} value={filterWisdoms} onChange={setFilterWisdoms} placeholder="Any Wisdom" />
              </th>
              <th>
                <MultiSelect options={commitmentOptions} value={filterCommitment} onChange={setFilterCommitment} placeholder="Any" />
              </th>
              <th>
                <MultiSelect options={allProps} value={filterProps} onChange={setFilterProps} placeholder="Any Property" />
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(skill => {
              const recipes = recipesBySkill[skill.id] || []
              const isExpanded = expanded.has(skill.id)
              return (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  recipes={recipes}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(skill.id)}
                  discoveredCraftingResults={discoveredCraftingResults}
                  onDiscoverResult={onDiscoverResult}
                  onDelete={onDelete}
                  onSetLevel={onSetLevel}
                  onSetCommitment={onSetCommitment}
                  onSetFulfilled={onSetFulfilled}
                  discoveredItems={discoveredItems}
                  onOpenItemModal={item => setItemModal(item)}
                />
              )
            })}
            {list.length === 0 && hasFilter && skills.length > 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1.5rem' }}>
                  No skills match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {skills.length === 0 && (
        <p className="empty-msg">No skills recorded yet.</p>
      )}

      {modal && (
        <AddSkillModal
          onSave={onDiscover}
          onClose={() => setModal(false)}
        />
      )}

      {itemModal && (
        <ItemInfoModal
          item={itemModal.item}
          discovered={itemModal.discovered}
          onClose={() => setItemModal(null)}
        />
      )}
    </section>
  )
}

function SkillRow({ skill, recipes, isExpanded, onToggle, discoveredCraftingResults, onDiscoverResult, onDelete, onSetLevel, onSetCommitment, onSetFulfilled, discoveredItems, onOpenItemModal }) {
  const level = skill.level || 1
  // BoH: at level N each soul gains (N-1) on top of its base value.
  // Higher (base 2) soul ends up at level+1; lower (base 1) at level.
  const scaledSouls = {}
  for (const [s, v] of Object.entries(skill.souls || {})) scaledSouls[s] = v + (level - 1)
  const committedWisdom = skill.committedWisdom || null
  const commitment = committedWisdom ? lookupWisdomCommitment(skill.id, committedWisdom) : null
  const [trySoul, setTrySoul] = useState('')
  const [tryAmount, setTryAmount] = useState('')
  const [tryFeedback, setTryFeedback] = useState(null) // { type: 'found'|'known'|'miss' }

  // Only non-keeper recipes are in play
  const visibleRecipes = recipes

  // Discovered subset grouped by tier
  const byTier = {}
  for (const r of visibleRecipes) {
    if (!discoveredCraftingResults.includes(r.id)) continue
    if (!byTier[r.tier]) byTier[r.tier] = []
    byTier[r.tier].push(r)
  }

  const discoveredCount = visibleRecipes.filter(r => discoveredCraftingResults.includes(r.id)).length

  // Undiscovered recipes grouped by tier
  const undiscoveredByTier = {}
  for (const r of visibleRecipes) {
    if (discoveredCraftingResults.includes(r.id)) continue
    if (!undiscoveredByTier[r.tier]) undiscoveredByTier[r.tier] = []
    undiscoveredByTier[r.tier].push(r)
  }
  const undiscoveredCount = visibleRecipes.length - discoveredCount

  function handleTry() {
    if (!trySoul || !tryAmount) return
    const amount = parseInt(tryAmount, 10)
    if (isNaN(amount)) return
    const match = visibleRecipes.find(r => r.soul === trySoul && r.soulAmount === amount)
    if (!match) {
      setTryFeedback({ type: 'miss' })
    } else if (discoveredCraftingResults.includes(match.id)) {
      setTryFeedback({ type: 'known' })
    } else {
      onDiscoverResult(match.id)
      setTryFeedback({ type: 'found' })
    }
  }

  function handleTryKeyDown(e) {
    if (e.key === 'Enter') handleTry()
  }

  function resetTry() {
    setTrySoul(''); setTryAmount(''); setTryFeedback(null)
  }

  useEffect(() => {
    if (tryFeedback?.type !== 'found') return
    const timer = setTimeout(() => setTryFeedback(null), 3000)
    return () => clearTimeout(timer)
  }, [tryFeedback])

  return (
    <>
      <tr
        id={`skill-row-${skill.id}`}
        className={visibleRecipes.length > 0 ? 'skill-row-expandable' : ''}
        onClick={e => { if (visibleRecipes.length > 0 && !e.target.closest('button') && !e.target.closest('select') && !e.target.closest('input')) onToggle() }}
      >
        <td>{skill.name}</td>
        <td>
          <select
            className="filter-select skill-level-select"
            value={level}
            onClick={e => e.stopPropagation()}
            onChange={e => onSetLevel(skill.id, parseInt(e.target.value, 10))}
          >
            {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </td>
        <td><SoulsDisplay souls={scaledSouls} /></td>
        <td>
          {skill.wisdoms && skill.wisdoms.length > 0 ? (
            <div className="tags">
              {skill.wisdoms.map(w => {
                const isCommitted = committedWisdom === w
                const otherCommitted = committedWisdom && !isCommitted
                return (
                  <span
                    key={w}
                    className={`tag wisdom-tag${isCommitted ? ' wisdom-tag--committed' : ''}${otherCommitted ? ' wisdom-tag--dimmed' : ''}`}
                    onClick={e => {
                      e.stopPropagation()
                      if (isCommitted) onSetCommitment(skill.id, null)
                      else onSetCommitment(skill.id, w)
                    }}
                    title={isCommitted ? 'Click to uncommit' : `Commit this skill to ${w}`}
                  >{w}</span>
                )
              })}
            </div>
          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td>
          {commitment ? (
            <div className="skill-committed-cell">
              <span className={`tag soul ability-${commitment.abilityLabel}`}>
                {commitment.abilityLabel}
              </span>
              <div className="toggle-cell" onClick={e => e.stopPropagation()}>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={!!skill.commitmentFulfilled}
                    onChange={() => onSetFulfilled(skill.id, !skill.commitmentFulfilled)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-label" style={{ color: skill.commitmentFulfilled ? 'var(--gold)' : 'var(--text-dim)' }}>
                  {skill.commitmentFulfilled ? 'Fulfilled' : 'Committed'}
                </span>
              </div>
            </div>
          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </td>
        <td><TagsDisplay tags={skill.properties} /></td>
        <td>
          <div className="actions-cell">
            {visibleRecipes.length > 0 && (
              <button
                className="btn-icon"
                onClick={e => { e.stopPropagation(); onToggle() }}
                title={isExpanded ? 'Hide recipes' : 'Show recipes'}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
            )}
            <button
              className="btn-icon delete"
              title="Delete"
              onClick={e => { e.stopPropagation(); onDelete(skill.id, skill.name) }}
            >✕</button>
          </div>
        </td>
      </tr>
      {isExpanded && visibleRecipes.length > 0 && (
        <tr className="skill-recipes-row">
          <td colSpan={7} className="skill-recipes-cell">

            {/* Discovered recipes — tier label shown inline on every row */}
            {discoveredCount > 0 && (
              <div className="skill-recipes-discovered">
                <div className="skill-recipe-list">
                  {TIER_ORDER.filter(t => byTier[t]).flatMap(tier =>
                    byTier[tier].map(recipe => (
                      <div key={recipe.id} className="skill-recipe">
                        <span className="skill-recipe-tier-label">{TIER_LABEL[tier]}</span>
                        <SoulTag soul={recipe.soul} val={recipe.soulAmount} />
                        {recipe.ingredient && (
                          <>
                            <span className="skill-recipe-plus">+</span>
                            <span className="tag">{recipe.ingredient}</span>
                          </>
                        )}
                        <span className="skill-recipe-arrow">→</span>
                        <a className="item-link" onClick={() => {
                          const item = gameItems.find(i => i.id === recipe.outputId)
                          if (item) onOpenItemModal({ item, discovered: discoveredItems.includes(item.id) })
                        }}>
                          {recipe.outputLabel}
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Undiscovered recipes */}
            {undiscoveredCount > 0 && (
              <div className={`skill-recipes-unknown${discoveredCount === 0 ? ' skill-recipes-unknown--first' : ''}`}>
                <div className="skill-recipe-list">
                  {TIER_ORDER.filter(t => undiscoveredByTier[t]).flatMap(tier =>
                    undiscoveredByTier[tier].map((_, i) => (
                      <div key={`${tier}-${i}`} className="skill-recipe skill-recipe--unknown">
                        <span className="skill-recipe-tier-label">{TIER_LABEL[tier]}</span>
                        <span className="skill-recipe-unknown-placeholder">???</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Try a combination */}
            <div className={`skill-recipe-try${discoveredCount === 0 && undiscoveredCount === 0 ? ' skill-recipe-try--first' : ''}`}>
              <select
                className={`filter-select skill-recipe-try-soul${!trySoul ? ' is-placeholder' : ''}`}
                value={trySoul}
                onChange={e => { setTrySoul(e.target.value); setTryFeedback(null) }}
              >
                <option value="">Soul…</option>
                {SOULS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select
                className={`filter-select skill-recipe-try-amount${!tryAmount ? ' is-placeholder' : ''}`}
                value={tryAmount}
                onChange={e => { setTryAmount(e.target.value); setTryFeedback(null) }}
              >
                <option value="">Amount…</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
              </select>
              <button
                className="btn-secondary btn-sm"
                onClick={handleTry}
                disabled={!trySoul || !tryAmount}
              >Add Recipe</button>
              {tryFeedback && (
                <>
                  <span className={`skill-recipe-try-feedback skill-recipe-try-feedback--${tryFeedback.type}`}>
                    {tryFeedback.type === 'found' && '✓ Recipe revealed!'}
                    {tryFeedback.type === 'known' && 'Already known.'}
                    {tryFeedback.type === 'miss' && 'No match.'}
                  </span>
                  <button className="btn-icon" title="Clear" onClick={resetTry}>✕</button>
                </>
              )}
            </div>

          </td>
        </tr>
      )}
    </>
  )
}

function AddSkillModal({ onSave, onClose }) {
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
    const result = lookupSkill(name)
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
      p = lookupSkill(name)
      if (!p) { setStatusOk(false); setStatus('Not found in game files. Check the spelling.'); return false }
      setPending(p)
    }
    onSave(p.id)
    onClose()
    return true
  }

  return (
    <Modal title="Add Skill" onClose={onClose} onSave={handleSave}>
      <div className="form-group">
        <label>Skill name</label>
        <AutocompleteInput
          placeholder="e.g. Birdsong"
          searchFn={searchSkills}
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
          <div className="tags">
            {Object.entries(preview.souls || {}).map(([s, v]) => (
              <SoulTag key={s} soul={s} val={v} />
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
