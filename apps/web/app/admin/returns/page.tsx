'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Search, Filter } from 'lucide-react'

export default function ReturnsPage() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // TODO: Fetch returns from API
    setLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Retouren</h1>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen nach RMA, Bestellung, Kunde..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <RotateCcw className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Retouren Übersicht</h3>
        <p className="text-gray-400">Hier werden alle Retouren aller Tenants angezeigt.</p>
        <p className="text-gray-500 text-sm mt-2">Coming Soon</p>
      </div>
    </div>
  )
}
