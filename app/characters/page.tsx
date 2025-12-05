'use client'

import { useState } from 'react'
import { useAppStore, type StoredCharacter } from '@/lib/store/useAppStore'
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
  UserPlus,
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Globe,
  Eye
} from 'lucide-react'

const ROLES = [
  { id: 'warrior', label: 'Krieger', icon: '⚔️' },
  { id: 'mage', label: 'Magier', icon: '🔮' },
  { id: 'rogue', label: 'Schurke', icon: '🗡️' },
  { id: 'support', label: 'Unterstützer', icon: '✨' },
  { id: 'ranger', label: 'Waldläufer', icon: '🏹' },
  { id: 'cleric', label: 'Kleriker', icon: '⛪' }
]

const POWER_LEVELS = [
  { id: 'low', label: 'Niedrig', description: 'Bürger oder Anfänger-Abenteurer' },
  { id: 'medium', label: 'Mittel', description: 'Erfahrener Abenteurer' },
  { id: 'high', label: 'Hoch', description: 'Legendärer Held' }
]

const STAT_LABELS: Record<string, string> = {
  strength: 'STÄ',
  dexterity: 'GES',
  constitution: 'KON',
  intelligence: 'INT',
  wisdom: 'WEI',
  charisma: 'CHA'
}

export default function CharactersPage() {
  const { worldDescription, saveCharacter, isLoading: storeLoading } = useAppStore()

  // Form state
  const [characterName, setCharacterName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [role, setRole] = useState('warrior')
  const [powerLevel, setPowerLevel] = useState('medium')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedCharacter, setGeneratedCharacter] = useState<StoredCharacter | null>(null)
  const [showWorldDescription, setShowWorldDescription] = useState(false)

  const handleGenerate = async () => {
    if (!shortDescription.trim()) {
      setError('Bitte gib eine kurze Beschreibung des Charakters an.')
      return
    }

    if (!worldDescription.trim()) {
      setError('Bitte lege zuerst in den Einstellungen eine Weltenbeschreibung fest.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedCharacter(null)

    try {
      const response = await fetch('/api/generate-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldDescription,
          characterName: characterName.trim() || undefined,
          shortDescription: shortDescription.trim(),
          role,
          powerLevel
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Charaktererzeugung fehlgeschlagen')
      }

      setGeneratedCharacter(data.character)
    } catch (err) {
      console.error('Failed to generate character:', err)
      setError(err instanceof Error ? err.message : 'Charaktererzeugung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveCharacter = async () => {
    if (!generatedCharacter) return

    setIsSaving(true)
    try {
      await saveCharacter(generatedCharacter)
      alert(`${generatedCharacter.name} wurde gespeichert!`)
    } catch (err) {
      console.error('Failed to save character:', err)
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleGenerate()
  }

  const getStatColor = (value: number) => {
    if (value >= 16) return 'text-green-400'
    if (value >= 12) return 'text-blue-400'
    if (value >= 10) return 'text-foreground'
    if (value >= 8) return 'text-yellow-400'
    return 'text-red-400'
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
        <h2 className="text-2xl font-semibold text-foreground">Charaktererstellung</h2>
        <Badge variant="outline" className="text-sm">
          <UserPlus className="h-3 w-3 mr-1" />
          KI-gestützt
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character Form */}
        <div className="space-y-4">
          {/* World Description Preview */}
          <AppCard
            icon={<Globe className="h-5 w-5 text-primary" />}
            contentClassName="pt-0"
          >
            <button
              onClick={() => setShowWorldDescription(!showWorldDescription)}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <div>
                <p className="font-medium text-sm">Weltenkontext</p>
                <p className="text-xs text-muted-foreground">
                  {worldDescription
                    ? `${worldDescription.slice(0, 60)}${worldDescription.length > 60 ? '...' : ''}`
                    : 'Keine Weltenbeschreibung festgelegt'}
                </p>
              </div>
              {showWorldDescription ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showWorldDescription && (
              <div className="pb-3">
                {worldDescription ? (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border max-h-32 overflow-y-auto">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {worldDescription}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-sm text-yellow-200">
                      Keine Weltenbeschreibung festgelegt. Gehe zu den Einstellungen, um eine hinzuzufügen und bessere Charaktere zu generieren.
                    </p>
                  </div>
                )}
              </div>
            )}
          </AppCard>

          {/* Generation Form */}
          <AppCard
            title="Charakter-Details"
            description="Beschreibe den Charakter, den du erstellen möchtest"
            icon={<Sparkles className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-5">
              {/* Character Name */}
              <div className="space-y-2">
                <Label htmlFor="characterName">Charaktername (optional)</Label>
                <Input
                  id="characterName"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Leer lassen, damit die KI einen Namen generiert"
                  className="bg-secondary"
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2">
                <Label htmlFor="shortDescription">
                  Charakterbeschreibung <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Ein stiller Elfen-Waldläufer, der Monster in den nördlichen Wäldern jagt …"
                  className="min-h-[100px] bg-secondary resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Beschreibe Persönlichkeit, Hintergrund-Hinweise und Rolle in deiner Geschichte
                </p>
              </div>

              {/* Role/Archetype */}
              <div className="space-y-2">
                <Label htmlFor="role">Rolle / Archetyp</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <span>{r.icon}</span>
                          <span>{r.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Power Level */}
              <div className="space-y-2">
                <Label htmlFor="powerLevel">Machtstufe</Label>
                <Select value={powerLevel} onValueChange={setPowerLevel}>
                  <SelectTrigger id="powerLevel" className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POWER_LEVELS.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        <span className="flex flex-col">
                          <span>{level.label}</span>
                          <span className="text-xs text-muted-foreground">{level.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      onClick={handleRetry}
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
                disabled={isGenerating || !shortDescription.trim()}
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
                    Charakter erzeugen
                  </>
                )}
              </Button>
            </div>
          </AppCard>
        </div>

        {/* Character Preview */}
        <div className="space-y-4">
          {generatedCharacter ? (
            <>
              {/* Character Header */}
              <AppCard
                icon={<UserPlus className="h-5 w-5 text-primary" />}
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold">{generatedCharacter.name}</h3>
                    <p className="text-muted-foreground">{generatedCharacter.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Stufe {generatedCharacter.stats.level}
                    </Badge>
                    <Badge variant="outline">
                      {generatedCharacter.stats.class}
                    </Badge>
                    <Badge variant="outline">
                      {generatedCharacter.stats.race}
                    </Badge>
                  </div>
                </div>
              </AppCard>

              {/* Appearance */}
              <AppCard
                title="Aussehen"
                icon={<Eye className="h-5 w-5 text-primary" />}
              >
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedCharacter.appearance}
                </p>
              </AppCard>

              {/* Stats */}
              <AppCard title="Attributswerte">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(STAT_LABELS).map(([key, label]) => {
                    const value = generatedCharacter.stats[key as keyof typeof generatedCharacter.stats] as number
                    const modifier = Math.floor((value - 10) / 2)
                    const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-lg bg-secondary/50 border border-border text-center"
                      >
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          {label}
                        </p>
                        <p className={`text-xl font-bold ${getStatColor(value)}`}>
                          {value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ({modifierStr})
                        </p>
                      </div>
                    )
                  })}
                </div>
              </AppCard>

              {/* Backstory */}
              <AppCard title="Hintergrundgeschichte">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedCharacter.backstory}
                </p>
              </AppCard>

              {/* Save Button */}
              <Button
                onClick={handleSaveCharacter}
                disabled={isSaving}
                className="w-full"
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
                    Charakter speichern
                  </>
                )}
              </Button>
            </>
          ) : (
            <AppCard className="h-full min-h-[400px]">
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <span className="text-6xl mb-4">🧙‍♂️</span>
                <h3 className="text-lg font-medium mb-2">Noch kein Charakter</h3>
                <p className="text-muted-foreground max-w-xs">
                  Fülle das Formular aus und klicke auf „Charakter erzeugen", um einen neuen Charakter per KI zu erstellen
                </p>
              </div>
            </AppCard>
          )}
        </div>
      </div>
    </div>
  )
}
