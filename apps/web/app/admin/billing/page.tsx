'use client'

import { useEffect, useState } from 'react'
import { CreditCard, TrendingUp, FileText, Search } from 'lucide-react'

export default function BillingPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch billing data from API
    setLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Abrechnung</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">CHF 0.00</p>
              <p className="text-sm text-gray-400">Umsatz diesen Monat</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-gray-400">Offene Rechnungen</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">CHF 0.00</p>
              <p className="text-sm text-gray-400">Überfällig</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
        <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Abrechnung & Fakturierung</h3>
        <p className="text-gray-400">Hier werden Rechnungen erstellt und verwaltet.</p>
        <p className="text-gray-500 text-sm mt-2">Coming Soon - Bexio Integration</p>
      </div>
    </div>
  )
}
