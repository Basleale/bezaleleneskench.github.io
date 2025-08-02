import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { BlobStorage } from "@/lib/blob-storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const senderId = formData.get("senderId") as string
    const senderName = formData.get("senderName") as string
    const receiverId = formData.get("receiverId") as string
    const receiverName = formData.get("receiverName") as string

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 })
    }

    if (!senderId || !senderId.trim()) {
      return NextResponse.json({ error: "Sender ID required" }, { status: 400 })
    }

    if (!senderName || !senderName.trim()) {
      return NextResponse.json({ error: "Sender name required" }, { status: 400 })
    }

    if (!receiverId || !receiverId.trim()) {
      return NextResponse.json({ error: "Receiver ID required" }, { status: 400 })
    }

    if (!receiverName || !receiverName.trim()) {
      return NextResponse.json({ error: "Receiver name required" }, { status: 400 })
    }

    // Upload audio file to blob storage
    const audioId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const audioBlob = await put(`voice-messages/private/${audioId}.webm`, audioFile, {
      access: "public",
    })

    // Create message record
    const message = await BlobStorage.addPrivateMessage({
      voiceUrl: audioBlob.url,
      senderId: senderId.trim(),
      senderName: senderName.trim(),
      receiverId: receiverId.trim(),
      receiverName: receiverName.trim(),
      type: "voice",
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating private voice message:", error)
    return NextResponse.json({ error: "Failed to create voice message" }, { status: 500 })
  }
}
