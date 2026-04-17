import { useState, useEffect, useCallback } from "react";
import {
  loadData,
  saveData,
  gameItems,
  gameBooks,
  gameWorkstations,
  gameSkillRecipes,
  gameSkills,
  gameLanguages,
} from "./storage";
import ItemsTab from "./components/ItemsTab";
import BooksTab from "./components/BooksTab";
import StationsTab from "./components/StationsTab";
import SkillsTab from "./components/SkillsTab";
import LanguagesTab from "./components/LanguagesTab";
import NotesTab from "./components/NotesTab";
import ConfirmDialog from "./components/ConfirmDialog";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("items");
  const [data, setData] = useState(() => loadData());
  const [confirm, setConfirm] = useState(null); // { msg, onConfirm }
  // Per-tab navigation state
  const [itemNav, setItemNav] = useState(null);
  const [bookNav, setBookNav] = useState(null);
  const [skillNav, setSkillNav] = useState(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // ── Item mutations ──────────────────────────────────────────────────────────
  const discoverItem = useCallback((id) => {
    setData((prev) => {
      if (prev.discoveredItems.includes(id)) return prev;
      return { ...prev, discoveredItems: [...prev.discoveredItems, id] };
    });
  }, []);

  const removeItem = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      discoveredItems: prev.discoveredItems.filter((i) => i !== id),
    }));
  }, []);

  // ── Book mutations ──────────────────────────────────────────────────────────
  const discoverBook = useCallback((bookId) => {
    setData((prev) => {
      if (prev.discoveredBooks.includes(bookId)) return prev;
      const next = {
        ...prev,
        discoveredBooks: [...prev.discoveredBooks, bookId],
      };
      // Auto-discover the book's language if it isn't already known
      const book = gameBooks.find((b) => b.id === bookId);
      if (book && book.language) {
        const langDef = gameLanguages.find((l) => l.name === book.language);
        if (
          langDef &&
          !langDef.isDefault &&
          !(prev.discoveredLanguages || []).includes(langDef.id)
        ) {
          next.discoveredLanguages = [
            ...(prev.discoveredLanguages || []),
            langDef.id,
          ];
        }
      }
      return next;
    });
  }, []);

  const removeBook = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      discoveredBooks: prev.discoveredBooks.filter((b) => b !== id),
      revealedBookResults: (prev.revealedBookResults || []).filter(
        (b) => b !== id,
      ),
      revealedBookSkills: (prev.revealedBookSkills || []).filter(
        (b) => b !== id,
      ),
    }));
  }, []);

  // Reveal a book's required skill
  const revealBookSkill = useCallback((bookId) => {
    setData((prev) => {
      if ((prev.revealedBookSkills || []).includes(bookId)) return prev;
      return {
        ...prev,
        revealedBookSkills: [...(prev.revealedBookSkills || []), bookId],
      };
    });
  }, []);

  // Reveal a book's reread result
  const revealBookResult = useCallback((bookId) => {
    setData((prev) => {
      if ((prev.revealedBookResults || []).includes(bookId)) return prev;
      return {
        ...prev,
        revealedBookResults: [...(prev.revealedBookResults || []), bookId],
      };
    });
  }, []);

  // ── Skill mutations ─────────────────────────────────────────────────────────
  const discoverSkill = useCallback((skillId) => {
    setData((prev) => ({
      ...prev,
      skills: (prev.skills || []).map((s) =>
        s.id === skillId ? { ...s, discovered: true } : s,
      ),
    }));
  }, []);

  const removeSkill = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      skills: (prev.skills || []).map((s) =>
        s.id === id
          ? { ...s, discovered: false, level: 1, committedWisdom: null }
          : s,
      ),
    }));
  }, []);

  const setSkillLevel = useCallback((id, level) => {
    setData((prev) => ({
      ...prev,
      skills: (prev.skills || []).map((s) =>
        s.id === id ? { ...s, level } : s,
      ),
    }));
  }, []);

  const setSkillCommitment = useCallback((id, wisdom) => {
    setData((prev) => ({
      ...prev,
      // Changing/clearing commitment also resets fulfilled.
      skills: (prev.skills || []).map((s) =>
        s.id === id
          ? { ...s, committedWisdom: wisdom, commitmentFulfilled: false }
          : s,
      ),
    }));
  }, []);

  const setSkillFulfilled = useCallback((id, fulfilled) => {
    setData((prev) => ({
      ...prev,
      skills: (prev.skills || []).map((s) =>
        s.id === id ? { ...s, commitmentFulfilled: !!fulfilled } : s,
      ),
    }));
  }, []);

  // ── Crafting result discovery ───────────────────────────────────────────────
  const discoverCraftingResult = useCallback((recipeId) => {
    setData((prev) => {
      if ((prev.discoveredCraftingResults || []).includes(recipeId))
        return prev;
      return {
        ...prev,
        discoveredCraftingResults: [
          ...(prev.discoveredCraftingResults || []),
          recipeId,
        ],
      };
    });
  }, []);

  // ── Station mutations ───────────────────────────────────────────────────────
  const discoverStation = useCallback((id) => {
    setData((prev) => {
      if (prev.discoveredStations.includes(id)) return prev;
      return { ...prev, discoveredStations: [...prev.discoveredStations, id] };
    });
  }, []);

  const removeStation = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      discoveredStations: prev.discoveredStations.filter((s) => s !== id),
    }));
  }, []);

  // ── Language mutations ─────────────────────────────────────────────────────
  const discoverLanguage = useCallback((id) => {
    setData((prev) => {
      if ((prev.discoveredLanguages || []).includes(id)) return prev;
      return {
        ...prev,
        discoveredLanguages: [...(prev.discoveredLanguages || []), id],
      };
    });
  }, []);

  const removeLanguage = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      discoveredLanguages: (prev.discoveredLanguages || []).filter(
        (l) => l !== id,
      ),
      learnedLanguages: (prev.learnedLanguages || []).filter((l) => l !== id),
    }));
  }, []);

  const learnLanguage = useCallback((id) => {
    setData((prev) => {
      if ((prev.learnedLanguages || []).includes(id)) return prev;
      return {
        ...prev,
        learnedLanguages: [...(prev.learnedLanguages || []), id],
      };
    });
  }, []);

  const unlearnLanguage = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      learnedLanguages: (prev.learnedLanguages || []).filter((l) => l !== id),
    }));
  }, []);

  // ── Confirm helper ──────────────────────────────────────────────────────────
  function confirmDelete(msg, onConfirm) {
    setConfirm({ msg, onConfirm });
  }

  // ── Cross-tab navigation ────────────────────────────────────────────────────
  function navigateToItem(id) {
    setActiveTab("items");
    setItemNav({ id });
  }
  function navigateToItemByName(name) {
    setActiveTab("items");
    setItemNav({ name });
  }
  function navigateToBooks(reread) {
    setActiveTab("books");
    setBookNav({ reread });
  }
  function navigateToSkill(skillId) {
    setActiveTab("skills");
    setSkillNav({ skillId });
  }

  const navigate = {
    toItem: navigateToItem,
    toItemByName: navigateToItemByName,
    toBooks: navigateToBooks,
    toSkill: navigateToSkill,
  };

  const discoveredItems = gameItems.filter((i) =>
    data.discoveredItems.includes(i.id),
  );
  // Items that are outputs of discovered crafting recipes but not themselves discovered
  const discoveredItemIdSet = new Set(data.discoveredItems);
  const discoveredRecipeIdSet = new Set(data.discoveredCraftingResults || []);
  const recipeRevealedItemIds = new Set();
  for (const r of gameSkillRecipes) {
    if (
      discoveredRecipeIdSet.has(r.id) &&
      !discoveredItemIdSet.has(r.outputId)
    ) {
      recipeRevealedItemIds.add(r.outputId);
    }
  }
  const recipeRevealedItems = gameItems
    .filter((i) => recipeRevealedItemIds.has(i.id))
    .map((i) => ({ ...i, undiscovered: true }));
  const itemsForTab = [...discoveredItems, ...recipeRevealedItems];
  const discoveredBooks = gameBooks.filter((b) =>
    data.discoveredBooks.includes(b.id),
  );
  const discoveredStations = gameWorkstations.filter((w) =>
    data.discoveredStations.includes(w.id),
  );
  // Merge stored user state with game data for discovered skills
  const gameSkillMap = new Map(gameSkills.map((s) => [s.id, s]));
  const discoveredSkills = (data.skills || [])
    .filter((s) => s.discovered)
    .map((s) => {
      const game = gameSkillMap.get(s.id);
      if (!game) return null;
      return { ...game, ...s };
    })
    .filter(Boolean);
  const TABS = ["items", "books", "workstations", "skills", "languages", "notes"];

  return (
    <div className="app">
      <header>
        <h1>Book of Hours</h1> 
        <p className="header-subtitle">Companion Catalogue</p>
      </header>

      <nav className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main>
        <div style={{ display: activeTab === "items" ? "block" : "none" }}>
          <ItemsTab
            items={itemsForTab}
            books={discoveredBooks}
            skillRecipes={gameSkillRecipes}
            discoveredCraftingResults={data.discoveredCraftingResults || []}
            revealedBookResults={data.revealedBookResults || []}
            onDiscover={discoverItem}
            onDelete={(id, name) =>
              confirmDelete(`Delete "${name}"?`, () => removeItem(id))
            }
            navigate={navigate}
            navState={itemNav}
            onNavHandled={() => setItemNav(null)}
          />
        </div>

        <div style={{ display: activeTab === "books" ? "block" : "none" }}>
          <BooksTab
            books={discoveredBooks}
            revealedBookResults={data.revealedBookResults || []}
            revealedBookSkills={data.revealedBookSkills || []}
            discoveredLanguageIds={data.discoveredLanguages || []}
            learnedLanguageIds={data.learnedLanguages || []}
            onDiscover={discoverBook}
            onRevealResult={revealBookResult}
            onRevealSkill={revealBookSkill}
            onDelete={(id, name) =>
              confirmDelete(`Delete "${name}"?`, () => removeBook(id))
            }
            navigate={navigate}
            navState={bookNav}
            onNavHandled={() => setBookNav(null)}
          />
        </div>

        <div style={{ display: activeTab === "workstations" ? "block" : "none" }}>
          <StationsTab
            stations={discoveredStations}
            onDiscover={discoverStation}
            onDelete={(id, name) =>
              confirmDelete(`Delete "${name}"?`, () => removeStation(id))
            }
          />
        </div>

        <div style={{ display: activeTab === "skills" ? "block" : "none" }}>
          <SkillsTab
            skills={discoveredSkills}
            onDiscover={discoverSkill}
            onDelete={(id, name) =>
              confirmDelete(`Delete "${name}"?`, () => removeSkill(id))
            }
            onSetLevel={setSkillLevel}
            onSetCommitment={setSkillCommitment}
            onSetFulfilled={setSkillFulfilled}
            skillRecipes={gameSkillRecipes}
            discoveredCraftingResults={data.discoveredCraftingResults || []}
            discoveredItems={data.discoveredItems || []}
            onDiscoverResult={discoverCraftingResult}
            navigate={navigate}
            navState={skillNav}
            onNavHandled={() => setSkillNav(null)}
          />
        </div>

        <div style={{ display: activeTab === "languages" ? "block" : "none" }}>
          <LanguagesTab
            discoveredLanguageIds={data.discoveredLanguages || []}
            learnedLanguageIds={data.learnedLanguages || []}
            onDiscover={discoverLanguage}
            onLearn={learnLanguage}
            onUnlearn={unlearnLanguage}
            onDelete={(id, name) =>
              confirmDelete(`Remove "${name}"?`, () => removeLanguage(id))
            }
          />
        </div>

        <div style={{ display: activeTab === "notes" ? "block" : "none" }}>
          <NotesTab
            notes={data.notes || ""}
            onChange={(notes) => setData((prev) => ({ ...prev, notes }))}
          />
        </div>
      </main>

      {confirm && (
        <ConfirmDialog
          msg={confirm.msg}
          onConfirm={() => {
            confirm.onConfirm();
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
