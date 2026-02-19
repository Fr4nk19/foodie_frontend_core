import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, Settings, UtensilsCrossed } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/companies', icon: Building2,        label: 'Empresas'  },
  { to: '/users',     icon: Users,            label: 'Usuarios',  soon: true },
  { to: '/settings',  icon: Settings,         label: 'Configuración', soon: true },
]

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <UtensilsCrossed size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Foodie</p>
          <p className="text-slate-400 text-xs">Panel Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, soon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
               ${isActive
                 ? 'bg-brand-500 text-white'
                 : 'text-slate-400 hover:bg-slate-800 hover:text-white'
               }
               ${soon ? 'pointer-events-none opacity-40' : ''}`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {soon && (
              <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                Pronto
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">© 2025 Foodie SaaS</p>
      </div>
    </aside>
  )
}
