'use client'

import { AppCard } from '@/components/ui/app-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store/useAppStore'
import { Dices, Loader2, MapPin, ScrollText, Skull } from 'lucide-react'
import Link from 'next/link'

const DANGER_LEVELS = [
  { id: 'safe', label: 'Sicher', color: 'bg-green-600' },
  { id: 'moderate', label: 'Mäßig', color: 'bg-yellow-600' },
  { id: 'dangerous', label: 'Gefährlich', color: 'bg-orange-600' },
  { id: 'deadly', label: 'Tödlich', color: 'bg-red-600' }
]

export default function Dashboard() {
  const {
    currentArea,
    setCurrentArea,
    areas,
    sessionNotes,
    setSessionNotes,
    monsters,
    npcs,
    tables,
    characters,
    isLoading
  } = useAppStore()

  const handleRollD20 = () => {
    const result = Math.floor(Math.random() * 20) + 1
    alert(`🎲 Du hast eine ${result} gewürfelt!`)
  }

  const handleRollCustomTable = () => {
    if (tables.length === 0) {
      alert('📜 Noch keine eigenen Tabellen vorhanden! Erstelle eine auf der Tabellen-Seite.')
      return
    }
    alert('📜 Gehe zu „Eigene Tabellen", um auf einer bestimmten Tabelle zu würfeln!')
  }

  const currentAreaInfo = areas.find((a) => a.id === currentArea)

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
        <h2 className="text-2xl font-semibold text-foreground">Übersicht</h2>
        <Badge variant="outline" className="text-sm">
          Spielleiter-Zentrale
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Current Area Card */}
        <AppCard
          title="Aktuelles Gebiet"
          icon={<MapPin className="h-5 w-5 text-primary" />}
          className="md:col-span-1"
        >
          <div className="space-y-4">
            <Select value={currentArea} onValueChange={setCurrentArea}>
              <SelectTrigger className="w-full bg-secondary">
                <SelectValue placeholder="Gebiet wählen …" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <span className="flex items-center gap-2">
                      <span>{area.icon}</span>
                      <span>{area.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gefahrenstufe:</span>
              <Badge className={`${DANGER_LEVELS[1].color} text-white`}>
                {DANGER_LEVELS[1].label}
              </Badge>
            </div>

            {currentAreaInfo && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 text-lg">
                  <span>{currentAreaInfo.icon}</span>
                  <span className="font-medium">{currentAreaInfo.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Aktive Umgebung für Begegnungen und Würfe
                </p>
              </div>
            )}
          </div>
        </AppCard>

        {/* Quick Rolls Card */}
        <AppCard
          title="Schnelle Würfe"
          icon={<Dices className="h-5 w-5 text-primary" />}
          className="md:col-span-1"
        >
          <div className="space-y-3">
            <Button
              onClick={handleRollD20}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Dices className="h-4 w-4 mr-2" />
              W20 würfeln
            </Button>
            <Button
              onClick={handleRollCustomTable}
              variant="secondary"
              className="w-full"
            >
              <ScrollText className="h-4 w-4 mr-2" />
              Auf eigener Tabelle würfeln
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Eigene Tabellen auf der Tabellen-Seite erstellen
            </p>
          </div>
        </AppCard>

        {/* Quick Monster Card */}
        <AppCard
          title="Schnelles Monster"
          icon={<Skull className="h-5 w-5 text-primary" />}
          className="md:col-span-1"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
              <span className="text-3xl">🐲</span>
              <p className="text-sm text-muted-foreground mt-2">
                Zufällige Begegnungen für deine Gruppe erzeugen
              </p>
            </div>
            <Link href="/monsters">
              <Button className="w-full bg-destructive hover:bg-destructive/90">
                <Skull className="h-4 w-4 mr-2" />
                Monster erzeugen
              </Button>
            </Link>
          </div>
        </AppCard>

        {/* Session Notes Card */}
        <AppCard
          title="Sitzungsnotizen"
          icon={<ScrollText className="h-5 w-5 text-primary" />}
          className="md:col-span-1 xl:row-span-1"
        >
          <div className="space-y-3">
            <Textarea
              placeholder="Schreibe hier deine Sitzungsnotizen …"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="min-h-[120px] bg-secondary border-border resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {sessionNotes.length > 0 ? `${sessionNotes.length} Zeichen` : 'Beginne zu tippen, um Notizen zu speichern'}
            </p>
          </div>
        </AppCard>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/bestiary" className="block">
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
            <p className="text-2xl font-bold text-primary">{monsters.length}</p>
            <p className="text-sm text-muted-foreground">Monster</p>
          </div>
        </Link>
        <Link href="/bestiary" className="block">
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
            <p className="text-2xl font-bold text-primary">{npcs.length}</p>
            <p className="text-sm text-muted-foreground">NPCs</p>
          </div>
        </Link>
        <Link href="/tables" className="block">
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
            <p className="text-2xl font-bold text-primary">{tables.length}</p>
            <p className="text-sm text-muted-foreground">Eigene Tabellen</p>
          </div>
        </Link>
        <Link href="/settings" className="block">
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
            <p className="text-2xl font-bold text-primary">{areas.length}</p>
            <p className="text-sm text-muted-foreground">Gebiete</p>
          </div>
        </Link>
        <Link href="/characters" className="block">
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors">
            <p className="text-2xl font-bold text-primary">{characters.length}</p>
            <p className="text-sm text-muted-foreground">Charaktere</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
