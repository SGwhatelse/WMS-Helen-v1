	'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, Search, Users, Package, ShoppingCart } from 'lucide-react'

type Tenant = {
  id: string
  name: string
  slug: string
  status: string
  contactEmail: string
  companyName: string | null
  createdAt: string
  _count: { users: number; products: number; orders: number }
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchTenants()
  }, [search, statusFilter])

  const fetchTenants = async () => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)
    const res = await fetch(`/api/admin/tenants?${params}`, { credentials: 'include' })
    const data = await res.json()
    setTenants(data.data || [])
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    suspended: 'bg-red-500/20 text-red-400',
    onboarding: 'bg-blue-500/20 text-blue-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tenants</h1>
        <Link
          href="/admin/tenants/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Neuer Tenant
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="pending">Ausstehend</option>
          <option value="onboarding">Onboarding</option>
          <option value="suspended">Gesperrt</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Keine Tenants gefunden</div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kontakt</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Users</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Produkte</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <Link href={`/admin/tenants/${tenant.id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white hover:text-blue-400">{tenant.name}</p>
                        <p className="text-sm text-gray-400">{tenant.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColors[tenant.status]}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white">{tenant.companyName || '-'}</p>
                    <p className="text-sm text-gray-400">{tenant.contactEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-300">
                      <Users className="w-4 h-4" />{tenant._count.users}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-300">
                      <Package className="w-4 h-4" />{tenant._count.products}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-300">
                      <ShoppingCart className="w-4 h-4" />{tenant._count.orders}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
