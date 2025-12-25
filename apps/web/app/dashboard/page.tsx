'use client'

import { AlertTriangle, Package, Truck, Clock, TrendingUp, TrendingDown, XCircle, ArrowRight, Plus, Search, RotateCcw, Boxes } from 'lucide-react'

export default function DashboardPage() {
  const stats = { openOrders: 24, pickedToday: 18, shippedToday: 42, blockedOrders: 3, onTimeRate: 94.2, avgFulfillmentTime: 4.2, shipmentErrorRate: 1.8, costPerOrder: 8.45, allowanceRate: 2.1, inventoryAccuracy: 98.7, lowStockAlerts: 5 }
  
  const alerts = [
    { id: 1, type: 'warning', title: '3 Bestellungen im Rueckstand', desc: 'SLA-Ziel: 24h ueberschritten', link: '/dashboard/orders' },
    { id: 2, type: 'critical', title: '5 Artikel unter Mindestbestand', desc: 'Nachbestellung empfohlen', link: '/dashboard/bestand' },
    { id: 3, type: 'info', title: 'Carrier-Verzoegerung: Post CH', desc: '+0.5 Tage Lieferzeit aktuell', link: '/dashboard/shipments' },
  ]
  
  const carriers = [
    { name: 'Post CH Priority', days: 1.2, rate: 0.8 },
    { name: 'Post CH Economy', days: 2.8, rate: 1.2 },
    { name: 'A-Post Plus', days: 1.5, rate: 0.5 },
  ]
  
  const lowStock = [
    { sku: 'SKU-001', name: 'Premium Widget', stock: 12, min: 50 },
    { sku: 'SKU-042', name: 'Standard Case', stock: 8, min: 30 },
    { sku: 'SKU-108', name: 'USB-C Kabel 2m', stock: 3, min: 25 },
  ]

  const alertBg = (t: string) => t === 'critical' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : t === 'warning' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <section className="space-y-3">
        {alerts.map((a) => (
          <a key={a.id} href={a.link} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all group">
            <div className={"p-2.5 rounded-xl " + alertBg(a.type)}><AlertTriangle className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{a.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a.desc}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </a>
        ))}
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Bestellungen heute</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Offen</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-lg"><Package className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stats.openOrders}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gepickt</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-500/20 rounded-lg"><Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stats.pickedToday}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Versendet</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/20 rounded-lg"><Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
            </div>
            <p className="text-3xl font-semibold text-gray-900 dark:text-white">{stats.shippedToday}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between mb-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Blockiert</span>
              <div className="p-2 bg-red-50 dark:bg-red-500/20 rounded-lg"><XCircle className="w-4 h-4 text-red-600 dark:text-red-400" /></div>
            </div>
            <p className={"text-3xl font-semibold " + (stats.blockedOrders > 0 ? "text-red-600" : "text-gray-900 dark:text-white")}>{stats.blockedOrders}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <a href="/dashboard/orders/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4" />Neue Bestellung</a>
        <a href="/dashboard/orders" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Search className="w-4 h-4" />Suchen</a>
        <a href="/dashboard/shipments" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Truck className="w-4 h-4" />Sendungen</a>
        <a href="/dashboard/bestand" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><Boxes className="w-4 h-4" />Bestand</a>
        <a href="/dashboard/returns" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"><RotateCcw className="w-4 h-4" />Retouren</a>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Performance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">On-Time Shipping</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={"text-3xl font-semibold " + (stats.onTimeRate >= 95 ? "text-emerald-600" : "text-amber-600")}>{stats.onTimeRate}%</span>
              <span className="text-xs text-emerald-600 flex items-center"><TrendingUp className="w-3 h-3" />+1.2%</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Ziel: 95%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fulfillment</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-semibold text-gray-900 dark:text-white">{stats.avgFulfillmentTime}h</span>
              <span className="text-xs text-emerald-600 flex items-center"><TrendingDown className="w-3 h-3" />-0.3h</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Ziel: 6h</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Fehlerrate</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={"text-3xl font-semibold " + (stats.shipmentErrorRate <= 2 ? "text-emerald-600" : "text-amber-600")}>{stats.shipmentErrorRate}%</span>
              <span className="text-xs text-red-600 flex items-center"><TrendingUp className="w-3 h-3" />+0.2%</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Ziel: 2%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bestandsgenauigkeit</p>
            <p className={"text-3xl font-semibold mt-1 " + (stats.inventoryAccuracy >= 98 ? "text-emerald-600" : "text-amber-600")}>{stats.inventoryAccuracy}%</p>
            <p className="text-xs text-gray-400 mt-2">Ziel: 99%</p>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5">Carrier Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {carriers.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <p className="font-medium text-gray-900 dark:text-white mb-3">{c.name}</p>
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Zustellung</span><span className="font-medium text-gray-900 dark:text-white">{c.days} Tage</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Incidents</span><span className={"font-medium " + (c.rate <= 1 ? "text-emerald-600" : "text-amber-600")}>{c.rate}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-5">Kosten</h3>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Kosten pro Bestellung</span><span className="text-xl font-semibold text-gray-900 dark:text-white">CHF {stats.costPerOrder.toFixed(2)}</span></div>
            <div className="h-px bg-gray-100 dark:bg-gray-700" />
            <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Allowance Rate</span><span className={"text-xl font-semibold " + (stats.allowanceRate <= 2 ? "text-emerald-600" : "text-amber-600")}>{stats.allowanceRate}%</span></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between mb-5">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Low Stock Alerts</h3>
            <span className="px-2.5 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">{stats.lowStockAlerts}</span>
          </div>
          <div className="space-y-4">
            {lowStock.map((item, i) => (
              <div key={i} className="flex justify-between">
                <div><p className="font-medium text-gray-900 dark:text-white">{item.sku}</p><p className="text-sm text-gray-500 dark:text-gray-400">{item.name}</p></div>
                <div className="text-right"><p className="font-semibold text-red-600">{item.stock}</p><p className="text-xs text-gray-400">Min: {item.min}</p></div>
              </div>
            ))}
          </div>
          <a href="/dashboard/bestand" className="flex items-center justify-center gap-2 mt-5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Alle anzeigen <ArrowRight className="w-4 h-4" /></a>
        </div>
      </section>
    </div>
  )
}
