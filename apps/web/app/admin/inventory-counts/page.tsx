'use client'

import { useEffect, useState } from 'react'
import { ClipboardList, Plus, Search } from 'lucide-react'

export default function InventoryCountsPage() {
  const [counts, setCounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch inventory counts from API
    setLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Inventur</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Neue Inventur
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Inventur verwalten</h3>
        <p className="text-gray-400">Hier können Inventuren gestartet und verwaltet werden.</p>
        <p className="text-gray-500 text-sm mt-2">Coming Soon</p>
      </div>
    </div>
  )
}
