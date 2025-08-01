import { put, list, del } from "@vercel/blob"

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export class AuthStorage {
  private static readonly AUTH_FOLDER = "authentication/"
  private static readonly USERS_FILE = "users.json"

  // Get all users from blob storage
  static async getAllUsers(): Promise<User[]> {
    try {
      const { blobs } = await list({
        prefix: this.AUTH_FOLDER + this.USERS_FILE,
      })

      if (blobs.length === 0) {
        // Initialize with demo user if no users file exists
        const demoUser: User = {
          id: "demo",
          name: "Demo User",
          email: "demo@example.com",
          passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm", // "password"
          createdAt: new Date().toISOString(),
        }
        await this.saveUsers([demoUser])
        return [demoUser]
      }

      const usersBlob = blobs[0]
      const response = await fetch(usersBlob.url)
      const users = await response.json()
      return users as User[]
    } catch (error) {
      console.error("Error fetching users:", error)
      // Return demo user as fallback
      return [
        {
          id: "demo",
          name: "Demo User",
          email: "demo@example.com",
          passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm",
          createdAt: new Date().toISOString(),
        },
      ]
    }
  }

  // Save users to blob storage
  static async saveUsers(users: User[]): Promise<void> {
    try {
      // Delete existing users file
      const { blobs } = await list({
        prefix: this.AUTH_FOLDER + this.USERS_FILE,
      })

      for (const blob of blobs) {
        await del(blob.url)
      }

      // Save new users file
      const usersJson = JSON.stringify(users, null, 2)
      await put(this.AUTH_FOLDER + this.USERS_FILE, usersJson, {
        access: "public",
        contentType: "application/json",
      })
    } catch (error) {
      console.error("Error saving users:", error)
      throw error
    }
  }

  // Find user by email
  static async findUserByEmail(email: string): Promise<User | null> {
    const users = await this.getAllUsers()
    return users.find((user) => user.email === email) || null
  }

  // Create new user
  static async createUser(name: string, email: string, passwordHash: string): Promise<User> {
    const users = await this.getAllUsers()

    // Check if user already exists
    const existingUser = users.find((user) => user.email === email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    await this.saveUsers(users)

    return newUser
  }

  // Find user by ID
  static async findUserById(id: string): Promise<User | null> {
    const users = await this.getAllUsers()
    return users.find((user) => user.id === id) || null
  }
}
