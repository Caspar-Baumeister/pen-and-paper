import fs from 'fs'
import path from 'path'

// Types for stored data
export interface StoredArea {
  id: string
  name: string
  icon: string
}

export interface StoredMonster {
  id: string
  name: string
  summary: string
  area: string
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly'
  appearance: string
  hp: number
  ac: number
  speed: string
  attacks: {
    name: string
    toHit: string
    damage: string
    effect?: string
  }[]
  abilities: {
    name: string
    description: string
  }[]
  tags: string[]
}

export interface StoredCharacter {
  id: string
  name: string
  summary: string
  stats: {
    level: number
    class: string
    race: string
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }
  appearance: string
  backstory: string
}

// Chat message for NPC conversations
export interface ChatMessage {
  role: 'user' | 'npc'
  content: string
  timestamp: number
}

// Chat state for memory management
export interface NPCChatState {
  memorySummary: string
  recentMessages: ChatMessage[]
}

// Voice preference for TTS
export type NPCVoice = 'male_epic' | 'female_epic'

export interface StoredNPC {
  id: string
  name: string
  area: string
  role: string
  summary: string
  appearance: string
  personality: string
  motivations: string
  hooks: string[]
  dangerLevel: 'harmlos' | 'unterstützend' | 'potenziell gefährlich' | 'sehr gefährlich'
  combatNotes: string
  // Chat-related fields
  voice?: NPCVoice
  chatState?: NPCChatState
}

export interface StoredTableRow {
  id: string
  start: number
  end: number
  title: string
  description: string
}

export interface StoredTable {
  id: string
  name: string
  area?: string
  description: string
  rows: StoredTableRow[]
}

export interface StorageData {
  worldDescription: string
  areas: StoredArea[]
  monsters: StoredMonster[]
  characters: StoredCharacter[]
  npcs: StoredNPC[]
  tables: StoredTable[]
  monsterTypes: string[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'storage.json')

const DEFAULT_DATA: StorageData = {
  worldDescription: '',
  areas: [
    { id: 'cave', name: 'Höhle', icon: '🕳️' },
    { id: 'forest', name: 'Wald', icon: '🌲' },
    { id: 'mountains', name: 'Gebirge', icon: '⛰️' },
    { id: 'lake', name: 'See', icon: '🌊' },
    { id: 'city', name: 'Stadt', icon: '🏰' }
  ],
  monsters: [],
  characters: [],
  npcs: [],
  tables: [],
  monsterTypes: [
    'Tier',
    'Untoter',
    'Humanoide',
    'Feenwesen',
    'Elementar',
    'Drache',
    'Dämon',
    'Konstrukt',
    'Aberration',
    'Himmlisches Wesen',
    'Pflanze',
    'Monstrosität'
  ]
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function loadData(): StorageData {
  try {
    ensureDataDir()

    if (!fs.existsSync(DATA_FILE)) {
      // Initialize with defaults
      saveData(DEFAULT_DATA)
      return DEFAULT_DATA
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const data = JSON.parse(raw) as StorageData

    // Merge with defaults to ensure all fields exist
    return {
      worldDescription: data.worldDescription ?? DEFAULT_DATA.worldDescription,
      areas: data.areas ?? DEFAULT_DATA.areas,
      monsters: data.monsters ?? DEFAULT_DATA.monsters,
      characters: data.characters ?? DEFAULT_DATA.characters,
      npcs: data.npcs ?? DEFAULT_DATA.npcs,
      tables: data.tables ?? DEFAULT_DATA.tables,
      monsterTypes: data.monsterTypes ?? DEFAULT_DATA.monsterTypes
    }
  } catch (error) {
    console.error('Failed to load data:', error)
    return DEFAULT_DATA
  }
}

export function saveData(data: StorageData): void {
  try {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save data:', error)
    throw new Error('Failed to save data to storage')
  }
}

// Helper functions for specific operations
export function updateWorldDescription(description: string): void {
  const data = loadData()
  data.worldDescription = description
  saveData(data)
}

export function addArea(area: StoredArea): void {
  const data = loadData()
  data.areas.push(area)
  saveData(data)
}

export function updateArea(id: string, updates: Partial<StoredArea>): void {
  const data = loadData()
  const index = data.areas.findIndex((a) => a.id === id)
  if (index !== -1) {
    data.areas[index] = { ...data.areas[index], ...updates }
    saveData(data)
  }
}

export function deleteArea(id: string): void {
  const data = loadData()
  data.areas = data.areas.filter((a) => a.id !== id)
  saveData(data)
}

export function addMonster(monster: StoredMonster): void {
  const data = loadData()
  data.monsters.push(monster)
  saveData(data)
}

export function deleteMonster(id: string): void {
  const data = loadData()
  data.monsters = data.monsters.filter((m) => m.id !== id)
  saveData(data)
}

export function addCharacter(character: StoredCharacter): void {
  const data = loadData()
  data.characters.push(character)
  saveData(data)
}

export function deleteCharacter(id: string): void {
  const data = loadData()
  data.characters = data.characters.filter((c) => c.id !== id)
  saveData(data)
}

export function addNPC(npc: StoredNPC): void {
  const data = loadData()
  data.npcs.push(npc)
  saveData(data)
}

export function updateNPC(id: string, updates: Partial<StoredNPC>): void {
  const data = loadData()
  const index = data.npcs.findIndex((n) => n.id === id)
  if (index !== -1) {
    data.npcs[index] = { ...data.npcs[index], ...updates }
    saveData(data)
  }
}

export function getNPC(id: string): StoredNPC | undefined {
  const data = loadData()
  return data.npcs.find((n) => n.id === id)
}

export function deleteNPC(id: string): void {
  const data = loadData()
  data.npcs = data.npcs.filter((n) => n.id !== id)
  saveData(data)
}

export function addTable(table: StoredTable): void {
  const data = loadData()
  data.tables.push(table)
  saveData(data)
}

export function updateTable(id: string, updates: Partial<StoredTable>): void {
  const data = loadData()
  const index = data.tables.findIndex((t) => t.id === id)
  if (index !== -1) {
    data.tables[index] = { ...data.tables[index], ...updates }
    saveData(data)
  }
}

export function deleteTable(id: string): void {
  const data = loadData()
  data.tables = data.tables.filter((t) => t.id !== id)
  saveData(data)
}

// NPC Chat specific helpers
export function updateNPCChatState(npcId: string, chatState: NPCChatState): void {
  const data = loadData()
  const index = data.npcs.findIndex((n) => n.id === npcId)
  if (index !== -1) {
    data.npcs[index].chatState = chatState
    saveData(data)
  }
}

export function updateNPCVoice(npcId: string, voice: NPCVoice): void {
  const data = loadData()
  const index = data.npcs.findIndex((n) => n.id === npcId)
  if (index !== -1) {
    data.npcs[index].voice = voice
    saveData(data)
  }
}
