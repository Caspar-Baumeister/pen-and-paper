import { loadData, type StoredNPC } from '@/lib/storage'
import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

interface GenerateNPCRequest {
  area: string
  role: string
  archetype?: string
  dangerLevel?: 'harmlos' | 'unterstützend' | 'potenziell gefährlich' | 'sehr gefährlich'
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

    const body: GenerateNPCRequest = await request.json()
    const { area, role, archetype, dangerLevel, description } = body

    if (!area) {
      return NextResponse.json(
        { error: 'Gebiet ist erforderlich.' },
        { status: 400 }
      )
    }

    if (!role?.trim()) {
      return NextResponse.json(
        { error: 'Rolle/Beruf ist erforderlich.' },
        { status: 400 }
      )
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'NPC-Beschreibung ist erforderlich.' },
        { status: 400 }
      )
    }

    // Load world description and area info
    const data = loadData()
    const areaInfo = data.areas.find((a) => a.id === area)
    const areaName = areaInfo?.name || area

    const dangerLevelText = dangerLevel || 'harmlos'
    const archetypeText = archetype ? `Archetyp: ${archetype}` : ''

    const promptText = `Du bist ein kreativer Spielleiter für ein Pen-&-Paper-Fantasy-Rollenspiel. Erzeuge einen detaillierten Nichtspielercharakter (NSC/NPC) basierend auf den folgenden Informationen.

WELTENBESCHREIBUNG:
${data.worldDescription || 'Eine klassische Fantasywelt mit Magie, Monstern und Abenteuern.'}

GEBIET/AUFENTHALTSORT:
${areaName}

NPC-ANFRAGE:
- Rolle/Beruf: ${role}
${archetypeText ? `- ${archetypeText}` : ''}
- Gefährlichkeitsgrad: ${dangerLevelText}
- Kurze Idee vom Spielleiter: ${description}

Erzeuge einen NPC, der natürlich in diese Welt und dieses Gebiet passt. Der NPC sollte sich im beschriebenen Setting glaubwürdig und fundiert anfühlen und am Spieltisch nützlich sein.

Du MUSST NUR ein gültiges JSON-Objekt zurückgeben (kein Markdown, keine Codeblöcke, keine Erklärungen) mit genau dieser Struktur:
{
  "name": "Vollständiger Name des NPCs",
  "role": "${role}",
  "summary": "Kurze Zusammenfassung in 1-2 Sätzen, wer dieser NPC ist und was ihn auszeichnet",
  "appearance": "Detaillierte Beschreibung des Aussehens: Körperbau, Kleidung, Haltung, Stimme, auffällige Merkmale. 2-3 Sätze auf Deutsch.",
  "personality": "Persönlichkeit, typische Verhaltensweisen, wie der NPC auf Fremde reagiert, Eigenheiten. 2-3 Sätze auf Deutsch.",
  "motivations": "Was treibt diesen NPC an? Was will er erreichen, beschützen oder vermeiden? Ängste und Ziele. 2-3 Sätze auf Deutsch.",
  "hooks": [
    "Erster Aufhänger/Plotidee für den Spielleiter",
    "Zweiter Aufhänger/Plotidee",
    "Dritter Aufhänger/Plotidee"
  ],
  "dangerLevel": "${dangerLevelText}",
  "combatNotes": "Kurze Kampfbeschreibung: Wie gefährlich ist der NPC? Waffen, Kampfstil, oder ob er überhaupt kämpft. 1-2 Sätze auf Deutsch."
}

WICHTIG:
- Alle Texte müssen auf Deutsch sein
- Der Name sollte zur Welt und zum Gebiet passen
- Die Aufhänger (hooks) sollten 2-4 konkrete Ideen sein, wie der Spielleiter den NPC in eine Geschichte einbinden kann
- Die Persönlichkeit sollte spielbar und interessant sein
- Die Kampfnotizen sollten zum Gefährlichkeitsgrad passen:
  - "harmlos": Kämpft nicht, flieht oder versteckt sich
  - "unterstützend": Kann helfen, aber kein Kämpfer
  - "potenziell gefährlich": Kann sich verteidigen, mittelmäßiger Kämpfer
  - "sehr gefährlich": Erfahrener Kämpfer, echte Bedrohung`

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

    let npcData
    try {
      npcData = JSON.parse(cleanedText)
    } catch {
      console.error('Failed to parse Gemini response:', cleanedText)
      return NextResponse.json(
        { error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    // Validate and construct the NPC
    const npc: StoredNPC = {
      id: Date.now().toString(),
      name: npcData.name || 'Unbekannter NPC',
      area,
      role: npcData.role || role,
      summary: npcData.summary || 'Ein geheimnisvoller Charakter.',
      appearance: npcData.appearance || 'Eine unauffällige Person.',
      personality: npcData.personality || 'Zurückhaltend und vorsichtig.',
      motivations: npcData.motivations || 'Überleben und ein ruhiges Leben führen.',
      hooks: Array.isArray(npcData.hooks) ? npcData.hooks.map(String) : ['Könnte Informationen haben.'],
      dangerLevel: npcData.dangerLevel || dangerLevel || 'harmlos',
      combatNotes: npcData.combatNotes || 'Kämpft nicht.'
    }

    return NextResponse.json({ npc })
  } catch (error) {
    console.error('NPC generation error:', error)
    return NextResponse.json(
      { error: 'NPC-Erzeugung fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}

