'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Package, Search, AlertTriangle, MapPin } from 'lucide-react'
import Link from 'next/link'

async function fetchInventory(params: URLSearchParams) {
  const res = await fetch(`/api/inventory?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch inventory')
  return res.json()
}

async function fetchWarehouses() {
  const res = await fetch('/api/warehouses', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch warehouses')
  return res.json()
}

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (warehouseId) params.set('warehouseId', warehouseId)
  if (showLowStock) params.set('lowStock', 'true')

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search, warehouseId, showLowStock],
    queryFn: () => fetchInventory(params),
  })

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses,
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bestand</h1>
        <p className="text-gray-500">Übersicht über deinen Lagerbestand</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Gesamt Artikel</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.totalItems ?? 0}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Verfügbar</p>
              <p className="text-2xl font-bold text-green-600">{data?.summary?.available ?? 0}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Reserviert</p>
              <p className="text-2xl font-bold text-yellow-600">{data?.summary?.reserved ?? 0}</p>
            </div>
            <Package className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Niedriger Bestand</p>
              <p className="text-2xl font-bold text-red-600">{data?.summary?.lowStock ?? 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="SKU oder Produktname suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Lager</option>
            {warehouses?.data?.map((wh: any) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded text-blue-600"
            />
            <span className="text-sm">Nur niedriger Bestand</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 h-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Kein Bestand gefunden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">SKU</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Lagerort</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Bestand</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Reserviert</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Verfügbar</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.data?.map((item: any) => {
                const available = item.quantityOnHand - item.quantityReserved
                const isLow = item.product?.reorderPoint && item.quantityOnHand <= item.product.reorderPoint
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/products/${item.product?.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {item.product?.name || 'Unbekannt'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-600">{item.product?.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{item.location?.code || item.location?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.quantityOnHand}</td>
                    <td className="px-4 py-3 text-right text-yellow-600">{item.quantityReserved}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{available}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                          <AlertTriangle className="w-3 h-3" />Niedrig
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">OK</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
