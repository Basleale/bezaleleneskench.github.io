import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user1Id = searchParams.get("user1Id")
    const user2Id = searchParams.get("user2Id")

    if (!user1Id || !user2Id) {
      return NextResponse.json({ error: "Both user IDs required" }, { status: 400 })
    }

    const messages = await BlobStorage.getPrivateMessages(user1Id, user2Id)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching private messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, senderId, senderName, receiverId, receiverName } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content required" }, { status: 400 })
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

    const message = await BlobStorage.addPrivateMessage({
      content: content.trim(),
      senderId: senderId.trim(),
      senderName: senderName.trim(),
      receiverId: receiverId.trim(),
      receiverName: receiverName.trim(),
      type: "text",
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating private message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
