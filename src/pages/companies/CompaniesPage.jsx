import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Building2, Search, RefreshCw, Activity, X, Users } from 'lucide-react'
import { getCompanies, createCompany } from '../../api/companies'
import { getCatalogActivities, addCompanyActivity } from '../../api/economicActivities'
import Button     from '../../components/ui/Button'
import Input      from '../../components/ui/Input'
import Modal      from '../../components/ui/Modal'
import Badge      from '../../components/ui/Badge'
import Spinner    from '../../components/ui/Spinner'
import Pagination from '../../components/ui/Pagination'

// ─── Create Company Form ──────────────────────────────────────────────────────
function CompanyForm({ onSuccess, onCancel }) {
  const [apiError, setApiError]               = useState('')
  const [catalogActivities, setCatalogActivities] = useState([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [activitySearch, setActivitySearch]   = useState('')
  const [selectedIds, setSelectedIds]         = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { country: 'Venezuela', timezone: 'UTC', plan: 'free' } })

  useEffect(() => {
    getCatalogActivities()
      .then(({ data }) => setCatalogActivities(data.data ?? data ?? []))
      .catch(() => setCatalogActivities([]))
      .finally(() => setLoadingActivities(false))
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

      {/* Fila 1 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            id="name"
            label="Nombre de la empresa *"
            placeholder="Ej: Restaurante El Buen Sabor"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Input
          id="email"
          label="Correo electrónico *"
          type="email"
          placeholder="contacto@empresa.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
          })}
        />

        <Input
          id="phone"
          label="Teléfono"
          type="tel"
          placeholder="+58 414 000 0000"
          {...register('phone')}
        />
      </div>

      {/* Fila 2 */}
      <Input
        id="address"
        label="Dirección"
        placeholder="Av. Principal, Local 1"
        {...register('address')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input id="city"  label="Ciudad"  placeholder="Caracas" {...register('city')} />
        <Input id="state" label="Estado"  placeholder="Distrito Capital" {...register('state')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="plan" className="text-sm font-medium text-gray-700">Plan</label>
          <select
            id="plan"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            {...register('plan')}
          >
            <option value="free">Gratuito</option>
            <option value="basic">Básico</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <Input
          id="branch_name"
          label="Nombre sucursal principal"
          placeholder="Principal"
          {...register('branch_name')}
        />
      </div>

      {/* Actividades económicas */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Actividades económicas
          </label>
          {selectedIds.length > 0 && (
            <span className="text-xs text-brand-600 font-medium">
              {selectedIds.length} seleccionada{selectedIds.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Chips de seleccionadas */}
        {selectedActivities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedActivities.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs font-medium"
              >
                {a.codigo} · {a.descripcion.length > 30 ? a.descripcion.slice(0, 30) + '…' : a.descripcion}
                <button
                  type="button"
                  onClick={() => toggleActivity(a.id)}
                  className="ml-0.5 text-brand-400 hover:text-brand-700"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Búsqueda */}
          <div className="relative border-b border-gray-200">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={activitySearch}
              onChange={(e) => setActivitySearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
            />
          </div>

          {/* Lista */}
          <div className="max-h-40 overflow-y-auto">
            {loadingActivities ? (
              <div className="py-4"><Spinner /></div>
            ) : filteredActivities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {activitySearch ? 'Sin resultados' : 'No hay actividades en el catálogo'}
              </p>
            ) : (
              filteredActivities.map((a) => (
                <label
                  key={a.id}
                  className="flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleActivity(a.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-700 leading-tight">
                    <span className="font-medium text-gray-500">{a.codigo}</span>
                    {' — '}
                    {a.descripcion}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Crear empresa
        </Button>
      </div>
    </form>
  )
}

// ─── Plan label map ───────────────────────────────────────────────────────────
const planLabel = { free: 'Gratuito', basic: 'Básico', premium: 'Premium' }
const planType  = { free: 'free',     basic: 'basic',  premium: 'premium' }

// ─── Companies Page ───────────────────────────────────────────────────────────
export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [meta, setMeta]           = useState(null)
  const [page, setPage]           = useState(1)
  const [perPage, setPerPage]     = useState(15)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCompanies({ page, per_page: perPage })
      .then(({ data }) => {
        // Supports both paginated { data, meta } and legacy { companies } responses
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

  const handleCreated = () => {
    setShowModal(false)
    load()
  }

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
          <Plus size={16} />
          Nueva empresa
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
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
            <Building2 size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay empresas registradas'}
            </p>
            {!search && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowModal(true)}
              >
                <Plus size={14} />
                Crear primera empresa
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500">Empresa</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Ciudad</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Plan</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Sucursales</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Estado</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Creada</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-16 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.slug}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{c.email}</td>
                    <td className="px-6 py-4 text-gray-500">{c.city ?? '—'}</td>
                    <td className="px-6 py-4">
                      <Badge
                        label={planLabel[c.plan] ?? c.plan}
                        type={planType[c.plan] ?? 'default'}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {c.branches?.length ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        label={c.status === 'active' ? 'Activo' : 'Inactivo'}
                        type={c.status === 'active' ? 'active' : 'inactive'}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('es-VE') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          to={`/companies/${c.id}/users`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Usuarios"
                        >
                          <Users size={15} />
                        </Link>
                        <Link
                          to={`/companies/${c.id}/economic-activities`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="Actividades económicas"
                        >
                          <Activity size={15} />
                        </Link>
                      </div>
                    </td>
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
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Empresa"
        size="lg"
      >
        <CompanyForm
          onSuccess={handleCreated}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
    </div>
  )
}
