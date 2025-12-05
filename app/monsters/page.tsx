'use client'

import { useState } from 'react'
import { useAppStore, type StoredMonster } from '@/lib/store/useAppStore'
import { AppCard } from '@/components/ui/app-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Skull,
  Sparkles,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Swords,
  Shield,
  Heart,
  Zap
} from 'lucide-react'

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Leicht', color: 'bg-green-600' },
  { id: 'medium', label: 'Mittel', color: 'bg-yellow-600' },
  { id: 'hard', label: 'Schwer', color: 'bg-orange-600' },
  { id: 'deadly', label: 'Tödlich', color: 'bg-red-600' }
]

export default function MonsterGeneratorPage() {
  const { areas, monsterTypes, currentArea, worldDescription, saveMonster, isLoading: storeLoading } = useAppStore()

  // Form state
  const [selectedArea, setSelectedArea] = useState(currentArea || '')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'deadly'>('medium')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedMonster, setGeneratedMonster] = useState<StoredMonster | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Bitte gib eine Monsterbeschreibung ein.')
      return
    }

    if (!selectedArea) {
      setError('Bitte wähle ein Gebiet aus.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedMonster(null)

    try {
      const response = await fetch('/api/generate-monster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: selectedArea,
          difficulty,
          description: description.trim(),
          tags: selectedTags
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Monstererzeugung fehlgeschlagen')
      }

      setGeneratedMonster(data.monster)
    } catch (err) {
      console.error('Failed to generate monster:', err)
      setError(err instanceof Error ? err.message : 'Monstererzeugung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveMonster = async () => {
    if (!generatedMonster) return

    setIsSaving(true)
    try {
      await saveMonster(generatedMonster)
      alert(`${generatedMonster.name} wurde im Bestiarium gespeichert!`)
    } catch (err) {
      console.error('Failed to save monster:', err)
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleGenerate()
  }

  const getDifficultyColor = (diff: string) => {
    return DIFFICULTY_LEVELS.find((d) => d.id === diff)?.color || 'bg-gray-600'
  }

  const getDifficultyLabel = (diff: string) => {
    return DIFFICULTY_LEVELS.find((d) => d.id === diff)?.label || diff
  }

  const getAreaName = (areaId: string) => {
    return areas.find((a) => a.id === areaId)?.name || areaId
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
        <h2 className="text-2xl font-semibold text-foreground">Monstergenerator</h2>
        <Badge variant="outline" className="text-sm">
          <Skull className="h-3 w-3 mr-1" />
          KI-gestützt
        </Badge>
      </div>

      {!worldDescription && (
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm text-yellow-200">
            <strong>Tipp:</strong> Lege in den Einstellungen eine Weltenbeschreibung fest, damit die generierten Monster besser zu deiner Kampagne passen.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <AppCard
          title="Monster-Details"
          description="Beschreibe das Monster, das du erzeugen möchtest"
          icon={<Sparkles className="h-5 w-5 text-primary" />}
        >
          <div className="space-y-5">
            {/* Area Select */}
            <div className="space-y-2">
              <Label htmlFor="area">Gebiet / Umgebung</Label>
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

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Schwierigkeitsgrad</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger id="difficulty" className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((level) => (
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

            {/* Monster Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Monster-Idee <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ein Pilzwolf, der nachts Reisende verfolgt und Sporen verbreitet …"
                className="min-h-[100px] bg-secondary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Beschreibe das Konzept, Verhalten oder Thema des Monsters
              </p>
            </div>

            {/* Monster Tags */}
            <div className="space-y-3">
              <Label>Monstertypen (optional)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {monsterTypes.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                    />
                    <label
                      htmlFor={tag}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
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
              disabled={isGenerating || !description.trim() || !selectedArea}
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
                  Monster erzeugen
                </>
              )}
            </Button>
          </div>
        </AppCard>

        {/* Monster Preview */}
        <div className="space-y-4">
          {generatedMonster ? (
            <>
              {/* Monster Header */}
              <AppCard icon={<Skull className="h-5 w-5 text-primary" />}>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold">{generatedMonster.name}</h3>
                    <p className="text-muted-foreground italic">{generatedMonster.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${getDifficultyColor(generatedMonster.difficulty)} text-white`}>
                      {getDifficultyLabel(generatedMonster.difficulty)}
                    </Badge>
                    <Badge variant="outline">
                      {getAreaName(generatedMonster.area)}
                    </Badge>
                    {generatedMonster.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AppCard>

              {/* Appearance */}
              <AppCard title="Aussehen" icon={<Eye className="h-5 w-5 text-primary" />}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {generatedMonster.appearance}
                </p>
              </AppCard>

              {/* Stats */}
              <AppCard title="Kampfwerte">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                    <Heart className="h-4 w-4 mx-auto mb-1 text-destructive" />
                    <p className="text-xs text-muted-foreground">TP</p>
                    <p className="text-xl font-bold text-destructive">{generatedMonster.hp}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                    <Shield className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">RK</p>
                    <p className="text-xl font-bold text-primary">{generatedMonster.ac}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border text-center">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Tempo</p>
                    <p className="text-sm font-medium">{generatedMonster.speed}</p>
                  </div>
                </div>

                {/* Attacks */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Swords className="h-4 w-4" />
                    Angriffe
                  </h4>
                  {generatedMonster.attacks.map((attack, index) => (
                    <div key={index} className="p-2 rounded bg-secondary/50 border border-border">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{attack.name}</span>
                        <span className="text-sm text-muted-foreground">{attack.toHit} Angriff</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{attack.damage}</p>
                      {attack.effect && (
                        <p className="text-xs text-primary mt-1">{attack.effect}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AppCard>

              {/* Abilities */}
              {generatedMonster.abilities.length > 0 && (
                <AppCard title="Besondere Fähigkeiten">
                  <div className="space-y-3">
                    {generatedMonster.abilities.map((ability, index) => (
                      <div key={index}>
                        <h4 className="font-medium text-sm">{ability.name}</h4>
                        <p className="text-sm text-muted-foreground">{ability.description}</p>
                      </div>
                    ))}
                  </div>
                </AppCard>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSaveMonster}
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
                    Im Bestiarium speichern
                  </>
                )}
              </Button>
            </>
          ) : (
            <AppCard className="h-full min-h-[400px]">
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <span className="text-6xl mb-4">🐲</span>
                <h3 className="text-lg font-medium mb-2">Noch kein Monster</h3>
                <p className="text-muted-foreground max-w-xs">
                  Fülle das Formular aus und klicke auf „Monster erzeugen", um eine neue Kreatur per KI zu erstellen
                </p>
              </div>
            </AppCard>
          )}
        </div>
      </div>
    </div>
  )
}
