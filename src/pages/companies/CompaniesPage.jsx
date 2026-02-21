import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Plus, Building2, Search, RefreshCw, X, ChevronDown, ChevronRight,
  Package, Pencil, Trash2, Tag,
} from 'lucide-react'
import { getCompanies, createCompany } from '../../api/companies'
import { getCatalogActivities, addCompanyActivity } from '../../api/economicActivities'
import { getDepartamentos } from '../../api/departamentos'
import { getMunicipios }    from '../../api/municipios'
import { getCompanyProducts, createCompanyProduct, updateCompanyProduct, deleteCompanyProduct } from '../../api/products'
import { getProductCategories, createProductCategory } from '../../api/productCategories'
import { getUnidadesDeMedida } from '../../api/unidadesDeMedida'
import { useAuth }   from '../../context/AuthContext'
import Button        from '../../components/ui/Button'
import Input         from '../../components/ui/Input'
import Modal         from '../../components/ui/Modal'
import Badge         from '../../components/ui/Badge'
import Spinner       from '../../components/ui/Spinner'
import Pagination    from '../../components/ui/Pagination'

// ─── Plan helpers ──────────────────────────────────────────────────────────────
const planLabel = { free: 'Gratuito', basic: 'Básico', premium: 'Premium' }
const planType  = { free: 'free',     basic: 'basic',  premium: 'premium' }

// ─── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ categoria }) {
  if (!categoria) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
      style={
        categoria.color
          ? { backgroundColor: categoria.color + '22', borderColor: categoria.color + '66', color: categoria.color }
          : { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569' }
      }
    >
      <Tag size={10} />
      {categoria.nombre}
    </span>
  )
}

// ─── Product Form (inline within company panel) ───────────────────────────────
function ProductForm({ companyId, initial, onSuccess, onCancel }) {
  const [apiError, setApiError]               = useState('')
  const [unidades, setUnidades]               = useState([])
  const [categories, setCategories]           = useState([])
  const [loadingUnidades, setLoadingUnidades] = useState(true)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCatName, setNewCatName]           = useState('')
  const [newCatColor, setNewCatColor]         = useState('#6366f1')
  const [savingCat, setSavingCat]             = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial
      ? { ...initial, product_category_id: initial.product_category_id ?? '', track_stock: initial.track_stock ?? true }
      : { codigo: '', nombre: '', descripcion: '', precio: '', peso: '', tamanio: '', cat_mh_unidad_de_medida_id: '', product_category_id: '', status: 'active', track_stock: true },
  })

  const trackStock = watch('track_stock')
  const isEdit = !!initial

  useEffect(() => {
    getUnidadesDeMedida({ per_page: 100 })
      .then(({ data }) => setUnidades(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingUnidades(false))
    getProductCategories(companyId, { per_page: 200 })
      .then(({ data }) => setCategories(data.data ?? []))
      .catch(() => {})
  }, [companyId])

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const res = await createProductCategory(companyId, { nombre: newCatName.trim(), color: newCatColor })
      setCategories((prev) => [res.data.data, ...prev])
      setNewCatName('')
      setShowNewCategory(false)
    } catch { /* ignore */ } finally { setSavingCat(false) }
  }

  const onSubmit = async (raw) => {
    setApiError('')
    const payload = {
      ...raw,
      cat_mh_unidad_de_medida_id: raw.cat_mh_unidad_de_medida_id || undefined,
      product_category_id: raw.product_category_id || undefined,
      precio: raw.precio !== '' ? raw.precio : undefined,
      peso:   raw.peso   !== '' ? raw.peso   : undefined,
      track_stock: raw.track_stock === true || raw.track_stock === 'true',
    }
    try {
      if (isEdit) await updateCompanyProduct(companyId, initial.id, payload)
      else        await createCompanyProduct(companyId, payload)
      onSuccess()
    } catch (err) {
      const fieldErrors = err.response?.data?.errors
      const msg = err.response?.data?.message
      setApiError(fieldErrors ? Object.values(fieldErrors)[0]?.[0] ?? msg : msg ?? 'Error al guardar.')
    }
  }

  if (loadingUnidades) return <div className="py-6"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {apiError && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{apiError}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input id="codigo" label="SKU / Código" placeholder="PROD-001" {...register('codigo')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Unidad de medida</label>
          <select
            {...register('cat_mh_unidad_de_medida_id', { required: 'Requerido' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar...</option>
            {unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo} – {u.descripcion}</option>)}
          </select>
          {errors.cat_mh_unidad_de_medida_id && <p className="text-xs text-red-500">{errors.cat_mh_unidad_de_medida_id.message}</p>}
        </div>
      </div>

      <Input
        id="nombre" label="Nombre *" placeholder="Ej: Hamburguesa Clásica"
        error={errors.nombre?.message}
        {...register('nombre', { required: 'El nombre es obligatorio' })}
      />

      <div className="grid grid-cols-3 gap-3">
        <Input
          id="precio" label="Precio *" type="number" step="0.01" min="0" placeholder="0.00"
          error={errors.precio?.message}
          {...register('precio', { required: 'El precio es obligatorio', min: { value: 0, message: 'No puede ser negativo' } })}
        />
        <Input id="peso" label="Peso (kg)" type="number" step="0.001" min="0" placeholder="0.000" {...register('peso')} />
        <Input id="tamanio" label="Tamaño" placeholder="XL, 30x20cm" {...register('tamanio')} />
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Categoría</label>
          <button type="button" onClick={() => setShowNewCategory((v) => !v)}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            {showNewCategory ? 'Cancelar' : '+ Nueva'}
          </button>
        </div>
        {showNewCategory && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <input type="text" placeholder="Nombre de la categoría..." value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <input type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)}
              className="h-8 w-10 rounded border border-gray-300 cursor-pointer" />
            <Button type="button" size="sm" loading={savingCat} onClick={handleCreateCategory}>Crear</Button>
          </div>
        )}
        <select {...register('product_category_id')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Sin categoría</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Estado</label>
          <select {...register('status')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Control de stock</span>
          <label className="flex items-center gap-3 mt-1 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" className="sr-only" {...register('track_stock')} />
              <div className={`w-10 h-5 rounded-full transition-colors ${trackStock ? 'bg-brand-600' : 'bg-gray-300'}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${trackStock ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-600">{trackStock ? 'Con stock' : 'Sin stock'}</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onCancel} type="button" size="sm">Cancelar</Button>
        <Button type="submit" loading={isSubmitting} size="sm">{isEdit ? 'Guardar' : 'Crear producto'}</Button>
      </div>
    </form>
  )
}

// ─── Inline Products Panel ────────────────────────────────────────────────────
function CompanyProductsPanel({ company }) {
  const { user } = useAuth()
  const isSuperAdmin   = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'
  const canEdit = isSuperAdmin || isCompanyAdmin

  const [items, setItems]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [showCreate, setShowCreate]       = useState(false)
  const [editing, setEditing]             = useState(null)
  const [deleting, setDeleting]           = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCompanyProducts(company.id, { per_page: 50 })
      .then(({ data }) => setItems(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [company.id])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteCompanyProduct(company.id, deleting.id)
      setDeleting(null)
      load()
    } catch { /* ignore */ } finally { setDeleteLoading(false) }
  }

  return (
    <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 space-y-3">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-brand-500" />
          <span className="text-sm font-semibold text-gray-700">
            Productos de {company.name}
          </span>
          <span className="text-xs text-gray-400">({items.length})</span>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditing(null); setShowCreate(true) }}>
            <Plus size={13} /> Agregar producto
          </Button>
        )}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="py-4"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center">
          <Package size={32} className="mx-auto text-gray-200 mb-2" />
          <p className="text-gray-400 text-xs">Sin productos registrados</p>
          {canEdit && (
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
              <Plus size={13} /> Agregar primer producto
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-4 py-2.5 font-medium text-gray-500">SKU</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Categoría</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Precio</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Stock</th>
                <th className="px-4 py-2.5 font-medium text-gray-500">Estado</th>
                {canEdit && <th className="px-4 py-2.5 font-medium text-gray-500 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-2.5">
                    {p.codigo
                      ? <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{p.codigo}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{p.nombre}</td>
                  <td className="px-4 py-2.5">
                    <CategoryBadge categoria={p.categoria} />
                    {!p.categoria && <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">
                    $ {parseFloat(p.precio ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5">
                    {p.track_stock ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Con stock</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Sin stock</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge label={p.status === 'active' ? 'Activo' : 'Inactivo'} type={p.status === 'active' ? 'active' : 'inactive'} />
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setShowCreate(false); setEditing(p) }}
                          className="p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition" title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDeleting(p)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={`Nuevo producto — ${company.name}`} size="lg">
        <ProductForm
          companyId={company.id}
          onSuccess={() => { setShowCreate(false); load() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar producto" size="lg">
        {editing && (
          <ProductForm
            companyId={company.id}
            initial={editing}
            onSuccess={() => { setEditing(null); load() }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar producto" size="sm">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              ¿Eliminar <span className="font-semibold text-gray-900">{deleting.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleting(null)} type="button">Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleteLoading}>Eliminar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ─── Create Company Form ──────────────────────────────────────────────────────
function CompanyForm({ onSuccess, onCancel }) {
  const [apiError, setApiError]               = useState('')
  const [catalogActivities, setCatalogActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [activitySearch, setActivitySearch]   = useState('')
  const [selectedIds, setSelectedIds]         = useState([])
  const [departamentos, setDepartamentos]     = useState([])
  const [municipios, setMunicipios]           = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { country: 'Honduras', timezone: 'UTC', plan: 'free' } })

  useEffect(() => {
    getCatalogActivities()
      .then(({ data }) => setCatalogActivities(data.data ?? data ?? []))
      .catch(() => setCatalogActivities([]))
      .finally(() => setLoadingActivities(false))
    getDepartamentos({ per_page: 500 })
      .then(({ data }) => setDepartamentos(data.data ?? []))
      .catch(() => setDepartamentos([]))
    getMunicipios({ per_page: 500 })
      .then(({ data }) => setMunicipios(data.data ?? []))
      .catch(() => setMunicipios([]))
  }, [])

  const filteredActivities = catalogActivities.filter((a) =>
    a.descripcion.toLowerCase().includes(activitySearch.toLowerCase()) ||
    a.codigo.toLowerCase().includes(activitySearch.toLowerCase())
  )

  const toggleActivity = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectedActivities = catalogActivities.filter((a) => selectedIds.includes(a.id))

  const onSubmit = async (data) => {
    setApiError('')
    try {
      const res = await createCompany(data)
      const companyId = res.data.company?.id

      if (companyId && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((actId) =>
            addCompanyActivity(companyId, { cat_mhactividad_id: actId })
          )
        )
      }

      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0]?.[0]
        setApiError(first ?? msg ?? 'Error al crear la empresa.')
      } else {
        setApiError(msg ?? 'Error al crear la empresa.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input id="name" label="Nombre de la empresa *" placeholder="Ej: Restaurante El Buen Sabor"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })} />
        </div>
        <Input id="email" label="Correo electrónico *" type="email" placeholder="contacto@empresa.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
          })} />
        <Input id="phone" label="Teléfono" type="tel" placeholder="+504 9900 0000" {...register('phone')} />
      </div>

      <Input id="address" label="Dirección" placeholder="Col. Palmira, Ave. República" {...register('address')} />

      <div className="grid grid-cols-2 gap-4">
        <Input id="city"  label="Ciudad"  placeholder="Tegucigalda" {...register('city')} />
        <Input id="state" label="Estado"  placeholder="Francisco Morazán" {...register('state')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="cat_mh_departamento_id" className="text-sm font-medium text-gray-700">Departamento MH</label>
          <select id="cat_mh_departamento_id"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('cat_mh_departamento_id')}>
            <option value="">Sin seleccionar</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>{d.codigo} – {d.descripcion}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="cat_mh_municipio_id" className="text-sm font-medium text-gray-700">Municipio MH</label>
          <select id="cat_mh_municipio_id"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('cat_mh_municipio_id')}>
            <option value="">Sin seleccionar</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.codigo} – {m.descripcion}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="plan" className="text-sm font-medium text-gray-700">Plan</label>
          <select id="plan"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('plan')}>
            <option value="free">Gratuito</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <Input id="branch_name" label="Nombre sucursal principal" placeholder="Principal" {...register('branch_name')} />
      </div>

      {/* Actividades económicas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Actividades económicas</label>
          {selectedIds.length > 0 && (
            <span className="text-xs text-brand-600 font-medium">
              {selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {selectedActivities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedActivities.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-medium">
                {a.codigo} · {a.descripcion.length > 30 ? a.descripcion.slice(0, 30) + '…' : a.descripcion}
                <button type="button" onClick={() => toggleActivity(a.id)} className="ml-0.5 text-brand-400 hover:text-brand-700">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="relative border-b border-gray-200">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por código o descripción..." value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500" />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {loadingActivities ? (
              <div className="py-4"><Spinner /></div>
            ) : filteredActivities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {activitySearch ? 'Sin resultados' : 'No hay actividades en el catálogo'}
              </p>
            ) : (
              filteredActivities.map((a) => (
                <label key={a.id} className="flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition">
                  <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleActivity(a.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs text-gray-700 leading-tight">
                    <span className="font-medium text-gray-500">{a.codigo}</span>{' — '}{a.descripcion}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>Crear empresa</Button>
      </div>
    </form>
  )
}

// ─── Companies Page ───────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const navigate = useNavigate()

  const [companies, setCompanies]   = useState([])
  const [meta, setMeta]             = useState(null)
  const [page, setPage]             = useState(1)
  const [perPage, setPerPage]       = useState(15)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getCompanies({ page, per_page: perPage })
      .then(({ data }) => {
        if (data.meta) {
          setCompanies(data.data ?? [])
          setMeta(data.meta)
        } else {
          setCompanies(data.companies ?? data.data ?? [])
          setMeta(null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, perPage])

  useEffect(() => { load() }, [load])

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id))

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Empresas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {(meta?.total ?? companies.length)} empresa{(meta?.total ?? companies.length) !== 1 ? 's' : ''} registrada{(meta?.total ?? companies.length) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nueva empresa
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre o email..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition" title="Recargar">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay empresas registradas'}
            </p>
            {!search && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Crear primera empresa
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-6 py-3 font-medium text-gray-500">Empresa</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Ciudad</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Plan</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Sucursales</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Estado</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Creada</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <>
                    <tr
                      key={c.id}
                      onClick={() => toggleExpand(c.id)}
                      className={`border-b border-gray-50 hover:bg-brand-50/40 transition cursor-pointer ${expandedId === c.id ? 'bg-brand-50/30' : ''}`}
                    >
                      {/* Expand toggle */}
                      <td className="pl-4 pr-0 py-4 text-gray-400">
                        {expandedId === c.id
                          ? <ChevronDown size={15} />
                          : <ChevronRight size={15} />}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          onClick={(e) => { e.stopPropagation(); navigate(`/companies/${c.id}`) }}
                          className="inline-flex items-center gap-1 group cursor-pointer"
                        >
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-brand-700 transition">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{c.email}</td>
                      <td className="px-6 py-4 text-gray-500">{c.city ?? '—'}</td>
                      <td className="px-6 py-4">
                        <Badge label={planLabel[c.plan] ?? c.plan} type={planType[c.plan] ?? 'default'} />
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{c.branches?.length ?? '—'}</td>
                      <td className="px-6 py-4">
                        <Badge label={c.status === 'active' ? 'Activo' : 'Inactivo'} type={c.status === 'active' ? 'active' : 'inactive'} />
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('es-HN') : '—'}
                      </td>
                    </tr>

                    {/* Expanded products panel */}
                    {expandedId === c.id && (
                      <tr key={`${c.id}-products`}>
                        <td colSpan={8} className="p-0">
                          <CompanyProductsPanel company={c} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && (
          <Pagination
            meta={meta}
            onPage={(p) => setPage(p)}
            onPerPage={(pp) => { setPage(1); setPerPage(pp) }}
          />
        )}
      </div>

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Empresa" size="lg">
        <CompanyForm
          onSuccess={() => { setShowModal(false); load() }}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}
