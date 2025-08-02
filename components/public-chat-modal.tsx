"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Mic, MicOff, Play, Pause, Globe } from "lucide-react"

interface Message {
  id: string
  content: string
  sender_name: string
  sender_id: string
  message_type: "text" | "voice"
  voice_url?: string
  created_at: string
}

interface PublicChatModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: any
}

export function PublicChatModal({ isOpen, onClose, currentUser }: PublicChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 3000) // Refresh every 3 seconds
      return () => clearInterval(interval)
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/chat/public")
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const sendTextMessage = async () => {
    if (!newMessage.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/chat/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          message_type: "text",
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages()
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        await sendVoiceMessage(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "voice-message.webm")
      formData.append("sender_id", currentUser.id)
      formData.append("sender_name", currentUser.name)

      const response = await fetch("/api/chat/public/voice", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        fetchMessages()
      } else {
        throw new Error("Failed to send voice message")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setPlayingAudio(messageId)
        audioRef.current.onended = () => setPlayingAudio(null)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            Public Chat
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender_id === currentUser.id ? "justify-end" : "justify-start"}`}
                >
                  {message.sender_id !== currentUser.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-sm">
                        {message.sender_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-xs ${message.sender_id === currentUser.id ? "order-first" : ""}`}>
                    {message.sender_id !== currentUser.id && (
                      <p className="text-xs text-gray-400 mb-1">{message.sender_name}</p>
                    )}

                    <div
                      className={`rounded-lg p-3 ${
                        message.sender_id === currentUser.id ? "bg-purple-600 text-white" : "bg-gray-700 text-white"
                      }`}
                    >
                      {message.message_type === "text" ? (
                        <p className="text-sm">{message.content}</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => playAudio(message.voice_url!, message.id)}
                            className="p-1 h-8 w-8"
                          >
                            {playingAudio === message.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <span className="text-xs">Voice message</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                  </div>

                  {message.sender_id === currentUser.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback className="bg-purple-600 text-white text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendTextMessage()}
                className="bg-gray-700 border-gray-600 text-white"
                disabled={loading}
              />

              <Button
                onClick={sendTextMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <audio ref={audioRef} />
      </DialogContent>
    </Dialog>
  )
}
