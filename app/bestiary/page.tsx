'use client'

import { useState } from 'react'
import { useAppStore, type StoredMonster, type StoredNPC } from '@/lib/store/useAppStore'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  BookOpen,
  Search,
  Eye,
  Trash2,
  Filter,
  Loader2,
  Heart,
  Shield,
  Zap,
  Swords,
  Users,
  Skull,
  Target,
  Lightbulb,
  User,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Leicht',
  medium: 'Mittel',
  hard: 'Schwer',
  deadly: 'Tödlich'
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-600',
  medium: 'bg-yellow-600',
  hard: 'bg-orange-600',
  deadly: 'bg-red-600'
}

const DANGER_LABELS: Record<string, string> = {
  'harmlos': 'Harmlos',
  'unterstützend': 'Unterstützend',
  'potenziell gefährlich': 'Potenziell gefährlich',
  'sehr gefährlich': 'Sehr gefährlich'
}

const DANGER_COLORS: Record<string, string> = {
  'harmlos': 'bg-green-600',
  'unterstützend': 'bg-blue-600',
  'potenziell gefährlich': 'bg-yellow-600',
  'sehr gefährlich': 'bg-red-600'
}

export default function BestiaryPage() {
  const { monsters, npcs, areas, monsterTypes, removeMonster, removeNPC, isLoading } = useAppStore()
  const [activeTab, setActiveTab] = useState<'monsters' | 'npcs'>('monsters')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState('All')
  const [selectedMonster, setSelectedMonster] = useState<StoredMonster | null>(null)
  const [selectedNPC, setSelectedNPC] = useState<StoredNPC | null>(null)

  const filteredMonsters = monsters.filter((monster) => {
    const matchesSearch = monster.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = filterTag === 'All' || monster.tags.includes(filterTag)
    return matchesSearch && matchesTag
  })

  const filteredNPCs = npcs.filter((npc) => {
    const matchesSearch = npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npc.role.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getAreaInfo = (areaId: string) => areas.find((a) => a.id === areaId)

  const handleViewMonster = (monster: StoredMonster) => {
    setSelectedMonster(monster)
    setSelectedNPC(null)
  }

  const handleViewNPC = (npc: StoredNPC) => {
    setSelectedNPC(npc)
    setSelectedMonster(null)
  }

  const handleDeleteMonster = async (monster: StoredMonster) => {
    if (confirm(`Möchtest du ${monster.name} wirklich löschen?`)) {
      await removeMonster(monster.id)
      if (selectedMonster?.id === monster.id) {
        setSelectedMonster(null)
      }
    }
  }

  const handleDeleteNPC = async (npc: StoredNPC) => {
    if (confirm(`Möchtest du ${npc.name} wirklich löschen?`)) {
      await removeNPC(npc.id)
      if (selectedNPC?.id === npc.id) {
        setSelectedNPC(null)
      }
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'monsters' | 'npcs')
    setSearchQuery('')
    setFilterTag('All')
    setSelectedMonster(null)
    setSelectedNPC(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Bestiarium</h2>
        <Badge variant="outline" className="text-sm">
          {activeTab === 'monsters' ? monsters.length : npcs.length} {activeTab === 'monsters' ? 'Kreaturen' : 'NPCs'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monsters" className="flex items-center gap-2">
            <Skull className="h-4 w-4" />
            Monster
          </TabsTrigger>
          <TabsTrigger value="npcs" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            NPCs
          </TabsTrigger>
        </TabsList>

        {/* Monsters Tab */}
        <TabsContent value="monsters" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monster List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Monster suchen …"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger className="w-40 bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">Alle Typen</SelectItem>
                      {monsterTypes.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Monster Table */}
              <AppCard contentClassName="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Gebiet</TableHead>
                        <TableHead>Schwierigkeit</TableHead>
                        <TableHead>Typen</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMonsters.length > 0 ? (
                        filteredMonsters.map((monster) => {
                          const areaInfo = getAreaInfo(monster.area)
                          return (
                            <TableRow
                              key={monster.id}
                              className="border-border cursor-pointer"
                              onClick={() => handleViewMonster(monster)}
                            >
                              <TableCell className="font-medium">{monster.name}</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <span>{areaInfo?.icon}</span>
                                  <span>{areaInfo?.name || monster.area}</span>
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${DIFFICULTY_COLORS[monster.difficulty]} text-white`}>
                                  {DIFFICULTY_LABELS[monster.difficulty] || monster.difficulty}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {monster.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {monster.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{monster.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewMonster(monster)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteMonster(monster)
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {searchQuery || filterTag !== 'All'
                              ? 'Keine Monster entsprechen deinen Filtern'
                              : 'Noch keine Monster im Bestiarium. Erzeuge welche!'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AppCard>
            </div>

            {/* Monster Detail */}
            <div className="lg:col-span-1 space-y-4">
              <AppCard
                title="Monster-Details"
                icon={<BookOpen className="h-5 w-5 text-primary" />}
              >
                {selectedMonster ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedMonster.name}</h3>
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {selectedMonster.summary}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                        <Heart className="h-3 w-3 mx-auto mb-1 text-destructive" />
                        <p className="text-xs text-muted-foreground">TP</p>
                        <p className="text-lg font-bold text-destructive">{selectedMonster.hp}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-center">
                        <Shield className="h-3 w-3 mx-auto mb-1 text-primary" />
                        <p className="text-xs text-muted-foreground">RK</p>
                        <p className="text-lg font-bold text-primary">{selectedMonster.ac}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/50 border border-border text-center">
                        <Zap className="h-3 w-3 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Tempo</p>
                        <p className="text-xs font-medium">{selectedMonster.speed}</p>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Eye className="h-3 w-3" />
                        Aussehen
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedMonster.appearance}
                      </p>
                    </div>

                    {/* Attacks */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Swords className="h-3 w-3" />
                        Angriffe
                      </h4>
                      <div className="space-y-2">
                        {selectedMonster.attacks.map((attack, index) => (
                          <div key={index} className="p-2 rounded bg-secondary/50 border border-border text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium">{attack.name}</span>
                              <span className="text-muted-foreground">{attack.toHit}</span>
                            </div>
                            <p className="text-muted-foreground">{attack.damage}</p>
                            {attack.effect && (
                              <p className="text-primary mt-1">{attack.effect}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Abilities */}
                    {selectedMonster.abilities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Fähigkeiten</h4>
                        <div className="space-y-2">
                          {selectedMonster.abilities.map((ability, index) => (
                            <div key={index}>
                              <span className="font-medium text-xs">{ability.name}:</span>
                              <p className="text-xs text-muted-foreground">{ability.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {selectedMonster.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-4xl mb-3">📖</span>
                    <p className="text-muted-foreground text-sm">
                      Wähle ein Monster aus der Liste, um Details anzuzeigen
                    </p>
                  </div>
                )}
              </AppCard>
            </div>
          </div>
        </TabsContent>

        {/* NPCs Tab */}
        <TabsContent value="npcs" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* NPC List */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="NPC suchen …"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary"
                  />
                </div>
              </div>

              {/* NPC Table */}
              <AppCard contentClassName="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Gebiet</TableHead>
                        <TableHead>Gefährlichkeit</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNPCs.length > 0 ? (
                        filteredNPCs.map((npc) => {
                          const areaInfo = getAreaInfo(npc.area)
                          return (
                            <TableRow
                              key={npc.id}
                              className="border-border cursor-pointer"
                              onClick={() => handleViewNPC(npc)}
                            >
                              <TableCell className="font-medium">{npc.name}</TableCell>
                              <TableCell>{npc.role}</TableCell>
                              <TableCell>
                                <span className="flex items-center gap-1">
                                  <span>{areaInfo?.icon}</span>
                                  <span>{areaInfo?.name || npc.area}</span>
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${DANGER_COLORS[npc.dangerLevel] || 'bg-gray-600'} text-white`}>
                                  {DANGER_LABELS[npc.dangerLevel] || npc.dangerLevel}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewNPC(npc)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Link href={`/npc/${npc.id}/chat`} onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Mit NPC sprechen"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteNPC(npc)
                                    }}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {searchQuery
                              ? 'Keine NPCs entsprechen deiner Suche'
                              : 'Noch keine NPCs im Bestiarium. Erzeuge welche!'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AppCard>
            </div>

            {/* NPC Detail */}
            <div className="lg:col-span-1 space-y-4">
              <AppCard
                title="NPC-Details"
                icon={<Users className="h-5 w-5 text-primary" />}
              >
                {selectedNPC ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedNPC.name}</h3>
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {selectedNPC.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{selectedNPC.role}</Badge>
                        <Badge className={`${DANGER_COLORS[selectedNPC.dangerLevel] || 'bg-gray-600'} text-white`}>
                          {DANGER_LABELS[selectedNPC.dangerLevel] || selectedNPC.dangerLevel}
                        </Badge>
                      </div>
                    </div>

                    {/* Appearance */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Eye className="h-3 w-3" />
                        Aussehen
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedNPC.appearance}
                      </p>
                    </div>

                    {/* Personality */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        Persönlichkeit
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedNPC.personality}
                      </p>
                    </div>

                    {/* Motivations */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Target className="h-3 w-3" />
                        Ziele / Motivation
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedNPC.motivations}
                      </p>
                    </div>

                    {/* Hooks */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Lightbulb className="h-3 w-3" />
                        Aufhänger
                      </h4>
                      <ul className="space-y-1">
                        {selectedNPC.hooks.map((hook, index) => (
                          <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="text-primary font-bold">•</span>
                            <span>{hook}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Combat Notes */}
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Swords className="h-3 w-3" />
                        Kampfnotizen
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedNPC.combatNotes}
                      </p>
                    </div>

                    {/* Chat Button */}
                    <Link href={`/npc/${selectedNPC.id}/chat`} className="block">
                      <Button className="w-full" variant="secondary">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Mit NPC sprechen
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="text-4xl mb-3">👤</span>
                    <p className="text-muted-foreground text-sm">
                      Wähle einen NPC aus der Liste, um Details anzuzeigen
                    </p>
                  </div>
                )}
              </AppCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
