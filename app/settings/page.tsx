'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type StoredArea } from '@/lib/store/useAppStore'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Settings,
  Key,
  Palette,
  Globe,
  Check,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  Loader2
} from 'lucide-react'

const AREA_ICONS = ['🏰', '🌲', '⛰️', '🌊', '🕳️', '🏜️', '❄️', '🌋', '🏛️', '⚔️', '🗿', '🌙']

export default function SettingsPage() {
  const {
    theme,
    setTheme,
    worldDescription,
    saveWorldDescription,
    areas,
    saveArea,
    updateAreaOnServer,
    removeArea,
    isLoading
  } = useAppStore()

  const [savedIndicator, setSavedIndicator] = useState(false)
  const [localWorldDescription, setLocalWorldDescription] = useState(worldDescription)

  // Area editing state
  const [isAddingArea, setIsAddingArea] = useState(false)
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [areaName, setAreaName] = useState('')
  const [areaIcon, setAreaIcon] = useState('🏰')

  // Sync local state with store
  useEffect(() => {
    setLocalWorldDescription(worldDescription)
  }, [worldDescription])

  const handleWorldDescriptionChange = async (value: string) => {
    setLocalWorldDescription(value)
    setSavedIndicator(true)
    await saveWorldDescription(value)
  }

  useEffect(() => {
    if (savedIndicator) {
      const timer = setTimeout(() => setSavedIndicator(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [savedIndicator])

  const handleAddArea = async () => {
    if (!areaName.trim()) return

    const newArea: StoredArea = {
      id: Date.now().toString(),
      name: areaName.trim(),
      icon: areaIcon
    }

    await saveArea(newArea)
    setAreaName('')
    setAreaIcon('🏰')
    setIsAddingArea(false)
  }

  const handleEditArea = (area: StoredArea) => {
    setEditingAreaId(area.id)
    setAreaName(area.name)
    setAreaIcon(area.icon)
  }

  const handleUpdateArea = async () => {
    if (!editingAreaId || !areaName.trim()) return

    await updateAreaOnServer(editingAreaId, {
      name: areaName.trim(),
      icon: areaIcon
    })

    setEditingAreaId(null)
    setAreaName('')
    setAreaIcon('🏰')
  }

  const handleDeleteArea = async (id: string) => {
    if (confirm('Möchtest du dieses Gebiet wirklich löschen?')) {
      await removeArea(id)
    }
  }

  const handleCancelEdit = () => {
    setEditingAreaId(null)
    setIsAddingArea(false)
    setAreaName('')
    setAreaIcon('🏰')
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
        <h2 className="text-2xl font-semibold text-foreground">Einstellungen</h2>
        <Badge variant="outline" className="text-sm">
          <Settings className="h-3 w-3 mr-1" />
          Konfiguration
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* World Description */}
        <AppCard
          title="Weltenbeschreibung"
          description="Definiere deine Kampagnenwelt für die KI-Generierung"
          icon={<Globe className="h-5 w-5 text-primary" />}
          className="md:col-span-2"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="worldDescription">Welt-Details</Label>
                <div className="flex items-center gap-2">
                  {savedIndicator && (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Check className="h-3 w-3" />
                      Gespeichert
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {localWorldDescription.length} Zeichen
                  </span>
                </div>
              </div>
              <Textarea
                id="worldDescription"
                value={localWorldDescription}
                onChange={(e) => handleWorldDescriptionChange(e.target.value)}
                placeholder="Beschreibe den Ton, das Technologie-Level, das Magiesystem, wichtige Fraktionen, spielbare Völker und die allgemeine Atmosphäre deiner Welt …"
                className="min-h-[160px] bg-secondary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Diese Beschreibung wird bei der Generierung von Monstern, Charakteren und Tabelleneinträgen verwendet.
              </p>
            </div>
          </div>
        </AppCard>

        {/* Areas Management */}
        <AppCard
          title="Gebiete / Umgebungen"
          description="Verwalte die Gebiete deiner Kampagnenwelt"
          icon={<MapPin className="h-5 w-5 text-primary" />}
          className="md:col-span-2"
        >
          <div className="space-y-4">
            {/* Existing Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                >
                  {editingAreaId === area.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Select value={areaIcon} onValueChange={setAreaIcon}>
                        <SelectTrigger className="w-16 bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AREA_ICONS.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              {icon}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={areaName}
                        onChange={(e) => setAreaName(e.target.value)}
                        className="flex-1 bg-secondary"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateArea}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{area.icon}</span>
                        <span className="font-medium">{area.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditArea(area)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteArea(area.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Area */}
            {isAddingArea ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
                <Select value={areaIcon} onValueChange={setAreaIcon}>
                  <SelectTrigger className="w-16 bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AREA_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="Gebietsname …"
                  className="flex-1 bg-secondary"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddArea} disabled={!areaName.trim()}>
                  Hinzufügen
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Abbrechen
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsAddingArea(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neues Gebiet hinzufügen
              </Button>
            )}
          </div>
        </AppCard>

        {/* API Configuration */}
        <AppCard
          title="KI-Konfiguration"
          description="Konfiguriere deine Gemini-API-Verbindung"
          icon={<Key className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">API-Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Der Gemini-API-Schlüssel wird aus Sicherheitsgründen über Server-Umgebungsvariablen konfiguriert. Der Schlüssel wird niemals an den Client übertragen.
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Einrichtungsanleitung:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Hole deinen API-Schlüssel von Google AI Studio</li>
                <li>Füge <code className="px-1 py-0.5 bg-secondary rounded">GEMINI_API_KEY</code> zu deiner <code className="px-1 py-0.5 bg-secondary rounded">.env.local</code> hinzu</li>
                <li>Starte den Entwicklungsserver neu</li>
              </ol>
            </div>
          </div>
        </AppCard>

        {/* Theme Settings */}
        <AppCard
          title="Erscheinungsbild"
          description="Passe das Aussehen an"
          icon={<Palette className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Farbschema</Label>
              <Select value={theme} onValueChange={(value) => setTheme(value as 'dark' | 'light')}>
                <SelectTrigger id="theme" className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">
                    <span className="flex items-center gap-2">
                      <span>🌙</span>
                      <span>Dunkler Modus</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="light">
                    <span className="flex items-center gap-2">
                      <span>☀️</span>
                      <span>Heller Modus</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Die Farbschema-Umschaltung wird in einem zukünftigen Update vollständig implementiert.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm">
                <span className="font-medium">Tipp:</span> Der dunkle Modus ist für lange Spielsitzungen optimiert und schont die Augen.
              </p>
            </div>
          </div>
        </AppCard>

        {/* About */}
        <AppCard
          title="Über"
          description="Pen-&-Paper-Leitstand"
          className="md:col-span-2"
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Eine moderne Spielleiter-App für Pen-&-Paper-Rollenspielsitzungen. Erzeuge Monster, erstelle Charaktere, verwalte eigene Tabellen und behalte deine Abenteuernotizen im Blick.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Next.js 16</Badge>
              <Badge variant="outline">React 19</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="outline">Shadcn/UI</Badge>
              <Badge variant="outline">Zustand</Badge>
              <Badge variant="outline">Gemini AI</Badge>
            </div>
            <p className="text-xs">
              Mit ❤️ für Tischrollenspieler überall entwickelt.
            </p>
          </div>
        </AppCard>
      </div>
    </div>
  )
}
