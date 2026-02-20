import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Users, Search, RefreshCw, Pencil, Trash2, Power, ArrowLeft } from 'lucide-react'
import { getCompanyUsers, createCompanyUser, updateCompanyUser, deleteCompanyUser } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import Button  from '../../components/ui/Button'
import Input   from '../../components/ui/Input'
import Modal   from '../../components/ui/Modal'
import Badge   from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function roleBadge(role) {
  const map = {
    super_admin:    { label: 'Super Admin',      color: 'purple' },
    company_admin:  { label: 'Admin Empresa',    color: 'blue'   },
    branch_manager: { label: 'Gerente Sucursal', color: 'yellow' },
    employee:       { label: 'Empleado',         color: 'gray'   },
  }
  return map[role] ?? { label: role, color: 'gray' }
}

// ─── User Form ────────────────────────────────────────────────────────────────
function UserForm({ initial, companyId, isSuperAdmin, onSuccess, onCancel }) {
  const [apiError, setApiError] = useState('')
  const isEdit = !!initial

  const allowedRoles = isSuperAdmin
    ? [
        { value: 'company_admin',  label: 'Admin Empresa'    },
        { value: 'branch_manager', label: 'Gerente Sucursal' },
        { value: 'employee',       label: 'Empleado'         },
      ]
    : [
        { value: 'branch_manager', label: 'Gerente Sucursal' },
        { value: 'employee',       label: 'Empleado'         },
      ]

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: initial
      ? { name: initial.name, email: initial.email, role: initial.role, is_active: initial.is_active }
      : { role: 'employee', is_active: true },
  })

  const onSubmit = async (data) => {
    setApiError('')
    if (isEdit && !data.password) delete data.password

    try {
      if (isEdit) {
        await updateCompanyUser(companyId, initial.id, data)
      } else {
        await createCompanyUser(companyId, data)
      }
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.message
      const fieldErrors = err.response?.data?.errors
      if (fieldErrors) {
        const first = Object.values(fieldErrors)[0]?.[0]
        setApiError(first ?? msg ?? 'Error al guardar el usuario.')
      } else {
        setApiError(msg ?? 'Error al guardar el usuario.')
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
          <Input
            id="name"
            label="Nombre completo *"
            placeholder="Juan Pérez"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
        </div>

        <Input
          id="email"
          label="Correo electrónico *"
          type="email"
          placeholder="juan@empresa.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
          })}
        />

        <Input
          id="password"
          label={isEdit ? 'Nueva contraseña' : 'Contraseña *'}
          type="password"
          placeholder={isEdit ? 'Dejar en blanco para no cambiar' : 'Mínimo 8 caracteres'}
          error={errors.password?.message}
          {...register('password', {
            ...(!isEdit ? { required: 'La contraseña es obligatoria' } : {}),
            minLength: { value: 8, message: 'Mínimo 8 caracteres' },
          })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-gray-700">Rol *</label>
        <select
          id="role"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          {...register('role', { required: 'El rol es obligatorio' })}
        >
          {allowedRoles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_active"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          {...register('is_active')}
        />
        <label htmlFor="is_active" className="text-sm text-gray-700">Usuario activo</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button type="submit" loading={isSubmitting}>
          {isEdit ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmDeleteModal({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ¿Estás seguro de que deseas eliminar al usuario{' '}
        <span className="font-semibold text-gray-900">{user.name}</span>?
        Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} type="button">Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>Eliminar</Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompanyUsersPage() {
  const { companyId } = useParams()
  const { user: authUser } = useAuth()
  const isSuperAdmin = authUser?.role === 'super_admin'

  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getCompanyUsers(companyId)
      .then(({ data }) => setUsers(data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyId])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteCompanyUser(companyId, deleting.id)
      setDeleting(null)
      load()
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleActive = async (u) => {
    try {
      await updateCompanyUser(companyId, u.id, { is_active: !u.is_active })
      load()
    } catch {
      // ignore
    }
  }

  const backTo = isSuperAdmin ? '/companies' : '/dashboard'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={backTo}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            title="Volver"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Usuarios de la empresa</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nuevo usuario
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
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

        {loading ? (
          <div className="py-16"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay usuarios en esta empresa'}
            </p>
            {!search && (
              <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus size={14} />
                Crear primer usuario
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left bg-gray-50">
                  <th className="px-6 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Correo</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-36">Rol</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-24">Estado</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-28">Creado</th>
                  <th className="px-6 py-3 font-medium text-gray-500 w-28 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => {
                  const { label, color } = roleBadge(u.role)
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <Badge color={color}>{label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge color={u.is_active ? 'green' : 'red'}>
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-VE') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.is_active
                                ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={u.is_active ? 'Desactivar' : 'Activar'}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            onClick={() => setEditing(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleting(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Usuario" size="md">
        <UserForm
          companyId={companyId}
          isSuperAdmin={isSuperAdmin}
          onSuccess={() => { setShowCreate(false); load() }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Usuario" size="md">
        {editing && (
          <UserForm
            initial={editing}
            companyId={companyId}
            isSuperAdmin={isSuperAdmin}
            onSuccess={() => { setEditing(null); load() }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar Usuario" size="sm">
        {deleting && (
          <ConfirmDeleteModal
            user={deleting}
            onConfirm={handleDelete}
            onCancel={() => setDeleting(null)}
            loading={deleteLoading}
          />
        )}
      </Modal>
    </div>
  )
}
