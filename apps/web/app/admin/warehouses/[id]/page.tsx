'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Warehouse, Plus, Layers, MapPin, Printer, Trash2 } from 'lucide-react'

type Zone = {
  id: string
  name: string
  code: string
  type: string
  isActive: boolean
  _count: { locations: number }
}

type Location = {
  id: string
  name: string
  barcode: string
  type: string
  level: string | null
  position: string | null
  isActive: boolean
  zone: { id: string; name: string; code: string } | null
}

type WarehouseDetail = {
  id: string
  name: string
  code: string
  city: string | null
  tenant: { id: string; name: string }
  zones: Zone[]
  _count: { locations: number }
}

export default function WarehouseDetailPage() {
  const params = useParams()
  const warehouseId = params.id as string

  const [warehouse, setWarehouse] = useState<WarehouseDetail | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('locations')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [showCreateZone, setShowCreateZone] = useState(false)
  const [showCreateLocations, setShowCreateLocations] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const [zoneForm, setZoneForm] = useState({ name: '', code: '' })
  const [locationForm, setLocationForm] = useState({
    regalFrom: '1',
    regalTo: '1',
    ebeneFrom: '1',
    ebeneTo: '1',
    platzFrom: '1',
    platzTo: '10',
    type: 'shelf',
    maxWeightKg: '70',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
  })

  useEffect(() => {
    fetchWarehouse()
  }, [warehouseId])

  useEffect(() => {
    if (warehouse) fetchLocations()
  }, [warehouse, selectedZone])

  const fetchWarehouse = async () => {
    const res = await fetch(`/api/admin/warehouses/${warehouseId}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setWarehouse(data)
    }
    setLoading(false)
  }

  const fetchLocations = async () => {
    const params = new URLSearchParams()
    if (selectedZone) params.append('zoneId', selectedZone)
    const res = await fetch(`/api/admin/warehouses/${warehouseId}/locations?${params}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setLocations(data.data || [])
    }
  }

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/admin/warehouses/${warehouseId}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(zoneForm),
    })
    if (res.ok) {
      setShowCreateZone(false)
      setZoneForm({ name: '', code: '' })
      fetchWarehouse()
    }
  }

  const handleCreateLocations = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const res = await fetch(`/api/admin/warehouses/${warehouseId}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(locationForm),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`${data.count} Lagerplätze erstellt!`)
      setShowCreateLocations(false)
      setLocationForm({ regalFrom: '1', regalTo: '1', ebeneFrom: '1', ebeneTo: '1', platzFrom: '1', platzTo: '10', type: 'shelf', maxWeightKg: '70', lengthMm: '', widthMm: '', heightMm: '' })
      fetchWarehouse()
      fetchLocations()
    } else {
      const err = await res.json()
      alert(err.error || 'Fehler beim Erstellen')
    }
    setCreating(false)
  }

  const handleDeleteLocation = async (id: string, barcode: string) => {
    if (!confirm(`Lagerplatz ${barcode} wirklich löschen?`)) return
    const res = await fetch(`/api/admin/locations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      fetchLocations()
      fetchWarehouse()
    } else {
      const data = await res.json()
      alert(data.message || data.error || 'Fehler beim Löschen')
    }
  }

  const handlePrintLabels = () => {
    const toPrint = selectedLocations.length > 0 
      ? locations.filter(l => selectedLocations.includes(l.id))
      : locations
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = `<!DOCTYPE html><html><head><title>Etiketten</title>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <style>@page{size:70mm 20mm;margin:0}body{margin:0;font-family:Arial}.label{width:70mm;height:20mm;display:flex;align-items:center;padding:2mm;box-sizing:border-box;page-break-after:always}.qr{width:16mm;height:16mm;margin-right:3mm}.text{font-size:14pt;font-weight:bold}</style></head><body>
      ${toPrint.map(loc => `<div class="label"><canvas class="qr" id="qr-${loc.id}"></canvas><span class="text">${loc.barcode}</span></div>`).join('')}
      <script>${toPrint.map(loc => `QRCode.toCanvas(document.getElementById('qr-${loc.id}'),'${loc.barcode}',{width:60,margin:0});`).join('')}setTimeout(()=>window.print(),500);<\/script></body></html>`
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const toggleSelectLocation = (id: string) => {
    setSelectedLocations(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    setSelectedLocations(selectedLocations.length === locations.length ? [] : locations.map(l => l.id))
  }

  const typeLabels: Record<string, string> = { shelf: 'Regal', pallet: 'Palette', floor: 'Boden', bin: 'Box', rack: 'Rack' }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
  if (!warehouse) return <div className="text-center py-12 text-gray-400">Lager nicht gefunden</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/warehouses" className="p-2 hover:bg-gray-700 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-400" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{warehouse.name}</h1>
          <p className="text-gray-400">{warehouse.code} • {warehouse.tenant.name}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        <button onClick={() => setActiveTab('zones')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${activeTab === 'zones' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
          <Layers className="w-4 h-4" />Zonen ({warehouse.zones.length})
        </button>
        <button onClick={() => setActiveTab('locations')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px ${activeTab === 'locations' ? 'text-blue-400 border-blue-400' : 'text-gray-400 border-transparent hover:text-white'}`}>
          <MapPin className="w-4 h-4" />Lagerplätze ({warehouse._count.locations})
        </button>
      </div>

      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateZone(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Neue Zone</button>
          </div>
          {warehouse.zones.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center"><Layers className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Keine Zonen vorhanden</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouse.zones.map((zone) => (
                <div key={zone.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-white">{zone.code}</span>
                    <span className={`px-2 py-1 rounded text-xs ${zone.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{zone.isActive ? 'Aktiv' : 'Inaktiv'}</span>
                  </div>
                  <p className="text-gray-400 mb-2">{zone.name}</p>
                  <p className="text-sm text-gray-500">{zone._count.locations} Lagerplätze</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
              <option value="">Alle Zonen</option>
              {warehouse.zones.map((z) => (<option key={z.id} value={z.id}>{z.code} - {z.name}</option>))}
            </select>
            <div className="flex-1" />
            {locations.length > 0 && (
              <button onClick={handlePrintLabels} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                <Printer className="w-4 h-4" />{selectedLocations.length > 0 ? `${selectedLocations.length} drucken` : 'Alle drucken'}
              </button>
            )}
            <button onClick={() => setShowCreateLocations(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-4 h-4" />Lagerplätze erstellen</button>
          </div>
          {locations.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center"><MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Keine Lagerplätze vorhanden</p></div>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedLocations.length === locations.length} onChange={toggleSelectAll} className="rounded bg-gray-700 border-gray-600" /></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Barcode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Zone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Typ</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3"><input type="checkbox" checked={selectedLocations.includes(loc.id)} onChange={() => toggleSelectLocation(loc.id)} className="rounded bg-gray-700 border-gray-600" /></td>
                      <td className="px-4 py-3 font-mono text-white">{loc.barcode}</td>
                      <td className="px-4 py-3 text-gray-300">{loc.zone?.code || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">{typeLabels[loc.type] || loc.type}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${loc.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{loc.isActive ? 'Aktiv' : 'Inaktiv'}</span></td>
                      <td className="px-4 py-3"><button onClick={() => handleDeleteLocation(loc.id, loc.barcode)} className="p-1 text-gray-400 hover:text-red-400" title="Löschen"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreateZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Neue Zone erstellen</h2>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Code *</label><input required value={zoneForm.code} onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="A" maxLength={5} /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Name *</label><input required value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" placeholder="Regal A" /></div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateZone(false)} className="px-4 py-2 text-gray-400 hover:text-white">Abbrechen</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Erstellen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateLocations && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Lagerplatz-Assistent</h2>
            <form onSubmit={handleCreateLocations} className="space-y-4">
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Lagerplatzbezeichnung definieren</h3>
                <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-400 mb-2">
                  <span>Regal</span>
                  <span>Ebene</span>
                  <span>Platz</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <input type="number" min="1" value={locationForm.regalFrom} onChange={(e) => setLocationForm({ ...locationForm, regalFrom: e.target.value })} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center" />
                  <input type="number" min="1" value={locationForm.ebeneFrom} onChange={(e) => setLocationForm({ ...locationForm, ebeneFrom: e.target.value })} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center" />
                  <input type="number" min="1" value={locationForm.platzFrom} onChange={(e) => setLocationForm({ ...locationForm, platzFrom: e.target.value })} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center" />
                </div>
                <div className="text-center text-gray-500 text-sm mb-2">bis</div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" min="1" value={locationForm.regalTo} onChange={(e) => setLocationForm({ ...locationForm, regalTo: e.target.value })} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center" />
                  <input type="number" min="1" value={locationForm.ebeneTo} onChange={(e) => setLocationForm({ ...locationForm, ebeneTo: e.target.value })} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center" />
                  <input type="number" min="1" value={locationForm.platzTo} onChange={(e) => setLocationForm({ ...locationForm, platzTo: e.target.value })} className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center" />
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Eigenschaften festlegen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Lagerplatztyp</label>
                    <select value={locationForm.type} onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
                      <option value="shelf">Regalplatz</option>
                      <option value="pallet">Palettenplatz</option>
                      <option value="floor">Bodenplatz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max. Gewicht (kg)</label>
                    <input type="number" min="0" value={locationForm.maxWeightKg} onChange={(e) => setLocationForm({ ...locationForm, maxWeightKg: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Länge (mm)</label>
                    <input type="number" min="0" value={locationForm.lengthMm} onChange={(e) => setLocationForm({ ...locationForm, lengthMm: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" placeholder="optional" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Breite (mm)</label>
                    <input type="number" min="0" value={locationForm.widthMm} onChange={(e) => setLocationForm({ ...locationForm, widthMm: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" placeholder="optional" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Höhe (mm)</label>
                    <input type="number" min="0" value={locationForm.heightMm} onChange={(e) => setLocationForm({ ...locationForm, heightMm: e.target.value })} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" placeholder="optional" />
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 font-medium">Vorschau</p>
                <p className="text-white mt-1">
                  A{String(parseInt(locationForm.regalFrom) || 1).padStart(2, '0')}-{String(parseInt(locationForm.ebeneFrom) || 1).padStart(2, '0')}-{String(parseInt(locationForm.platzFrom) || 1).padStart(2, '0')}
                  {' bis '}
                  A{String(parseInt(locationForm.regalTo) || 1).padStart(2, '0')}-{String(parseInt(locationForm.ebeneTo) || 1).padStart(2, '0')}-{String(parseInt(locationForm.platzTo) || 1).padStart(2, '0')}
                </p>
                <p className="text-blue-300 text-sm mt-2">
                  {Math.max(0, ((parseInt(locationForm.regalTo) || 1) - (parseInt(locationForm.regalFrom) || 1) + 1) * ((parseInt(locationForm.ebeneTo) || 1) - (parseInt(locationForm.ebeneFrom) || 1) + 1) * ((parseInt(locationForm.platzTo) || 1) - (parseInt(locationForm.platzFrom) || 1) + 1))} Lagerplätze werden erstellt
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateLocations(false)} className="px-4 py-2 text-gray-400 hover:text-white">Abbrechen</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {creating ? 'Erstelle...' : 'Lagerplätze anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
