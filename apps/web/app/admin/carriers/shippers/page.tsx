'use client'

import { useEffect, useState } from 'react'
import { MapPin, Plus, Edit2, Trash2, Building2 } from 'lucide-react'

type ShipperAddress = {
  id: string
  name: string
  company: string | null
  street: string
  street2: string | null
  zip: string
  city: string
  countryCode: string
  phone: string | null
  email: string | null
  isDefault: boolean
  isActive: boolean
  tenant: { id: string; name: string }
}

export default function ShippersPage() {
  const [shippers, setShippers] = useState<ShipperAddress[]>([])
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    tenantId: '',
    name: '',
    company: '',
    street: '',
    street2: '',
    zip: '',
    city: '',
    countryCode: 'CH',
    phone: '',
    email: '',
    isDefault: false,
  })

  useEffect(() => {
    fetchShippers()
    fetchTenants()
  }, [])

  const fetchShippers = async () => {
    const res = await fetch('/api/admin/shipper-addresses', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setShippers(data.data || [])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingId 
      ? `/api/admin/shipper-addresses/${editingId}`
      : '/api/admin/shipper-addresses'
    
    const res = await fetch(url, {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData),
    })
    
    if (res.ok) {
      setShowCreate(false)
      setEditingId(null)
      resetForm()
      fetchShippers()
    } else {
      const err = await res.json()
      alert(err.error || 'Fehler beim Speichern')
    }
  }

  const handleEdit = (shipper: ShipperAddress) => {
    setFormData({
      tenantId: shipper.tenant.id,
      name: shipper.name,
      company: shipper.company || '',
      street: shipper.street,
      street2: shipper.street2 || '',
      zip: shipper.zip,
      city: shipper.city,
      countryCode: shipper.countryCode,
      phone: shipper.phone || '',
      email: shipper.email || '',
      isDefault: shipper.isDefault,
    })
    setEditingId(shipper.id)
    setShowCreate(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Absender "${name}" wirklich löschen?`)) return
    
    const res = await fetch(`/api/admin/shipper-addresses/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    
    if (res.ok) {
      fetchShippers()
    } else {
      const err = await res.json()
      alert(err.error || 'Fehler beim Löschen')
    }
  }

  const resetForm = () => {
    setFormData({
      tenantId: '',
      name: '',
      company: '',
      street: '',
      street2: '',
      zip: '',
      city: '',
      countryCode: 'CH',
      phone: '',
      email: '',
      isDefault: false,
    })
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
        <h1 className="text-2xl font-bold text-white">Absender-Adressen</h1>
        <button
          onClick={() => { resetForm(); setEditingId(null); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Neue Adresse
        </button>
      </div>

      {shippers.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Keine Absender-Adressen</h3>
          <p className="text-gray-400">Erstellen Sie Absender-Adressen für Ihre Tenants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shippers.map((shipper) => (
            <div key={shipper.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{shipper.name}</h3>
                    {shipper.company && <p className="text-sm text-gray-400">{shipper.company}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {shipper.isDefault && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Standard</span>
                  )}
                  <button onClick={() => handleEdit(shipper)} className="p-1 text-gray-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(shipper.id, shipper.name)} className="p-1 text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-300 mb-3">
                <p>{shipper.street}</p>
                {shipper.street2 && <p>{shipper.street2}</p>}
                <p>{shipper.zip} {shipper.city}</p>
                <p>{shipper.countryCode}</p>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Building2 className="w-3 h-3" />
                {shipper.tenant.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Absender bearbeiten' : 'Neue Absender-Adresse'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tenant *</label>
                <select
                  required
                  value={formData.tenantId}
                  onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  disabled={!!editingId}
                >
                  <option value="">Auswählen...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name/Bezeichnung *</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Hauptlager"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Firma</label>
                  <input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="Firma GmbH"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Strasse *</label>
                <input
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Musterstrasse 1"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Adresszusatz</label>
                <input
                  value={formData.street2}
                  onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  placeholder="Gebäude B"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">PLZ *</label>
                  <input
                    required
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ort *</label>
                  <input
                    required
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
                    <option value="CH">Schweiz</option>
                    <option value="DE">Deutschland</option>
                    <option value="AT">Österreich</option>
                    <option value="LI">Liechtenstein</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefon</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="+41 71 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="versand@firma.ch"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded bg-gray-700 border-gray-600"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-300">Als Standard-Absender setzen</label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Speichern' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
