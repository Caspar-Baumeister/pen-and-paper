import { loadData, updateNPC, type StoredNPC, type ChatMessage, type NPCChatState } from '@/lib/storage'
import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

interface NPCChatRequest {
  npcId: string
  message: string
}

const MAX_RECENT_MESSAGES = 20
const SUMMARIZE_THRESHOLD = 30

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY ist nicht konfiguriert.' },
        { status: 500 }
      )
    }

    const body: NPCChatRequest = await request.json()
    const { npcId, message } = body

    if (!npcId) {
      return NextResponse.json(
        { error: 'NPC-ID ist erforderlich.' },
        { status: 400 }
      )
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Nachricht ist erforderlich.' },
        { status: 400 }
      )
    }

    // Load data
    const data = loadData()
    const npc = data.npcs.find((n) => n.id === npcId)

    if (!npc) {
      return NextResponse.json(
        { error: 'NPC nicht gefunden.' },
        { status: 404 }
      )
    }

    const areaInfo = data.areas.find((a) => a.id === npc.area)
    const areaName = areaInfo?.name || npc.area

    // Initialize chat state if not present
    const chatState: NPCChatState = npc.chatState || {
      memorySummary: '',
      recentMessages: []
    }

    // Build the persona prompt
    const personaPrompt = buildPersonaPrompt(npc, areaName, data.worldDescription, chatState.memorySummary)

    // Build recent messages for context
    const recentContext = chatState.recentMessages
      .map((m) => m.role === 'user' ? `Spieler: ${m.content}` : `${npc.name}: ${m.content}`)
      .join('\n')

    // Full prompt
    const fullPrompt = `${personaPrompt}

${chatState.memorySummary ? `ERINNERUNGSZUSAMMENFASSUNG (was bisher geschah):\n${chatState.memorySummary}\n` : ''}
${recentContext ? `LETZTE NACHRICHTEN:\n${recentContext}\n` : ''}
Spieler: ${message}

${npc.name}:`

    let npcResponse: string
    try {
      const ai = new GoogleGenAI({ apiKey })

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }]
          }
        ]
      })

      npcResponse = response.text || ''

      if (!npcResponse) {
        return NextResponse.json(
          { error: 'Leere Antwort von der KI. Bitte versuche es erneut.' },
          { status: 500 }
        )
      }

      // Clean up the response (remove any leading "NPC Name:" if present)
      npcResponse = npcResponse.trim()
      if (npcResponse.startsWith(`${npc.name}:`)) {
        npcResponse = npcResponse.slice(npc.name.length + 1).trim()
      }
    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      return NextResponse.json(
        { error: 'KI-Fehler. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }

    // Add new messages to chat state
    const now = Date.now()
    const newUserMessage: ChatMessage = { role: 'user', content: message.trim(), timestamp: now }
    const newNpcMessage: ChatMessage = { role: 'npc', content: npcResponse, timestamp: now + 1 }

    chatState.recentMessages.push(newUserMessage, newNpcMessage)

    // Check if we need to summarize older messages
    if (chatState.recentMessages.length > SUMMARIZE_THRESHOLD) {
      try {
        const updatedChatState = await summarizeOlderMessages(apiKey, npc, chatState)
        await updateNPC(npcId, { chatState: updatedChatState })
      } catch (summarizeError) {
        console.error('Failed to summarize messages:', summarizeError)
        // Still save the messages even if summarization fails
        // Just trim to max
        chatState.recentMessages = chatState.recentMessages.slice(-MAX_RECENT_MESSAGES)
        await updateNPC(npcId, { chatState })
      }
    } else {
      // Save updated chat state
      await updateNPC(npcId, { chatState })
    }

    return NextResponse.json({
      response: npcResponse,
      npcName: npc.name
    })
  } catch (error) {
    console.error('NPC chat error:', error)
    return NextResponse.json(
      { error: 'Chat-Fehler. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}

function buildPersonaPrompt(
  npc: StoredNPC,
  areaName: string,
  worldDescription: string,
  memorySummary: string
): string {
  return `Du bist ${npc.name}, ein NPC (Nichtspielercharakter) in einem Pen-&-Paper-Fantasy-Rollenspiel.

WELTENBESCHREIBUNG:
${worldDescription || 'Eine klassische Fantasywelt mit Magie, Monstern und Abenteuern.'}

DEIN AUFENTHALTSORT:
${areaName}

DEINE ROLLE / BERUF:
${npc.role}

DEINE PERSÖNLICHKEIT:
${npc.personality}

DEIN AUSSEHEN:
${npc.appearance}

DEINE ZIELE UND MOTIVATIONEN:
${npc.motivations}

DEINE GEFÄHRLICHKEIT:
${npc.dangerLevel}
${npc.combatNotes ? `Kampfnotizen: ${npc.combatNotes}` : ''}

WICHTIGE ANWEISUNGEN:
- Antworte IMMER auf Deutsch.
- Bleib konsequent in der Rolle dieses NPCs.
- Sprich als ${npc.name}, nicht als Erzähler.
- Nutze die Erinnerungszusammenfassung, um dich an frühere Ereignisse zu erinnern.
- Sei konsistent mit deiner Persönlichkeit und deinen Zielen.
- Halte deine Antworten natürlich und passend zur Spielsituation.
- Antworte in 1-3 Sätzen, außer die Situation erfordert eine längere Erklärung.`
}

async function summarizeOlderMessages(
  apiKey: string,
  npc: StoredNPC,
  chatState: NPCChatState
): Promise<NPCChatState> {
  // Take older messages to summarize (keep the last MAX_RECENT_MESSAGES)
  const messagesToKeep = chatState.recentMessages.slice(-MAX_RECENT_MESSAGES)
  const messagesToSummarize = chatState.recentMessages.slice(0, -MAX_RECENT_MESSAGES)

  if (messagesToSummarize.length === 0) {
    return chatState
  }

  // Build conversation text to summarize
  const conversationText = messagesToSummarize
    .map((m) => m.role === 'user' ? `Spieler: ${m.content}` : `${npc.name}: ${m.content}`)
    .join('\n')

  const summarizePrompt = `Du bist ein Assistent, der Gespräche zusammenfasst.

Fasse das folgende Gespräch zwischen dem Spieler und dem NPC "${npc.name}" auf Deutsch zusammen.
Fokussiere dich auf:
- Was der NPC über den Spieler gelernt hat
- Laufende Quests, Versprechen, Geheimnisse oder Konflikte
- Wichtige Fakten, die für zukünftige Gespräche relevant sind

${chatState.memorySummary ? `BISHERIGE ERINNERUNGEN:\n${chatState.memorySummary}\n` : ''}

NEUE NACHRICHTEN ZUM ZUSAMMENFASSEN:
${conversationText}

Gib NUR die aktualisierte Zusammenfassung zurück (2-4 Sätze auf Deutsch), keine Erklärungen:`

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: summarizePrompt }]
      }
    ]
  })

  const newSummary = response.text?.trim() || chatState.memorySummary

  return {
    memorySummary: newSummary,
    recentMessages: messagesToKeep
  }
}

