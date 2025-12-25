'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Warehouse, Plus, MapPin, Layers, Building2 } from 'lucide-react'

type WarehouseType = {
  id: string
  name: string
  code: string
  city: string | null
  countryCode: string
  isActive: boolean
  tenant: { id: string; name: string }
  _count: { zones: number; locations: number }
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])
  const [formData, setFormData] = useState({
    tenantId: '',
    name: '',
    code: '',
    addressLine1: '',
    postalCode: '',
    city: '',
    countryCode: 'CH',
  })

  useEffect(() => {
    fetchWarehouses()
    fetchTenants()
  }, [])

  const fetchWarehouses = async () => {
    const res = await fetch('/api/admin/warehouses', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setWarehouses(data.data || [])
    }
    setLoading(false)
  }

  const fetchTenants = async () => {
    const res = await fetch('/api/admin/tenants?limit=100', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setTenants(data.data || [])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/warehouses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      setShowCreate(false)
      setFormData({ tenantId: '', name: '', code: '', addressLine1: '', postalCode: '', city: '', countryCode: 'CH' })
      fetchWarehouses()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Lager</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Neues Lager
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Neues Lager erstellen</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tenant *</label>
                <select
                  required
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">Auswählen...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Hauptlager"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Code *</label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="WH1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Adresse</label>
                <input
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Musterstrasse 1"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">PLZ</label>
                  <input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ort</label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Land</label>
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="CH">CH</option>
                    <option value="DE">DE</option>
                    <option value="AT">AT</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Warehouse className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Keine Lager vorhanden</h3>
          <p className="text-gray-400">Erstellen Sie Ihr erstes Lager.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <Link
              key={wh.id}
              href={`/admin/warehouses/${wh.id}`}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-white" />
                </div>
                <span className={`px-2 py-1 rounded text-xs ${wh.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {wh.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{wh.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{wh.code}</p>
              <div className="flex items-center gap-1 text-sm text-gray-400 mb-4">
                <Building2 className="w-4 h-4" />
                {wh.tenant.name}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-300">
                  <Layers className="w-4 h-4" />
                  {wh._count.zones} Zonen
                </div>
                <div className="flex items-center gap-1 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  {wh._count.locations} Plätze
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
