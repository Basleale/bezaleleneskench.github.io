import { createClient } from "@vercel/postgres"

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
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(`
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
      `)

      return result.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      })) as MediaItem[]
    } catch (error) {
      console.error("Error fetching media from database:", error)
      throw error
    } finally {
      await client.end()
    }
  }

  // Insert new media items
  static async insertMedia(mediaItems: Omit<MediaItem, "id" | "created_at" | "updated_at">[]): Promise<MediaItem[]> {
    const client = createClient()
    await client.connect()

    try {
      const insertedItems: MediaItem[] = []

      for (const item of mediaItems) {
        const result = await client.query(
          `
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
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
          RETURNING *
        `,
          [
            item.name,
            item.original_name,
            item.type,
            item.extension,
            item.blob_url,
            item.file_size,
            item.uploaded_at,
            item.uploaded_by,
            item.tags,
          ],
        )

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
    } finally {
      await client.end()
    }
  }

  // Delete media items by IDs
  static async deleteMedia(ids: string[]): Promise<MediaItem[]> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
        DELETE FROM media 
        WHERE id = ANY($1)
        RETURNING *
      `,
        [ids],
      )

      return result.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      })) as MediaItem[]
    } catch (error) {
      console.error("Error deleting media from database:", error)
      throw error
    } finally {
      await client.end()
    }
  }

  // Update tags for a media item
  static async updateMediaTags(mediaId: string, tags: string[]): Promise<MediaItem | null> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
        UPDATE media 
        SET 
          tags = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `,
        [tags, mediaId],
      )

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
    } finally {
      await client.end()
    }
  }

  // Get media by specific tags
  static async getMediaByTags(tags: string[]): Promise<MediaItem[]> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
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
        WHERE tags && $1
        ORDER BY uploaded_at DESC
      `,
        [tags],
      )

      return result.rows.map((row) => ({
        ...row,
        tags: row.tags || [],
      })) as MediaItem[]
    } catch (error) {
      console.error("Error fetching media by tags from database:", error)
      throw error
    } finally {
      await client.end()
    }
  }

  // Get a single media item by ID
  static async getMediaById(id: string): Promise<MediaItem | null> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
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
        WHERE id = $1
      `,
        [id],
      )

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
    } finally {
      await client.end()
    }
  }
}

export class UserDatabase {
  // Create a new user
  static async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
        INSERT INTO users (name, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, name, email, password_hash, created_at, updated_at
      `,
        [name, email, passwordHash],
      )

      return result.rows[0] as User
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    } finally {
      await client.end()
    }
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users 
        WHERE email = $1
      `,
        [email],
      )

      return (result.rows[0] as User) || null
    } catch (error) {
      console.error("Error finding user by email:", error)
      throw error
    } finally {
      await client.end()
    }
  }

  // Find user by ID
  static async findUserById(id: string): Promise<User | null> {
    const client = createClient()
    await client.connect()

    try {
      const result = await client.query(
        `
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users 
        WHERE id = $1
      `,
        [id],
      )

      return (result.rows[0] as User) || null
    } catch (error) {
      console.error("Error finding user by ID:", error)
      throw error
    } finally {
      await client.end()
    }
  }
}
