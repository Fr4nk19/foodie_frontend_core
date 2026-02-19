import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Activity, RefreshCw, Trash2, Star, ArrowLeft } from 'lucide-react'
import {
  getCatalogActivities,
  getCompanyActivities,
  addCompanyActivity,
  updateCompanyActivity,
  removeCompanyActivity,
} from '../../api/economicActivities'
import { useAuth } from '../../context/AuthContext'
import Button  from '../../components/ui/Button'
import Modal   from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import Badge   from '../../components/ui/Badge'

// ─── Add activity form ────────────────────────────────────────────────────────
function AddActivityForm({ companyId, existingIds, onSuccess, onCancel }) {
  const [catalog, setCatalog]     = useState([])
  const [selected, setSelected]   = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [loadingCat, setLoadingCat] = useState(true)
  const [apiError, setApiError]   = useState('')

  useEffect(() => {
    getCatalogActivities()
      .then(({ data }) => setCatalog(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingCat(false))
  }, [])

  // Filter out already-assigned activities
  const available = catalog.filter((a) => !existingIds.includes(a.id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) {
      setApiError('Debes seleccionar una actividad económica.')
      return
    }
    setApiError('')
    setLoading(true)
    try {
      await addCompanyActivity(companyId, {
        cat_mhactividad_id: Number(selected),
        is_primary: isPrimary,
      })
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0]?.[0]
        setApiError(first ?? msg ?? 'Error al asignar la actividad económica.')
      } else {
        setApiError(msg ?? 'Error al asignar la actividad económica.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingCat) return <div className="py-8"><Spinner /></div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {apiError}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="actividad" className="text-sm font-medium text-gray-700">
          Actividad económica *
        </label>
        {available.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No hay actividades disponibles para asignar.
          </p>
        ) : (
          <select
            id="actividad"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Seleccionar actividad...</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} – {a.descripcion}
              </option>
            ))}
          </select>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(e) => setIsPrimary(e.target.checked)}
          className="w-4 h-4 accent-brand-500"
        />
        <span className="text-sm text-gray-700">Marcar como actividad principal</span>
      </label>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={available.length === 0}>
          Agregar actividad
        </Button>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompanyEconomicActivitiesPage() {
  const { companyId } = useParams()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  // For company_admin: use their own company_id if no param
  const resolvedCompanyId = companyId ?? user?.company_id

  const [activities, setActivities]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [showAdd, setShowAdd]           = useState(false)
  const [togglingId, setTogglingId]     = useState(null)
  const [removingId, setRemovingId]     = useState(null)

  const load = useCallback(() => {
    if (!resolvedCompanyId) return
    setLoading(true)
    getCompanyActivities(resolvedCompanyId)
      .then(({ data }) => setActivities(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [resolvedCompanyId])

  useEffect(() => { load() }, [load])

  const handleTogglePrimary = async (activity) => {
    if (activity.is_primary) return // ya es principal, no hacer nada
    setTogglingId(activity.id)
    try {
      await updateCompanyActivity(resolvedCompanyId, activity.id, { is_primary: true })
      load()
    } finally {
      setTogglingId(null)
    }
  }

  const handleRemove = async (activity) => {
    setRemovingId(activity.id)
    try {
      await removeCompanyActivity(resolvedCompanyId, activity.id)
      load()
    } finally {
      setRemovingId(null)
    }
  }

  const existingIds = activities.map((a) => a.cat_mhactividad_id)

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
            <h2 className="text-xl font-bold text-gray-900">Actividades Económicas</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {activities.length} actividad{activities.length !== 1 ? 'es' : ''} asignada{activities.length !== 1 ? 's' : ''}
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
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            Agregar actividad
          </Button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center">
            <Activity size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aún no hay actividades económicas asignadas</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowAdd(true)}
            >
              <Plus size={14} />
              Agregar primera actividad
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500 w-32">Código</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Descripción</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-32">Estado</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-32 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {a.actividad?.codigo ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {a.actividad?.descripcion ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      {a.is_primary ? (
                        <Badge label="Principal" type="active" />
                      ) : (
                        <Badge label="Secundaria" type="default" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {!a.is_primary && (
                          <button
                            onClick={() => handleTogglePrimary(a)}
                            disabled={togglingId === a.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition disabled:opacity-50"
                            title="Marcar como principal"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(a)}
                          disabled={removingId === a.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          title="Quitar actividad"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Agregar Actividad Económica"
        size="md"
      >
        <AddActivityForm
          companyId={resolvedCompanyId}
          existingIds={existingIds}
          onSuccess={() => { setShowAdd(false); load() }}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  )
}
