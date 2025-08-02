"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic, MicOff, Play, Pause } from "lucide-react"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
  currentUser: any
}

interface Message {
  id: string
  text?: string
  audioUrl?: string
  sender: string
  timestamp: Date
  type: "text" | "voice"
}

export function ChatModal({ isOpen, onClose, user, currentUser }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const sendTextMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: currentUser.name,
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)

        const message: Message = {
          id: Date.now().toString(),
          audioUrl,
          sender: currentUser.name,
          timestamp: new Date(),
          type: "voice",
        }

        setMessages((prev) => [...prev, message])
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const playAudio = (audioUrl: string, messageId: string) => {
    if (playingAudio === messageId) {
      setPlayingAudio(null)
      return
    }

    const audio = new Audio(audioUrl)
    setPlayingAudio(messageId)

    audio.onended = () => {
      setPlayingAudio(null)
    }

    audio.play()
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-sm">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            Chat with {user.name}
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === currentUser.name ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === currentUser.name ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-100"
                    }`}
                  >
                    {message.type === "text" ? (
                      <p className="text-sm">{message.text}</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => playAudio(message.audioUrl!, message.id)}
                          className="p-1 h-8 w-8"
                        >
                          {playingAudio === message.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <span className="text-xs">Voice message</span>
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  sendTextMessage()
                }
              }}
              className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            />
            <Button
              onClick={sendTextMessage}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="sm"
              variant={isRecording ? "destructive" : "outline"}
              className={isRecording ? "" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          {isRecording && <p className="text-xs text-red-400 mt-2 text-center">Recording... Click mic to stop</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
