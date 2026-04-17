# Book of Hours Companion App

A single-page React app for tracking progress in the game [Book of Hours](https://store.steampowered.com/app/1028310/BOOK_OF_HOURS/) by Weather Factory.

## What it does

Players use this to record which in-game items, books, workstations, skills, and languages they have discovered, and to track skill levels, wisdom commitments, and crafting recipes.

## Architecture

- **Vite + React** (JSX, no TypeScript). Single `App.jsx` orchestrates all tabs.
- **No backend** — all state lives in `localStorage`. Game reference data is extracted from the installed game files into static JSON under `src/data/`.
- **Dark theme** with a gold accent palette inspired by the game's aesthetic.

## Key design decisions

### Storage: IDs only, not full objects
`localStorage` stores **only user state** (discovered IDs, levels, commitment status, etc.). Game data (names, souls, properties, wisdoms) is **never** duplicated into storage — it is merged at render time from the JSON files. This avoids migration headaches when new fields are added.

- Items, books, stations, languages: store arrays of discovered IDs
- Skills: store `{ id, discovered, level, committedWisdom, commitmentFulfilled }` per skill
- The `seed()` function in `storage.js` runs one-time migrations on existing data

### Data extraction
`scripts/extract-game-data.cjs` reads from the local Steam game installation (macOS path) and produces the JSON files in `src/data/`. It handles UTF-16 encoded files, trailing commas in game JSON, and control characters in strings.

Generated files:
- `game-items.json` — items with souls and properties
- `game-books.json` — tomes with mystery souls, language, skill, reread result
- `game-skills.json` — skills with souls, wisdoms, and properties (excludes language-learning skills)
- `game-workstations.json` — workstations with souls, wisdom, and slot properties
- `game-skill-recipes.json` — crafting recipes (prentice/scholar/keeper tiers)
- `game-wisdom-commitments.json` — per-skill wisdom commitment → soul type mapping
- `game-languages.json` — all languages with default/special classification
- `game-terrains.json` — terrain unlock requirements (adjacency not available from JSON)

### Tabs
- **Items** — discovered items + undiscovered items revealed by crafting recipes
- **Books** — discovered books with reveal mechanics for reread results
- **Workstations** — discovered workstations with soul/wisdom/property data
- **Skills** — discovered skills with level, soul scaling, wisdom commitment, fulfillment toggle, and crafting recipe expansion
- **Languages** — default (always shown) + discovered languages with a learned toggle
- **Notes** — freeform text area

### Filtering
Each tab has per-column filters rendered in a second `<thead>` row. Text filters for names, multiselects for souls/wisdoms/properties, selects for status fields.

### Components
- `MultiSelect` — dropdown with search, tag-based selection, click-to-remove pills
- `SoulTags` — soul-colored tag display (each soul has its own CSS color)
- `AutocompleteInput` — search-as-you-type for adding new entries
- `Modal` — reusable dialog for add/info modals
- `ConfirmDialog` — lightweight delete confirmation

## Build

```bash
npm install
npm run dev          # Vite dev server
npm run build        # Production build → dist/
```

To regenerate game data (requires Book of Hours installed via Steam on macOS):
```bash
node scripts/extract-game-data.cjs
```

## Game concepts glossary

- **Souls** — 13 principle aspects (Edge, Forge, Grail, Heart, Knock, Lantern, Moon, Moth, Nectar, Rose, Scale, Sky, Winter)
- **Wisdoms** — 9 disciplines (Birdsong, Bosk, Horomachistry, Hushery, Illumination, Ithastry, Nyctodromy, Preservation, Skolekosophy)
- **Commitment** — locking a skill to a wisdom, granting a soul type (e.g. Fet, Phost, Mettle)
- **Properties** — item/skill tags like Chandlery, Effective Against Curses, Spicing, etc.
- **Terrain** — rooms in Hush House that can be unlocked with soul requirements
