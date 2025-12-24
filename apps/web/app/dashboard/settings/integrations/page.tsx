'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { 
  ShoppingBag, Plus, Trash2, RefreshCw, Settings, 
  CheckCircle, XCircle, AlertTriangle, ExternalLink,
  Link as LinkIcon, Unlink
} from 'lucide-react'

async function fetchIntegrations() {
  const res = await fetch('/api/shopify/integrations', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

async function fetchCarrierServices() {
  const res = await fetch('/api/carriers/services', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

async function fetchShippingMappings() {
  const res = await fetch('/api/shopify/shipping-mappings', { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function ShopifyIntegrationsPage() {
  const queryClient = useQueryClient()
  const [shopDomain, setShopDomain] = useState('')
  const [showMappingForm, setShowMappingForm] = useState(false)
  const [newMapping, setNewMapping] = useState({ 
    integrationId: '', 
    externalShippingMethod: '', 
    carrierServiceId: '' 
  })

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['shopify-integrations'],
    queryFn: fetchIntegrations,
  })

  const { data: carrierServices } = useQuery({
    queryKey: ['carrier-services'],
    queryFn: fetchCarrierServices,
  })

  const { data: shippingMappings } = useQuery({
    queryKey: ['shipping-mappings'],
    queryFn: fetchShippingMappings,
  })

  const connectMutation = useMutation({
    mutationFn: async (shop: string) => {
      const res = await fetch(`/api/shopify/install?shop=${shop}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to get install URL')
      return res.json()
    },
    onSuccess: (data) => {
      window.location.href = data.installUrl
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shopify/integrations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to disconnect')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopify-integrations'] })
    },
  })

  const syncProductsMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shopify/integrations/${id}/sync/products`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const syncOrdersMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shopify/integrations/${id}/sync/orders`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const syncInventoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shopify/integrations/${id}/sync/inventory`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Sync failed')
      return res.json()
    },
  })

  const createMappingMutation = useMutation({
    mutationFn: async (data: typeof newMapping) => {
      const res = await fetch('/api/shopify/shipping-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create mapping')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-mappings'] })
      setShowMappingForm(false)
      setNewMapping({ integrationId: '', externalShippingMethod: '', carrierServiceId: '' })
    },
  })

  const deleteMappingMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shopify/shipping-mappings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-mappings'] })
    },
  })

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault()
    let shop = shopDomain.trim()
    if (!shop.includes('.myshopify.com')) {
      shop = `${shop}.myshopify.com`
    }
    connectMutation.mutate(shop)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shopify Integration</h1>
        <p className="text-gray-500">Verbinde deinen Shopify Shop mit dem WMS</p>
      </div>

      {/* Connected Shops */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Verbundene Shops</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : integrations?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Noch kein Shop verbunden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {integrations?.map((integration: any) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{integration.name}</p>
                    <p className="text-sm text-gray-500">{integration.credentials.shop}</p>
                  </div>
                  {integration.isActive ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Aktiv
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Inaktiv
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => syncProductsMutation.mutate(integration.id)}
                    disabled={syncProductsMutation.isPending}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Produkte synchronisieren"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncProductsMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => syncOrdersMutation.mutate(integration.id)}
                    disabled={syncOrdersMutation.isPending}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                    title="Bestellungen synchronisieren"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncOrdersMutation.isPending ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => disconnectMutation.mutate(integration.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Trennen"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Connect New Shop */}
        <form onSubmit={handleConnect} className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Neuen Shop verbinden</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="mein-shop.myshopify.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!shopDomain || connectMutation.isPending}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Verbinden
            </button>
          </div>
        </form>
      </div>

      {/* Shipping Mappings */}
      {integrations?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Versandarten-Mapping</h2>
              <p className="text-sm text-gray-500">Ordne Shopify-Versandarten deinen Carriers zu</p>
            </div>
            <button
              onClick={() => setShowMappingForm(true)}
              className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Mapping hinzufügen
            </button>
          </div>

          {showMappingForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shop</label>
                  <select
                    value={newMapping.integrationId}
                    onChange={(e) => setNewMapping({ ...newMapping, integrationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Wählen...</option>
                    {integrations?.map((i: any) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shopify Versandart</label>
                  <input
                    type="text"
                    value={newMapping.externalShippingMethod}
                    onChange={(e) => setNewMapping({ ...newMapping, externalShippingMethod: e.target.value })}
                    placeholder="z.B. Standard Shipping"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WMS Carrier</label>
                  <select
                    value={newMapping.carrierServiceId}
                    onChange={(e) => setNewMapping({ ...newMapping, carrierServiceId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Wählen...</option>
                    {carrierServices?.map((cs: any) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.carrier.name} - {cs.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setShowMappingForm(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => createMappingMutation.mutate(newMapping)}
                  disabled={!newMapping.integrationId || !newMapping.externalShippingMethod || !newMapping.carrierServiceId}
                  className="px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  Speichern
                </button>
              </div>
            </div>
          )}

          {shippingMappings?.length === 0 ? (
            <p className="text-gray-500 text-sm">Noch keine Mappings definiert</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Shopify Versandart</th>
                  <th className="pb-2">WMS Carrier</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shippingMappings?.map((mapping: any) => (
                  <tr key={mapping.id}>
                    <td className="py-3">{mapping.externalShippingMethod}</td>
                    <td className="py-3">
                      {mapping.carrierService.carrier.name} - {mapping.carrierService.name}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => deleteMappingMutation.mutate(mapping.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
