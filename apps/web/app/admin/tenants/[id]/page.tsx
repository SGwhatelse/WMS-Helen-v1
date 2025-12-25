'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, ArrowLeft, Users, FileText, MessageSquare, 
  Mail, Phone, MapPin, Calendar, Edit, Save, X, Plus,
  Send, CheckCircle, Clock, AlertCircle
} from 'lucide-react'

type Tenant = {
  id: string
  name: string
  slug: string
  status: string
  contactEmail: string
  contactPhone: string | null
  companyName: string | null
  vatNumber: string | null
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  countryCode: string
  createdAt: string
  users: Array<{
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
  }>
  _count: { products: number; orders: number; returns: number }
}

type Invoice = {
  id: string
  invoiceNumber: string
  status: string
  amountCents: number
  currency: string
  periodStart: string | null
  periodEnd: string | null
  dueDate: string | null
  createdAt: string
}

type ContactLog = {
  id: string
  channel: string
  subject: string
  content: string | null
  status: string
  contactedAt: string
  contactedByUser: { firstName: string; lastName: string } | null
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [contacts, setContacts] = useState<ContactLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Tenant>>({})

  useEffect(() => {
    fetchTenant()
    fetchInvoices()
    fetchContacts()
  }, [tenantId])

  const fetchTenant = async () => {
    const res = await fetch(`/api/admin/tenants/${tenantId}`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setTenant(data)
      setEditData(data)
    }
    setLoading(false)
  }

  const fetchInvoices = async () => {
    const res = await fetch(`/api/admin/tenants/${tenantId}/invoices?limit=10`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setInvoices(data.data || [])
    }
  }

  const fetchContacts = async () => {
    const res = await fetch(`/api/admin/tenants/${tenantId}/contacts?limit=10`, { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setContacts(data.data || [])
    }
  }

  const handleSave = async () => {
    const res = await fetch(`/api/admin/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editData),
    })
    if (res.ok) {
      const updated = await res.json()
      setTenant({ ...tenant, ...updated })
      setEditing(false)
    }
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
    suspended: 'bg-red-500/20 text-red-400',
    onboarding: 'bg-blue-500/20 text-blue-400',
  }

  const invoiceStatusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
  }

  const contactStatusColors: Record<string, string> = {
    open: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-blue-500/20 text-blue-400',
    resolved: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!tenant) {
    return <div className="text-center py-12 text-gray-400">Tenant nicht gefunden</div>
  }

  const tabs = [
    { id: 'overview', label: 'Übersicht', icon: Building2 },
    { id: 'users', label: 'Benutzer', icon: Users, count: tenant.users.length },
    { id: 'invoices', label: 'Rechnungen', icon: FileText, count: invoices.length },
    { id: 'contacts', label: 'Kontakte', icon: MessageSquare, count: contacts.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/tenants" className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
          <p className="text-gray-400">{tenant.slug}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[tenant.status]}`}>
          {tenant.status}
        </span>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-blue-400 border-blue-400'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && (
              <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Stammdaten</h3>
              {editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="p-2 hover:bg-gray-700 rounded-lg">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={handleSave} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                    <Save className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="p-2 hover:bg-gray-700 rounded-lg">
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Firmenname</label>
                {editing ? (
                  <input
                    value={editData.companyName || ''}
                    onChange={(e) => setEditData({ ...editData, companyName: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-white">{tenant.companyName || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400">UID/VAT</label>
                {editing ? (
                  <input
                    value={editData.vatNumber || ''}
                    onChange={(e) => setEditData({ ...editData, vatNumber: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                ) : (
                  <p className="text-white">{tenant.vatNumber || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-400">Status</label>
                {editing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="active">Aktiv</option>
                    <option value="pending">Ausstehend</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="suspended">Gesperrt</option>
                  </select>
                ) : (
                  <p className="text-white">{tenant.status}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Kontakt</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-white">{tenant.contactEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-white">{tenant.contactPhone || '-'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-white">
                  {tenant.addressLine1 && <p>{tenant.addressLine1}</p>}
                  {tenant.addressLine2 && <p>{tenant.addressLine2}</p>}
                  <p>{tenant.postalCode} {tenant.city}</p>
                  <p>{tenant.countryCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-white">Erstellt: {new Date(tenant.createdAt).toLocaleDateString('de-CH')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Statistiken</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{tenant._count.products}</p>
                <p className="text-sm text-gray-400">Produkte</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{tenant._count.orders}</p>
                <p className="text-sm text-gray-400">Bestellungen</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{tenant._count.returns}</p>
                <p className="text-sm text-gray-400">Retouren</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Benutzer</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Benutzer hinzufügen
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Rolle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tenant.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-white">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 text-gray-300">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-4 h-4" /> Aktiv</span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400"><AlertCircle className="w-4 h-4" /> Inaktiv</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Rechnungen</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Neue Rechnung
            </button>
          </div>
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Keine Rechnungen vorhanden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nummer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Betrag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fällig</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Erstellt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-white font-mono">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${invoiceStatusColors[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-white">
                      {(inv.amountCents / 100).toFixed(2)} {inv.currency}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('de-CH') : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(inv.createdAt).toLocaleDateString('de-CH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-white">Kontaktaufnahmen</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Neuer Eintrag
            </button>
          </div>
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Keine Kontakte vorhanden</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Datum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Kanal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Betreff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Von</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-300">
                      {new Date(contact.contactedAt).toLocaleDateString('de-CH')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">{contact.channel}</span>
                    </td>
                    <td className="px-6 py-4 text-white">{contact.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${contactStatusColors[contact.status]}`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {contact.contactedByUser 
                        ? `${contact.contactedByUser.firstName} ${contact.contactedByUser.lastName}`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
