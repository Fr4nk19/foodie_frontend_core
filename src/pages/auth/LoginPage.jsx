import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input  from '../../components/ui/Input'

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [apiError, setApiError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const onSubmit = async (data) => {
    setApiError('')
    try {
      await signIn(data)
      navigate('/dashboard')
    } catch (err) {
      setApiError(
        err.response?.data?.message ?? 'Error al iniciar sesión. Intenta de nuevo.'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <UtensilsCrossed size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Foodie Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Panel de Administración Central</p>
          </div>

          {/* Error global */}
          {apiError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              label="Correo electrónico"
              type="email"
              placeholder="admin@foodie.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es obligatorio',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Correo inválido' },
              })}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`
                    w-full rounded-lg border px-3 py-2 text-sm pr-10
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                    ${errors.password ? 'border-red-400' : 'border-gray-300'}
                  `}
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPwd((v) => !v)}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Ingresar
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Solo acceso para administradores del sistema
          </p>
        </div>
      </div>
    </div>
  )
}
