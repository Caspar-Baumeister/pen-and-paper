'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
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
  MessageCircle,
  Send,
  Volume2,
  Loader2,
  Save,
  User,
  Bot,
  MapPin,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import type { StoredNPC, ChatMessage, NPCVoice } from '@/lib/storage'

interface DisplayMessage extends ChatMessage {
  id: string
  isPlaying?: boolean
}

const DANGER_LABELS: Record<string, string> = {
  'harmlos': 'Harmlos',
  'unterstützend': 'Unterstützend',
  'potenziell gefährlich': 'Potenziell gefährlich',
  'sehr gefährlich': 'Sehr gefährlich'
}

const DANGER_COLORS: Record<string, string> = {
  'harmlos': 'bg-green-600',
  'unterstützend': 'bg-blue-600',
  'potenziell gefährlich': 'bg-yellow-600',
  'sehr gefährlich': 'bg-red-600'
}

export default function NPCChatPage() {
  const params = useParams()
  const npcId = params.id as string

  // NPC data
  const [npc, setNpc] = useState<StoredNPC | null>(null)
  const [areaName, setAreaName] = useState('')
  const [isLoadingNpc, setIsLoadingNpc] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Editable backstory/personality
  const [editablePersonality, setEditablePersonality] = useState('')
  const [isSavingPersonality, setIsSavingPersonality] = useState(false)
  const [personalitySaved, setPersonalitySaved] = useState(false)

  // Voice settings
  const [voice, setVoice] = useState<NPCVoice>('male_epic')

  // Chat state
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)

  // TTS state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [ttsUnavailable, setTtsUnavailable] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load NPC data
  useEffect(() => {
    const loadNPC = async () => {
      try {
        setIsLoadingNpc(true)
        setLoadError(null)

        const response = await fetch(`/api/data/npcs?id=${npcId}`)
        if (!response.ok) {
          throw new Error('NPC nicht gefunden')
        }

        const data = await response.json()
        const loadedNpc = data.npc as StoredNPC

        setNpc(loadedNpc)
        setEditablePersonality(loadedNpc.personality || '')
        setVoice(loadedNpc.voice || 'male_epic')

        // Load existing messages from chat state
        if (loadedNpc.chatState?.recentMessages) {
          setMessages(
            loadedNpc.chatState.recentMessages.map((m, i) => ({
              ...m,
              id: `${m.timestamp}-${i}`
            }))
          )
        }

        // Load area name
        const areaResponse = await fetch('/api/data')
        if (areaResponse.ok) {
          const allData = await areaResponse.json()
          const area = allData.areas?.find((a: { id: string }) => a.id === loadedNpc.area)
          setAreaName(area?.name || loadedNpc.area)
        }
      } catch (error) {
        console.error('Failed to load NPC:', error)
        setLoadError('NPC konnte nicht geladen werden.')
      } finally {
        setIsLoadingNpc(false)
      }
    }

    if (npcId) {
      loadNPC()
    }
  }, [npcId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save personality
  const handleSavePersonality = async () => {
    if (!npc) return

    setIsSavingPersonality(true)
    setPersonalitySaved(false)

    try {
      const response = await fetch('/api/data/npcs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: npc.id,
          personality: editablePersonality
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      setNpc({ ...npc, personality: editablePersonality })
      setPersonalitySaved(true)
      setTimeout(() => setPersonalitySaved(false), 2000)
    } catch (error) {
      console.error('Failed to save personality:', error)
      alert('Speichern fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setIsSavingPersonality(false)
    }
  }

  // Save voice preference
  const handleVoiceChange = async (newVoice: NPCVoice) => {
    setVoice(newVoice)

    if (npc) {
      try {
        await fetch('/api/data/npcs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: npc.id,
            voice: newVoice
          })
        })
      } catch (error) {
        console.error('Failed to save voice:', error)
      }
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !npc || isSending) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsSending(true)
    setChatError(null)

    // Add user message immediately
    const userDisplayMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, userDisplayMessage])

    try {
      const response = await fetch('/api/npc-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: npc.id,
          message: userMessage
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Chat-Fehler')
      }

      // Add NPC response
      const npcDisplayMessage: DisplayMessage = {
        id: `npc-${Date.now()}`,
        role: 'npc',
        content: data.response,
        timestamp: Date.now()
      }
      setMessages((prev) => [...prev, npcDisplayMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setChatError(error instanceof Error ? error.message : 'Nachricht konnte nicht gesendet werden.')
    } finally {
      setIsSending(false)
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Text-to-speech
  const handlePlayTTS = async (message: DisplayMessage) => {
    if (ttsUnavailable) return

    if (playingMessageId === message.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlayingMessageId(null)
      return
    }

    setPlayingMessageId(message.id)
    setTtsError(null)

    try {
      const response = await fetch('/api/npc-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message.content,
          voice
        })
      })

      // Check if response is JSON (error) or binary (audio)
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        const data = await response.json()
        if (data.unavailable) {
          setTtsUnavailable(true)
        }
        throw new Error(data.error || 'TTS-Fehler')
      }

      if (!response.ok) {
        throw new Error('TTS-Fehler')
      }

      // Get audio as blob and create URL
      const audioBlob = await response.blob()

      // Verify we got audio data
      if (audioBlob.size === 0) {
        throw new Error('Keine Audiodaten erhalten.')
      }

      const audioUrl = URL.createObjectURL(audioBlob)

      // Play audio
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setPlayingMessageId(null)
        audioRef.current = null
        URL.revokeObjectURL(audioUrl)
      }

      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        setPlayingMessageId(null)
        audioRef.current = null
        URL.revokeObjectURL(audioUrl)
        setTtsError('Audio konnte nicht abgespielt werden. Das Format wird möglicherweise nicht unterstützt.')
        setTtsUnavailable(true)
      }

      await audio.play()
    } catch (error) {
      console.error('TTS error:', error)
      setTtsError(error instanceof Error ? error.message : 'Sprachausgabe fehlgeschlagen.')
      setPlayingMessageId(null)
    }
  }

  if (isLoadingNpc) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loadError || !npc) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">{loadError || 'NPC nicht gefunden'}</p>
        <Link href="/bestiary">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Bestiarium
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/bestiary">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Gespräch mit {npc.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {npc.role} • {areaName}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          <MessageCircle className="h-3 w-3 mr-1" />
          NPC-Chat
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - NPC Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* NPC Info Card */}
          <AppCard title="NPC-Informationen" icon={<User className="h-5 w-5 text-primary" />}>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-lg">{npc.name}</p>
                <p className="text-sm text-muted-foreground italic">{npc.summary}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{npc.role}</Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {areaName}
                </Badge>
                <Badge className={`${DANGER_COLORS[npc.dangerLevel] || 'bg-gray-600'} text-white`}>
                  {DANGER_LABELS[npc.dangerLevel] || npc.dangerLevel}
                </Badge>
              </div>
            </div>
          </AppCard>

          {/* Personality Editor */}
          <AppCard
            title="Hintergrund / Persönlichkeit des NPC"
            description="Bearbeite die Persönlichkeit, um das Verhalten im Chat zu beeinflussen"
          >
            <div className="space-y-3">
              <Textarea
                value={editablePersonality}
                onChange={(e) => setEditablePersonality(e.target.value)}
                placeholder="Beschreibe die Persönlichkeit, Verhaltensweisen und Eigenheiten des NPCs …"
                className="min-h-[150px] bg-secondary resize-none"
              />
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleSavePersonality}
                  disabled={isSavingPersonality}
                  size="sm"
                >
                  {isSavingPersonality ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Speichern …
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Speichern
                    </>
                  )}
                </Button>
                {personalitySaved && (
                  <span className="text-sm text-green-500">✓ Gespeichert</span>
                )}
              </div>
            </div>
          </AppCard>

          {/* Voice Settings */}
          <AppCard title="Stimme für Vorlesen" icon={<Volume2 className="h-5 w-5 text-primary" />}>
            {ttsUnavailable ? (
              <div className="text-sm text-muted-foreground">
                <p className="text-yellow-500 mb-2">⚠️ Sprachausgabe nicht verfügbar</p>
                <p>Das TTS-Modell wird von deinem API-Schlüssel derzeit nicht unterstützt.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="voice">NPC-Stimme</Label>
                <Select value={voice} onValueChange={(v) => handleVoiceChange(v as NPCVoice)}>
                  <SelectTrigger id="voice" className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male_epic">
                      <span className="flex items-center gap-2">
                        <span>🎭</span>
                        <span>Männlich episch</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="female_epic">
                      <span className="flex items-center gap-2">
                        <span>🎭</span>
                        <span>Weiblich episch</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Diese Stimme wird für die Sprachausgabe der NPC-Nachrichten verwendet.
                </p>
              </div>
            )}
          </AppCard>
        </div>

        {/* Right Panel - Chat */}
        <div className="lg:col-span-2">
          <AppCard
            title="Chat"
            icon={<MessageCircle className="h-5 w-5 text-primary" />}
            contentClassName="p-0"
            className="h-[600px] flex flex-col"
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Beginne ein Gespräch mit {npc.name}
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Schreibe eine Nachricht und drücke Enter oder klicke auf Senden.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary border border-border'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'npc' && (
                          <Bot className="h-4 w-4 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">
                            {message.role === 'user' ? 'Du' : npc.name}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <User className="h-4 w-4 mt-0.5 shrink-0" />
                        )}
                      </div>

                      {/* TTS button for NPC messages */}
                      {message.role === 'npc' && !ttsUnavailable && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlayTTS(message)}
                            disabled={playingMessageId !== null && playingMessageId !== message.id}
                            className="h-7 text-xs"
                          >
                            {playingMessageId === message.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Spielt …
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3 w-3 mr-1" />
                                Vorlesen
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {(chatError || ttsError) && (
              <div className="px-4 pb-2">
                <div className="p-2 rounded bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  {chatError || ttsError}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Schreibe eine Nachricht …"
                  className="flex-1 bg-secondary"
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !inputMessage.trim()}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </div>
  )
}

