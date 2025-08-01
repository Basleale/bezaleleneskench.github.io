"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function SetupDbPage() {
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const setupDatabase = async () => {
    setLoading(true)
    setStatus("Setting up database...")

    try {
      const response = await fetch("/api/setup-db", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setStatus("✅ Database setup completed successfully!")
      } else {
        setStatus(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950 flex items-center justify-center">
      <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Database Setup</h1>

        <div className="space-y-4">
          <Button onClick={setupDatabase} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
            {loading ? "Setting up..." : "Setup Database"}
          </Button>

          {status && (
            <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
              <p className="text-white text-sm">{status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
