'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Inbox, Search, Plus, ChevronRight } from 'lucide-react'
import Link from 'next/link'

async function fetchWROs(params: URLSearchParams) {
  const res = await fetch(`/api/wros?${params}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch WROs')
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
  on_hold: { label: 'Zurückgestellt', color: 'bg-gray-100 text-gray-700' },
}

export default function WarenEingangPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  params.set('page', page.toString())
  params.set('limit', '20')
  if (search) params.set('search', search)
  if (status) params.set('status', status)

  const { data, isLoading } = useQuery({
    queryKey: ['wros', search, status, page],
    queryFn: () => fetchWROs(params),
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wareneingang</h1>
          <p className="text-gray-500">Wareneingänge (WRO) verwalten</p>
        </div>
        <Link href="/dashboard/wareneingang/neu" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />Neue WRO
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Erwartet</p>
          <p className="text-2xl font-bold text-yellow-600">{data?.stats?.awaiting ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Angekommen</p>
          <p className="text-2xl font-bold text-purple-600">{data?.stats?.arrived ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">In Bearbeitung</p>
          <p className="text-2xl font-bold text-blue-600">{data?.stats?.processing ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Diese Woche</p>
          <p className="text-2xl font-bold text-gray-900">{data?.stats?.thisWeek ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="WRO-Nummer suchen..."
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
            <option value="draft">Entwurf</option>
            <option value="awaiting">Erwartet</option>
            <option value="arrived">Angekommen</option>
            <option value="processing">In Bearbeitung</option>
            <option value="completed">Abgeschlossen</option>
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
            <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Keine Wareneingänge gefunden</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">WRO</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Lieferant</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Lager</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Erwartet am</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Artikel</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.data?.map((wro: any) => {
                  const statusConfig = STATUS_CONFIG[wro.status] || STATUS_CONFIG.draft
                  return (
                    <tr key={wro.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/wareneingang/${wro.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {wro.wroNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{wro.supplier?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{wro.warehouse?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{wro.expectedArrivalDate ? formatDate(wro.expectedArrivalDate) : '-'}</td>
                      <td className="px-4 py-3 text-sm">{wro._count?.lines || wro.lines?.length || 0} Positionen</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusConfig.color}`}>{statusConfig.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/wareneingang/${wro.id}`} className="p-1 text-gray-400 hover:text-gray-600">
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
                <p className="text-sm text-gray-500">Seite {data.meta.page} von {data.meta.totalPages}</p>
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
