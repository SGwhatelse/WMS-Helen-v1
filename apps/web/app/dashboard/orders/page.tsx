'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ShoppingCart, Search, Clock, Package, Truck, CheckCircle, XCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

async function fetchOrders(params: URLSearchParams) {
  const res = await fetch(`/api/orders?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Offen', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'In Bearbeitung', color: 'bg-blue-100 text-blue-700', icon: Package },
  picking: { label: 'Kommissionierung', color: 'bg-blue-100 text-blue-700', icon: Package },
  picked: { label: 'Kommissioniert', color: 'bg-blue-100 text-blue-700', icon: Package },
  packing: { label: 'Verpacken', color: 'bg-purple-100 text-purple-700', icon: Package },
  packed: { label: 'Verpackt', color: 'bg-purple-100 text-purple-700', icon: Package },
  shipped: { label: 'Versendet', color: 'bg-green-100 text-green-700', icon: Truck },
  delivered: { label: 'Zugestellt', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Storniert', color: 'bg-red-100 text-red-700', icon: XCircle },
  on_hold: { label: 'Zurückgestellt', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
  exception: { label: 'Ausnahme', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('limit', '20')
  if (search) params.set('search', search)
  if (status) params.set('status', status)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, status, page],
    queryFn: () => fetchOrders(params),
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const formatCurrency = (cents: number) => (cents / 100).toFixed(2) + ' CHF'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bestellungen</h1>
          <p className="text-gray-500">Alle Bestellungen verwalten</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Offen</p>
          <p className="text-2xl font-bold text-yellow-600">{data?.stats?.pending ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">In Bearbeitung</p>
          <p className="text-2xl font-bold text-blue-600">{data?.stats?.processing ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Versendet</p>
          <p className="text-2xl font-bold text-green-600">{data?.stats?.shipped ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Ausnahmen</p>
          <p className="text-2xl font-bold text-red-600">{data?.stats?.exception ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Heute</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.today ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Bestellnummer oder Kunde suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="pending">Offen</option>
            <option value="processing">In Bearbeitung</option>
            <option value="picking">Kommissionierung</option>
            <option value="packing">Verpacken</option>
            <option value="shipped">Versendet</option>
            <option value="delivered">Zugestellt</option>
            <option value="cancelled">Storniert</option>
            <option value="exception">Ausnahme</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Keine Bestellungen gefunden</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Bestellung</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Datum</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Kunde</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Artikel</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Betrag</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((order: any) => {
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {order.orderNumber}
                        </Link>
                        {order.externalOrderId && <p className="text-xs text-gray-400">Ext: {order.externalOrderId}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.orderPlacedAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{order.shippingFirstName} {order.shippingLastName}</p>
                        <p className="text-sm text-gray-500">{order.shippingCity}, {order.shippingCountryCode}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{order.totalItems || order._count?.lines || 0} Artikel</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(order.totalCents)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />{statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/orders/${order.id}`} className="p-1 text-gray-400 hover:text-gray-600">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {data?.meta && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">Seite {data.meta.page} von {data.meta.totalPages} ({data.meta.total} Bestellungen)</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Zurück</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.meta.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Weiter</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
