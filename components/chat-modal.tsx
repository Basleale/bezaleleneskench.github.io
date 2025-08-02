"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Mic, MicOff, Play, Pause, Loader2 } from "lucide-react"

interface Message {
  id: string
  content?: string
  voiceUrl?: string
  senderName: string
  senderId: string
  createdAt: string
  type: "text" | "voice"
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  currentUser: any
}

export function ChatModal({ isOpen, onClose, user, currentUser }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && user && currentUser) {
      fetchMessages()
      // Auto-refresh messages every 2 seconds
      const interval = setInterval(fetchMessages, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen, user, currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    if (!user || !currentUser) return

    setLoading(true)
    try {
      const response = await fetch(`/api/chat/private?user1=${currentUser.id}&user2=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !currentUser) return

    setSending(true)
    try {
      const response = await fetch("/api/chat/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: user.id,
          content: newMessage.trim(),
          type: "text",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
        setNewMessage("")
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
      setSending(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
        await sendVoiceMessage(audioBlob)
        setAudioChunks([])
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
    if (!user || !currentUser) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append("audio", audioBlob, "voice-message.webm")
      formData.append("senderId", currentUser.id)
      formData.append("receiverId", user.id)

      const response = await fetch("/api/chat/private/voice", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, data.message])
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
      setSending(false)
    }
  }

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null)
      return
    }

    const audio = new Audio(audioUrl)
    audio.onended = () => setPlayingAudio(null)
    audio.play()
    setPlayingAudio(messageId)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-white">Chat with {user.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 max-h-96 mb-4">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.senderId === currentUser?.id
                return (
                  <div key={message.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-xs">
                        {message.senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-purple-400">
                          {isOwn ? "You" : message.senderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      {message.type === "text" ? (
                        <div
                          className={`inline-block p-3 rounded-lg max-w-xs ${
                            isOwn ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                      ) : (
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            isOwn ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          <Button
                            onClick={() => playAudio(message.voiceUrl!, message.id)}
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                          >
                            {playingAudio === message.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            <span className="ml-2 text-xs">Voice message</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              disabled={sending || isRecording}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            size="sm"
            variant={isRecording ? "destructive" : "outline"}
            className={isRecording ? "animate-pulse" : ""}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
