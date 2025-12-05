import { loadData, type StoredMonster } from '@/lib/storage'
import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

interface GenerateMonsterRequest {
    area: string
    difficulty: 'easy' | 'medium' | 'hard' | 'deadly'
    description: string
    tags: string[]
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

        const body: GenerateMonsterRequest = await request.json()
        const { area, difficulty, description, tags } = body

        if (!area) {
            return NextResponse.json(
                { error: 'Gebiet ist erforderlich.' },
                { status: 400 }
            )
        }

        if (!description?.trim()) {
            return NextResponse.json(
                { error: 'Monsterbeschreibung ist erforderlich.' },
                { status: 400 }
            )
        }

        // Load world description and area info
        const data = loadData()
        const areaInfo = data.areas.find((a) => a.id === area)
        const areaName = areaInfo?.name || area

        // Calculate stats ranges based on difficulty
        const difficultyLabels: Record<string, string> = {
            easy: 'Leicht',
            medium: 'Mittel',
            hard: 'Schwer',
            deadly: 'Tödlich'
        }

        const difficultyStats = {
            easy: { hpMin: 10, hpMax: 30, acMin: 10, acMax: 13, toHitMin: 2, toHitMax: 4, damageMin: 4, damageMax: 8 },
            medium: { hpMin: 30, hpMax: 60, acMin: 12, acMax: 15, toHitMin: 4, toHitMax: 6, damageMin: 8, damageMax: 15 },
            hard: { hpMin: 60, hpMax: 120, acMin: 14, acMax: 17, toHitMin: 6, toHitMax: 9, damageMin: 15, damageMax: 30 },
            deadly: { hpMin: 100, hpMax: 200, acMin: 16, acMax: 20, toHitMin: 8, toHitMax: 12, damageMin: 25, damageMax: 50 }
        }
        const stats = difficultyStats[difficulty] || difficultyStats.medium

        const promptText = `Du bist ein kreativer Monsterdesigner für ein Tischrollenspiel. Erzeuge ein detailliertes Monster basierend auf den folgenden Informationen.

WELTENBESCHREIBUNG:
${data.worldDescription || 'Eine klassische Fantasywelt mit Magie, Monstern und Abenteuern.'}

GEBIET/TERRAIN:
${areaName}

MONSTERANFRAGE:
- Beschreibung: ${description}
- Schwierigkeitsgrad: ${difficultyLabels[difficulty] || difficulty}
- Vorgeschlagene Typen/Tags: ${tags.length > 0 ? tags.join(', ') : 'Jeder passende Typ'}

WERTE-RICHTLINIEN (passe sie an das Monsterkonzept an):
- TP (Trefferpunkte): ${stats.hpMin}-${stats.hpMax}
- RK (Rüstungsklasse): ${stats.acMin}-${stats.acMax}
- Angriffsbonus: +${stats.toHitMin} bis +${stats.toHitMax}
- Schaden pro Treffer: ${stats.damageMin}-${stats.damageMax}

Erzeuge ein Monster, das natürlich in diese Welt und dieses Gebiet passt. Das Monster sollte sich im beschriebenen Setting glaubwürdig und fundiert anfühlen.

Nutze die Weltenbeschreibung und das Gebiet, damit das Monster thematisch dazu passt.

Du MUSST NUR ein gültiges JSON-Objekt zurückgeben (kein Markdown, keine Codeblöcke, keine Erklärungen) mit genau dieser Struktur:
{
  "name": "Name des Monsters",
  "summary": "Einzeilige, stimmungsvolle Zusammenfassung des Monsters (max. 100 Zeichen, auf Deutsch)",
  "appearance": "Eine detaillierte Beschreibung des physischen Erscheinungsbilds des Monsters in 2-3 Absätzen auf Deutsch. Beschreibe Körperstruktur, Größe, Färbung, Texturen, Kleidung oder natürliche Panzerung, wie es sich bewegt, Geräusche die es macht, markante Gerüche und die allgemeine Stimmung oder das Gefühl, das es hervorruft.",
  "hp": <Zahl>,
  "ac": <Zahl>,
  "speed": "<Bewegungsbeschreibung, z.B. '9 m, Klettern 6 m'>",
  "attacks": [
    {
      "name": "<Angriffsname auf Deutsch>",
      "toHit": "+<Zahl>",
      "damage": "<Würfelausdruck, z.B. '2W6+3 Hiebschaden'>",
      "effect": "<optionaler Spezialeffekt oder Zustand auf Deutsch>"
    }
  ],
  "abilities": [
    {
      "name": "<Fähigkeitsname auf Deutsch>",
      "description": "<was die Fähigkeit bewirkt, auf Deutsch>"
    }
  ],
  "tags": ["<Typ1>", "<Typ2>"]
}

WICHTIG:
- Alle Beschreibungen müssen auf Deutsch sein
- Füge 1-3 Angriffe hinzu, je nach Schwierigkeitsgrad
- Füge 1-4 besondere Fähigkeiten hinzu, je nach Schwierigkeitsgrad
- Das Aussehen sollte lebendig und eindrucksvoll sein
- Tags sollten den Kreaturentyp (Tier, Untoter, usw.) und relevante Schlüsselwörter enthalten
- Mache Angriffe und Fähigkeiten thematisch passend zum Monsterkonzept`

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

        let monsterData
        try {
            monsterData = JSON.parse(cleanedText)
        } catch {
            console.error('Failed to parse Gemini response:', cleanedText)
            return NextResponse.json(
                { error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.' },
                { status: 500 }
            )
        }

        // Validate and construct the monster
        const monster: StoredMonster = {
            id: Date.now().toString(),
            name: monsterData.name || 'Unbekannte Kreatur',
            summary: monsterData.summary || 'Eine geheimnisvolle Kreatur.',
            area,
            difficulty,
            appearance: monsterData.appearance || 'Eine Kreatur von unbestimmter Form.',
            hp: typeof monsterData.hp === 'number' ? monsterData.hp : stats.hpMin,
            ac: typeof monsterData.ac === 'number' ? monsterData.ac : stats.acMin,
            speed: monsterData.speed || '9 m',
            attacks: Array.isArray(monsterData.attacks) ? monsterData.attacks.map((a: Record<string, unknown>) => ({
                name: String(a.name || 'Angriff'),
                toHit: String(a.toHit || '+4'),
                damage: String(a.damage || '1W6 Schaden'),
                effect: a.effect ? String(a.effect) : undefined
            })) : [{ name: 'Angriff', toHit: '+4', damage: '1W6 Schaden' }],
            abilities: Array.isArray(monsterData.abilities) ? monsterData.abilities.map((a: Record<string, unknown>) => ({
                name: String(a.name || 'Fähigkeit'),
                description: String(a.description || 'Eine besondere Fähigkeit.')
            })) : [],
            tags: Array.isArray(monsterData.tags) ? monsterData.tags.map(String) : tags
        }

        return NextResponse.json({ monster })
    } catch (error) {
        console.error('Monster generation error:', error)
        return NextResponse.json(
            { error: 'Monstererzeugung fehlgeschlagen. Bitte versuche es erneut.' },
            { status: 500 }
        )
    }
}
