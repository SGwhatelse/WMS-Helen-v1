'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Truck, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

async function fetchWRO(id: string) {
  const res = await fetch(`/api/wros/${id}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch WRO')
  return res.json()
}

async function updateWROStatus(id: string, status: string) {
  const res = await fetch(`/api/wros/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update status')
  return res.json()
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Eingereicht', color: 'bg-blue-100 text-blue-700' },
  awaiting: { label: 'Erwartet', color: 'bg-yellow-100 text-yellow-700' },
  partially_arrived: { label: 'Teilweise angekommen', color: 'bg-orange-100 text-orange-700' },
  arrived: { label: 'Angekommen', color: 'bg-purple-100 text-purple-700' },
  processing: { label: 'In Bearbeitung', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Storniert', color: 'bg-red-100 text-red-700' },
}

export default function WRODetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const wroId = params.id as string

  const { data: wro, isLoading, error } = useQuery({
    queryKey: ['wro', wroId],
    queryFn: () => fetchWRO(wroId),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateWROStatus(wroId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wro', wroId] })
      queryClient.invalidateQueries({ queryKey: ['wros'] })
    },
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !wro) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          WRO nicht gefunden
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[wro.status] || STATUS_CONFIG.draft

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/wareneingang" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{wro.wroNumber}</h1>
            <p className="text-gray-500">Erstellt am {formatDate(wro.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <select
            value={wro.status}
            onChange={(e) => statusMutation.mutate(e.target.value)}
            disabled={statusMutation.isPending}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Entwurf</option>
            <option value="awaiting">Erwartet</option>
            <option value="arrived">Angekommen</option>
            <option value="processing">In Bearbeitung</option>
            <option value="completed">Abgeschlossen</option>
            <option value="cancelled">Storniert</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Erwartete Produkte
              </h2>
            </div>
            {wro.lines?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Keine Produkte</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Produkt</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">SKU</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Erwartet</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Erhalten</th>
                    <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Beschädigt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wro.lines?.map((line: any) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3 font-medium">{line.product?.name || 'Unbekannt'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-sm">{line.product?.sku}</td>
                      <td className="px-4 py-3 text-right">{line.quantityExpected}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{line.quantityReceived}</td>
                      <td className="px-4 py-3 text-right text-red-600">{line.quantityDamaged}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={2} className="px-4 py-2 font-medium">Gesamt</td>
                    <td className="px-4 py-2 text-right font-bold">
                      {wro.lines?.reduce((sum: number, l: any) => sum + l.quantityExpected, 0)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-green-600">
                      {wro.lines?.reduce((sum: number, l: any) => sum + l.quantityReceived, 0)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-red-600">
                      {wro.lines?.reduce((sum: number, l: any) => sum + l.quantityDamaged, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Notes */}
          {wro.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Notizen</h2>
              <p className="text-gray-600">{wro.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              Lieferdetails
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Lager:</span>
                <p className="font-medium">{wro.warehouse?.name}</p>
              </div>
              {wro.supplier && (
                <div>
                  <span className="text-gray-500">Lieferant:</span>
                  <p className="font-medium">{wro.supplier.name}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Tracking:</span>
                <p className="font-medium font-mono">
                  {Array.isArray(wro.trackingNumbers) ? wro.trackingNumbers.join(', ') : '-'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Erwartete Pakete:</span>
                <p className="font-medium">{wro.expectedBoxCount || '-'}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Termine
            </h2>
            <div className="space-y-2 text-sm">
              {wro.expectedArrivalDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Erwartet</span>
                  <span className="font-medium">{formatDate(wro.expectedArrivalDate)}</span>
                </div>
              )}
              {wro.arrivedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Angekommen</span>
                  <span className="font-medium">{formatDate(wro.arrivedAt)}</span>
                </div>
              )}
              {wro.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Abgeschlossen</span>
                  <span className="font-medium">{formatDate(wro.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Aktionen</h2>
            <div className="space-y-2">
              {wro.status === 'awaiting' && (
                <button
                  onClick={() => statusMutation.mutate('arrived')}
                  disabled={statusMutation.isPending}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Als angekommen markieren
                </button>
              )}
              {wro.status === 'arrived' && (
                <button
                  onClick={() => statusMutation.mutate('processing')}
                  disabled={statusMutation.isPending}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Wareneingang starten
                </button>
              )}
              {wro.status === 'processing' && (
                <button
                  onClick={() => statusMutation.mutate('completed')}
                  disabled={statusMutation.isPending}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Abschliessen
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
