import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'
import type { NPCVoice } from '@/lib/storage'

interface TTSRequest {
  text: string
  voice: NPCVoice
}

// Voice configurations for TTS
const VOICE_CONFIG: Record<NPCVoice, { voiceName: string }> = {
  male_epic: {
    voiceName: 'Charon' // Deep male voice
  },
  female_epic: {
    voiceName: 'Kore' // Confident female voice
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY ist nicht konfiguriert.' },
        { status: 500 }
      )
    }

    const body: TTSRequest = await request.json()
    const { text, voice } = body

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text ist erforderlich.' },
        { status: 400 }
      )
    }

    const voicePreference = voice || 'male_epic'
    const config = VOICE_CONFIG[voicePreference]

    try {
      const ai = new GoogleGenAI({ apiKey })

      // Use Gemini's TTS capabilities with the correct model
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        config: {
          responseModalities: ['audio'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: config.voiceName
              }
            }
          }
        }
      })

      // Extract audio data from response
      const candidate = response.candidates?.[0]
      if (!candidate?.content?.parts) {
        throw new Error('No audio data in response')
      }

      // Find the audio part
      const audioPart = candidate.content.parts.find(
        (part) => part.inlineData?.mimeType?.startsWith('audio/')
      )

      if (!audioPart?.inlineData?.data) {
        throw new Error('No audio part found in response')
      }

      const { mimeType, data } = audioPart.inlineData

      // Return the audio as a binary response instead of base64 data URL
      // This is more reliable for browser playback
      const audioBuffer = Buffer.from(data, 'base64')

      return new Response(audioBuffer, {
        headers: {
          'Content-Type': mimeType || 'audio/mp3',
          'Content-Length': audioBuffer.length.toString()
        }
      })
    } catch (ttsError) {
      console.error('TTS API error:', ttsError)

      const errorMessage = ttsError instanceof Error ? ttsError.message : String(ttsError)

      // Check for specific error types
      if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          { error: 'TTS-Kontingent erschöpft. Bitte versuche es später erneut.' },
          { status: 429 }
        )
      }

      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('404') ||
        errorMessage.includes('not supported') ||
        errorMessage.includes('INVALID_ARGUMENT')
      ) {
        // TTS model not available - provide fallback message
        return NextResponse.json(
          {
            error: 'Sprachausgabe ist derzeit nicht verfügbar. Das TTS-Modell wird von deinem API-Schlüssel möglicherweise nicht unterstützt.',
            unavailable: true
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: 'Sprachausgabe fehlgeschlagen. Bitte versuche es erneut.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { error: 'Sprachausgabe fehlgeschlagen. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
