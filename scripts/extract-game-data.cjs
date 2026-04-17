#!/usr/bin/env node
'use strict';
// Run with: node scripts/extract-game-data.js  (from project root)
// Reads from game installation, writes JSON files into src/data/.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = path.join(
  process.env.HOME,
  'Library/Application Support/Steam/steamapps/common/Book of Hours',
  'OSX.app/Contents/Resources/Data/StreamingAssets/bhcontent/core/elements'
);
const VERBS_BASE = path.join(
  process.env.HOME,
  'Library/Application Support/Steam/steamapps/common/Book of Hours',
  'OSX.app/Contents/Resources/Data/StreamingAssets/bhcontent/core/verbs'
);

const ITEMS_FILE      = path.join(BASE, 'aspecteditems.json');
const TOMES_FILE      = path.join(BASE, 'tomes.json');
const PROTOTYPES_FILE = path.join(BASE, '_prototypes.json');
const SKILLS_FILE     = path.join(BASE, 'skills.json');
const SKILLS_R_FILE   = path.join(BASE, 'skills_r.json');
const SRC             = path.join(__dirname, '..', 'src', 'data');


const WS_FILES = [
  'workstations_library_world.json',
  'workstations_village.json',
  'workstations_unusual.json',
  'workstations_upgraded.json',
  'workstations_beds.json',
  'workstations_gathering.json',
  'workstations_legacy.json',
];

// Sanitize control characters inside JSON strings (UTF-8 version)
// Also strips trailing commas before ] or } (game files use non-strict JSON)
function readJsonWithControlCharsUtf8(filePath) {
  let str = fs.readFileSync(filePath, 'utf8');
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped)           { result += c; escaped = false; continue; }
    if (c === '\\' && inString) { result += c; escaped = true;  continue; }
    if (c === '"')         { inString = !inString; result += c; continue; }
    if (inString && c === '\n') { result += '\\n'; continue; }
    if (inString && c === '\r') { result += '\\r'; continue; }
    if (inString && c === '\t') { result += '\\t'; continue; }
    result += c;
  }
  // Remove trailing commas before ] or }
  result = result.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(result);
}

// Auto-detect UTF-16 BOM vs UTF-8 and parse with the right reader
function readJsonAuto(filePath) {
  const head = fs.readFileSync(filePath, { encoding: null }).slice(0, 2);
  if (head[0] === 0xFF && head[1] === 0xFE) return readJsonWithControlChars(filePath);
  return readJsonWithControlCharsUtf8(filePath);
}

// tomes.json contains literal newlines inside JSON strings — fix them before parsing
function readJsonWithControlChars(filePath) {
  const raw = execFileSync('iconv', ['-f', 'UTF-16', '-t', 'UTF-8', filePath]);
  let str = raw.toString('utf-8');
  // Replace bare control characters inside string values with their escape sequences
  let result = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (escaped)           { result += c; escaped = false; continue; }
    if (c === '\\' && inString) { result += c; escaped = true;  continue; }
    if (c === '"')         { inString = !inString; result += c; continue; }
    if (inString && c === '\n') { result += '\\n'; continue; }
    if (inString && c === '\r') { result += '\\r'; continue; }
    if (inString && c === '\t') { result += '\\t'; continue; }
    result += c;
  }
  return JSON.parse(result);
}

const WISDOM_LABEL = {
  'w.birdsong':      'Birdsong',
  'w.bosk':          'Bosk',
  'w.horomachistry': 'Horomachistry',
  'w.hushery':       'Hushery',
  'w.illumination':  'Illumination',
  'w.ithastry':      'Ithastry',
  'w.nyctodromy':    'Nyctodromy',
  'w.preservation':  'Preservation',
  'w.skolekosophy':  'Skolekosophy',
};

const SOUL_ASPECTS = new Set([
  'lantern','forge','edge','winter','heart','grail',
  'moth','knock','scale','sky','moon','rose','nectar'
]);

const PROP_LABEL = {
  // Courses
  'course.first':   'First Course',
  'course.side':    'Side Course',
  'course.main':    'Main Course',
  'course.pudding': 'Pudding Course',
  // Esoteric skills / lore
  'e.birdsong':      'Birdsong',
  'e.nyctodromy':    'Nyctodromy',
  'e.preservation':  'Preservation',
  'e.skolekosophy':  'Skolekosophy',
  'e.ithastry':      'Ithastry',
  'e.horomachistry': 'Horomachistry',
  'e.illumination':  'Illumination',
  'e.hushery':       'Hushery',
  'e.bosk':          'Bosk',
  // Materials & substances
  'milk.aspect':  'Milk',
  'ink':          'Ink',
  'pigment':      'Pigment',
  'encaustum':    'Encaustum',
  'liquid':       'Liquid',
  'water':        'Water',
  'fuel':         'Fuel',
  'light':        'Light',
  'metal':        'Metal',
  'wood':         'Wood',
  'wooden':       'Wooden',
  'stone':        'Stone',
  'gem':          'Gem',
  'glass':        'Glass',
  'fabric':       'Fabric',
  'woven':        'Woven',
  'flower':       'Flower',
  'fruit':        'Fruit',
  'bread':        'Bread',
  'root':         'Root',
  'leaf':         'Leaf',
  'egg':          'Egg',
  'carcass':      'Carcass',
  'remains':      'Remains',
  'beast':        'Beast',
  'beverage':     'Beverage',
  'candle':       'Candle',
  'numen':        'Numen',
  // Food / drink
  'sustenance':   'Sustenance',
  'ingredient':   'Cooking Ingredient',
  'intoxicating': 'Intoxicating',
  'brewable':     'Brewable',
  'spicing':      'Spicing',
  'kitchenware':  'Kitchenware',
  'cooperative':  'Cooperative',
  'raw':          'Raw',
  // Tools & objects
  'tool':         'Tool',
  'knife':        'Knife',
  'lens':         'Lens',
  'key':          'Key',
  'instrument':   'Instrument',
  'tally':        'Tally',
  'fixed':        'Fixed',
  'inert':        'Inert',
  'material':     'Material',
  'covenant':     'Covenant',
  // Soul / ability token
  'ability':      'Element of the soul',
  // Devices & physical objects
  'device':       'Device',
  'ductile':      'Ductile',
  'film':         'Film',
  'journal':      'Journal',
  'readable':     'Readable',
  'record.phonograph': 'Phonograph Record',
  // Status & currency
  'blank':        'Blank',
  'malady':       'Malady',
  'mark':         'Mark',
  'pence':        'Pence',
  'penny':        'Penny',
  // Other
  'sound':        'Sound',
  'omen':         'Omen',
  'memory':       'Memory',
  'restorative':  'Restorative',
  'soiled':       'Soiled',
  'soaked':       'Soaked',
  // Caches
  'cache.unregarded.rarities': 'Cache (Unregarded)',
  'cache.bright.rarities':     'Cache (Bright)',
  'cache.night.rarities':      'Cache (Night)',
  'cache.sovereign.rarities':  'Cache (Sovereign)',
};

// Variant suffixes — skip these forms of items
const VARIANT_RE = /\.(me|mf|empty|full|used|spent|h)$/;

// ── Load files ────────────────────────────────────────────────────────────────

for (const [label, file] of [['Items', ITEMS_FILE], ['Tomes', TOMES_FILE], ['Prototypes', PROTOTYPES_FILE]]) {
  if (!fs.existsSync(file)) {
    console.error(`${label} file not found:\n`, file);
    process.exit(1);
  }
}

const skillsFiles = [SKILLS_FILE, SKILLS_R_FILE].filter(f => fs.existsSync(f));
if (skillsFiles.length === 0) {
  console.warn('No skills files found — skills will not be extracted');
}

console.log('Loading game data…');
const itemsUtf8 = execFileSync('iconv', ['-f', 'UTF-16', '-t', 'UTF-8', ITEMS_FILE]);
const itemsData = JSON.parse(itemsUtf8.toString('utf-8'));
const tomesData = readJsonWithControlChars(TOMES_FILE);

// _prototypes.json is plain UTF-8
const protosData = JSON.parse(fs.readFileSync(PROTOTYPES_FILE, 'utf8'));

// ── Build prototype lookup ────────────────────────────────────────────────────

const protoById = {};
for (const p of (protosData.elements || [])) {
  const id = (p.id || p.ID || '').toLowerCase();
  if (id) protoById[id] = p;
}

// Recursively resolve full inherited+own aspects for a prototype ID
const resolveCache = {};
function resolveProtoAspects(id) {
  if (id in resolveCache) return resolveCache[id];
  const proto = protoById[id];
  if (!proto) { resolveCache[id] = {}; return {}; }
  const parentId = (proto.inherits || '').toLowerCase();
  const parentAspects = parentId ? resolveProtoAspects(parentId) : {};
  // Parent sets base, child overrides
  const result = { ...parentAspects, ...(proto.aspects || {}) };
  resolveCache[id] = result;
  return result;
}

// ── Process items & books ─────────────────────────────────────────────────────

const items = [];
const books = [];
let skipped = 0;

for (const e of (itemsData.elements || [])) {
  const id = (e.ID || e.id || '').toLowerCase();
  const label = (e.Label || e.label || '').trim();

  if (!label || !id) { skipped++; continue; }
  if (VARIANT_RE.test(id)) { skipped++; continue; }

  // Resolve prototype chain then merge with item's own aspects
  // Item's own values override inherited (child wins)
  const inheritId = (e.inherits || '').toLowerCase();
  const inheritedAspects = inheritId ? resolveProtoAspects(inheritId) : {};
  const allAspects = { ...inheritedAspects, ...(e.aspects || {}) };

  const souls = {};
  const propsSeen = new Set();
  const properties = [];

  for (const [k, v] of Object.entries(allAspects)) {
    if (k.startsWith('boost.')) continue;
    if (SOUL_ASPECTS.has(k)) {
      souls[k.charAt(0).toUpperCase() + k.slice(1)] = v;
    } else if (PROP_LABEL[k] && !propsSeen.has(PROP_LABEL[k])) {
      propsSeen.add(PROP_LABEL[k]);
      properties.push(PROP_LABEL[k]);
    }
    // Anything else is silently dropped (game internals)
  }

  items.push({ id, name: label, souls, properties });
}

// ── Build element label lookup (for resolving re-read spawn IDs) ──────────────

const elementLabel = {};
for (const e of (itemsData.elements || [])) {
  const id    = (e.ID || e.id || '').toLowerCase();
  const label = (e.Label || e.label || '').trim();
  if (id && label) elementLabel[id] = label;
}

// ── Extract books from tomes.json ─────────────────────────────────────────────

for (const e of (tomesData.elements || [])) {
  const id = (e.ID || e.id || '').toLowerCase();
  const label = (e.Label || e.label || '').trim();
  if (!label || !id) continue;
  if (VARIANT_RE.test(id)) continue;

  // Extract re-read result from xtriggers.reading.* entries
  const xt = e.xtriggers || {};
  const rereadIds = Object.entries(xt)
    .filter(([k]) => k.startsWith('reading.'))
    .flatMap(([, v]) => (Array.isArray(v) ? v : [v]))
    .map(entry => (entry.id || '').toLowerCase())
    .filter(Boolean);
  const rereadResult = rereadIds.map(rid => elementLabel[rid] || rid).join(', ');

  // Extract language (w.latin → 'Latin', etc.)
  const LANGUAGE_LABEL = {
    'w.aramaic':   'Aramaic',
    'w.cracktrack':'Cracktrack',
    'w.ericapaean':'Ericapaean',
    'w.fucine':    'Fucine',
    'w.greek':     'Greek',
    'w.henavek':   'Henavek',
    'w.hyksos':    'Hyksos',
    'w.killasimi': 'Killasimi',
    'w.latin':     'Latin',
    'w.mandaic':   'Mandaic',
    'w.phrygian':  'Phrygian',
    'w.ramsund':   'Ramsund',
    'w.sabazine':  'Sabazine',
    'w.sanskrit':  'Sanskrit',
    'w.vak':       'Vak',
  };
  const langEntry = Object.keys(e.aspects || {}).find(k => k.startsWith('w.'));
  const bookLanguage = langEntry ? (LANGUAGE_LABEL[langEntry] || langEntry.slice(2)) : null;

  // Extract mystery souls (mystery.edge → { Edge: 10 })
  const bookSouls = {};
  for (const [k, v] of Object.entries(e.aspects || {})) {
    if (k.startsWith('mystery.')) {
      const soul = k.slice('mystery.'.length);
      bookSouls[soul.charAt(0).toUpperCase() + soul.slice(1)] = v;
    }
  }

  // Extract required skill (r.watchmansparadoxes → s.watchmansparadoxes)
  const skillEntry = Object.entries(e.aspects || {}).find(([k]) => k.startsWith('r.'));
  const bookSkillId = skillEntry ? 's.' + skillEntry[0].slice(2) : null;

  books.push({ id, name: label, rereadResult, souls: bookSouls, skillId: bookSkillId, language: bookLanguage });
}

// ── Extract skills ────────────────────────────────────────────────────────────

const SKILL_PROP_LABEL = {
  'skill.chandlery':                      'Chandlery',
  'effective.contamination.infestation':   'Effective Against Infestations',
  'effective.contamination.corruption':    'Effective Against Corruption',
  'effective.contamination.theoplasma':    'Effective Against Theoplasma',
  'effective.contamination.curse':         'Effective Against Curses',
  'spicing':                               'Spicing',
  // 'host.technique.summon.echidna' is hidden in-game (isHidden: true) — omitted
};

const skills = [];
const seenSkillIds = new Set();
// Language-learning "skills" — they live in skills.json but represent learning a
// foreign language. We track those on the Languages tab instead.
const LANGUAGE_SKILL_IDS = new Set([
  's.cracktrack', 's.mandaic', 's.ericapaean', 's.fucine', 's.henavek',
  's.hyksos', 's.killasimi', 's.ramsund', 's.sabazine', 's.vak',
]);

for (const skillFile of skillsFiles) {
  const skillsData = readJsonWithControlCharsUtf8(skillFile);

  for (const e of (skillsData.elements || [])) {
    const id = (e.ID || e.id || '').toLowerCase();
    const label = (e.Label || e.label || '').trim();
    if (!label || !id) continue;
    if (seenSkillIds.has(id)) continue;

    const aspects = e.aspects || {};
    if (!aspects.skill) continue; // only true skills
    // Exclude language-learning "skills" — these are tracked on the Languages tab.
    if (LANGUAGE_SKILL_IDS.has(id)) continue;

    const souls = {};
    const wisdoms = [];
    const properties = [];
    for (const [k, v] of Object.entries(aspects)) {
      if (k === 'skill') continue;
      if (SOUL_ASPECTS.has(k)) {
        souls[k.charAt(0).toUpperCase() + k.slice(1)] = v;
      } else if (WISDOM_LABEL[k]) {
        wisdoms.push(WISDOM_LABEL[k]);
      }
    }
    // Extract skill properties from non-soul, non-wisdom aspects
    for (const [k] of Object.entries(aspects)) {
      if (SKILL_PROP_LABEL[k]) properties.push(SKILL_PROP_LABEL[k]);
    }

    seenSkillIds.add(id);
    skills.push({ id, name: label, souls, wisdoms, properties });
  }
}

// ── Extract workstations ──────────────────────────────────────────────────────

const workstations = [];

for (const fname of WS_FILES) {
  const fpath = path.join(VERBS_BASE, fname);
  if (!fs.existsSync(fpath)) { console.warn(`Skipping missing file: ${fname}`); continue; }
  const wsData = readJsonWithControlCharsUtf8(fpath);

  for (const v of (wsData.verbs || [])) {
    const id = (v.id || v.ID || '').toLowerCase();
    const label = (v.label || v.Label || '').trim();
    if (!id || !label) continue;
    if (id.endsWith('.closed') || id.endsWith('.friend') || id.includes('.open.friend')) continue;

    const hints = v.hints || [];
    const souls = hints
      .filter(h => SOUL_ASPECTS.has(h))
      .map(h => h.charAt(0).toUpperCase() + h.slice(1));

    const aspects = v.aspects || {};
    let wisdom = null;
    for (const [k] of Object.entries(aspects)) {
      if (k.startsWith('e.') && PROP_LABEL[k]) { wisdom = PROP_LABEL[k]; break; }
    }

    const coreSlotIds = new Set(['a', 's', 'm', 'skill', 'w', 'thing']);
    const slots = v.slots || (v.slot ? [v.slot] : []);
    const extraSlots = slots.filter(s => !coreSlotIds.has(s.id));

    function slotAccepts(s) {
      const req = s.required || {};
      return [...new Set(
        Object.keys(req).filter(k => PROP_LABEL[k] && !k.startsWith('e.')).map(k => PROP_LABEL[k])
      )].sort();
    }

    workstations.push({
      id,
      name: label,
      souls,
      wisdom,
      slot4: extraSlots[0] ? slotAccepts(extraSlots[0]) : [],
      slot5: extraSlots[1] ? slotAccepts(extraSlots[1]) : [],
      slot6: extraSlots[2] ? slotAccepts(extraSlots[2]) : [],
    });
  }
}

// ── Extract skill crafting recipes ────────────────────────────────────────────

// Build combined label lookup: specific items + tomes + generic properties
const allElementLabel = { ...elementLabel };
for (const e of (tomesData.elements || [])) {
  const id    = (e.ID || e.id || '').toLowerCase();
  const label = (e.Label || e.label || '').trim();
  if (id && label) allElementLabel[id] = label;
}

function lookupLabel(id) {
  return allElementLabel[id] || PROP_LABEL[id] || id;
}

const CRAFTING_FILES = [
  { file: 'crafting_2_keeper.json',  tier: 'keeper'   },
  { file: 'crafting_3_scholar.json', tier: 'scholar'  },
  { file: 'crafting_4b_prentice.json', tier: 'prentice' },
];

const RECIPES_BASE = path.join(BASE, '..', 'recipes');
const skillRecipes = [];

for (const { file, tier } of CRAFTING_FILES) {
  const fpath = path.join(RECIPES_BASE, file);
  if (!fs.existsSync(fpath)) { console.warn(`Skipping missing file: ${file}`); continue; }
  const data = readJsonWithControlCharsUtf8(fpath);

  for (const r of (data.recipes || [])) {
    const reqs = r.reqs || {};
    const effects = r.effects || {};

    const skillId = Object.keys(reqs).find(k => k.startsWith('s.'));
    if (!skillId) continue;

    const soulEntry = Object.entries(reqs).find(([k]) => SOUL_ASPECTS.has(k));
    if (!soulEntry) continue;

    const ingredientKey = Object.keys(reqs).find(
      k => !SOUL_ASPECTS.has(k) && !k.startsWith('s.') && k !== 'ability'
    );

    const outputId = Object.keys(effects)[0];
    if (!outputId) continue;

    const skillName = skills.find(s => s.id === skillId)?.name || skillId;

    skillRecipes.push({
      id:              r.id,
      skillId,
      skillName,
      tier,
      soul:            soulEntry[0].charAt(0).toUpperCase() + soulEntry[0].slice(1),
      soulAmount:      soulEntry[1],
      ingredient:      ingredientKey ? lookupLabel(ingredientKey) : null,
      outputId,
      outputLabel:     lookupLabel(outputId),
    });
  }
}

// ── Extract wisdom commitments (skill × wisdom → soul) ───────────────────────

// Build ability code → primary soul map by scanning abilities files.
const ABILITY_FILES = [
  'abilities.json', 'abilities2.json', 'abilities3.json',
  'abilities4.json', 'abilities_setup.json',
];
const abilitySoul = {}; // 'xfet' -> { soul: 'Rose', label: 'Fet' }
for (const f of ABILITY_FILES) {
  const fpath = path.join(BASE, f);
  if (!fs.existsSync(fpath)) continue;
  let data;
  try { data = readJsonAuto(fpath); } catch { continue; }
  for (const e of (data.elements || [])) {
    const id = (e.id || e.ID || '').toLowerCase();
    if (!/^x[a-z]{3,}$/.test(id)) continue;
    const aspects = e.aspects || {};
    const soulEntries = Object.entries(aspects).filter(([k]) => SOUL_ASPECTS.has(k));
    if (!soulEntries.length) continue;
    soulEntries.sort((a, b) => b[1] - a[1]);
    const primary = soulEntries[0][0];
    abilitySoul[id] = {
      soul: primary.charAt(0).toUpperCase() + primary.slice(1),
      label: e.label || e.Label || id,
    };
  }
}

const WISDOM_CODE = {
  bir: 'Birdsong', bos: 'Bosk', hor: 'Horomachistry', hus: 'Hushery',
  ill: 'Illumination', ith: 'Ithastry', nyc: 'Nyctodromy',
  pre: 'Preservation', sko: 'Skolekosophy',
};

const skillNameLookup = new Map(skills.map(s => [s.id, s.name]));
const wisdomCommitments = []; // flat list
const COMMITMENT_FILES = ['wisdom_commitments.json', 'wisdom_commitments_exotic.json'];
for (const f of COMMITMENT_FILES) {
  const fpath = path.join(RECIPES_BASE, f);
  if (!fs.existsSync(fpath)) { console.warn(`Skipping missing file: ${f}`); continue; }
  const data = readJsonAuto(fpath);
  for (const r of (data.recipes || [])) {
    const m = (r.id || '').match(/^commit\.([a-z]+)\.(s\..+)$/);
    if (!m) continue;
    const wisdom = WISDOM_CODE[m[1]];
    const skillId = m[2];
    if (!wisdom) continue;
    const ability = Object.keys(r.effects || {}).find(k => abilitySoul[k]);
    if (!ability) continue;
    wisdomCommitments.push({
      id:        r.id,
      skillId,
      skillName: skillNameLookup.get(skillId) || skillId,
      wisdom,
      ability,
      abilityLabel: abilitySoul[ability].label,
      soul:      abilitySoul[ability].soul,
      foundationStone: r.label || null,
    });
  }
}

// ── Extract languages (the LANGUAGE_LABEL table inlined above) ───────────────
const LANGUAGE_DEFINITIONS = [
  { id: 'w.aramaic',    name: 'Aramaic',    isDefault: true  },
  { id: 'w.cracktrack', name: 'Cracktrack', isDefault: false },
  { id: 'w.ericapaean', name: 'Ericapaean', isDefault: false },
  { id: 'w.fucine',     name: 'Fucine',     isDefault: false },
  { id: 'w.greek',      name: 'Greek',      isDefault: true  },
  { id: 'w.henavek',    name: 'Henavek',    isDefault: false },
  { id: 'w.hyksos',     name: 'Hyksos',     isDefault: false },
  { id: 'w.killasimi',  name: 'Killasimi',  isDefault: false },
  { id: 'w.latin',      name: 'Latin',      isDefault: true  },
  { id: 'w.mandaic',    name: 'Mandaic',    isDefault: false },
  { id: 'w.phrygian',   name: 'Phrygian',   isDefault: true  },
  { id: 'w.ramsund',    name: 'Ramsund',    isDefault: false },
  { id: 'w.sabazine',   name: 'Sabazine',   isDefault: false },
  { id: 'w.sanskrit',   name: 'Sanskrit',   isDefault: true  },
  { id: 'w.vak',        name: 'Vak',        isDefault: false },
];
// Count books per language (from the extracted books) so the tab shows usage stats
const langBookCount = {};
for (const b of books) {
  const k = b.language || 'English';
  langBookCount[k] = (langBookCount[k] || 0) + 1;
}
const languages = LANGUAGE_DEFINITIONS.map(l => ({ ...l, bookCount: langBookCount[l.name] || 0 }));

// ── Extract terrains (unlock requirements) ───────────────────────────────────
// NOTE: room-to-room adjacency is encoded in Unity scene binaries, not in any
// JSON file shipped with the game. Only the unlock requirements are derivable.

const terrains = [];
const TERRAIN_FILE = path.join(RECIPES_BASE, 'terrain.json');
if (fs.existsSync(TERRAIN_FILE)) {
  const data = readJsonAuto(TERRAIN_FILE);
  for (const r of (data.recipes || [])) {
    if (!(r.id || '').startsWith('terrain.')) continue;
    const slot = (r.preslots && r.preslots[0]) || {};
    const required = slot.required || {};
    const forbidden = slot.forbidden || {};
    const requirements = {};
    const otherRequirements = {};
    for (const [k, v] of Object.entries(required)) {
      if (SOUL_ASPECTS.has(k)) {
        requirements[k.charAt(0).toUpperCase() + k.slice(1)] = v;
      } else {
        otherRequirements[k] = v;
      }
    }
    terrains.push({
      id:                r.id,
      name:              r.label || r.id,
      lockedName:        r.preface || null,
      shortDescription:  r.startdescription || null,
      description:       r.desc || null,
      requirements,                                 // soul costs to unlock
      otherRequirements: Object.keys(otherRequirements).length ? otherRequirements : undefined,
      forbidden:         Object.keys(forbidden).length ? forbidden : undefined,
      unlocks:           Object.keys(r.fx || {}),  // e.g. ["atrium.open"]
      warmupSeconds:     r.warmup ?? null,
    });
  }
}

// ── Write output files ────────────────────────────────────────────────────────

items.sort((a, b) => a.name.localeCompare(b.name));
books.sort((a, b) => a.name.localeCompare(b.name));
skills.sort((a, b) => a.name.localeCompare(b.name));
workstations.sort((a, b) => a.name.localeCompare(b.name));
wisdomCommitments.sort((a, b) =>
  a.skillName.localeCompare(b.skillName) || a.wisdom.localeCompare(b.wisdom));
terrains.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(path.join(SRC, 'game-items.json'),               JSON.stringify(items,             null, 2));
fs.writeFileSync(path.join(SRC, 'game-books.json'),               JSON.stringify(books,             null, 2));
fs.writeFileSync(path.join(SRC, 'game-skills.json'),              JSON.stringify(skills,            null, 2));
fs.writeFileSync(path.join(SRC, 'game-workstations.json'),        JSON.stringify(workstations,      null, 2));
fs.writeFileSync(path.join(SRC, 'game-skill-recipes.json'),       JSON.stringify(skillRecipes,      null, 2));
fs.writeFileSync(path.join(SRC, 'game-wisdom-commitments.json'),  JSON.stringify(wisdomCommitments, null, 2));
fs.writeFileSync(path.join(SRC, 'game-terrains.json'),            JSON.stringify(terrains,          null, 2));
fs.writeFileSync(path.join(SRC, 'game-languages.json'),           JSON.stringify(languages,         null, 2));

console.log(`Extracted:`);
console.log(`  ${items.length} items        → src/data/game-items.json  (${skipped} variants skipped)`);
console.log(`  ${books.length} books        → src/data/game-books.json`);
console.log(`  ${skills.length} skills       → src/data/game-skills.json`);
console.log(`  ${workstations.length} workstations → src/data/game-workstations.json`);
console.log(`  ${skillRecipes.length} skill recipes → src/data/game-skill-recipes.json`);
console.log(`  ${wisdomCommitments.length} wisdom commitments → src/data/game-wisdom-commitments.json`);
console.log(`  ${terrains.length} terrains     → src/data/game-terrains.json (adjacency NOT available; lives in Unity scene binaries)`);
