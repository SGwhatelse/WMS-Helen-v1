'use client'

import { useQuery } from '@tanstack/react-query'
import { Package, ShoppingCart, AlertTriangle, Truck, Clock, CheckCircle } from 'lucide-react'

async function fetchOrderStats() {
  const res = await fetch('/api/orders/stats', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

async function fetchInventorySummary() {
  const res = await fetch('/api/inventory/summary', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch inventory')
  return res.json()
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subtitle 
}: { 
  title: string
  value: number | string
  icon: React.ElementType
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  subtitle?: string
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: orderStats, isLoading: ordersLoading } = useQuery({
    queryKey: ['orderStats'],
    queryFn: fetchOrderStats,
  })

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventorySummary'],
    queryFn: fetchInventorySummary,
  })

  const isLoading = ordersLoading || inventoryLoading

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Übersicht über dein Warehouse</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
        <>
          {/* Order Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestellungen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Offen"
                value={orderStats?.pending ?? 0}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                title="In Bearbeitung"
                value={(orderStats?.processing ?? 0) + (orderStats?.picking ?? 0) + (orderStats?.packing ?? 0)}
                icon={Package}
                color="blue"
              />
              <StatCard
                title="Versendet"
                value={orderStats?.shipped ?? 0}
                icon={Truck}
                color="green"
              />
              <StatCard
                title="Ausnahmen"
                value={orderStats?.exception ?? 0}
                icon={AlertTriangle}
                color="red"
              />
            </div>
          </div>

          {/* Inventory Stats */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bestand</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Produkte"
                value={inventoryData?.totals?.totalProducts ?? 0}
                icon={Package}
                color="gray"
              />
              <StatCard
                title="Niedriger Bestand"
                value={inventoryData?.totals?.lowStockCount ?? 0}
                icon={AlertTriangle}
                color="yellow"
              />
              <StatCard
                title="Nicht auf Lager"
                value={inventoryData?.totals?.outOfStockCount ?? 0}
                icon={AlertTriangle}
                color="red"
              />
            </div>
          </div>

          {/* Low Stock Products */}
          {inventoryData?.products?.filter((p: any) => p.isLowStock).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nachbestellung erforderlich</h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Verfügbar</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Meldebestand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventoryData.products
                      .filter((p: any) => p.isLowStock)
                      .slice(0, 5)
                      .map((product: any) => (
                        <tr key={product.productId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">{product.sku}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                          <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                            {product.available}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-500">
                            {product.reorderPoint}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <ShoppingCart className="w-6 h-6 text-brand-600 mb-2" />
                <p className="font-medium text-gray-900">Neue Bestellung</p>
                <p className="text-sm text-gray-500">Manuelle Bestellung erfassen</p>
              </button>
              <button className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Package className="w-6 h-6 text-brand-600 mb-2" />
                <p className="font-medium text-gray-900">Wareneingang</p>
                <p className="text-sm text-gray-500">WRO erstellen</p>
              </button>
              <button className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Truck className="w-6 h-6 text-brand-600 mb-2" />
                <p className="font-medium text-gray-900">Pack Station</p>
                <p className="text-sm text-gray-500">Verpacken starten</p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
