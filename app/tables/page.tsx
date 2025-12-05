'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type StoredTable, type StoredTableRow } from '@/lib/store/useAppStore'
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
import { Dices, Plus, Trash2, Play, List, Sparkles, Loader2, Save, AlertCircle } from 'lucide-react'

export default function TablesPage() {
  const { tables, areas, saveTable, updateTableOnServer, removeTable, isLoading } = useAppStore()
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [rollResult, setRollResult] = useState<{ roll: number; title: string; description: string } | null>(null)

  // Form state for new/editing table
  const [isCreating, setIsCreating] = useState(false)
  const [tableName, setTableName] = useState('')
  const [tableArea, setTableArea] = useState<string>('')
  const [tableDescription, setTableDescription] = useState('')
  const [tableRows, setTableRows] = useState<StoredTableRow[]>([])

  // AI generation state
  const [isGeneratingRows, setIsGeneratingRows] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Saving state
  const [isSaving, setIsSaving] = useState(false)

  const selectedTable = tables.find((t) => t.id === selectedTableId)

  // Load table data when selection changes
  useEffect(() => {
    if (selectedTable) {
      setTableName(selectedTable.name)
      setTableArea(selectedTable.area || '')
      setTableDescription(selectedTable.description)
      setTableRows(selectedTable.rows.map((row) => ({ ...row })))
      setIsCreating(false)
    }
    setRollResult(null)
  }, [selectedTableId, selectedTable])

  const handleCreateNew = () => {
    setSelectedTableId(null)
    setIsCreating(true)
    setTableName('')
    setTableArea('')
    setTableDescription('')
    setTableRows([])
    setRollResult(null)
  }

  const handleGenerateRows = async () => {
    if (!tableDescription.trim()) {
      setGenerationError('Bitte gib zuerst eine Tabellenbeschreibung ein.')
      return
    }

    setIsGeneratingRows(true)
    setGenerationError(null)

    try {
      const response = await fetch('/api/generate-table-rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: tableArea || undefined,
          description: tableDescription.trim()
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Zeilenerzeugung fehlgeschlagen')
      }

      setTableRows(data.rows)
    } catch (err) {
      console.error('Failed to generate table rows:', err)
      setGenerationError(err instanceof Error ? err.message : 'Zeilenerzeugung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsGeneratingRows(false)
    }
  }

  const handleSaveTable = async () => {
    if (!tableName.trim()) {
      alert('Bitte gib einen Tabellennamen ein.')
      return
    }

    if (tableRows.length === 0) {
      alert('Bitte füge mindestens eine Zeile zur Tabelle hinzu.')
      return
    }

    setIsSaving(true)

    try {
      const tableData: StoredTable = {
        id: selectedTableId || Date.now().toString(),
        name: tableName.trim(),
        area: tableArea || undefined,
        description: tableDescription.trim(),
        rows: tableRows
      }

      if (selectedTableId) {
        await updateTableOnServer(selectedTableId, tableData)
      } else {
        await saveTable(tableData)
        setSelectedTableId(tableData.id)
      }

      setIsCreating(false)
      alert('Tabelle gespeichert!')
    } catch (err) {
      console.error('Failed to save table:', err)
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTable = async (id: string) => {
    if (confirm('Möchtest du diese Tabelle wirklich löschen?')) {
      await removeTable(id)
      if (selectedTableId === id) {
        setSelectedTableId(null)
        setIsCreating(false)
      }
    }
  }

  const handleAddRow = () => {
    const maxEnd = Math.max(...tableRows.map((r) => r.end), 0)
    const newRow: StoredTableRow = {
      id: Date.now().toString(),
      start: maxEnd + 1,
      end: Math.min(maxEnd + 2, 20),
      title: 'Neues Ergebnis',
      description: 'Beschreibe, was passiert …'
    }
    setTableRows([...tableRows, newRow])
  }

  const handleDeleteRow = (rowId: string) => {
    setTableRows(tableRows.filter((r) => r.id !== rowId))
  }

  const handleRowChange = (rowId: string, field: keyof StoredTableRow, value: string | number) => {
    setTableRows(tableRows.map((r) =>
      r.id === rowId ? { ...r, [field]: value } : r
    ))
  }

  const handleRoll = () => {
    if (tableRows.length === 0) return

    const roll = Math.floor(Math.random() * 20) + 1
    const matchingRow = tableRows.find(
      (row) => roll >= row.start && roll <= row.end
    )

    setRollResult({
      roll,
      title: matchingRow?.title || 'Kein passendes Ergebnis',
      description: matchingRow?.description || ''
    })
  }

  const getAreaInfo = (areaId: string) => areas.find((a) => a.id === areaId)

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
        <h2 className="text-2xl font-semibold text-foreground">Eigene W20-Tabellen</h2>
        <Button onClick={handleCreateNew} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neue Tabelle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div className="lg:col-span-1">
          <AppCard
            title="Deine Tabellen"
            icon={<List className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-2">
              {tables.length > 0 ? (
                tables.map((table) => {
                  const areaInfo = table.area ? getAreaInfo(table.area) : null
                  const isSelected = selectedTableId === table.id
                  return (
                    <div
                      key={table.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'bg-secondary/50 border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedTableId(table.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{table.name}</p>
                          {areaInfo && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm">{areaInfo.icon}</span>
                              <span className="text-sm text-muted-foreground">
                                {areaInfo.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTable(table.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {table.rows.length} Einträge
                      </Badge>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Dices className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Noch keine Tabellen</p>
                  <p className="text-xs">Erstelle eine, um loszulegen</p>
                </div>
              )}
            </div>
          </AppCard>
        </div>

        {/* Table Editor */}
        <div className="lg:col-span-2">
          {(selectedTableId || isCreating) ? (
            <AppCard
              title={isCreating ? 'Neue Tabelle erstellen' : 'Tabelle bearbeiten'}
              icon={<Dices className="h-5 w-5 text-primary" />}
            >
              <div className="space-y-5">
                {/* Table Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tableName">Tabellenname</Label>
                    <Input
                      id="tableName"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="z. B. Waldsuche"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tableArea">Gebiet (optional)</Label>
                    <Select
                      value={tableArea || '_none'}
                      onValueChange={(v) => setTableArea(v === '_none' ? '' : v)}
                    >
                      <SelectTrigger id="tableArea" className="bg-secondary">
                        <SelectValue placeholder="Gebiet wählen …" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Kein bestimmtes Gebiet</SelectItem>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableDesc">Beschreibung / Zweck</Label>
                  <Textarea
                    id="tableDesc"
                    value={tableDescription}
                    onChange={(e) => setTableDescription(e.target.value)}
                    placeholder="Wofür ist diese Tabelle? z. B. ‚Suche nach Kräutern in einem verwunschenen Wald'"
                    className="bg-secondary resize-none"
                    rows={2}
                  />
                </div>

                {/* AI Generation */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="secondary"
                    onClick={handleGenerateRows}
                    disabled={isGeneratingRows || !tableDescription.trim()}
                    className="flex-1"
                  >
                    {isGeneratingRows ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird erzeugt …
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Zeilen mit KI erzeugen
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleAddRow} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    Zeile manuell hinzufügen
                  </Button>
                </div>

                {generationError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-sm text-destructive">{generationError}</p>
                  </div>
                )}

                {/* Table Rows */}
                <div className="space-y-3">
                  <Label>Würfelergebnisse</Label>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                    {tableRows.map((row) => (
                      <div
                        key={row.id}
                        className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={row.start}
                            onChange={(e) => handleRowChange(row.id, 'start', Number(e.target.value))}
                            className="w-16 bg-secondary text-center"
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={row.end}
                            onChange={(e) => handleRowChange(row.id, 'end', Number(e.target.value))}
                            className="w-16 bg-secondary text-center"
                          />
                          <Input
                            value={row.title}
                            onChange={(e) => handleRowChange(row.id, 'title', e.target.value)}
                            className="flex-1 bg-secondary font-medium"
                            placeholder="Titel …"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={row.description}
                          onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                          className="bg-secondary resize-none text-sm"
                          rows={2}
                          placeholder="Beschreibe, was passiert …"
                        />
                      </div>
                    ))}
                    {tableRows.length === 0 && (
                      <p className="text-center text-muted-foreground py-4 text-sm">
                        Noch keine Zeilen. Erzeuge welche mit der KI oder füge sie manuell hinzu.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSaveTable}
                    disabled={isSaving || !tableName.trim()}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Wird gespeichert …
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Tabelle speichern
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRoll}
                    variant="secondary"
                    disabled={tableRows.length === 0}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    W20 würfeln
                  </Button>
                </div>

                {/* Roll Result */}
                {rollResult && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl font-bold text-primary">
                        🎲 {rollResult.roll}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{rollResult.title}</p>
                        <p className="text-sm text-muted-foreground">{rollResult.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AppCard>
          ) : (
            <AppCard>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Dices className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Wähle eine Tabelle aus der Liste oder erstelle eine neue
                </p>
              </div>
            </AppCard>
          )}
        </div>
      </div>
    </div>
  )
}
