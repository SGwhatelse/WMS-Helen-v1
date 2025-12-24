'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, Package, Truck, Upload, Search, X, Plus, Minus } from 'lucide-react'
import Link from 'next/link'

type ShipmentType = 'parcel' | 'pallet'

interface WROLine {
  productId: string
  sku: string
  name: string
  quantity: number
}

interface WROData {
  deliveryNumber: string
  shipmentType: ShipmentType
  parcelCount: number
  palletCount: number
  expectedDate: string
  timeWindowStart: string
  timeWindowEnd: string
  lines: WROLine[]
}

async function searchProducts(query: string) {
  const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to search products')
  return res.json()
}

async function createWRO(data: WROData) {
  const res = await fetch('/api/wros', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create WRO')
  return res.json()
}

export default function NeueWROPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const [formData, setFormData] = useState<WROData>({
    deliveryNumber: '',
    shipmentType: 'parcel',
    parcelCount: 0,
    palletCount: 0,
    expectedDate: '',
    timeWindowStart: '08:00',
    timeWindowEnd: '17:00',
    lines: [],
  })

  const createMutation = useMutation({
    mutationFn: createWRO,
    onSuccess: (data) => {
      router.push(`/dashboard/wareneingang/${data.id}`)
    },
  })

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const result = await searchProducts(query)
      setSearchResults(result.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }, [])

  const addProduct = (product: any) => {
    const existing = formData.lines.find(l => l.productId === product.id)
    if (existing) {
      setFormData(prev => ({
        ...prev,
        lines: prev.lines.map(l => l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        lines: [...prev.lines, { productId: product.id, sku: product.sku, name: product.name, quantity: 1 }]
      }))
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const updateQuantity = (productId: string, delta: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(l => {
        if (l.productId === productId) {
          const newQty = Math.max(1, l.quantity + delta)
          return { ...l, quantity: newQty }
        }
        return l
      })
    }))
  }

  const removeLine = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(l => l.productId !== productId)
    }))
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').slice(1) // Skip header
      const newLines: WROLine[] = []

      lines.forEach(line => {
        const [sku, name, quantity] = line.split(',').map(s => s.trim())
        if (sku && quantity) {
          newLines.push({
            productId: '', // Will be matched on backend
            sku,
            name: name || sku,
            quantity: parseInt(quantity) || 1
          })
        }
      })

      setFormData(prev => ({
        ...prev,
        lines: [...prev.lines, ...newLines]
      }))
    }
    reader.readAsText(file)
  }

  const canProceed = () => {
    if (step === 1) {
      return formData.deliveryNumber && formData.expectedDate && (formData.parcelCount > 0 || formData.palletCount > 0)
    }
    if (step === 2) {
      return formData.lines.length > 0
    }
    return true
  }

  const handleSubmit = () => {
    createMutation.mutate(formData)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/wareneingang" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neue WRO erstellen</h1>
          <p className="text-gray-500">Wareneingang ankündigen</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-20 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-between mb-8 px-4">
        <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Lieferdetails</span>
        <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Produkte</span>
        <span className={`text-sm ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Bestätigung</span>
      </div>

      {/* Step 1: Delivery Details */}
      {step === 1 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Lieferdetails
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lieferscheinnummer *</label>
              <input
                type="text"
                value={formData.deliveryNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryNumber: e.target.value }))}
                placeholder="z.B. LS-2024-001"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Art der Sendung *</label>
              <select
                value={formData.shipmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, shipmentType: e.target.value as ShipmentType }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="parcel">Paket</option>
                <option value="pallet">Palette</option>
                <option value="mixed">Gemischt (Pakete & Paletten)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Pakete</label>
                <input
                  type="number"
                  min="0"
                  value={formData.parcelCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, parcelCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl Paletten</label>
                <input
                  type="number"
                  min="0"
                  value={formData.palletCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, palletCount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Erwartetes Lieferdatum *</label>
              <input
                type="date"
                value={formData.expectedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zeitfenster von</label>
                <input
                  type="time"
                  value={formData.timeWindowStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeWindowStart: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zeitfenster bis</label>
                <input
                  type="time"
                  value={formData.timeWindowEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeWindowEnd: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Produkte hinzufügen
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Produkt suchen (SKU oder Name)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                    <Plus className="w-4 h-4 text-blue-600" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CSV Upload */}
          <div className="mb-6">
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">CSV hochladen (SKU, Name, Menge)</span>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          </div>

          {/* Product List */}
          {formData.lines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Noch keine Produkte hinzugefügt</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Produkt</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">SKU</th>
                    <th className="text-center px-4 py-2 text-sm font-medium text-gray-500">Menge</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {formData.lines.map((line) => (
                    <tr key={line.productId || line.sku}>
                      <td className="px-4 py-3 font-medium">{line.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-sm">{line.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(line.productId || line.sku, -1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{line.quantity}</span>
                          <button
                            onClick={() => updateQuantity(line.productId || line.sku, 1)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeLine(line.productId || line.sku)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-blue-600" />
            Bestätigung
          </h2>

          <div className="space-y-6">
            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Lieferdetails</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Lieferscheinnummer:</span>
                  <p className="font-medium">{formData.deliveryNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Art der Sendung:</span>
                  <p className="font-medium">{formData.shipmentType === 'parcel' ? 'Paket' : formData.shipmentType === 'pallet' ? 'Palette' : 'Gemischt'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Pakete / Paletten:</span>
                  <p className="font-medium">{formData.parcelCount} Pakete, {formData.palletCount} Paletten</p>
                </div>
                <div>
                  <span className="text-gray-500">Lieferdatum:</span>
                  <p className="font-medium">{new Date(formData.expectedDate).toLocaleDateString('de-CH')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Zeitfenster:</span>
                  <p className="font-medium">{formData.timeWindowStart} - {formData.timeWindowEnd}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Produkte ({formData.lines.length})</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Produkt</th>
                      <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">SKU</th>
                      <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Menge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.lines.map((line) => (
                      <tr key={line.productId || line.sku}>
                        <td className="px-4 py-2">{line.name}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-sm">{line.sku}</td>
                        <td className="px-4 py-2 text-right font-medium">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-4 py-2 font-medium">Gesamt</td>
                      <td className="px-4 py-2 text-right font-bold">
                        {formData.lines.reduce((sum, l) => sum + l.quantity, 0)} Einheiten
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Weiter
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Wird erstellt...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                WRO erstellen
              </>
            )}
          </button>
        )}
      </div>

      {createMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          Fehler beim Erstellen der WRO. Bitte versuche es erneut.
        </div>
      )}
    </div>
  )
}
