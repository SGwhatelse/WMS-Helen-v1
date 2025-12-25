'use client'

import { useEffect, useState } from 'react'
import { Truck, Plus, Settings, Check, X } from 'lucide-react'

type CarrierService = {
  id: string
  name: string
  code: string
  type: string
  isActive: boolean
  sortOrder: number
}

type Carrier = {
  id: string
  name: string
  code: string
  logoUrl: string | null
  isActive: boolean
  services: CarrierService[]
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCarriers()
  }, [])

  const fetchCarriers = async () => {
    const res = await fetch('/api/admin/carriers', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setCarriers(data.data || [])
    }
    setLoading(false)
  }

  const typeLabels: Record<string, string> = {
    parcel: 'Paket',
    letter: 'Brief',
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Versanddienstleister</h1>
      </div>

      {carriers.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Keine Carrier vorhanden</h3>
          <p className="text-gray-400">Carrier werden vom System verwaltet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {carriers.map((carrier) => (
            <div key={carrier.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center">
                    <Truck className="w-8 h-8 text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{carrier.name}</h2>
                    <p className="text-gray-400">{carrier.code}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${carrier.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {carrier.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Versandarten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {carrier.services.sort((a, b) => a.sortOrder - b.sortOrder).map((service) => (
                    <div 
                      key={service.id} 
                      className={`p-4 rounded-lg border ${service.isActive ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-800 border-gray-700 opacity-50'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{service.name}</span>
                        {service.isActive ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">{service.code}</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-400">{typeLabels[service.type] || service.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
