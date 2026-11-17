import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, Save, Upload, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isValidPincode } from '@/lib/utils'
import { useAdminAuth } from '@/hooks/useAdminAuth'

type SettingKey =
  | 'store_name' | 'announcement_text' | 'announcement_visible'
  | 'upi_id' | 'contact_email' | 'instagram_url'
  | 'default_shipping_rate_paise' | 'upi_qr_path'

function useSettingValue(key: SettingKey) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: async () => {
      const { data } = await supabase.from('store_settings').select('value').eq('key', key).single()
      return data?.value
    },
  })
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-sm border border-gray-200 p-5">
      <h2 className="font-medium text-plum font-dm-sans mb-4 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

// SettingField is defined OUTSIDE AdminSettingsPage to avoid hook remount bug
interface SettingFieldProps {
  label: string
  settingKey: SettingKey
  type?: string
  defaultValue?: unknown
  saving: string | null
  onSave: (key: string, value: unknown) => void
}

function SettingField({ label, settingKey, type = 'text', defaultValue, saving, onSave }: SettingFieldProps) {
  const [localVal, setLocalVal] = useState<string>(
    type === 'checkbox' ? String(defaultValue ?? false) : String(defaultValue ?? '')
  )
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="block text-sm font-medium text-plum font-dm-sans mb-1.5">{label}</label>
        {type === 'checkbox' ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={Boolean(defaultValue)}
              onChange={(e) => setLocalVal(String(e.target.checked))}
              className="rounded border-soft-line text-dusty-pink"
            />
            <span className="text-sm font-dm-sans text-plum">Visible</span>
          </label>
        ) : (
          <input
            type={type}
            defaultValue={String(defaultValue ?? '')}
            onChange={(e) => setLocalVal(e.target.value)}
            className="input-base"
          />
        )}
      </div>
      <button
        onClick={() => onSave(settingKey, type === 'checkbox' ? localVal === 'true' : localVal)}
        disabled={saving === settingKey}
        className="btn-secondary text-xs mt-auto"
      >
        {saving === settingKey ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const qc = useQueryClient()
  const { adminProfile } = useAdminAuth()
  const [saving, setSaving] = useState<string | null>(null)

  // Store info
  const { data: storeName } = useSettingValue('store_name')
  const { data: contactEmail } = useSettingValue('contact_email')
  const { data: instagramUrl } = useSettingValue('instagram_url')

  // Announcement
  const { data: announcementText } = useSettingValue('announcement_text')
  const { data: announcementVisible } = useSettingValue('announcement_visible')

  // UPI
  const { data: upiId } = useSettingValue('upi_id')
  const { data: upiQrPath, refetch: refetchQrPath } = useSettingValue('upi_qr_path')

  // QR upload state
  const qrFileRef = useRef<HTMLInputElement>(null)
  const [qrUploading, setQrUploading] = useState(false)
  const [qrUploadStatus, setQrUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleQrUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setQrUploadStatus('error')
      return
    }
    setQrUploading(true)
    setQrUploadStatus('idle')
    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `upi-qr/upi_qr.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError
      await supabase.from('store_settings').upsert(
        { key: 'upi_qr_path', value: path, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      await refetchQrPath()
      qc.invalidateQueries({ queryKey: ['setting', 'upi_qr_path'] })
      qc.invalidateQueries({ queryKey: ['store-setting', 'upi_qr_path'] })
      setQrUploadStatus('success')
    } catch {
      setQrUploadStatus('error')
    } finally {
      setQrUploading(false)
      if (qrFileRef.current) qrFileRef.current.value = ''
    }
  }

  // Build public URL for existing QR
  const qrPublicUrl = upiQrPath
    ? supabase.storage.from('store-assets').getPublicUrl(upiQrPath as string).data.publicUrl
    : null

  // Pincodes
  const { data: pincodes, isLoading: pincodesLoading } = useQuery({
    queryKey: ['admin-pincodes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('serviceable_pincodes').select('*').order('pincode')
      if (error) throw error
      return data ?? []
    },
  })

  async function saveSetting(key: string, value: unknown) {
    setSaving(key)
    try {
      await supabase.from('store_settings').upsert(
        { key, value, updated_by: adminProfile?.id ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      qc.invalidateQueries({ queryKey: ['setting', key] })
      qc.invalidateQueries({ queryKey: ['store-setting', key] })
    } finally {
      setSaving(null)
    }
  }

  // Pincode form
  const [newPin, setNewPin] = useState({ pincode: '', area_name: '', city: '', state: '', shipping_rate_rupees: '', min_days: '1', max_days: '5' })
  const [pinError, setPinError] = useState('')

  const addPinMutation = useMutation({
    mutationFn: async () => {
      if (!isValidPincode(newPin.pincode)) { setPinError('Invalid PIN code'); return }
      setPinError('')
      const { error } = await supabase.from('serviceable_pincodes').upsert({
        pincode: newPin.pincode.trim(),
        area_name: newPin.area_name || null,
        city: newPin.city || null,
        state: newPin.state || 'Telangana',
        shipping_rate_paise: Math.round(Number(newPin.shipping_rate_rupees || '0') * 100),
        estimated_days_min: Number(newPin.min_days),
        estimated_days_max: Number(newPin.max_days),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'pincode' })
      if (error) throw error
      setNewPin({ pincode: '', area_name: '', city: '', state: '', shipping_rate_rupees: '', min_days: '1', max_days: '5' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pincodes'] }),
  })

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('serviceable_pincodes').update({ is_active: active, updated_at: new Date().toISOString() }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pincodes'] }),
  })

  const deletePinMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('serviceable_pincodes').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pincodes'] }),
  })

  return (
    <div>
      <h1 className="font-fraunces text-2xl font-medium text-plum mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Store info */}
        <SettingSection title="Store Information">
          <div className="space-y-4">
            <SettingField label="Store Name" settingKey="store_name" defaultValue={storeName} saving={saving} onSave={saveSetting} />
            <SettingField label="Contact Email" settingKey="contact_email" type="email" defaultValue={contactEmail} saving={saving} onSave={saveSetting} />
            <SettingField label="Instagram URL" settingKey="instagram_url" type="url" defaultValue={instagramUrl} saving={saving} onSave={saveSetting} />
          </div>
        </SettingSection>

        {/* Announcement */}
        <SettingSection title="Announcement Strip">
          <div className="space-y-4">
            <SettingField label="Announcement Text" settingKey="announcement_text" defaultValue={announcementText} saving={saving} onSave={saveSetting} />
            <SettingField label="Announcement Visible" settingKey="announcement_visible" type="checkbox" defaultValue={announcementVisible} saving={saving} onSave={saveSetting} />
          </div>
        </SettingSection>

        {/* UPI */}
        <SettingSection title="UPI Payment">
          <div className="space-y-4">
            <SettingField label="UPI ID (shown to customers after order)" settingKey="upi_id" defaultValue={upiId} saving={saving} onSave={saveSetting} />
            <div>
              <p className="text-sm font-medium text-plum font-dm-sans mb-1.5">UPI QR Code</p>

              {/* Current QR preview */}
              {qrPublicUrl && (
                <div className="mb-3 flex items-start gap-4">
                  <img
                    src={qrPublicUrl}
                    alt="UPI QR Code"
                    className="w-32 h-32 object-contain border border-soft-line rounded-sm bg-white p-1"
                  />
                  <div className="text-xs text-plum/50 font-dm-sans pt-1">
                    <p className="font-medium text-green-600 flex items-center gap-1 mb-1">
                      <CheckCircle className="h-3.5 w-3.5" /> QR uploaded
                    </p>
                    <p>Shown to customers on the payment screen.</p>
                    <p className="mt-1 break-all text-plum/40">{upiQrPath as string}</p>
                  </div>
                </div>
              )}

              {/* Upload area */}
              <div
                className="border-2 border-dashed border-soft-line rounded-sm p-5 text-center cursor-pointer hover:border-dusty-pink transition-colors"
                onClick={() => qrFileRef.current?.click()}
              >
                {qrUploading ? (
                  <div className="flex flex-col items-center gap-2 text-plum/50">
                    <Loader2 className="h-6 w-6 animate-spin text-dusty-pink" />
                    <span className="text-sm font-dm-sans">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-plum/50">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-dm-sans">
                      {qrPublicUrl ? 'Replace QR image' : 'Upload UPI QR image'}
                    </span>
                    <span className="text-xs font-dm-sans text-plum/30">PNG, JPG or SVG · max 2 MB</span>
                  </div>
                )}
              </div>

              {/* Status feedback */}
              {qrUploadStatus === 'success' && (
                <p className="mt-2 text-xs text-green-600 font-dm-sans flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" /> QR image saved successfully.
                </p>
              )}
              {qrUploadStatus === 'error' && (
                <p className="mt-2 text-xs text-red-600 font-dm-sans flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> Upload failed. Please try again with a valid image file.
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={qrFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
            </div>
          </div>
        </SettingSection>

        {/* Serviceable pincodes */}
        <SettingSection title="Serviceable PIN Codes & Shipping Rates">
          <div className="space-y-4">
            {/* Add new */}
            <div className="bg-gray-50 rounded-sm p-4 space-y-3">
              <p className="text-sm font-medium text-plum font-dm-sans">Add / Update PIN Code</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-plum/60 font-dm-sans mb-1">PIN Code *</label>
                  <input value={newPin.pincode} onChange={(e) => setNewPin((p) => ({ ...p, pincode: e.target.value }))} maxLength={6} className="input-base text-sm font-mono" placeholder="500001" />
                </div>
                <div>
                  <label className="block text-xs text-plum/60 font-dm-sans mb-1">Area Name</label>
                  <input value={newPin.area_name} onChange={(e) => setNewPin((p) => ({ ...p, area_name: e.target.value }))} className="input-base text-sm" placeholder="Gachibowli" />
                </div>
                <div>
                  <label className="block text-xs text-plum/60 font-dm-sans mb-1">City</label>
                  <input value={newPin.city} onChange={(e) => setNewPin((p) => ({ ...p, city: e.target.value }))} className="input-base text-sm" placeholder="Hyderabad" />
                </div>
                <div>
                  <label className="block text-xs text-plum/60 font-dm-sans mb-1">State</label>
                  <input value={newPin.state} onChange={(e) => setNewPin((p) => ({ ...p, state: e.target.value }))} className="input-base text-sm" placeholder="Telangana" />
                </div>
                <div>
                  <label className="block text-xs text-plum/60 font-dm-sans mb-1">Shipping Rate (₹)</label>
                  <input value={newPin.shipping_rate_rupees} onChange={(e) => setNewPin((p) => ({ ...p, shipping_rate_rupees: e.target.value }))} type="number" min="0" className="input-base text-sm" placeholder="49" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-plum/60 font-dm-sans mb-1">Days (min–max)</label>
                    <div className="flex gap-1">
                      <input value={newPin.min_days} onChange={(e) => setNewPin((p) => ({ ...p, min_days: e.target.value }))} type="number" min="1" className="input-base text-sm w-16" />
                      <span className="self-center text-plum/40">–</span>
                      <input value={newPin.max_days} onChange={(e) => setNewPin((p) => ({ ...p, max_days: e.target.value }))} type="number" min="1" className="input-base text-sm w-16" />
                    </div>
                  </div>
                </div>
              </div>
              {pinError && <p className="text-xs text-red-600 font-dm-sans">{pinError}</p>}
              <button
                onClick={() => addPinMutation.mutate()}
                disabled={!newPin.pincode || addPinMutation.isPending}
                className="btn-primary text-sm"
              >
                {addPinMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add PIN Code
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border border-gray-200">
                    <th className="text-left px-3 py-2.5 font-medium text-plum/60 font-dm-sans">PIN</th>
                    <th className="text-left px-3 py-2.5 font-medium text-plum/60 font-dm-sans">Area</th>
                    <th className="text-left px-3 py-2.5 font-medium text-plum/60 font-dm-sans">City / State</th>
                    <th className="text-left px-3 py-2.5 font-medium text-plum/60 font-dm-sans">Rate</th>
                    <th className="text-left px-3 py-2.5 font-medium text-plum/60 font-dm-sans">Days</th>
                    <th className="text-left px-3 py-2.5 font-medium text-plum/60 font-dm-sans">Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pincodesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-3 py-2.5"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>)}</tr>)
                  ) : (pincodes ?? []).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-mono text-sm text-plum font-medium">{p.pincode}</td>
                      <td className="px-3 py-2.5 text-plum/70 font-dm-sans text-xs">{p.area_name ?? '—'}</td>
                      <td className="px-3 py-2.5 text-plum/60 font-dm-sans text-xs">{[p.city, p.state].filter(Boolean).join(', ')}</td>
                      <td className="px-3 py-2.5 font-dm-sans text-plum">₹{(p.shipping_rate_paise / 100).toFixed(0)}</td>
                      <td className="px-3 py-2.5 font-dm-sans text-plum/60 text-xs">{p.estimated_days_min}–{p.estimated_days_max}d</td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => togglePinMutation.mutate({ id: p.id, active: !p.is_active })}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {p.is_active ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <button onClick={() => deletePinMutation.mutate(p.id)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
