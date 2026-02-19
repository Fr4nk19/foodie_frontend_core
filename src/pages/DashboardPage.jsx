import { useState, useEffect } from 'react'
import { Building2, CheckCircle, TrendingUp, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getCompanies } from '../api/companies'
import Spinner from '../components/ui/Spinner'

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        {loading ? (
          <div className="h-7 w-10 bg-gray-100 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getCompanies()
      .then(({ data }) => setCompanies(data.companies ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active   = companies.filter((c) => c.status === 'active').length
  const onTrial  = companies.filter((c) => c.trial_ends_at).length
  const onFree   = companies.filter((c) => c.plan === 'free').length

  const now  = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
        <p className="text-brand-100 text-sm">{greeting},</p>
        <h2 className="text-2xl font-bold mt-1">{user?.name ?? 'Administrador'}</h2>
        <p className="text-brand-100 text-sm mt-1 capitalize">
          {user?.role?.replace('_', ' ')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Empresas"
          value={companies.length}
          color="bg-brand-500"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Empresas Activas"
          value={active}
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Plan Gratuito"
          value={onFree}
          color="bg-indigo-500"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="En Prueba"
          value={onTrial}
          color="bg-amber-500"
          loading={loading}
        />
      </div>

      {/* Recent companies table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Empresas recientes</h3>
        </div>

        {loading ? (
          <div className="py-12"><Spinner /></div>
        ) : companies.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            <Building2 size={36} className="mx-auto mb-2 opacity-30" />
            <p>Aún no hay empresas registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Empresa</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Plan</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-3 text-gray-500">{c.email}</td>
                    <td className="px-6 py-3 capitalize">{c.plan}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
