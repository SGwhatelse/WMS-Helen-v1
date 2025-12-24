'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Package, ShoppingCart, RotateCcw, Truck, TrendingUp } from 'lucide-react'

type Stats = {
  tenants: { total: number; active: number }
  products: number
  orders: number
  returns: number
  pendingWros: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const cards = [
    {
      name: 'Tenants',
      value: stats?.tenants?.total || 0,
      subvalue: `${stats?.tenants?.active || 0} aktiv`,     
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      name: 'Produkte',
      value: stats?.products || 0,
      subvalue: 'Gesamt',
      icon: Package,
      color: 'bg-green-500',
    },
    {
      name: 'Bestellungen',
      value: stats?.orders || 0,
      subvalue: 'Gesamt',
      icon: ShoppingCart,
      color: 'bg-purple-500',
    },
    {
      name: 'Retouren',
      value: stats?.returns || 0,
      subvalue: 'Gesamt',
      icon: RotateCcw,
      color: 'bg-orange-500',
    },
    {
      name: 'Offene WROs',
      value: stats?.pendingWros || 0,
      subvalue: 'Wartend',
      icon: Truck,
      color: 'bg-yellow-500',
    },
  ]

  const quickActions = [
    { name: 'Neuer Tenant', href: '/admin/tenants', icon: Building2, color: 'text-blue-400' },
    { name: 'Inventar', href: '/admin/inventory', icon: Package, color: 'text-green-400' },
    { name: 'Lager', href: '/admin/warehouses', icon: Truck, color: 'text-yellow-400' },
    { name: 'Benutzer', href: '/admin/users', icon: TrendingUp, color: 'text-purple-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.name} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
                <p className="text-sm text-gray-400">{card.name}</p>
                <p className="text-xs text-gray-500">{card.subvalue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Schnellzugriff</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <action.icon className={`w-8 h-8 ${action.color}`} />
              <span className="text-sm text-white">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Umsatz (Coming Soon)</h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            Chart Placeholder
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Aktivität (Coming Soon)</h3>
          <div className="h-48 flex items-center justify-center text-gray-500">
            Timeline Placeholder
          </div>
        </div>
      </div>
    </div>
  )
}
