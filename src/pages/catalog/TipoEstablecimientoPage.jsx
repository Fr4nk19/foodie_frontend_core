import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Store, Search, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import {
  getTiposEstablecimiento,
  createTipoEstablecimiento,
  updateTipoEstablecimiento,
  deleteTipoEstablecimiento,
} from '../../api/tipoEstablecimiento'
import { useAuth } from '../../context/AuthContext'
import Button     from '../../components/ui/Button'
import Input      from '../../components/ui/Input'
import Modal      from '../../components/ui/Modal'
import Spinner    from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'

// ─── Form (create / edit) ─────────────────────────────────────────────────────
function TipoEstablecimientoForm({ initial, onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: initial ?? { codigo: '', descripcion: '' } })

  const isEdit = !!initial

  const onSubmit = async (data) => {
    setApiError('')
    try {
      if (isEdit) {
        await updateTipoEstablecimiento(initial.id, data)
      } else {
        await createTipoEstablecimiento(data)
      }
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0]?.[0]
        setApiError(first ?? msg ?? 'Error al guardar el tipo de establecimiento.')
      } else {
        setApiError(msg ?? 'Error al guardar el tipo de establecimiento.')
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

      <Input
        id="codigo"
        label="Código MH *"
        placeholder="Ej: 01"
        error={errors.codigo?.message}
        {...register('codigo', { required: 'El código es obligatorio' })}
      />

      <Input
        id="descripcion"
        label="Descripción *"
        placeholder="Ej: Casa Matriz"
        error={errors.descripcion?.message}
        {...register('descripcion', { required: 'La descripción es obligatoria' })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Guardar cambios' : 'Crear tipo'}
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
        ¿Estás seguro de que deseas eliminar el tipo{' '}
        <span className="font-semibold text-gray-900">
          {item.codigo} – {item.descripcion}
        </span>
        ? Esta acción dejará de mostrarlo en el catálogo.
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
export default function TipoEstablecimientoPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [items, setItems]           = useState([])
  const [meta, setMeta]             = useState(null)
  const [page, setPage]             = useState(1)
  const [perPage, setPerPage]       = useState(15)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getTiposEstablecimiento({ page, per_page: perPage })
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
  }, [page, perPage])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(
    (a) =>
      a.codigo.toLowerCase().includes(search.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteTipoEstablecimiento(deleting.id)
      setDeleting(null)
      load()
    } catch {
      // ignore, user can retry
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Catálogo de Tipos de Establecimiento</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {(meta?.total ?? items.length)} tipo{(meta?.total ?? items.length) !== 1 ? 's' : ''} registrado{(meta?.total ?? items.length) !== 1 ? 's' : ''}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nuevo tipo
          </Button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={load}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
            title="Recargar"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay tipos de establecimiento registrados'}
            </p>
            {!search && isSuperAdmin && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreate(true)}
              >
                <Plus size={14} />
                Crear primer tipo
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500 w-32">Código</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Descripción</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-32">Creado</th>
                  {isSuperAdmin && (
                    <th className="px-6 py-3 font-medium text-gray-500 w-24 text-right">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {a.codigo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{a.descripcion}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('es-VE') : '—'}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditing(a)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleting(a)}
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
        title="Nuevo Tipo de Establecimiento"
        size="md"
      >
        <TipoEstablecimientoForm
          onSuccess={() => { setShowCreate(false); load() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar Tipo de Establecimiento"
        size="md"
      >
        {editing && (
          <TipoEstablecimientoForm
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
        title="Eliminar Tipo de Establecimiento"
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
