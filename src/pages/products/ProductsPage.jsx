import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Package, Search, RefreshCw, Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { getCompanyProducts, createCompanyProduct, updateCompanyProduct, deleteCompanyProduct } from '../../api/products'
import { getUnidadesDeMedida } from '../../api/unidadesDeMedida'
import { useAuth }    from '../../context/AuthContext'
import Button         from '../../components/ui/Button'
import Input          from '../../components/ui/Input'
import Modal          from '../../components/ui/Modal'
import Spinner        from '../../components/ui/Spinner'
import Pagination     from '../../components/ui/Pagination'
import Badge          from '../../components/ui/Badge'

// ─── Product form (create / edit) ─────────────────────────────────────────────
function ProductForm({ companyId, initial, onSuccess, onCancel }) {
  const [apiError, setApiError]         = useState('')
  const [unidades, setUnidades]         = useState([])
  const [loadingUnidades, setLoadingUnidades] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial ?? {
      codigo: '',
      nombre: '',
      descripcion: '',
      precio: '',
      peso: '',
      tamanio: '',
      cat_mh_unidad_de_medida_id: '',
      status: 'active',
    },
  })

  const isEdit = !!initial

  useEffect(() => {
    getUnidadesDeMedida({ per_page: 100 })
      .then(({ data }) => setUnidades(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingUnidades(false))
  }, [])

  const onSubmit = async (raw) => {
    setApiError('')
    const payload = {
      ...raw,
      cat_mh_unidad_de_medida_id: raw.cat_mh_unidad_de_medida_id || undefined,
      precio: raw.precio !== '' ? raw.precio : undefined,
      peso:   raw.peso   !== '' ? raw.peso   : undefined,
    }
    try {
      if (isEdit) {
        await updateCompanyProduct(companyId, initial.id, payload)
      } else {
        await createCompanyProduct(companyId, payload)
      }
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0]?.[0]
        setApiError(first ?? msg ?? 'Error al guardar el producto.')
      } else {
        setApiError(msg ?? 'Error al guardar el producto.')
      }
    }
  }

  if (loadingUnidades) return <div className="py-8"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="codigo"
          label="SKU / Código"
          placeholder="Ej: PROD-001"
          error={errors.codigo?.message}
          {...register('codigo')}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="cat_mh_unidad_de_medida_id" className="text-sm font-medium text-gray-700">
            Unidad de medida
          </label>
          <select
            id="cat_mh_unidad_de_medida_id"
            {...register('cat_mh_unidad_de_medida_id', { required: 'La unidad de medida es obligatoria' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar unidad...</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.codigo} – {u.descripcion}
              </option>
            ))}
          </select>
          {errors.cat_mh_unidad_de_medida_id && (
            <p className="text-xs text-red-500">{errors.cat_mh_unidad_de_medida_id.message}</p>
          )}
        </div>
      </div>

      <Input
        id="nombre"
        label="Nombre *"
        placeholder="Ej: Hamburguesa Clásica"
        error={errors.nombre?.message}
        {...register('nombre', { required: 'El nombre es obligatorio' })}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          rows={3}
          placeholder="Descripción del producto..."
          {...register('descripcion')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          id="precio"
          label="Precio *"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          error={errors.precio?.message}
          {...register('precio', { required: 'El precio es obligatorio', min: { value: 0, message: 'El precio no puede ser negativo' } })}
        />
        <Input
          id="peso"
          label="Peso (kg)"
          type="number"
          step="0.001"
          min="0"
          placeholder="0.000"
          error={errors.peso?.message}
          {...register('peso')}
        />
        <Input
          id="tamanio"
          label="Tamaño"
          placeholder="Ej: XL, 30x20cm"
          error={errors.tamanio?.message}
          {...register('tamanio')}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="status" className="text-sm font-medium text-gray-700">
          Estado
        </label>
        <select
          id="status"
          {...register('status')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDeleteModal({ item, onConfirm, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ¿Estás seguro de que deseas eliminar el producto{' '}
        <span className="font-semibold text-gray-900">{item.nombre}</span>
        ? Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Eliminar
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const { companyId } = useParams()
  const { user } = useAuth()
  const isSuperAdmin   = user?.role === 'super_admin'
  const isCompanyAdmin = user?.role === 'company_admin'

  const resolvedCompanyId = companyId ?? user?.company_id

  const [items, setItems]                 = useState([])
  const [meta, setMeta]                   = useState(null)
  const [page, setPage]                   = useState(1)
  const [perPage, setPerPage]             = useState(15)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [showCreate, setShowCreate]       = useState(false)
  const [editing, setEditing]             = useState(null)
  const [deleting, setDeleting]           = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    if (!resolvedCompanyId) return
    setLoading(true)
    getCompanyProducts(resolvedCompanyId, { page, per_page: perPage })
      .then(({ data }) => {
        if (data.meta) {
          setItems(data.data ?? [])
          setMeta(data.meta)
        } else {
          setItems(data.data ?? [])
          setMeta(null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [resolvedCompanyId, page, perPage])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteCompanyProduct(resolvedCompanyId, deleting.id)
      setDeleting(null)
      load()
    } catch {
      // ignore, user can retry
    } finally {
      setDeleteLoading(false)
    }
  }

  const canEdit = isSuperAdmin || isCompanyAdmin

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <Link
              to="/companies"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Volver a empresas"
            >
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Productos</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {(meta?.total ?? items.length)} producto{(meta?.total ?? items.length) !== 1 ? 's' : ''} registrado{(meta?.total ?? items.length) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
            title="Recargar"
          >
            <RefreshCw size={15} />
          </button>
          {canEdit && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={16} />
              Nuevo producto
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay productos registrados'}
            </p>
            {!search && canEdit && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={14} />
                Crear primer producto
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500 w-32">SKU</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-28">Precio</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-32">Unidad</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-24">Estado</th>
                  {canEdit && (
                    <th className="px-6 py-3 font-medium text-gray-500 w-24 text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      {p.codigo ? (
                        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {p.codigo}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{p.nombre}</p>
                      {p.descripcion && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.descripcion}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                      L {parseFloat(p.precio ?? 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {p.unidad_de_medida?.codigo ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        label={p.status === 'active' ? 'Activo' : 'Inactivo'}
                        type={p.status === 'active' ? 'active' : 'inactive'}
                      />
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleting(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nuevo Producto"
        size="lg"
      >
        <ProductForm
          companyId={resolvedCompanyId}
          onSuccess={() => { setShowCreate(false); load() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar Producto"
        size="lg"
      >
        {editing && (
          <ProductForm
            companyId={resolvedCompanyId}
            initial={editing}
            onSuccess={() => { setEditing(null); load() }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar Producto"
        size="sm"
      >
        {deleting && (
          <ConfirmDeleteModal
            item={deleting}
            onConfirm={handleDelete}
            onCancel={() => setDeleting(null)}
            loading={deleteLoading}
          />
        )}
      </Modal>
    </div>
  )
}
