import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import {
  X, Building2, GitBranch, Users, Activity,
  Plus, Pencil, Trash2, Star, Power, Save,
  RefreshCw, MapPin,
} from 'lucide-react'
import { getCompany, updateCompany } from '../../api/companies'
import { getCompanyBranches, createCompanyBranch, updateCompanyBranch, deleteCompanyBranch } from '../../api/branches'
import { getCompanyUsers, createCompanyUser, updateCompanyUser, deleteCompanyUser } from '../../api/users'
import {
  getCatalogActivities,
  getCompanyActivities,
  addCompanyActivity,
  updateCompanyActivity,
  removeCompanyActivity,
} from '../../api/economicActivities'
import Button  from '../ui/Button'
import Badge   from '../ui/Badge'
import Spinner from '../ui/Spinner'
import Modal   from '../ui/Modal'
import Input   from '../ui/Input'

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'general',    label: 'General',        icon: Building2 },
  { id: 'branches',   label: 'Sucursales',      icon: GitBranch },
  { id: 'users',      label: 'Usuarios',        icon: Users     },
  { id: 'activities', label: 'Act. Económicas', icon: Activity  },
]

const planLabel   = { free: 'Gratuito', basic: 'Básico',   premium: 'Premium'  }
const planType    = { free: 'free',     basic: 'basic',     premium: 'premium'  }
const statusLabel = { active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido' }
const statusType  = { active: 'active', inactive: 'inactive', suspended: 'inactive'   }

function roleBadgeInfo(role) {
  const map = {
    super_admin:    { label: 'Super Admin',      type: 'premium' },
    company_admin:  { label: 'Admin Empresa',    type: 'basic'   },
    branch_manager: { label: 'Gerente Sucursal', type: 'trial'   },
    employee:       { label: 'Empleado',         type: 'default' },
  }
  return map[role] ?? { label: role, type: 'default' }
}

function FormError({ message }) {
  if (!message) return null
  return (
    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
      {message}
    </div>
  )
}

// ─── Tab: General ─────────────────────────────────────────────────────────────

function GeneralTab({ company, onUpdated }) {
  const [apiError, setApiError] = useState('')
  const [success,  setSuccess]  = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: buildDefaults(company),
  })

  function buildDefaults(c) {
    return {
      name:     c.name     ?? '',
      email:    c.email    ?? '',
      phone:    c.phone    ?? '',
      address:  c.address  ?? '',
      city:     c.city     ?? '',
      state:    c.state    ?? '',
      country:  c.country  ?? 'Venezuela',
      timezone: c.timezone ?? 'UTC',
      plan:     c.plan     ?? 'free',
      status:   c.status   ?? 'active',
    }
  }

  useEffect(() => { reset(buildDefaults(company)) }, [company, reset]) // eslint-disable-line

  const onSubmit = async (data) => {
    setApiError('')
    setSuccess(false)
    try {
      await updateCompany(company.id, data)
      setSuccess(true)
      onUpdated()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const msg = err.response?.data?.message
      const fe  = err.response?.data?.errors
      setApiError(fe ? (Object.values(fe)[0]?.[0] ?? msg ?? 'Error al actualizar.') : (msg ?? 'Error al actualizar.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormError message={apiError} />
      {success && (
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          Empresa actualizada exitosamente.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input id="g-name" label="Nombre de la empresa *" error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })} />
        </div>
        <Input id="g-email" label="Correo electrónico *" type="email" error={errors.email?.message}
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
          })} />
        <Input id="g-phone" label="Teléfono" type="tel" {...register('phone')} />
      </div>

      <Input id="g-address" label="Dirección" {...register('address')} />

      <div className="grid grid-cols-2 gap-3">
        <Input id="g-city"    label="Ciudad"       {...register('city')} />
        <Input id="g-state"   label="Estado"       {...register('state')} />
        <Input id="g-country" label="País"         {...register('country')} />
        <Input id="g-tz"      label="Zona horaria" {...register('timezone')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Plan</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('plan')}>
            <option value="free">Gratuito</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('status')}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
      </div>

      <div className="pt-1 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-400">
        <span>Slug: <span className="font-mono text-gray-500">{company.slug}</span></span>
        <span>Creada: {company.created_at ? new Date(company.created_at).toLocaleDateString('es-VE') : '—'}</span>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          <Save size={14} />
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}

// ─── Tab: Sucursales ──────────────────────────────────────────────────────────

function BranchForm({ initial, companyId, onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const isEdit = !!initial

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial
      ? { name: initial.name, address: initial.address ?? '', city: initial.city ?? '',
          state: initial.state ?? '', phone: initial.phone ?? '', email: initial.email ?? '',
          status: initial.status ?? 'active', is_default: initial.is_default ?? false }
      : { status: 'active', is_default: false },
  })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      if (isEdit) await updateCompanyBranch(companyId, initial.id, data)
      else        await createCompanyBranch(companyId, data)
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fe  = err.response?.data?.errors
      setApiError(fe ? (Object.values(fe)[0]?.[0] ?? msg ?? 'Error.') : (msg ?? 'Error.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormError message={apiError} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input id="b-name" label="Nombre *" error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })} />
        </div>
        <div className="col-span-2">
          <Input id="b-addr" label="Dirección" {...register('address')} />
        </div>
        <Input id="b-city"  label="Ciudad"   {...register('city')} />
        <Input id="b-state" label="Estado"   {...register('state')} />
        <Input id="b-phone" label="Teléfono" {...register('phone')} />
        <Input id="b-email" label="Correo"   type="email" {...register('email')} />
      </div>
      <div className="grid grid-cols-2 gap-3 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('status')}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <label className="flex items-center gap-2 mt-5 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" {...register('is_default')} />
          <span className="text-sm text-gray-700">Sucursal principal</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" loading={isSubmitting}>{isEdit ? 'Guardar' : 'Crear sucursal'}</Button>
      </div>
    </form>
  )
}

function BranchesTab({ companyId }) {
  const [branches, setBranches] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,   setDeleteError]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getCompanyBranches(companyId)
      .then(({ data }) => setBranches(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteCompanyBranch(companyId, deleting.id)
      setDeleting(null)
      load()
    } catch (err) {
      setDeleteError(err.response?.data?.message ?? 'Error al eliminar la sucursal.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <div className="py-12"><Spinner /></div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{branches.length} sucursal{branches.length !== 1 ? 'es' : ''}</p>
        <div className="flex gap-2">
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar"><RefreshCw size={13} /></button>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditing(null) }}><Plus size={13} />Nueva sucursal</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border border-brand-200 bg-brand-50/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Nueva sucursal</p>
          <BranchForm companyId={companyId} onSuccess={() => { setShowAdd(false); load() }} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {branches.length === 0 && !showAdd ? (
        <div className="py-10 text-center">
          <GitBranch size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Aún no hay sucursales registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {branches.map((b) => (
            <div key={b.id}>
              {editing?.id === b.id ? (
                <div className="border border-brand-200 bg-brand-50/30 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Editar: {b.name}</p>
                  <BranchForm initial={b} companyId={companyId} onSuccess={() => { setEditing(null); load() }} onCancel={() => setEditing(null)} />
                </div>
              ) : (
                <div className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500 shrink-0"><MapPin size={13} /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{b.name}</p>
                        {b.is_default && <Badge label="Principal" type="active" />}
                        <Badge label={b.status === 'active' ? 'Activo' : 'Inactivo'} type={b.status === 'active' ? 'active' : 'inactive'} />
                      </div>
                      {b.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{b.address}{b.city ? `, ${b.city}` : ''}</p>}
                      {b.phone   && <p className="text-xs text-gray-400">{b.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => { setEditing(b); setShowAdd(false) }} className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition" title="Editar"><Pencil size={13} /></button>
                    {!b.is_default && (
                      <button onClick={() => { setDeleting(b); setDeleteError('') }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar"><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar sucursal" size="sm">
        {deleting && (
          <div className="space-y-4">
            <FormError message={deleteError} />
            <p className="text-sm text-gray-600">¿Eliminar la sucursal <span className="font-semibold text-gray-900">{deleting.name}</span>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Tab: Usuarios ────────────────────────────────────────────────────────────

function UserForm({ initial, companyId, onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const isEdit = !!initial

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial
      ? { name: initial.name, email: initial.email, role: initial.role, is_active: initial.is_active }
      : { role: 'employee', is_active: true },
  })

  const onSubmit = async (data) => {
    setApiError('')
    if (isEdit && !data.password) delete data.password
    try {
      if (isEdit) await updateCompanyUser(companyId, initial.id, data)
      else        await createCompanyUser(companyId, data)
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fe  = err.response?.data?.errors
      setApiError(fe ? (Object.values(fe)[0]?.[0] ?? msg ?? 'Error.') : (msg ?? 'Error.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormError message={apiError} />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Input id="u-name" label="Nombre completo *" error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })} />
        </div>
        <Input id="u-email" label="Correo *" type="email" error={errors.email?.message}
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
          })} />
        <Input id="u-pass" label={isEdit ? 'Nueva contraseña' : 'Contraseña *'} type="password"
          placeholder={isEdit ? 'Dejar en blanco para no cambiar' : 'Mínimo 8 caracteres'}
          error={errors.password?.message}
          {...register('password', {
            ...(!isEdit ? { required: 'La contraseña es obligatoria' } : {}),
            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
          })} />
      </div>
      <div className="grid grid-cols-2 gap-3 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Rol *</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('role', { required: true })}>
            <option value="company_admin">Admin Empresa</option>
            <option value="branch_manager">Gerente Sucursal</option>
            <option value="employee">Empleado</option>
          </select>
        </div>
        <label className="flex items-center gap-2 mt-5 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" {...register('is_active')} />
          <span className="text-sm text-gray-700">Usuario activo</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" loading={isSubmitting}>{isEdit ? 'Guardar' : 'Crear usuario'}</Button>
      </div>
    </form>
  )
}

function UsersTab({ companyId }) {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCompanyUsers(companyId, { per_page: 100 })
      .then(({ data }) => setUsers(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteCompanyUser(companyId, deleting.id)
      setDeleting(null)
      load()
    } catch { /* ignore */ } finally { setDeleteLoading(false) }
  }

  const handleToggleActive = async (u) => {
    try { await updateCompanyUser(companyId, u.id, { is_active: !u.is_active }); load() } catch { /* ignore */ }
  }

  if (loading) return <div className="py-12"><Spinner /></div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar"><RefreshCw size={13} /></button>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditing(null) }}><Plus size={13} />Nuevo usuario</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border border-brand-200 bg-brand-50/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Nuevo usuario</p>
          <UserForm companyId={companyId} onSuccess={() => { setShowAdd(false); load() }} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {users.length === 0 && !showAdd ? (
        <div className="py-10 text-center">
          <Users size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Aún no hay usuarios en esta empresa</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const { label: roleLabel, type: roleType } = roleBadgeInfo(u.role)
            return (
              <div key={u.id}>
                {editing?.id === u.id ? (
                  <div className="border border-brand-200 bg-brand-50/30 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Editar: {u.name}</p>
                    <UserForm initial={u} companyId={companyId} onSuccess={() => { setEditing(null); load() }} onCancel={() => setEditing(null)} />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{u.name}</p>
                        <Badge label={roleLabel} type={roleType} />
                        <Badge label={u.is_active ? 'Activo' : 'Inactivo'} type={u.is_active ? 'active' : 'inactive'} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-lg transition ${u.is_active ? 'text-gray-300 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-300 hover:text-green-600 hover:bg-green-50'}`} title={u.is_active ? 'Desactivar' : 'Activar'}><Power size={13} /></button>
                      <button onClick={() => { setEditing(u); setShowAdd(false) }} className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition" title="Editar"><Pencil size={13} /></button>
                      <button onClick={() => setDeleting(u)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar usuario" size="sm">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">¿Eliminar al usuario <span className="font-semibold">{deleting.name}</span>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Tab: Actividades Económicas ──────────────────────────────────────────────

function AddActivityForm({ companyId, existingIds, onSuccess, onCancel }) {
  const [catalog,    setCatalog]    = useState([])
  const [selected,   setSelected]   = useState('')
  const [isPrimary,  setIsPrimary]  = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [loadingCat, setLoadingCat] = useState(true)
  const [apiError,   setApiError]   = useState('')

  useEffect(() => {
    getCatalogActivities()
      .then(({ data }) => setCatalog(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCat(false))
  }, [])

  const available = catalog.filter((a) => !existingIds.includes(a.id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) { setApiError('Selecciona una actividad.'); return }
    setApiError('')
    setLoading(true)
    try {
      await addCompanyActivity(companyId, { cat_mhactividad_id: Number(selected), is_primary: isPrimary })
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fe  = err.response?.data?.errors
      setApiError(fe ? (Object.values(fe)[0]?.[0] ?? msg ?? 'Error.') : (msg ?? 'Error.'))
    } finally { setLoading(false) }
  }

  if (loadingCat) return <div className="py-4"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormError message={apiError} />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Actividad económica *</label>
        {available.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay actividades disponibles para asignar.</p>
        ) : (
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">Seleccionar...</option>
            {available.map((a) => <option key={a.id} value={a.id}>{a.codigo} – {a.descripcion}</option>)}
          </select>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="h-4 w-4 accent-brand-500" />
        <span className="text-sm text-gray-700">Marcar como actividad principal</span>
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" type="button" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" loading={loading} disabled={available.length === 0}>Agregar</Button>
      </div>
    </form>
  )
}

function ActivitiesTab({ companyId }) {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getCompanyActivities(companyId)
      .then(({ data }) => setActivities(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load() }, [load])

  const handleTogglePrimary = async (a) => {
    if (a.is_primary) return
    setTogglingId(a.id)
    try { await updateCompanyActivity(companyId, a.id, { is_primary: true }); load() }
    finally { setTogglingId(null) }
  }

  const handleRemove = async (a) => {
    setRemovingId(a.id)
    try { await removeCompanyActivity(companyId, a.id); load() }
    finally { setRemovingId(null) }
  }

  const existingIds = activities.map((a) => a.cat_mhactividad_id)

  if (loading) return <div className="py-12"><Spinner /></div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{activities.length} actividad{activities.length !== 1 ? 'es' : ''} asignada{activities.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar"><RefreshCw size={13} /></button>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} />Agregar</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border border-brand-200 bg-brand-50/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Agregar actividad económica</p>
          <AddActivityForm companyId={companyId} existingIds={existingIds} onSuccess={() => { setShowAdd(false); load() }} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {activities.length === 0 && !showAdd ? (
        <div className="py-10 text-center">
          <Activity size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Aún no hay actividades económicas asignadas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition">
              <div className="min-w-0 flex items-start gap-3">
                <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded shrink-0">{a.actividad?.codigo ?? '—'}</span>
                <div>
                  <p className="text-sm text-gray-700 leading-snug">{a.actividad?.descripcion ?? '—'}</p>
                  <div className="mt-1">
                    <Badge label={a.is_primary ? 'Principal' : 'Secundaria'} type={a.is_primary ? 'active' : 'default'} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {!a.is_primary && (
                  <button onClick={() => handleTogglePrimary(a)} disabled={togglingId === a.id} className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition disabled:opacity-50" title="Marcar como principal"><Star size={13} /></button>
                )}
                <button onClick={() => handleRemove(a)} disabled={removingId === a.id} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50" title="Quitar actividad"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function CompanyDetailPanel({ companyId, onClose, onUpdated }) {
  const [company,   setCompany]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  const loadCompany = useCallback(() => {
    if (!companyId) return
    setLoading(true)
    getCompany(companyId)
      .then(({ data }) => setCompany(data.company))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => {
    setActiveTab('general')
    loadCompany()
  }, [companyId, loadCompany])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleGeneralUpdated = () => {
    loadCompany()
    onUpdated?.()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Sliding panel */}
      <div className="fixed right-0 top-0 h-full z-40 w-full max-w-2xl bg-white shadow-2xl flex flex-col border-l border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          {loading || !company ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-brand-50 text-brand-600 shrink-0"><Building2 size={18} /></div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{company.name}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">{company.slug}</span>
                  <Badge label={planLabel[company.plan] ?? company.plan} type={planType[company.plan] ?? 'default'} />
                  <Badge label={statusLabel[company.status] ?? company.status} type={statusType[company.status] ?? 'default'} />
                </div>
              </div>
            </div>
          )}
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0 ml-3" title="Cerrar (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-2 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap ${
                  isActive ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-16"><Spinner /></div>
          ) : !company ? (
            <div className="py-16 text-center text-sm text-gray-400">No se pudo cargar la empresa.</div>
          ) : (
            <>
              {activeTab === 'general'    && <GeneralTab    company={company} onUpdated={handleGeneralUpdated} />}
              {activeTab === 'branches'   && <BranchesTab   companyId={company.id} />}
              {activeTab === 'users'      && <UsersTab      companyId={company.id} />}
              {activeTab === 'activities' && <ActivitiesTab companyId={company.id} />}
            </>
          )}
        </div>
      </div>
    </>
  )
}
