'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { 
  ArrowLeft, Save, Trash2, Package, Barcode, Scale, Ruler, 
  DollarSign, AlertTriangle, Plus, X, Check
} from 'lucide-react'
import Link from 'next/link'

async function fetchProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json()
}

async function updateProduct(id: string, data: any) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update product')
  }
  return res.json()
}

async function deleteProduct(id: string) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete product')
  }
  return res.json()
}

async function addBarcode(productId: string, barcode: string, type: string) {
  const res = await fetch(`/api/products/${productId}/barcodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ barcode, type, isPrimary: false }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to add barcode')
  }
  return res.json()
}

function Input({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text',
  placeholder,
  suffix,
  help,
  disabled = false,
}: {
  label: string
  name: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  suffix?: string
  help?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {help && <p className="mt-1 text-sm text-gray-500">{help}</p>}
    </div>
  )
}

function Textarea({ 
  label, 
  name, 
  value, 
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        name={name}
        value={value ?? ''}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )
}

function Toggle({
  label,
  name,
  checked,
  onChange,
  help,
}: {
  label: string
  name: string
  checked: boolean
  onChange: (checked: boolean) => void
  help?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {help && <p className="text-sm text-gray-500">{help}</p>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const productId = params.id as string

  const [formData, setFormData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newBarcode, setNewBarcode] = useState('')
  const [newBarcodeType, setNewBarcodeType] = useState('ean13')
  const [showBarcodeForm, setShowBarcodeForm] = useState(false)

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId),
  })

  // Initialize form data when product loads
  if (product && !formData) {
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      weightGrams: product.weightGrams || '',
      lengthMm: product.lengthMm || '',
      widthMm: product.widthMm || '',
      heightMm: product.heightMm || '',
      costCents: product.costCents ? (product.costCents / 100).toFixed(2) : '',
      priceCents: product.priceCents ? (product.priceCents / 100).toFixed(2) : '',
      reorderPoint: product.reorderPoint || '',
      reorderQuantity: product.reorderQuantity || '',
      hsCode: product.hsCode || '',
      countryOrigin: product.countryOrigin || '',
      requiresLotTracking: product.requiresLotTracking,
      requiresExpiryTracking: product.requiresExpiryTracking,
      requiresSerialTracking: product.requiresSerialTracking,
      isHazmat: product.isHazmat,
      isActive: product.isActive,
    })
  }

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateProduct(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setHasChanges(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push('/dashboard/products')
    },
  })

  const barcodeMutation = useMutation({
    mutationFn: () => addBarcode(productId, newBarcode, newBarcodeType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      setNewBarcode('')
      setShowBarcodeForm(false)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setHasChanges(true)
  }

  const handleToggle = (name: string, value: boolean) => {
    setFormData({ ...formData, [name]: value })
    setHasChanges(true)
  }

  const handleSave = () => {
    const dataToSave = {
      ...formData,
      weightGrams: formData.weightGrams ? parseInt(formData.weightGrams) : null,
      lengthMm: formData.lengthMm ? parseInt(formData.lengthMm) : null,
      widthMm: formData.widthMm ? parseInt(formData.widthMm) : null,
      heightMm: formData.heightMm ? parseInt(formData.heightMm) : null,
      costCents: formData.costCents ? Math.round(parseFloat(formData.costCents) * 100) : null,
      priceCents: formData.priceCents ? Math.round(parseFloat(formData.priceCents) * 100) : null,
      reorderPoint: formData.reorderPoint ? parseInt(formData.reorderPoint) : null,
      reorderQuantity: formData.reorderQuantity ? parseInt(formData.reorderQuantity) : null,
    }
    updateMutation.mutate(dataToSave)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Produkt nicht gefunden
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Löschen
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {updateMutation.isSuccess && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          Änderungen gespeichert
        </div>
      )}
      {updateMutation.isError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {updateMutation.error.message}
        </div>
      )}

      {formData && (
        <div className="space-y-6">
          {/* Basic Info */}
          <Section title="Grundinformationen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                disabled
                help="SKU kann nicht geändert werden"
              />
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Produktname"
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Beschreibung"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Produktbeschreibung..."
                  rows={4}
                />
              </div>
            </div>
          </Section>

          {/* Barcodes */}
          <Section title="Barcodes">
            <div className="space-y-3">
              {product.barcodes?.map((bc: any) => (
                <div
                  key={bc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Barcode className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-mono font-medium">{bc.barcode}</p>
                      <p className="text-sm text-gray-500">{bc.type.toUpperCase()}</p>
                    </div>
                  </div>
                  {bc.isPrimary && (
                    <span className="px-2 py-1 text-xs bg-brand-100 text-brand-700 rounded">
                      Primär
                    </span>
                  )}
                </div>
              ))}

              {showBarcodeForm ? (
                <div className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      placeholder="Barcode eingeben..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Typ
                    </label>
                    <select
                      value={newBarcodeType}
                      onChange={(e) => setNewBarcodeType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="ean13">EAN-13</option>
                      <option value="upc">UPC</option>
                      <option value="internal">Intern</option>
                      <option value="manufacturer">Hersteller</option>
                    </select>
                  </div>
                  <button
                    onClick={() => barcodeMutation.mutate()}
                    disabled={!newBarcode || barcodeMutation.isPending}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                  >
                    {barcodeMutation.isPending ? '...' : 'Hinzufügen'}
                  </button>
                  <button
                    onClick={() => setShowBarcodeForm(false)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowBarcodeForm(true)}
                  className="flex items-center gap-2 text-brand-600 hover:text-brand-700"
                >
                  <Plus className="w-4 h-4" />
                  Barcode hinzufügen
                </button>
              )}
            </div>
          </Section>

          {/* Dimensions & Weight */}
          <Section title="Masse & Gewicht">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Gewicht"
                name="weightGrams"
                type="number"
                value={formData.weightGrams}
                onChange={handleChange}
                suffix="g"
              />
              <Input
                label="Länge"
                name="lengthMm"
                type="number"
                value={formData.lengthMm}
                onChange={handleChange}
                suffix="mm"
              />
              <Input
                label="Breite"
                name="widthMm"
                type="number"
                value={formData.widthMm}
                onChange={handleChange}
                suffix="mm"
              />
              <Input
                label="Höhe"
                name="heightMm"
                type="number"
                value={formData.heightMm}
                onChange={handleChange}
                suffix="mm"
              />
            </div>
          </Section>

          {/* Pricing */}
          <Section title="Preise">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Einkaufspreis"
                name="costCents"
                type="number"
                value={formData.costCents}
                onChange={handleChange}
                suffix="CHF"
                placeholder="0.00"
              />
              <Input
                label="Verkaufspreis"
                name="priceCents"
                type="number"
                value={formData.priceCents}
                onChange={handleChange}
                suffix="CHF"
                placeholder="0.00"
              />
            </div>
          </Section>

          {/* Inventory Settings */}
          <Section title="Bestandseinstellungen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Meldebestand"
                name="reorderPoint"
                type="number"
                value={formData.reorderPoint}
                onChange={handleChange}
                help="Warnung wenn Bestand unter diesen Wert fällt"
              />
              <Input
                label="Nachbestellmenge"
                name="reorderQuantity"
                type="number"
                value={formData.reorderQuantity}
                onChange={handleChange}
                help="Empfohlene Menge für Nachbestellung"
              />
            </div>
          </Section>

          {/* Tracking Options */}
          <Section title="Tracking-Optionen">
            <div className="space-y-4">
              <Toggle
                label="LOT-Tracking"
                name="requiresLotTracking"
                checked={formData.requiresLotTracking}
                onChange={(v) => handleToggle('requiresLotTracking', v)}
                help="Chargen-/Lotnummern für dieses Produkt erfassen"
              />
              <Toggle
                label="MHD-Tracking"
                name="requiresExpiryTracking"
                checked={formData.requiresExpiryTracking}
                onChange={(v) => handleToggle('requiresExpiryTracking', v)}
                help="Mindesthaltbarkeitsdatum erfassen (FEFO-Kommissionierung)"
              />
              <Toggle
                label="Seriennummern"
                name="requiresSerialTracking"
                checked={formData.requiresSerialTracking}
                onChange={(v) => handleToggle('requiresSerialTracking', v)}
                help="Individuelle Seriennummer pro Einheit erfassen"
              />
              <Toggle
                label="Gefahrgut"
                name="isHazmat"
                checked={formData.isHazmat}
                onChange={(v) => handleToggle('isHazmat', v)}
                help="Produkt erfordert spezielle Handhabung"
              />
            </div>
          </Section>

          {/* Customs */}
          <Section title="Zoll & Herkunft">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="HS-Code"
                name="hsCode"
                value={formData.hsCode}
                onChange={handleChange}
                placeholder="z.B. 6109.10"
                help="Harmonisierter Zolltarif"
              />
              <Input
                label="Ursprungsland"
                name="countryOrigin"
                value={formData.countryOrigin}
                onChange={handleChange}
                placeholder="z.B. CH"
                help="ISO 2-stelliger Ländercode"
              />
            </div>
          </Section>

          {/* Status */}
          <Section title="Status">
            <Toggle
              label="Produkt aktiv"
              name="isActive"
              checked={formData.isActive}
              onChange={(v) => handleToggle('isActive', v)}
              help="Inaktive Produkte werden nicht in Listen angezeigt und können nicht bestellt werden"
            />
          </Section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Produkt löschen?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Möchtest du <strong>{product.name}</strong> wirklich löschen? 
              Das Produkt wird deaktiviert und ist nicht mehr sichtbar.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Abbrechen
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Löschen...' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
