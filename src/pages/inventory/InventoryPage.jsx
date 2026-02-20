import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Warehouse, RefreshCw, Pencil, Trash2, ArrowLeft, AlertTriangle } from 'lucide-react'
import { getBranchInventory, addBranchInventory, updateBranchInventory, deleteBranchInventory } from '../../api/inventory'
import { getCompanyProducts } from '../../api/products'
import { useAuth }  from '../../context/AuthContext'
import Button       from '../../components/ui/Button'
import Modal        from '../../components/ui/Modal'
import Spinner      from '../../components/ui/Spinner'
import Pagination   from '../../components/ui/Pagination'

// ─── Add/Edit inventory form ──────────────────────────────────────────────────
function InventoryForm({ companyId, branchId, initial, existingProductIds, onSuccess, onCancel }) {
  const [apiError, setApiError]         = useState('')
  const [products, setProducts]         = useState([])
  const [loadingProducts, setLoadingProducts] = useState(!initial) // only load on create

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial
      ? {
          cantidad:         initial.cantidad ?? '',
          cantidad_minima:  initial.cantidad_minima ?? '',
          cantidad_maxima:  initial.cantidad_maxima ?? '',
          costo_unitario:   initial.costo_unitario ?? '',
        }
      : {
          product_id:      '',
          cantidad:        '0',
          cantidad_minima: '',
          cantidad_maxima: '',
          costo_unitario:  '',
        },
  })

  const isEdit = !!initial

  useEffect(() => {
    if (isEdit) return
    getCompanyProducts(companyId, { per_page: 200 })
      .then(({ data }) => {
        const all = data.data ?? []
        // Filter out already-added products
        setProducts(all.filter((p) => !existingProductIds.includes(p.id) && p.status === 'active'))
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [companyId, isEdit, existingProductIds])

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
      if (isEdit) {
        await updateBranchInventory(companyId, branchId, initial.id, payload)
      } else {
        await addBranchInventory(companyId, branchId, payload)
      }
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0]?.[0]
        setApiError(first ?? msg ?? 'Error al guardar el inventario.')
      } else {
        setApiError(msg ?? 'Error al guardar el inventario.')
      }
    }
  }

  if (loadingProducts) return <div className="py-8"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {apiError}
        </div>
      )}

      {!isEdit && (
        <div className="flex flex-col gap-1">
          <label htmlFor="product_id" className="text-sm font-medium text-gray-700">
            Producto *
          </label>
          {products.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              No hay productos disponibles para agregar al inventario.
            </p>
          ) : (
            <select
              id="product_id"
              {...register('product_id', { required: 'Debes seleccionar un producto' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                </option>
              ))}
            </select>
          )}
          {errors.product_id && (
            <p className="text-xs text-red-500">{errors.product_id.message}</p>
          )}
        </div>
      )}

      {isEdit && initial?.product && (
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Producto</p>
          <p className="text-sm font-medium text-gray-900">
            {initial.product.codigo ? `[${initial.product.codigo}] ` : ''}{initial.product.nombre}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad disponible *
          </label>
          <input
            id="cantidad"
            type="number"
            step="0.001"
            min="0"
            placeholder="0.000"
            {...register('cantidad', {
              required: 'La cantidad es obligatoria',
              min: { value: 0, message: 'La cantidad no puede ser negativa' },
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.cantidad && (
            <p className="text-xs text-red-500 mt-1">{errors.cantidad.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="cantidad_minima" className="block text-sm font-medium text-gray-700 mb-1">
            Stock mínimo
          </label>
          <input
            id="cantidad_minima"
            type="number"
            step="0.001"
            min="0"
            placeholder="Alerta de stock bajo"
            {...register('cantidad_minima')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label htmlFor="cantidad_maxima" className="block text-sm font-medium text-gray-700 mb-1">
            Stock máximo
          </label>
          <input
            id="cantidad_maxima"
            type="number"
            step="0.001"
            min="0"
            placeholder="Capacidad máxima"
            {...register('cantidad_maxima')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="costo_unitario" className="block text-sm font-medium text-gray-700 mb-1">
          Costo unitario
        </label>
        <input
          id="costo_unitario"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register('costo_unitario')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!isEdit && products.length === 0}>
          {isEdit ? 'Guardar cambios' : 'Agregar al inventario'}
        </Button>
      </div>
    </form>
  )
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDeleteModal({ item, onConfirm, onCancel, loading }) {
  const productName = item?.product?.nombre ?? `Producto #${item?.product_id}`
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ¿Estás seguro de que deseas quitar{' '}
        <span className="font-semibold text-gray-900">{productName}</span>
        {' '}del inventario de esta sucursal?
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Quitar
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { companyId, branchId } = useParams()
  const { user } = useAuth()
  const isSuperAdmin    = user?.role === 'super_admin'
  const isCompanyAdmin  = user?.role === 'company_admin'
  const isBranchManager = user?.role === 'branch_manager'

  const resolvedCompanyId = companyId ?? user?.company_id
  const resolvedBranchId  = branchId  ?? user?.branch_id

  const [items, setItems]                 = useState([])
  const [meta, setMeta]                   = useState(null)
  const [page, setPage]                   = useState(1)
  const [perPage, setPerPage]             = useState(15)
  const [loading, setLoading]             = useState(true)
  const [showAdd, setShowAdd]             = useState(false)
  const [editing, setEditing]             = useState(null)
  const [deleting, setDeleting]           = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    if (!resolvedCompanyId || !resolvedBranchId) return
    setLoading(true)
    getBranchInventory(resolvedCompanyId, resolvedBranchId, { page, per_page: perPage })
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
  }, [resolvedCompanyId, resolvedBranchId, page, perPage])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteBranchInventory(resolvedCompanyId, resolvedBranchId, deleting.id)
      setDeleting(null)
      load()
    } catch {
      // ignore, user can retry
    } finally {
      setDeleteLoading(false)
    }
  }

  const canEdit = isSuperAdmin || isCompanyAdmin || isBranchManager
  const existingProductIds = items.map((i) => i.product_id)

  // Count low stock items
  const lowStockCount = items.filter(
    (i) => i.cantidad_minima != null && parseFloat(i.cantidad) < parseFloat(i.cantidad_minima)
  ).length

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {(isSuperAdmin || isCompanyAdmin) && (
            <Link
              to={isSuperAdmin ? '/companies' : `/companies/${resolvedCompanyId}/products`}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Volver"
            >
              <ArrowLeft size={18} />
            </Link>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Inventario de Sucursal</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {(meta?.total ?? items.length)} producto{(meta?.total ?? items.length) !== 1 ? 's' : ''} en inventario
              {lowStockCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                  <AlertTriangle size={12} />
                  {lowStockCount} con stock bajo
                </span>
              )}
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
            <Button onClick={() => setShowAdd(true)}>
              <Plus size={16} />
              Agregar producto
            </Button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <Warehouse size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">El inventario de esta sucursal está vacío</p>
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowAdd(true)}
              >
                <Plus size={14} />
                Agregar primer producto
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500">Producto</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-28 text-right">Cantidad</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-28 text-right">Mínimo</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-28 text-right">Máximo</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-32 text-right">Costo unit.</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-24 text-center">Estado</th>
                  {canEdit && (
                    <th className="px-6 py-3 font-medium text-gray-500 w-24 text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((inv) => {
                  const isLow = inv.cantidad_minima != null &&
                    parseFloat(inv.cantidad) < parseFloat(inv.cantidad_minima)
                  return (
                    <tr key={inv.id} className={`hover:bg-gray-50 transition ${isLow ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          {inv.product?.nombre ?? `Producto #${inv.product_id}`}
                        </p>
                        {inv.product?.codigo && (
                          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {inv.product.codigo}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-gray-900">
                        {parseFloat(inv.cantidad).toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                        {inv.cantidad_minima != null ? parseFloat(inv.cantidad_minima).toFixed(3) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-500">
                        {inv.cantidad_maxima != null ? parseFloat(inv.cantidad_maxima).toFixed(3) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-gray-700">
                        {inv.costo_unitario != null ? `L ${parseFloat(inv.costo_unitario).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} />
                            Stock bajo
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            OK
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditing(inv)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleting(inv)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Quitar del inventario"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
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

      {/* Add modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Agregar Producto al Inventario"
        size="md"
      >
        <InventoryForm
          companyId={resolvedCompanyId}
          branchId={resolvedBranchId}
          existingProductIds={existingProductIds}
          onSuccess={() => { setShowAdd(false); load() }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Actualizar Inventario"
        size="md"
      >
        {editing && (
          <InventoryForm
            companyId={resolvedCompanyId}
            branchId={resolvedBranchId}
            initial={editing}
            existingProductIds={existingProductIds}
            onSuccess={() => { setEditing(null); load() }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Quitar del Inventario"
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
