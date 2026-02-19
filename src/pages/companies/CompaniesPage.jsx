import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Building2, Search, RefreshCw, Activity } from 'lucide-react'
import { getCompanies, createCompany } from '../../api/companies'
import Button  from '../../components/ui/Button'
import Input   from '../../components/ui/Input'
import Modal   from '../../components/ui/Modal'
import Badge   from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

// ─── Create Company Form ──────────────────────────────────────────────────────
function CompanyForm({ onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { country: 'Venezuela', timezone: 'UTC', plan: 'free' } })

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await createCompany(data)
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
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCompanies()
      .then(({ data }) => setCompanies(data.companies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
            {companies.length} empresa{companies.length !== 1 ? 's' : ''} registrada{companies.length !== 1 ? 's' : ''}
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
                      <div className="flex justify-end">
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
