'use client'

import { useState } from 'react'
import { useAppStore, type StoredNPC } from '@/lib/store/useAppStore'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Users,
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Target,
  Lightbulb,
  Swords,
  User
} from 'lucide-react'

const ARCHETYPES = [
  { id: 'einwohner', label: 'Einwohner/in' },
  { id: 'anfuehrer', label: 'Anführer/in' },
  { id: 'schurke', label: 'Schurke/Schurkin' },
  { id: 'reisender', label: 'Reisende/r' },
  { id: 'gelehrter', label: 'Gelehrte/r' },
  { id: 'haendler', label: 'Händler/in' },
  { id: 'handwerker', label: 'Handwerker/in' },
  { id: 'wache', label: 'Wache/Soldat' },
  { id: 'mystiker', label: 'Mystiker/in' }
]

const DANGER_LEVELS = [
  { id: 'harmlos', label: 'Harmlos', color: 'bg-green-600' },
  { id: 'unterstützend', label: 'Unterstützend', color: 'bg-blue-600' },
  { id: 'potenziell gefährlich', label: 'Potenziell gefährlich', color: 'bg-yellow-600' },
  { id: 'sehr gefährlich', label: 'Sehr gefährlich', color: 'bg-red-600' }
]

type DangerLevel = 'harmlos' | 'unterstützend' | 'potenziell gefährlich' | 'sehr gefährlich'

export default function NPCsPage() {
  const { areas, worldDescription, saveNPC, isLoading: storeLoading } = useAppStore()

  // Form state
  const [selectedArea, setSelectedArea] = useState('')
  const [role, setRole] = useState('')
  const [archetype, setArchetype] = useState('')
  const [dangerLevel, setDangerLevel] = useState<DangerLevel>('harmlos')
  const [description, setDescription] = useState('')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedNPC, setGeneratedNPC] = useState<StoredNPC | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Bitte gib eine NPC-Beschreibung ein.')
      return
    }

    if (!selectedArea) {
      setError('Bitte wähle ein Gebiet aus.')
      return
    }

    if (!role.trim()) {
      setError('Bitte gib eine Rolle/Beruf an.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedNPC(null)

    try {
      const response = await fetch('/api/generate-npc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: selectedArea,
          role: role.trim(),
          archetype: archetype || undefined,
          dangerLevel,
          description: description.trim()
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'NPC-Erzeugung fehlgeschlagen')
      }

      setGeneratedNPC(data.npc)
    } catch (err) {
      console.error('Failed to generate NPC:', err)
      setError(err instanceof Error ? err.message : 'NPC-Erzeugung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveNPC = async () => {
    if (!generatedNPC) return

    setIsSaving(true)
    try {
      await saveNPC(generatedNPC)
      alert(`${generatedNPC.name} wurde im Bestiarium gespeichert!`)
    } catch (err) {
      console.error('Failed to save NPC:', err)
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerate = () => {
    setError(null)
    handleGenerate()
  }

  const getDangerColor = (level: string) => {
    return DANGER_LEVELS.find((d) => d.id === level)?.color || 'bg-gray-600'
  }

  const getDangerLabel = (level: string) => {
    return DANGER_LEVELS.find((d) => d.id === level)?.label || level
  }

  const getAreaName = (areaId: string) => {
    return areas.find((a) => a.id === areaId)?.name || areaId
  }

  const getAreaIcon = (areaId: string) => {
    return areas.find((a) => a.id === areaId)?.icon || '📍'
  }

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">NPC-Generator</h2>
        <Badge variant="outline" className="text-sm">
          <Users className="h-3 w-3 mr-1" />
          KI-gestützt
        </Badge>
      </div>

      {!worldDescription && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-200">
            <strong>Tipp:</strong> Lege in den Einstellungen eine Weltenbeschreibung fest, damit die generierten NPCs besser zu deiner Kampagne passen.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <AppCard
          title="NPC-Details"
          description="Beschreibe den Nichtspielercharakter, den du erzeugen möchtest"
          icon={<Sparkles className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-5">
            {/* Area Select */}
            <div className="space-y-2">
              <Label htmlFor="area">Gebiet / Aufenthaltsort</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger id="area" className="bg-secondary">
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
            </div>

            {/* Role/Profession */}
            <div className="space-y-2">
              <Label htmlFor="role">
                Rolle / Beruf <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="z. B. Wirt, Waldläuferin, Priester, Schmiedin …"
                className="bg-secondary"
              />
            </div>

            {/* Archetype */}
            <div className="space-y-2">
              <Label htmlFor="archetype">Archetyp (optional)</Label>
              <Select value={archetype || '_none'} onValueChange={(v) => setArchetype(v === '_none' ? '' : v)}>
                <SelectTrigger id="archetype" className="bg-secondary">
                  <SelectValue placeholder="Archetyp wählen …" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Kein bestimmter Archetyp</SelectItem>
                  {ARCHETYPES.map((arch) => (
                    <SelectItem key={arch.id} value={arch.id}>
                      {arch.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Danger Level */}
            <div className="space-y-2">
              <Label htmlFor="dangerLevel">Gefährlichkeitsgrad</Label>
              <Select value={dangerLevel} onValueChange={(v) => setDangerLevel(v as DangerLevel)}>
                <SelectTrigger id="dangerLevel" className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DANGER_LEVELS.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${level.color}`} />
                        <span>{level.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* NPC Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                NPC-Idee <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Alte Kräuterfrau, die mehr weiß als sie zugibt, lebt allein am Waldrand …"
                className="min-h-[100px] bg-secondary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Beschreibe das Konzept, den Hintergrund oder besondere Merkmale des NPCs
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    className="mt-2 h-7 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Erneut versuchen
                  </Button>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim() || !selectedArea || !role.trim()}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird erzeugt …
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  NPC erzeugen
                </>
              )}
            </Button>
          </div>
        </AppCard>

        {/* NPC Preview */}
        <div className="space-y-4">
          {generatedNPC ? (
            <>
              {/* NPC Header */}
              <AppCard icon={<User className="h-5 w-5 text-primary" />}>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold">{generatedNPC.name}</h3>
                    <p className="text-muted-foreground italic">{generatedNPC.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {generatedNPC.role}
                    </Badge>
                    <Badge variant="outline">
                      <span className="mr-1">{getAreaIcon(generatedNPC.area)}</span>
                      {getAreaName(generatedNPC.area)}
                    </Badge>
                    <Badge className={`${getDangerColor(generatedNPC.dangerLevel)} text-white`}>
                      {getDangerLabel(generatedNPC.dangerLevel)}
                    </Badge>
                  </div>
                </div>
              </AppCard>

              {/* Appearance */}
              <AppCard title="Aussehen" icon={<Eye className="h-5 w-5 text-primary" />}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedNPC.appearance}
                </p>
              </AppCard>

              {/* Personality */}
              <AppCard title="Persönlichkeit" icon={<User className="h-5 w-5 text-primary" />}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedNPC.personality}
                </p>
              </AppCard>

              {/* Motivations */}
              <AppCard title="Ziele / Motivation" icon={<Target className="h-5 w-5 text-primary" />}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedNPC.motivations}
                </p>
              </AppCard>

              {/* Hooks */}
              <AppCard title="Aufhänger / Plotideen" icon={<Lightbulb className="h-5 w-5 text-primary" />}>
                <ul className="space-y-2">
                  {generatedNPC.hooks.map((hook, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-bold">•</span>
                      <span>{hook}</span>
                    </li>
                  ))}
                </ul>
              </AppCard>

              {/* Combat Notes */}
              <AppCard title="Kampfnotizen" icon={<Swords className="h-5 w-5 text-primary" />}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedNPC.combatNotes}
                </p>
              </AppCard>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveNPC}
                  disabled={isSaving}
                  className="flex-1"
                  variant="secondary"
                  size="lg"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gespeichert …
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Im Bestiarium speichern
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  variant="outline"
                  size="lg"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Neu würfeln
                </Button>
              </div>
            </>
          ) : (
            <AppCard className="h-full min-h-[400px]">
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <span className="text-6xl mb-4">👤</span>
                <h3 className="text-lg font-medium mb-2">Noch kein NPC</h3>
                <p className="text-muted-foreground max-w-xs">
                  Fülle das Formular aus und klicke auf „NPC erzeugen", um einen neuen Nichtspielercharakter per KI zu erstellen
                </p>
              </div>
            </AppCard>
          )}
        </div>
      </div>
    </div>
  )
}

