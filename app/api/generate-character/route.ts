import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

interface GenerateCharacterRequest {
  worldDescription: string
  characterName?: string
  shortDescription: string
  role: string
  powerLevel: string
}

interface GeneratedCharacter {
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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY ist nicht konfiguriert. Bitte füge ihn zu deiner .env.local Datei hinzu.' },
        { status: 500 }
      )
    }

    const body: GenerateCharacterRequest = await request.json()
    const { worldDescription, characterName, shortDescription, role, powerLevel } = body

    if (!worldDescription?.trim()) {
      return NextResponse.json(
        { error: 'Weltenbeschreibung ist erforderlich. Bitte lege sie in den Einstellungen fest.' },
        { status: 400 }
      )
    }

    if (!shortDescription?.trim()) {
      return NextResponse.json(
        { error: 'Charakterbeschreibung ist erforderlich.' },
        { status: 400 }
      )
    }

    // Calculate level range based on power level
    const levelRanges = {
      low: { min: 1, max: 4 },
      medium: { min: 5, max: 10 },
      high: { min: 11, max: 20 }
    }
    const levelRange = levelRanges[powerLevel as keyof typeof levelRanges] || levelRanges.medium

    // Map role to suggested classes (in German)
    const roleClasses: Record<string, string[]> = {
      warrior: ['Kämpfer', 'Barbar', 'Paladin', 'Ritter'],
      mage: ['Magier', 'Hexenmeister', 'Zauberer', 'Elementarist'],
      rogue: ['Schurke', 'Assassine', 'Dieb', 'Schattenläufer'],
      support: ['Kleriker', 'Barde', 'Druide', 'Heiler'],
      ranger: ['Waldläufer', 'Jäger', 'Späher', 'Bogenschütze'],
      cleric: ['Kleriker', 'Priester', 'Paladin', 'Templer']
    }
    const suggestedClasses = roleClasses[role] || ['Abenteurer']

    const promptText = `Du bist ein kreativer Charaktergenerator für Pen-&-Paper-Rollenspiele. Erzeuge einen detaillierten Charakter basierend auf den folgenden Informationen.

WELTENBESCHREIBUNG:
${worldDescription}

CHARAKTERANFRAGE:
${characterName ? `- Gewünschter Name: ${characterName}` : '- Erzeuge einen passenden Namen'}
- Beschreibung: ${shortDescription}
- Rolle/Archetyp: ${role}
- Machtstufe: ${powerLevel} (Stufenbereich: ${levelRange.min}-${levelRange.max})
- Vorgeschlagene Klassen: ${suggestedClasses.join(', ')}

Erzeuge einen Charakter, der natürlich in diese Welt passt. Der Charakter sollte sich im beschriebenen Setting glaubwürdig und fundiert anfühlen.

Du MUSST NUR ein gültiges JSON-Objekt zurückgeben (kein Markdown, keine Codeblöcke, keine Erklärungen) mit genau dieser Struktur:
{
  "name": "Vollständiger Name des Charakters",
  "summary": "Einzeilige Zusammenfassung, wer dieser Charakter ist (max. 100 Zeichen)",
  "stats": {
    "level": <Zahl zwischen ${levelRange.min} und ${levelRange.max}>,
    "class": "<Klasse, die zur Welt und Rolle passt>",
    "race": "<Volk/Spezies, die in dieser Welt existiert>",
    "strength": <8-18>,
    "dexterity": <8-18>,
    "constitution": <8-18>,
    "intelligence": <8-18>,
    "wisdom": <8-18>,
    "charisma": <8-18>
  },
  "appearance": "Eine reichhaltige, detaillierte Beschreibung des physischen Erscheinungsbilds des Charakters. Beschreibe: Größe, Körperbau, Hautton, Haarfarbe und -stil, Augenfarbe, Gesichtszüge, markante Merkmale oder Narben, typische Kleidung und Rüstung, Waffen oder Ausrüstung, und alle einzigartigen visuellen Merkmale, die ihn unvergesslich machen. Schreibe 2-3 detaillierte Absätze auf Deutsch.",
  "backstory": "2-3 Absätze auf Deutsch, die die Geschichte, Motivationen und Persönlichkeit des Charakters beschreiben. Sollte auf Fraktionen, Orte oder Ereignisse der Welt Bezug nehmen, wo es angemessen ist."
}

WICHTIG:
- Alle Texte (summary, appearance, backstory, class, race) müssen auf Deutsch sein
- Die Werte sollten die Rolle des Charakters widerspiegeln (Krieger haben höhere STÄ, Magier höhere INT, usw.)
- Die Summe aller sechs Attributswerte sollte zwischen 70-80 liegen für gute Balance
- Die Hintergrundgeschichte sollte spezifisch auf die Weltenbeschreibung Bezug nehmen
- Das Aussehen sollte lebendig und eindrucksvoll sein, ein klares Bild davon malen, wie der Charakter aussieht`

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

      // Provide specific error messages for common issues
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('invalid')) {
        return NextResponse.json(
          { error: 'Ungültiger API-Schlüssel. Bitte überprüfe, ob dein GEMINI_API_KEY korrekt ist.' },
          { status: 401 }
        )
      }
      if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'API-Kontingent erschöpft. Bitte versuche es später erneut oder überprüfe deine Google AI Studio Nutzung.' },
          { status: 429 }
        )
      }
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return NextResponse.json(
          { error: 'Gemini-Modell nicht gefunden. Die API hat sich möglicherweise geändert.' },
          { status: 404 }
        )
      }
      if (errorMessage.includes('permission') || errorMessage.includes('403')) {
        return NextResponse.json(
          { error: 'API-Schlüssel hat keine Berechtigung für Gemini. Aktiviere die Generative Language API in der Google Cloud Console.' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: `Gemini API Fehler: ${errorMessage}` },
        { status: 500 }
      )
    }

    // Clean the response - remove markdown code blocks if present
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

    let characterData
    try {
      characterData = JSON.parse(cleanedText)
    } catch {
      console.error('Failed to parse Gemini response:', cleanedText)
      return NextResponse.json(
        { error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    // Validate and construct the character
    const character: GeneratedCharacter = {
      id: Date.now().toString(),
      name: characterData.name || characterName || 'Unbekannter Charakter',
      summary: characterData.summary || 'Ein geheimnisvoller Abenteurer',
      stats: {
        level: Math.max(1, Math.min(20, characterData.stats?.level || levelRange.min)),
        class: characterData.stats?.class || suggestedClasses[0],
        race: characterData.stats?.race || 'Mensch',
        strength: clampStat(characterData.stats?.strength),
        dexterity: clampStat(characterData.stats?.dexterity),
        constitution: clampStat(characterData.stats?.constitution),
        intelligence: clampStat(characterData.stats?.intelligence),
        wisdom: clampStat(characterData.stats?.wisdom),
        charisma: clampStat(characterData.stats?.charisma)
      },
      appearance: characterData.appearance || 'Eine Gestalt von durchschnittlicher Statur mit unauffälligen Merkmalen.',
      backstory: characterData.backstory || 'Ein Charakter mit einer geheimnisvollen Vergangenheit.'
    }

    return NextResponse.json({ character })
  } catch (error) {
    console.error('Character generation error:', error)
    return NextResponse.json(
      { error: 'Charaktererzeugung fehlgeschlagen. Bitte überprüfe deinen API-Schlüssel und versuche es erneut.' },
      { status: 500 }
    )
  }
}

function clampStat(value: unknown): number {
  const num = typeof value === 'number' ? value : 10
  return Math.max(3, Math.min(20, num))
}
