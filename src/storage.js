import gameItemsData from "./data/game-items.json";
import gameBooksData from "./data/game-books.json";
import gameSkillsData from "./data/game-skills.json";
import gameWorkstationsData from "./data/game-workstations.json";
import gameSkillRecipesData from "./data/game-skill-recipes.json";
import gameWisdomCommitmentsData from "./data/game-wisdom-commitments.json";
import gameLanguagesData from "./data/game-languages.json";
import gameBeastsData from "./data/game-beasts.json";

const KEY = "book-of-hours";

export const gameItems = gameItemsData;
export const gameBooks = gameBooksData;
export const gameWorkstations = gameWorkstationsData;
export const gameSkills = gameSkillsData;
export const gameSkillRecipes = gameSkillRecipesData;
export const gameWisdomCommitments = gameWisdomCommitmentsData;
export const gameLanguages = gameLanguagesData;
export const gameBeasts = gameBeastsData;

export function searchLanguages(q) {
  const ql = (q || "").toLowerCase();
  return gameLanguagesData
    .filter((l) => !l.isDefault && l.name.toLowerCase().includes(ql))
    .slice(0, 12)
    .map((l) => ({ id: l.id, name: l.name }));
}

export function lookupLanguage(name) {
  const ql = (name || "").toLowerCase();
  const found = gameLanguagesData.find((l) => l.name.toLowerCase() === ql);
  return found || null;
}

// Lookup: skillId + wisdom -> commitment record (with .soul)
const _wcMap = new Map();
for (const c of gameWisdomCommitmentsData) {
  _wcMap.set(c.skillId + "|" + c.wisdom, c);
}
export function lookupWisdomCommitment(skillId, wisdom) {
  return _wcMap.get(skillId + "|" + wisdom) || null;
}

export function loadData() {
  const raw = localStorage.getItem(KEY);
  const data = raw
    ? JSON.parse(raw)
    : {
        discoveredItems: [],
        discoveredBooks: [],
        discoveredStations: [],
        recipes: [],
        skills: [],
        discoveredCraftingResults: [],
        revealedBookResults: [],
        revealedBookSkills: [],
        notes: "",
      };
  return seed(data);
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function seed(data) {
  let changed = false;

  if (!data.discoveredItems) {
    data.discoveredItems = [];
    changed = true;
  }
  if (!data.discoveredLanguages) {
    data.discoveredLanguages = [];
    changed = true;
  }
  if (!data.learnedLanguages) {
    data.learnedLanguages = [];
    changed = true;
  }
  if (!data.discoveredBooks) {
    data.discoveredBooks = [];
    changed = true;
  }
  if (!data.discoveredCraftingResults) {
    data.discoveredCraftingResults = [];
    changed = true;
  }
  if (!data.revealedBookResults) {
    data.revealedBookResults = [];
    changed = true;
  }
  if (!data.revealedBookSkills) {
    data.revealedBookSkills = [];
    changed = true;
  }
  if (data.notes === undefined) {
    data.notes = "";
    changed = true;
  }
  if (!data.discoveredBeasts) {
    data.discoveredBeasts = [];
    changed = true;
  }

  // Migrate old stations array → discoveredStations by name-matching
  if (Array.isArray(data.stations)) {
    if (!data.discoveredStations) {
      const wsMap = new Map(
        gameWorkstationsData.map((w) => [w.name.toLowerCase(), w.id]),
      );
      data.discoveredStations = [];
      for (const s of data.stations) {
        const id = wsMap.get((s.name || "").toLowerCase());
        if (id && !data.discoveredStations.includes(id))
          data.discoveredStations.push(id);
      }
    }
    delete data.stations;
    changed = true;
  }

  if (!data.discoveredStations) {
    data.discoveredStations = [];
    changed = true;
  }

  // Skills: localStorage stores ONLY user state (id, discovered, level,
  // committedWisdom, commitmentFulfilled). Game data (name, souls, wisdoms,
  // properties) is merged at render time in App.jsx from gameSkillsData.
  if (!data._skillsSeeded) {
    // First-time seed: create a user-state stub for every game skill,
    // preserving discovered status from any pre-existing data.
    const existingByName = new Map(
      (data.skills || []).map((s) => [
        (s.name || "").toLowerCase(),
        s,
      ]),
    );
    const existingById = new Map(
      (data.skills || []).map((s) => [s.id, s]),
    );
    data.skills = gameSkillsData.map((gs) => {
      const prev = existingById.get(gs.id) ||
        existingByName.get(gs.name.toLowerCase());
      return {
        id: gs.id,
        discovered: !!(prev && prev.discovered),
        level: (prev && typeof prev.level === "number") ? prev.level : 1,
        committedWisdom: (prev && prev.committedWisdom) || null,
        commitmentFulfilled: !!(prev && prev.commitmentFulfilled),
      };
    });
    data._skillsSeeded = true;
    changed = true;
  }

  // One-time migration: strip game data fields that were previously stored.
  if (!data._skillsSlimmed) {
    const validIds = new Set(gameSkillsData.map((s) => s.id));
    data.skills = (data.skills || [])
      .filter((s) => validIds.has(s.id))
      .map((s) => ({
        id: s.id,
        discovered: !!s.discovered,
        level: typeof s.level === "number" ? s.level : 1,
        committedWisdom: s.committedWisdom || null,
        commitmentFulfilled: !!s.commitmentFulfilled,
      }));
    data._skillsSlimmed = true;
    changed = true;
  }

  // Backfill discovered languages from already-discovered books.
  if (!data._languagesBackfilled) {
    const langByName = new Map(gameLanguagesData.map((l) => [l.name, l]));
    const existing = new Set(data.discoveredLanguages || []);
    for (const bookId of data.discoveredBooks || []) {
      const book = gameBooksData.find((b) => b.id === bookId);
      if (!book || !book.language) continue;
      const lang = langByName.get(book.language);
      if (lang && !lang.isDefault && !existing.has(lang.id)) {
        existing.add(lang.id);
      }
    }
    data.discoveredLanguages = [...existing];
    data._languagesBackfilled = true;
    changed = true;
  }

  if (changed) saveData(data);
  return data;
}

// ── Client-side search (searches all game data, including undiscovered) ──────

function fuzzyScore(name, id, query) {
  const q = query.toLowerCase().trim();
  const n = name.toLowerCase();
  const i = (id || "").toLowerCase();
  if (n === q) return 3;
  if (n.startsWith(q)) return 2;
  if (n.includes(q) || i.includes(q)) return 1;
  return -1;
}

export function searchItems(q) {
  return gameItemsData
    .map((item) => ({
      score: fuzzyScore(item.name, item.id, q),
      item: { id: item.id, name: item.name },
    }))
    .filter((r) => r.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((r) => r.item);
}

export function searchBooks(q) {
  return gameBooksData
    .map((b) => ({
      score: fuzzyScore(b.name, b.id, q),
      item: { id: b.id, name: b.name },
    }))
    .filter((r) => r.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.item);
}

export function searchSkills(q) {
  return gameSkillsData
    .map((s) => ({
      score: fuzzyScore(s.name, s.id, q),
      item: { id: s.id, name: s.name },
    }))
    .filter((r) => r.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.item);
}

export function searchWorkstations(q) {
  return gameWorkstationsData
    .map((w) => ({
      score: fuzzyScore(w.name, w.id, q),
      item: { id: w.id, name: w.name },
    }))
    .filter((r) => r.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.item);
}

export function lookupItem(name) {
  let best = null,
    bestScore = -1;
  for (const item of gameItemsData) {
    const score = fuzzyScore(item.name, item.id, name);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (!best || bestScore < 1) return null;
  return {
    id: best.id,
    name: best.name,
    souls: best.souls || {},
    properties: best.properties || [],
  };
}

export function lookupBook(name) {
  let best = null,
    bestScore = -1;
  for (const book of gameBooksData) {
    const score = fuzzyScore(book.name, book.id, name);
    if (score > bestScore) {
      bestScore = score;
      best = book;
    }
  }
  if (!best || bestScore < 1) return null;
  return {
    id: best.id,
    name: best.name,
    rereadResult: best.rereadResult || "",
    skillId: best.skillId || null,
    language: best.language || null,
    souls: best.souls || {},
  };
}

export function lookupWorkstation(name) {
  let best = null,
    bestScore = -1;
  for (const w of gameWorkstationsData) {
    const score = fuzzyScore(w.name, w.id, name);
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }
  if (!best || bestScore < 1) return null;
  return best;
}

export function searchBeasts(q) {
  return gameBeastsData
    .map((b) => ({
      score: fuzzyScore(b.name, b.id, q),
      item: { id: b.id, name: b.name },
    }))
    .filter((r) => r.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((r) => r.item);
}

export function lookupBeast(name) {
  let best = null,
    bestScore = -1;
  for (const beast of gameBeastsData) {
    const score = fuzzyScore(beast.name, beast.id, name);
    if (score > bestScore) {
      bestScore = score;
      best = beast;
    }
  }
  if (!best || bestScore < 1) return null;
  return best;
}

export function lookupSkill(name) {
  let best = null,
    bestScore = -1;
  for (const skill of gameSkillsData) {
    const score = fuzzyScore(skill.name, skill.id, name);
    if (score > bestScore) {
      bestScore = score;
      best = skill;
    }
  }
  if (!best || bestScore < 1) return null;
  return { id: best.id, name: best.name, souls: best.souls || {} };
}

export function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
