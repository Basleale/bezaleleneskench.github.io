import { Search, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function Component() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800">
        <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
          <Menu className="h-6 w-6" />
        </Button>

        <h1 className="text-xl font-bold tracking-wider">ENESKENCH SUMMIT</h1>

        <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
          <User className="h-6 w-6" />
        </Button>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Your Digital Universe</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Discover, collect, and share extraordinary visual art from around the globe.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search albums, images, or artists..."
              className="w-full pl-12 pr-4 py-4 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 rounded-full text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Featured Collections */}
        <section>
          <h3 className="text-2xl font-bold mb-8">Featured Collections</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                <div className="aspect-square p-8 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-600 flex items-center justify-center">
                    <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
