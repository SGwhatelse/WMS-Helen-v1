'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Package, ShoppingCart, Warehouse, Boxes, RotateCcw, Settings, LogOut, Menu, X, Users, MessageSquare, Building2 } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bestellungen', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Produkte', href: '/dashboard/products', icon: Package },
  { name: 'Bestand', href: '/dashboard/bestand', icon: Boxes },
  { name: 'Wareneingang', href: '/dashboard/wareneingang', icon: Warehouse },
  { name: 'Retouren', href: '/dashboard/retouren', icon: RotateCcw },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
]

const bottomNav = [
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Einstellungen', href: '/dashboard/settings', icon: Settings },
]

type User = { id: string; email: string; firstName: string; lastName: string; role: string }
type Tenant = { id: string; name: string }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Remove dark class on mount to ensure light mode
    document.documentElement.classList.remove('dark')
  }, [])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => { if (!res.ok) throw new Error('Not authenticated'); return res.json() })
      .then(data => { setUser(data.user); setTenant(data.tenant); setLoading(false) })
      .catch(() => router.push('/auth/login'))
  }, [router])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/auth/login')
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  // Colors based on mode
  const bg = darkMode ? 'bg-gray-900' : 'bg-[#F9FAFB]'
  const sidebar = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const header = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const text = darkMode ? 'text-white' : 'text-gray-900'
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-500'
  const navActive = darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
  const navInactive = darkMode ? 'text-gray-400 hover:bg-gray-700/50 hover:text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  const avatar = darkMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
  const border = darkMode ? 'border-gray-700' : 'border-gray-200'

  return (
    <div className={`min-h-screen ${bg}`}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 ${sidebar} border-r transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className={`flex items-center gap-3 px-4 py-5 border-b ${border}`}>
            <div className={`w-10 h-10 ${darkMode ? 'bg-white' : 'bg-gray-900'} rounded-xl flex items-center justify-center`}>
              <Building2 className={`w-5 h-5 ${darkMode ? 'text-gray-900' : 'text-white'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`font-semibold ${text} truncate`}>{tenant?.name || 'WMS'}</h1>
              <p className={`text-xs ${textMuted}`}>Tenant Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? navActive : navInactive}`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className={`px-3 py-4 border-t ${border} space-y-1`}>
            {bottomNav.map((item) => (
              <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${navInactive}`}>
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className={`px-4 py-4 border-t ${border}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${avatar} rounded-full flex items-center justify-center`}>
                <span className="font-medium text-sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${text} truncate`}>{user?.firstName} {user?.lastName}</p>
                <p className={`text-xs ${textMuted} truncate`}>{user?.role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm ${textMuted} hover:${text} rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className={`sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 ${header} border-b`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 ${textMuted} rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className={`text-lg font-semibold ${text}`}>
              {navigation.find(n => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Dark Mode Switch */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${darkMode ? 'left-[26px]' : 'left-0.5'}`}>
                {darkMode ? (
                  <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                ) : (
                  <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                )}
              </span>
            </button>
            {/* Profile */}
            <div className={`flex items-center gap-3 pl-4 border-l ${border}`}>
              <div className={`w-8 h-8 ${avatar} rounded-full flex items-center justify-center`}>
                <span className="text-sm font-medium">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </div>
              <span className={`text-sm font-medium hidden md:inline ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user?.firstName}</span>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  )
}
