import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Create the media table
    await sql`
      CREATE TABLE IF NOT EXISTS media (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
        extension VARCHAR(10) NOT NULL,
        blob_url TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        uploaded_by VARCHAR(100) NOT NULL DEFAULT 'Current User',
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media(uploaded_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN(tags)`
    await sql`CREATE INDEX IF NOT EXISTS idx_media_type ON media(type)`

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        error: "Failed to setup database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
