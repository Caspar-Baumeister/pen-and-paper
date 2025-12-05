import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { loadData, type StoredTableRow } from '@/lib/storage'

interface GenerateTableRowsRequest {
  area?: string
  description: string
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY ist nicht konfiguriert. Bitte füge ihn zu deiner .env.local Datei hinzu.' },
        { status: 500 }
      )
    }

    const body: GenerateTableRowsRequest = await request.json()
    const { area, description } = body

    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Tabellenbeschreibung ist erforderlich.' },
        { status: 400 }
      )
    }

    // Load world description and area info
    const data = loadData()
    const areaInfo = area ? data.areas.find((a) => a.id === area) : null
    const areaName = areaInfo?.name || area || 'allgemein'

    const promptText = `Du bist ein kreativer Spielleiter für ein Tischrollenspiel. Erzeuge eine W20-Zufallstabelle basierend auf den folgenden Informationen.

WELTENBESCHREIBUNG:
${data.worldDescription || 'Eine klassische Fantasywelt mit Magie, Monstern und Abenteuern.'}

${area ? `GEBIET/TERRAIN: ${areaName}` : ''}

TABELLENZWECK:
${description}

Dies ist eine Ereignistabelle / Zufallstabelle für einen W20-Wurf.

Erzeuge genau 10 Ergebnisse für eine W20-Tabelle, die den gesamten Bereich mit diesen zusammenhängenden Bereichen abdeckt:
1-2, 3-4, 5-6, 7-8, 9-10, 11-12, 13-14, 15-16, 17-18, 19-20

Die Ergebnisse sollten von schlecht/negativ (niedrige Würfe) zu gut/positiv (hohe Würfe) fortschreiten, mit einigen neutralen oder gemischten Ergebnissen in der Mitte.

Du MUSST NUR ein gültiges JSON-Array zurückgeben (kein Markdown, keine Codeblöcke, keine Erklärungen) mit genau 10 Einträgen in dieser Struktur:
[
  {
    "start": 1,
    "end": 2,
    "title": "Kurzer Titel für dieses Ergebnis auf Deutsch",
    "description": "1-3 Sätze auf Deutsch, die beschreiben, was mechanisch oder erzählerisch passiert."
  },
  {
    "start": 3,
    "end": 4,
    "title": "...",
    "description": "..."
  }
]

WICHTIG:
- Alle Titel und Beschreibungen müssen auf Deutsch sein
- Erzeuge genau 10 Einträge
- Verwende die exakten Bereiche: 1-2, 3-4, 5-6, 7-8, 9-10, 11-12, 13-14, 15-16, 17-18, 19-20
- Mache die Ergebnisse thematisch passend zum Tabellenzweck und Gebiet
- Niedrige Würfe (1-6) sollten generell negativ oder gefährlich sein
- Mittlere Würfe (7-14) sollten neutral oder gemischt sein
- Hohe Würfe (15-20) sollten positiv oder vorteilhaft sein
- 19-20 sollte außergewöhnlich gut sein`

    let text: string
    try {
      const ai = new GoogleGenAI({ apiKey })

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: promptText }]
          }
        ]
      })

      text = response.text || ''

      if (!text) {
        return NextResponse.json(
          { error: 'Leere Antwort von der KI. Bitte versuche es erneut.' },
          { status: 500 }
        )
      }
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      const errorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError)

      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
        return NextResponse.json(
          { error: 'Ungültiger API-Schlüssel. Bitte überprüfe deinen GEMINI_API_KEY.' },
          { status: 401 }
        )
      }
      if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'API-Kontingent erschöpft. Bitte versuche es später erneut.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Gemini API Fehler: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Clean the response
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7)
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    let rowsData
    try {
      rowsData = JSON.parse(cleanedText)
    } catch {
      console.error('Failed to parse Gemini response:', cleanedText)
      return NextResponse.json(
        { error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    // Validate and construct the rows
    if (!Array.isArray(rowsData)) {
      return NextResponse.json(
        { error: 'Ungültiges Antwortformat. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    const rows: StoredTableRow[] = rowsData.map((row: Record<string, unknown>, index: number) => ({
      id: `${Date.now()}-${index}`,
      start: typeof row.start === 'number' ? row.start : (index * 2) + 1,
      end: typeof row.end === 'number' ? row.end : (index * 2) + 2,
      title: String(row.title || `Ergebnis ${index + 1}`),
      description: String(row.description || 'Etwas passiert.')
    }))

    // Ensure we have exactly 10 rows with correct ranges
    const expectedRanges = [
      { start: 1, end: 2 },
      { start: 3, end: 4 },
      { start: 5, end: 6 },
      { start: 7, end: 8 },
      { start: 9, end: 10 },
      { start: 11, end: 12 },
      { start: 13, end: 14 },
      { start: 15, end: 16 },
      { start: 17, end: 18 },
      { start: 19, end: 20 }
    ]

    const normalizedRows: StoredTableRow[] = expectedRanges.map((range, index) => {
      const existingRow = rows[index]
      return {
        id: existingRow?.id || `${Date.now()}-${index}`,
        start: range.start,
        end: range.end,
        title: existingRow?.title || `Ergebnis ${index + 1}`,
        description: existingRow?.description || 'Etwas passiert.'
      }
    })

    return NextResponse.json({ rows: normalizedRows })
  } catch (error) {
    console.error('Table generation error:', error)
    return NextResponse.json(
      { error: 'Tabellenerzeugung fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
