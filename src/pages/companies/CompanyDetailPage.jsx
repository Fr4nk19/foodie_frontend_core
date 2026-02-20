import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft, Building2, GitBranch, Users, Activity,
  Plus, Pencil, Trash2, Star, Power, Save, RefreshCw,
  MapPin, Warehouse, AlertTriangle, Package, ChevronRight,
} from 'lucide-react'
import { getCompany, updateCompany }                          from '../../api/companies'
import { getCompanyBranches, createCompanyBranch, updateCompanyBranch, deleteCompanyBranch } from '../../api/branches'
import { getCompanyUsers, createCompanyUser, updateCompanyUser, deleteCompanyUser }           from '../../api/users'
import { getDepartamentos }  from '../../api/departamentos'
import { getMunicipios }     from '../../api/municipios'
import { getCatalogActivities, getCompanyActivities, addCompanyActivity, updateCompanyActivity, removeCompanyActivity } from '../../api/economicActivities'
import { getCompanyProducts } from '../../api/products'
import { getBranchInventory, addBranchInventory, updateBranchInventory, deleteBranchInventory } from '../../api/inventory'
import { getUnidadesDeMedida } from '../../api/unidadesDeMedida'
import Button   from '../../components/ui/Button'
import Badge    from '../../components/ui/Badge'
import Spinner  from '../../components/ui/Spinner'
import Modal    from '../../components/ui/Modal'
import Input    from '../../components/ui/Input'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const planLabel   = { free: 'Gratuito', basic: 'Básico', premium: 'Premium' }
const planType    = { free: 'free', basic: 'basic', premium: 'premium' }
const statusLabel = { active: 'Activo', inactive: 'Inactivo', suspended: 'Suspendido' }
const statusType  = { active: 'active', inactive: 'inactive', suspended: 'inactive' }

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
    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
      {message}
    </div>
  )
}

// ─── GEO selects (reusable) ───────────────────────────────────────────────────

function GeoSelects({ selectedDeptId, selectedMuniId, onDeptChange, onMuniChange, departamentos, municipios }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Departamento</label>
        <select
          value={selectedDeptId}
          onChange={(e) => onDeptChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Sin seleccionar</option>
          {departamentos.map((d) => (
            <option key={d.id} value={String(d.id)}>{d.codigo} – {d.descripcion}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Municipio</label>
        <select
          value={selectedMuniId}
          onChange={(e) => onMuniChange(e.target.value)}
          disabled={!selectedDeptId}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">{selectedDeptId ? 'Sin seleccionar' : 'Seleccione un departamento primero'}</option>
          {municipios.map((m) => (
            <option key={m.id} value={String(m.id)}>{m.codigo} – {m.descripcion}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function useGeo(initialDeptId = '') {
  const [departamentos, setDepartamentos] = useState([])
  const [municipios,    setMunicipios]    = useState([])

  useEffect(() => {
    getDepartamentos({ per_page: 500 })
      .then(({ data }) => setDepartamentos(data.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!initialDeptId) { setMunicipios([]); return }
    getMunicipios({ departamento_id: initialDeptId, per_page: 500 })
      .then(({ data }) => setMunicipios(data.data ?? []))
      .catch(() => {})
  }, [initialDeptId])

  return { departamentos, municipios, setMunicipios }
}

// ─── Tab: General ─────────────────────────────────────────────────────────────

function GeneralTab({ company, onUpdated }) {
  const [apiError, setApiError] = useState('')
  const [success,  setSuccess]  = useState(false)

  function buildDefaults(c) {
    return {
      name:    c.name    ?? '', email:   c.email   ?? '', phone:   c.phone   ?? '',
      address: c.address ?? '', city:    c.city     ?? '', state:   c.state   ?? '',
      country: c.country ?? 'Honduras', timezone: c.timezone ?? 'UTC',
      plan:    c.plan    ?? 'free', status: c.status ?? 'active',
      cat_mh_departamento_id: c.cat_mh_departamento_id ? String(c.cat_mh_departamento_id) : '',
      cat_mh_municipio_id:    c.cat_mh_municipio_id    ? String(c.cat_mh_municipio_id)    : '',
    }
  }

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: buildDefaults(company),
  })

  const selectedDeptId = watch('cat_mh_departamento_id')
  const selectedMuniId = watch('cat_mh_municipio_id')

  useEffect(() => { reset(buildDefaults(company)) }, [company]) // eslint-disable-line

  const { departamentos, municipios } = useGeo(selectedDeptId)

  const onSubmit = async (rawData) => {
    setApiError(''); setSuccess(false)
    const data = {
      ...rawData,
      cat_mh_departamento_id: rawData.cat_mh_departamento_id || null,
      cat_mh_municipio_id:    rawData.cat_mh_municipio_id    || null,
    }
    try {
      await updateCompany(company.id, data)
      setSuccess(true)
      onUpdated()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const fe = err.response?.data?.errors
      setApiError(fe ? Object.values(fe)[0]?.[0] : (err.response?.data?.message ?? 'Error al actualizar.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <FormError message={apiError} />
      {success && (
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Empresa actualizada exitosamente.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input id="g-name" label="Nombre de la empresa *" error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })} />
        </div>
        <Input id="g-email" label="Correo electrónico *" type="email" error={errors.email?.message}
          {...register('email', { required: 'Requerido', pattern: { value: /\S+@\S+\.\S+/, message: 'Inválido' } })} />
        <Input id="g-phone" label="Teléfono" type="tel" {...register('phone')} />
        <div className="col-span-2">
          <Input id="g-address" label="Dirección" {...register('address')} />
        </div>
        <Input id="g-city"    label="Ciudad"       {...register('city')} />
        <Input id="g-state"   label="Estado/Depto" {...register('state')} />
        <Input id="g-country" label="País"         {...register('country')} />
        <Input id="g-tz"      label="Zona horaria" {...register('timezone')} />
      </div>

      <GeoSelects
        selectedDeptId={selectedDeptId}
        selectedMuniId={selectedMuniId}
        departamentos={departamentos}
        municipios={municipios}
        onDeptChange={(v) => { setValue('cat_mh_departamento_id', v, { shouldDirty: true }); setValue('cat_mh_municipio_id', '', { shouldDirty: true }) }}
        onMuniChange={(v) => setValue('cat_mh_municipio_id', v, { shouldDirty: true })}
      />

      <div className="grid grid-cols-2 gap-4">
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

      <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
        Slug: <span className="font-mono text-gray-500">{company.slug}</span> · Creada: {company.created_at ? new Date(company.created_at).toLocaleDateString('es-HN') : '—'}
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          <Save size={14} /> Guardar cambios
        </Button>
      </div>
    </form>
  )
}

// ─── Inventory section (inside BranchDetail) ──────────────────────────────────

function InventorySection({ companyId, branchId }) {
  const [items,         setItems]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [products,      setProducts]      = useState([])
  const [unidades,      setUnidades]      = useState([])
  const [showAdd,       setShowAdd]       = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [deleting,      setDeleting]      = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getBranchInventory(companyId, branchId)
      .then(({ data }) => setItems(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId, branchId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getCompanyProducts(companyId, { per_page: 200 })
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => {})
    getUnidadesDeMedida({ per_page: 100 })
      .then(({ data }) => setUnidades(data.data ?? []))
      .catch(() => {})
  }, [companyId])

  const existingProductIds = items.map((i) => i.product_id)
  const availableProducts  = products.filter(
    (p) => p.status === 'active' && !existingProductIds.includes(p.id)
  )

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteBranchInventory(companyId, branchId, deleting.id)
      setDeleting(null)
      load()
    } catch { /* ignore */ } finally { setDeleteLoading(false) }
  }

  const lowCount = items.filter(
    (i) => i.cantidad_minima != null && parseFloat(i.cantidad) < parseFloat(i.cantidad_minima)
  ).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Warehouse size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Inventario</span>
          <span className="text-xs text-gray-400">({items.length} producto{items.length !== 1 ? 's' : ''})</span>
          {lowCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              <AlertTriangle size={11} /> {lowCount} stock bajo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar">
            <RefreshCw size={13} />
          </button>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditing(null) }}>
            <Plus size={13} /> Agregar producto
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8"><Spinner /></div>
      ) : items.length === 0 && !showAdd ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl">
          <Package size={28} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-400">Sin productos en inventario</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Agregar primer producto
          </Button>
        </div>
      ) : (
        <>
          {showAdd && (
            <InventoryForm
              mode="add"
              companyId={companyId}
              branchId={branchId}
              availableProducts={availableProducts}
              onSuccess={() => { setShowAdd(false); load() }}
              onCancel={() => setShowAdd(false)}
            />
          )}
          {items.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-4 py-2.5 font-medium text-gray-500">Producto</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right w-24">Cantidad</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right w-20">Mín.</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right w-20">Máx.</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right w-24">Costo unit.</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 w-20 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((inv) => {
                    const isLow = inv.cantidad_minima != null && parseFloat(inv.cantidad) < parseFloat(inv.cantidad_minima)
                    return (
                      <tr key={inv.id} className={`hover:bg-gray-50 transition ${isLow ? 'bg-amber-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-sm">{inv.product?.nombre ?? `#${inv.product_id}`}</p>
                          {inv.product?.codigo && (
                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{inv.product.codigo}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-mono text-sm font-semibold ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                            {parseFloat(inv.cantidad).toFixed(3)}
                          </span>
                          {isLow && <AlertTriangle size={11} className="inline ml-1 text-amber-500" />}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-gray-400">
                          {inv.cantidad_minima != null ? parseFloat(inv.cantidad_minima).toFixed(3) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-gray-400">
                          {inv.cantidad_maxima != null ? parseFloat(inv.cantidad_maxima).toFixed(3) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                          {inv.costo_unitario != null ? `L ${parseFloat(inv.costo_unitario).toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditing(inv); setShowAdd(false) }}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition" title="Editar">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleting(inv)}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition" title="Quitar">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar inventario" size="sm">
        {editing && (
          <InventoryForm
            mode="edit"
            initial={editing}
            companyId={companyId}
            branchId={branchId}
            availableProducts={availableProducts}
            onSuccess={() => { setEditing(null); load() }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Quitar del inventario" size="sm">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Quitar <span className="font-semibold">{deleting.product?.nombre ?? `Producto #${deleting.product_id}`}</span> del inventario?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleting(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Quitar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function InventoryForm({ mode, initial, companyId, branchId, availableProducts, onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const isEdit = mode === 'edit'

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEdit
      ? { cantidad: initial.cantidad ?? '', cantidad_minima: initial.cantidad_minima ?? '', cantidad_maxima: initial.cantidad_maxima ?? '', costo_unitario: initial.costo_unitario ?? '' }
      : { product_id: '', cantidad: '0', cantidad_minima: '', cantidad_maxima: '', costo_unitario: '' },
  })

  const onSubmit = async (raw) => {
    setApiError('')
    const payload = {
      ...(isEdit ? {} : { product_id: Number(raw.product_id) }),
      cantidad:        raw.cantidad        !== '' ? raw.cantidad        : 0,
      cantidad_minima: raw.cantidad_minima !== '' ? raw.cantidad_minima : null,
      cantidad_maxima: raw.cantidad_maxima !== '' ? raw.cantidad_maxima : null,
      costo_unitario:  raw.costo_unitario  !== '' ? raw.costo_unitario  : null,
    }
    try {
      if (isEdit) await updateBranchInventory(companyId, branchId, initial.id, payload)
      else        await addBranchInventory(companyId, branchId, payload)
      onSuccess()
    } catch (err) {
      const fe = err.response?.data?.errors
      setApiError(fe ? Object.values(fe)[0]?.[0] : (err.response?.data?.message ?? 'Error al guardar.'))
    }
  }

  return (
    <div className="border border-brand-200 bg-brand-50/20 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-700">{isEdit ? `Editar: ${initial.product?.nombre}` : 'Agregar producto al inventario'}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <FormError message={apiError} />

        {!isEdit && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Producto *</label>
            {availableProducts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No hay productos disponibles para agregar.</p>
            ) : (
              <select {...register('product_id', { required: 'Selecciona un producto' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Seleccionar producto...</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}</option>
                ))}
              </select>
            )}
            {errors.product_id && <p className="text-xs text-red-500">{errors.product_id.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Cantidad *</label>
            <input type="number" step="0.001" min="0" placeholder="0.000"
              {...register('cantidad', { required: 'Requerido', min: { value: 0, message: 'No puede ser negativo' } })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            {errors.cantidad && <p className="text-xs text-red-500">{errors.cantidad.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Stock mínimo</label>
            <input type="number" step="0.001" min="0" placeholder="Alerta de stock bajo"
              {...register('cantidad_minima')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Stock máximo</label>
            <input type="number" step="0.001" min="0" placeholder="Capacidad máxima"
              {...register('cantidad_maxima')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Costo unitario</label>
            <input type="number" step="0.01" min="0" placeholder="0.00"
              {...register('costo_unitario')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" size="sm" loading={isSubmitting} disabled={!isEdit && availableProducts.length === 0}>
            {isEdit ? 'Guardar cambios' : 'Agregar al inventario'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ─── Branch detail (right panel) ─────────────────────────────────────────────

function BranchDetail({ branch, companyId, onUpdated, onDeleted }) {
  const [editMode,     setEditMode]     = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,  setDeleteError]  = useState('')

  const handleDelete = async () => {
    setDeleteLoading(true); setDeleteError('')
    try {
      await deleteCompanyBranch(companyId, branch.id)
      setConfirmDel(false)
      onDeleted()
    } catch (err) {
      setDeleteError(err.response?.data?.message ?? 'Error al eliminar.')
    } finally { setDeleteLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Branch header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900">{branch.name}</h3>
            {branch.is_default && <Badge label="Principal" type="active" />}
            <Badge label={branch.status === 'active' ? 'Activo' : 'Inactivo'} type={branch.status === 'active' ? 'active' : 'inactive'} />
          </div>
          {branch.address && <p className="text-sm text-gray-400 mt-0.5">{branch.address}{branch.city ? `, ${branch.city}` : ''}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setEditMode((v) => !v)}
            className={`p-1.5 rounded-lg transition ${editMode ? 'bg-brand-100 text-brand-600' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'}`}
            title="Editar sucursal">
            <Pencil size={14} />
          </button>
          {!branch.is_default && (
            <button onClick={() => { setConfirmDel(true); setDeleteError('') }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editMode && (
        <BranchForm
          initial={branch}
          companyId={companyId}
          onSuccess={() => { setEditMode(false); onUpdated() }}
          onCancel={() => setEditMode(false)}
        />
      )}

      {/* Inventory */}
      <div className="border-t border-gray-100 pt-4">
        <InventorySection companyId={companyId} branchId={branch.id} />
      </div>

      {/* Delete confirm modal */}
      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Eliminar sucursal" size="sm">
        <div className="space-y-4">
          <FormError message={deleteError} />
          <p className="text-sm text-gray-600">
            ¿Eliminar la sucursal <span className="font-semibold">{branch.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmDel(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Branch form ──────────────────────────────────────────────────────────────

function BranchForm({ initial, companyId, onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const isEdit = !!initial

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initial
      ? { name: initial.name, address: initial.address ?? '', city: initial.city ?? '',
          state: initial.state ?? '', phone: initial.phone ?? '', email: initial.email ?? '',
          status: initial.status ?? 'active', is_default: initial.is_default ?? false,
          cat_mh_departamento_id: initial.cat_mh_departamento_id ? String(initial.cat_mh_departamento_id) : '',
          cat_mh_municipio_id:    initial.cat_mh_municipio_id    ? String(initial.cat_mh_municipio_id)    : '' }
      : { status: 'active', is_default: false, cat_mh_departamento_id: '', cat_mh_municipio_id: '' },
  })

  const selectedDeptId = watch('cat_mh_departamento_id')
  const selectedMuniId = watch('cat_mh_municipio_id')
  const { departamentos, municipios } = useGeo(selectedDeptId)

  const onSubmit = async (rawData) => {
    setApiError('')
    const data = {
      ...rawData,
      cat_mh_departamento_id: rawData.cat_mh_departamento_id || null,
      cat_mh_municipio_id:    rawData.cat_mh_municipio_id    || null,
    }
    try {
      if (isEdit) await updateCompanyBranch(companyId, initial.id, data)
      else        await createCompanyBranch(companyId, data)
      onSuccess()
    } catch (err) {
      const fe = err.response?.data?.errors
      setApiError(fe ? Object.values(fe)[0]?.[0] : (err.response?.data?.message ?? 'Error.'))
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

      <GeoSelects
        selectedDeptId={selectedDeptId}
        selectedMuniId={selectedMuniId}
        departamentos={departamentos}
        municipios={municipios}
        onDeptChange={(v) => { setValue('cat_mh_departamento_id', v, { shouldDirty: true }); setValue('cat_mh_municipio_id', '', { shouldDirty: true }) }}
        onMuniChange={(v) => setValue('cat_mh_municipio_id', v, { shouldDirty: true })}
      />

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
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" loading={isSubmitting}>{isEdit ? 'Guardar cambios' : 'Crear sucursal'}</Button>
      </div>
    </form>
  )
}

// ─── Tab: Sucursales ──────────────────────────────────────────────────────────

function BranchesTab({ companyId }) {
  const [branches,      setBranches]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selectedId,    setSelectedId]    = useState(null)
  const [showAddForm,   setShowAddForm]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCompanyBranches(companyId)
      .then(({ data }) => setBranches(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load() }, [load])

  const selectedBranch = branches.find((b) => b.id === selectedId) ?? null

  if (loading) return <div className="py-16"><Spinner /></div>

  return (
    <div className="flex gap-6 min-h-96">
      {/* Left: branch list */}
      <div className="w-72 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-500">{branches.length} sucursal{branches.length !== 1 ? 'es' : ''}</span>
          <div className="flex items-center gap-1">
            <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar">
              <RefreshCw size={13} />
            </button>
            <Button size="sm" onClick={() => { setShowAddForm(true); setSelectedId(null) }}>
              <Plus size={13} /> Nueva
            </Button>
          </div>
        </div>

        {showAddForm && (
          <div className="border border-brand-200 bg-brand-50/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Nueva sucursal</p>
            <BranchForm companyId={companyId} onSuccess={() => { setShowAddForm(false); load() }} onCancel={() => setShowAddForm(false)} />
          </div>
        )}

        {branches.length === 0 && !showAddForm ? (
          <div className="py-10 text-center">
            <GitBranch size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Aún no hay sucursales</p>
          </div>
        ) : (
          branches.map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelectedId(b.id); setShowAddForm(false) }}
              className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                selectedId === b.id
                  ? 'border-brand-300 bg-brand-50 ring-1 ring-brand-200'
                  : 'border-gray-100 bg-white hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                  {b.is_default && <Badge label="Principal" type="active" />}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge label={b.status === 'active' ? 'Activo' : 'Inactivo'} type={b.status === 'active' ? 'active' : 'inactive'} />
                  {b.address && <span className="text-xs text-gray-400 truncate">{b.city ?? b.address}</span>}
                </div>
              </div>
              <ChevronRight size={14} className={`shrink-0 transition ${selectedId === b.id ? 'text-brand-500' : 'text-gray-300'}`} />
            </button>
          ))
        )}
      </div>

      {/* Right: branch detail + inventory */}
      <div className="flex-1 min-w-0">
        {!selectedBranch && !showAddForm ? (
          <div className="h-full flex items-center justify-center text-center border border-dashed border-gray-200 rounded-2xl">
            <div>
              <MapPin size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">Selecciona una sucursal para ver sus detalles e inventario</p>
            </div>
          </div>
        ) : selectedBranch ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <BranchDetail
              branch={selectedBranch}
              companyId={companyId}
              onUpdated={() => load()}
              onDeleted={() => { setSelectedId(null); load() }}
            />
          </div>
        ) : null}
      </div>
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
      const fe = err.response?.data?.errors
      setApiError(fe ? Object.values(fe)[0]?.[0] : (err.response?.data?.message ?? 'Error.'))
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
          {...register('email', { required: 'Requerido', pattern: { value: /\S+@\S+\.\S+/, message: 'Inválido' } })} />
        <Input id="u-pass" label={isEdit ? 'Nueva contraseña' : 'Contraseña *'} type="password"
          placeholder={isEdit ? 'Dejar en blanco para no cambiar' : 'Mínimo 8 caracteres'}
          error={errors.password?.message}
          {...register('password', {
            ...(!isEdit ? { required: 'Requerido' } : {}),
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
      <div className="flex justify-end gap-2">
        <Button variant="secondary" type="button" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" loading={isSubmitting}>{isEdit ? 'Guardar' : 'Crear usuario'}</Button>
      </div>
    </form>
  )
}

function UsersTab({ companyId }) {
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showAdd,       setShowAdd]       = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [deleting,      setDeleting]      = useState(null)
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
    try { await deleteCompanyUser(companyId, deleting.id); setDeleting(null); load() }
    catch { /* ignore */ } finally { setDeleteLoading(false) }
  }

  const handleToggleActive = async (u) => {
    try { await updateCompanyUser(companyId, u.id, { is_active: !u.is_active }); load() } catch { /* ignore */ }
  }

  if (loading) return <div className="py-16"><Spinner /></div>

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar"><RefreshCw size={13} /></button>
          <Button size="sm" onClick={() => { setShowAdd(true); setEditing(null) }}><Plus size={13} /> Nuevo usuario</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border border-brand-200 bg-brand-50/20 rounded-xl p-4">
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
                  <div className="border border-brand-200 bg-brand-50/20 rounded-xl p-4">
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
            <p className="text-sm text-gray-600">¿Eliminar al usuario <span className="font-semibold">{deleting.name}</span>?</p>
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

function ActivitiesTab({ companyId }) {
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [catalog,    setCatalog]    = useState([])
  const [selected,   setSelected]   = useState('')
  const [isPrimary,  setIsPrimary]  = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addError,   setAddError]   = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getCompanyActivities(companyId)
      .then(({ data }) => setActivities(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (showAdd) {
      getCatalogActivities()
        .then(({ data }) => setCatalog(data.data ?? []))
        .catch(() => {})
    }
  }, [showAdd])

  const existingIds = activities.map((a) => a.cat_mhactividad_id)
  const available   = catalog.filter((a) => !existingIds.includes(a.id))

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!selected) { setAddError('Selecciona una actividad.'); return }
    setAddError(''); setAddLoading(true)
    try {
      await addCompanyActivity(companyId, { cat_mhactividad_id: Number(selected), is_primary: isPrimary })
      setShowAdd(false); setSelected(''); setIsPrimary(false); load()
    } catch (err) {
      const fe = err.response?.data?.errors
      setAddError(fe ? Object.values(fe)[0]?.[0] : (err.response?.data?.message ?? 'Error.'))
    } finally { setAddLoading(false) }
  }

  if (loading) return <div className="py-16"><Spinner /></div>

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{activities.length} actividad{activities.length !== 1 ? 'es' : ''} asignada{activities.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={load} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar"><RefreshCw size={13} /></button>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Agregar</Button>
        </div>
      </div>

      {showAdd && (
        <div className="border border-brand-200 bg-brand-50/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Agregar actividad económica</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <FormError message={addError} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Actividad económica *</label>
              {available.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No hay actividades disponibles para asignar.</p>
              ) : (
                <select value={selected} onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seleccionar...</option>
                  {available.map((a) => <option key={a.id} value={a.id}>{a.codigo} – {a.descripcion}</option>)}
                </select>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="h-4 w-4 accent-brand-500" />
              <span className="text-sm text-gray-700">Marcar como actividad principal</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" type="button" size="sm" onClick={() => { setShowAdd(false); setSelected(''); setIsPrimary(false) }}>Cancelar</Button>
              <Button type="submit" size="sm" loading={addLoading} disabled={available.length === 0}>Agregar</Button>
            </div>
          </form>
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
                  <button onClick={async () => { setTogglingId(a.id); try { await updateCompanyActivity(companyId, a.id, { is_primary: true }); load() } finally { setTogglingId(null) } }}
                    disabled={togglingId === a.id} className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition disabled:opacity-50" title="Marcar como principal">
                    <Star size={13} />
                  </button>
                )}
                <button onClick={async () => { setRemovingId(a.id); try { await removeCompanyActivity(companyId, a.id); load() } finally { setRemovingId(null) } }}
                  disabled={removingId === a.id} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50" title="Quitar">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'general',    label: 'General',            icon: Building2  },
  { id: 'branches',   label: 'Sucursales',          icon: GitBranch  },
  { id: 'users',      label: 'Usuarios',            icon: Users      },
  { id: 'activities', label: 'Act. Económicas',     icon: Activity   },
]

export default function CompanyDetailPage() {
  const { companyId } = useParams()
  const navigate      = useNavigate()

  const [company,   setCompany]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  const loadCompany = useCallback(() => {
    setLoading(true)
    getCompany(companyId)
      .then(({ data }) => setCompany(data.company))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { loadCompany() }, [loadCompany])

  if (loading) {
    return (
      <div className="py-32"><Spinner /></div>
    )
  }

  if (!company) {
    return (
      <div className="py-32 text-center">
        <p className="text-gray-400 text-sm">No se pudo cargar la empresa.</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/companies')}>
          <ArrowLeft size={14} /> Volver a empresas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/companies')}
          className="mt-0.5 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
          title="Volver a empresas"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-2 rounded-lg bg-brand-50 text-brand-600 shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{company.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-gray-400 font-mono">{company.slug}</span>
                <Badge label={planLabel[company.plan] ?? company.plan} type={planType[company.plan] ?? 'default'} />
                <Badge label={statusLabel[company.status] ?? company.status} type={statusType[company.status] ?? 'default'} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto px-2">
          {TABS.map((tab) => {
            const Icon     = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${
                  isActive
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'general'    && <GeneralTab    company={company} onUpdated={loadCompany} />}
          {activeTab === 'branches'   && <BranchesTab   companyId={company.id} />}
          {activeTab === 'users'      && <UsersTab      companyId={company.id} />}
          {activeTab === 'activities' && <ActivitiesTab companyId={company.id} />}
        </div>
      </div>
    </div>
  )
}
