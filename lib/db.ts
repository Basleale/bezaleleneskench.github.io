import { sql } from "@vercel/postgres"

export interface MediaItem {
  id: string
  name: string
  original_name: string
  type: "image" | "video"
  extension: string
  blob_url: string
  file_size: number
  uploaded_at: string
  uploaded_by: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  created_at: string
  updated_at: string
}

export class MediaDatabase {
  // Get all media items, sorted by upload date (newest first)
  static async getAllMedia(): Promise<MediaItem[]> {
    try {
      const result = await sql`
        SELECT 
          id,
          name,
          original_name,
          type,
          extension,
          blob_url,
          file_size,
          uploaded_at,
          uploaded_by,
          tags,
          created_at,
          updated_at
        FROM media 
        ORDER BY uploaded_at DESC
      `

      return result.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      })) as MediaItem[]
    } catch (error) {
      console.error("Error fetching media from database:", error)
      throw error
    }
  }

  // Insert new media items
  static async insertMedia(mediaItems: Omit<MediaItem, "id" | "created_at" | "updated_at">[]): Promise<MediaItem[]> {
    try {
      const insertedItems: MediaItem[] = []

      for (const item of mediaItems) {
        const result = await sql`
          INSERT INTO media (
            name, 
            original_name, 
            type, 
            extension, 
            blob_url, 
            file_size, 
            uploaded_at, 
            uploaded_by, 
            tags
          ) VALUES (
            ${item.name},
            ${item.original_name},
            ${item.type},
            ${item.extension},
            ${item.blob_url},
            ${item.file_size},
            ${item.uploaded_at},
            ${item.uploaded_by},
            ${item.tags}
          )
          RETURNING *
        `

        if (result.rows[0]) {
          insertedItems.push({
            ...result.rows[0],
            tags: result.rows[0].tags || [],
          } as MediaItem)
        }
      }

      return insertedItems
    } catch (error) {
      console.error("Error inserting media to database:", error)
      throw error
    }
  }

  // Delete media items by IDs
  static async deleteMedia(ids: string[]): Promise<MediaItem[]> {
    try {
      const result = await sql`
        DELETE FROM media 
        WHERE id = ANY(${ids})
        RETURNING *
      `

      return result.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      })) as MediaItem[]
    } catch (error) {
      console.error("Error deleting media from database:", error)
      throw error
    }
  }

  // Update tags for a media item
  static async updateMediaTags(mediaId: string, tags: string[]): Promise<MediaItem | null> {
    try {
      const result = await sql`
        UPDATE media 
        SET 
          tags = ${tags},
          updated_at = NOW()
        WHERE id = ${mediaId}
        RETURNING *
      `

      if (result.rows[0]) {
        return {
          ...result.rows[0],
          tags: result.rows[0].tags || [],
        } as MediaItem
      }

      return null
    } catch (error) {
      console.error("Error updating media tags in database:", error)
      throw error
    }
  }

  // Get media by specific tags
  static async getMediaByTags(tags: string[]): Promise<MediaItem[]> {
    try {
      const result = await sql`
        SELECT 
          id,
          name,
          original_name,
          type,
          extension,
          blob_url,
          file_size,
          uploaded_at,
          uploaded_by,
          tags,
          created_at,
          updated_at
        FROM media 
        WHERE tags && ${tags}
        ORDER BY uploaded_at DESC
      `

      return result.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      })) as MediaItem[]
    } catch (error) {
      console.error("Error fetching media by tags from database:", error)
      throw error
    }
  }

  // Get a single media item by ID
  static async getMediaById(id: string): Promise<MediaItem | null> {
    try {
      const result = await sql`
        SELECT 
          id,
          name,
          original_name,
          type,
          extension,
          blob_url,
          file_size,
          uploaded_at,
          uploaded_by,
          tags,
          created_at,
          updated_at
        FROM media 
        WHERE id = ${id}
      `

      if (result.rows[0]) {
        return {
          ...result.rows[0],
          tags: result.rows[0].tags || [],
        } as MediaItem
      }

      return null
    } catch (error) {
      console.error("Error fetching media by ID from database:", error)
      throw error
    }
  }
}

export class UserDatabase {
  // Create a new user
  static async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO users (name, email, password_hash, created_at, updated_at)
        VALUES (${name}, ${email}, ${passwordHash}, NOW(), NOW())
        RETURNING id, name, email, password_hash, created_at, updated_at
      `

      return result.rows[0] as User
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users 
        WHERE email = ${email}
      `

      return (result.rows[0] as User) || null
    } catch (error) {
      console.error("Error finding user by email:", error)
      throw error
    }
  }

  // Find user by ID
  static async findUserById(id: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users 
        WHERE id = ${id}
      `

      return (result.rows[0] as User) || null
    } catch (error) {
      console.error("Error finding user by ID:", error)
      throw error
    }
  }
}
