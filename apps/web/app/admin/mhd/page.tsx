'use client'

import { useEffect, useState } from 'react'
import { Calendar, AlertTriangle, Search } from 'lucide-react'

export default function MHDPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch MHD items from API
    setLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mindesthaltbarkeit (MHD)</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-red-400">Abgelaufen</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-yellow-400">Läuft bald ab (30 Tage)</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">0</p>
	      <p className="text-sm text-green-400">OK (&gt; 30 Tage)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">MHD Übersicht</h3>
        <p className="text-gray-400">Hier werden Produkte mit Mindesthaltbarkeitsdatum überwacht.</p>
        <p className="text-gray-500 text-sm mt-2">Coming Soon</p>
      </div>
    </div>
  )
}
