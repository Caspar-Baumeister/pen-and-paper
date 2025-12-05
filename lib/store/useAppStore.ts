'use client'

import { create } from 'zustand'
import type { StoredArea, StoredMonster, StoredCharacter, StoredNPC, StoredTable, StorageData } from '@/lib/storage'

interface AppState {
  // Loading state
  isLoading: boolean
  isInitialized: boolean

  // World description
  worldDescription: string
  setWorldDescription: (description: string) => void

  // Areas
  areas: StoredArea[]
  setAreas: (areas: StoredArea[]) => void
  addArea: (area: StoredArea) => void
  updateArea: (id: string, updates: Partial<StoredArea>) => void
  deleteArea: (id: string) => void

  // Current area (for quick access)
  currentArea: string
  setCurrentArea: (areaId: string) => void

  // Session notes (local only)
  sessionNotes: string
  setSessionNotes: (notes: string) => void

  // Monsters
  monsters: StoredMonster[]
  setMonsters: (monsters: StoredMonster[]) => void
  addMonster: (monster: StoredMonster) => void
  deleteMonster: (id: string) => void

  // Characters
  characters: StoredCharacter[]
  setCharacters: (characters: StoredCharacter[]) => void
  addCharacter: (character: StoredCharacter) => void
  deleteCharacter: (id: string) => void

  // NPCs
  npcs: StoredNPC[]
  setNPCs: (npcs: StoredNPC[]) => void
  addNPC: (npc: StoredNPC) => void
  deleteNPC: (id: string) => void

  // Tables
  tables: StoredTable[]
  setTables: (tables: StoredTable[]) => void
  addTable: (table: StoredTable) => void
  updateTable: (id: string, updates: Partial<StoredTable>) => void
  deleteTable: (id: string) => void

  // Monster types
  monsterTypes: string[]
  setMonsterTypes: (types: string[]) => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Initialize from server
  initializeFromServer: () => Promise<void>

  // Save to server
  saveWorldDescription: (description: string) => Promise<void>
  saveMonster: (monster: StoredMonster) => Promise<void>
  removeMonster: (id: string) => Promise<void>
  saveCharacter: (character: StoredCharacter) => Promise<void>
  removeCharacter: (id: string) => Promise<void>
  saveNPC: (npc: StoredNPC) => Promise<void>
  removeNPC: (id: string) => Promise<void>
  saveTable: (table: StoredTable) => Promise<void>
  updateTableOnServer: (id: string, updates: Partial<StoredTable>) => Promise<void>
  removeTable: (id: string) => Promise<void>
  saveArea: (area: StoredArea) => Promise<void>
  updateAreaOnServer: (id: string, updates: Partial<StoredArea>) => Promise<void>
  removeArea: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>()((set, get) => ({
  // Loading state
  isLoading: false,
  isInitialized: false,

  // World description
  worldDescription: '',
  setWorldDescription: (description) => set({ worldDescription: description }),

  // Areas
  areas: [],
  setAreas: (areas) => set({ areas }),
  addArea: (area) => set((state) => ({ areas: [...state.areas, area] })),
  updateArea: (id, updates) => set((state) => ({
    areas: state.areas.map((a) => a.id === id ? { ...a, ...updates } : a)
  })),
  deleteArea: (id) => set((state) => ({
    areas: state.areas.filter((a) => a.id !== id)
  })),

  // Current area
  currentArea: '',
  setCurrentArea: (areaId) => set({ currentArea: areaId }),

  // Session notes
  sessionNotes: '',
  setSessionNotes: (notes) => set({ sessionNotes: notes }),

  // Monsters
  monsters: [],
  setMonsters: (monsters) => set({ monsters }),
  addMonster: (monster) => set((state) => ({ monsters: [...state.monsters, monster] })),
  deleteMonster: (id) => set((state) => ({
    monsters: state.monsters.filter((m) => m.id !== id)
  })),

  // Characters
  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) => set((state) => ({ characters: [...state.characters, character] })),
  deleteCharacter: (id) => set((state) => ({
    characters: state.characters.filter((c) => c.id !== id)
  })),

  // NPCs
  npcs: [],
  setNPCs: (npcs) => set({ npcs }),
  addNPC: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),
  deleteNPC: (id) => set((state) => ({
    npcs: state.npcs.filter((n) => n.id !== id)
  })),

  // Tables
  tables: [],
  setTables: (tables) => set({ tables }),
  addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
  updateTable: (id, updates) => set((state) => ({
    tables: state.tables.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  deleteTable: (id) => set((state) => ({
    tables: state.tables.filter((t) => t.id !== id)
  })),

  // Monster types
  monsterTypes: [],
  setMonsterTypes: (types) => set({ monsterTypes: types }),

  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  // Initialize from server
  initializeFromServer: async () => {
    if (get().isInitialized) return

    set({ isLoading: true })
    try {
      const response = await fetch('/api/data')
      if (response.ok) {
        const data: StorageData = await response.json()
        set({
          worldDescription: data.worldDescription,
          areas: data.areas,
          monsters: data.monsters,
          characters: data.characters,
          npcs: data.npcs || [],
          tables: data.tables,
          monsterTypes: data.monsterTypes,
          currentArea: data.areas[0]?.id || '',
          isInitialized: true
        })
      }
    } catch (error) {
      console.error('Failed to initialize from server:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Save world description
  saveWorldDescription: async (description) => {
    set({ worldDescription: description })
    try {
      await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldDescription: description })
      })
    } catch (error) {
      console.error('Failed to save world description:', error)
    }
  },

  // Save monster
  saveMonster: async (monster) => {
    set((state) => ({ monsters: [...state.monsters, monster] }))
    try {
      await fetch('/api/data/monsters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monster)
      })
    } catch (error) {
      console.error('Failed to save monster:', error)
    }
  },

  // Remove monster
  removeMonster: async (id) => {
    set((state) => ({ monsters: state.monsters.filter((m) => m.id !== id) }))
    try {
      await fetch('/api/data/monsters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (error) {
      console.error('Failed to delete monster:', error)
    }
  },

  // Save character
  saveCharacter: async (character) => {
    set((state) => ({ characters: [...state.characters, character] }))
    try {
      await fetch('/api/data/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
      })
    } catch (error) {
      console.error('Failed to save character:', error)
    }
  },

  // Remove character
  removeCharacter: async (id) => {
    set((state) => ({ characters: state.characters.filter((c) => c.id !== id) }))
    try {
      await fetch('/api/data/characters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (error) {
      console.error('Failed to delete character:', error)
    }
  },

  // Save NPC
  saveNPC: async (npc) => {
    set((state) => ({ npcs: [...state.npcs, npc] }))
    try {
      await fetch('/api/data/npcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(npc)
      })
    } catch (error) {
      console.error('Failed to save NPC:', error)
    }
  },

  // Remove NPC
  removeNPC: async (id) => {
    set((state) => ({ npcs: state.npcs.filter((n) => n.id !== id) }))
    try {
      await fetch('/api/data/npcs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (error) {
      console.error('Failed to delete NPC:', error)
    }
  },

  // Save table
  saveTable: async (table) => {
    set((state) => ({ tables: [...state.tables, table] }))
    try {
      await fetch('/api/data/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table)
      })
    } catch (error) {
      console.error('Failed to save table:', error)
    }
  },

  // Update table on server
  updateTableOnServer: async (id, updates) => {
    set((state) => ({
      tables: state.tables.map((t) => t.id === id ? { ...t, ...updates } : t)
    }))
    try {
      await fetch('/api/data/tables', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
    } catch (error) {
      console.error('Failed to update table:', error)
    }
  },

  // Remove table
  removeTable: async (id) => {
    set((state) => ({ tables: state.tables.filter((t) => t.id !== id) }))
    try {
      await fetch('/api/data/tables', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (error) {
      console.error('Failed to delete table:', error)
    }
  },

  // Save area
  saveArea: async (area) => {
    set((state) => ({ areas: [...state.areas, area] }))
    try {
      await fetch('/api/data/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(area)
      })
    } catch (error) {
      console.error('Failed to save area:', error)
    }
  },

  // Update area on server
  updateAreaOnServer: async (id, updates) => {
    set((state) => ({
      areas: state.areas.map((a) => a.id === id ? { ...a, ...updates } : a)
    }))
    try {
      await fetch('/api/data/areas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      })
    } catch (error) {
      console.error('Failed to update area:', error)
    }
  },

  // Remove area
  removeArea: async (id) => {
    set((state) => ({ areas: state.areas.filter((a) => a.id !== id) }))
    try {
      await fetch('/api/data/areas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
    } catch (error) {
      console.error('Failed to delete area:', error)
    }
  }
}))

// Re-export types for convenience
export type {
  StoredArea,
  StoredMonster,
  StoredCharacter,
  StoredNPC,
  StoredTable,
  StoredTableRow,
  ChatMessage,
  NPCChatState,
  NPCVoice
} from '@/lib/storage'
