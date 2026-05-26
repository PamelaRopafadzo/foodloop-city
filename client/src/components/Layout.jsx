import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon, CubeIcon, ClipboardDocumentListIcon,
  HeartIcon, ChartBarIcon, UserGroupIcon,
  ArrowRightOnRectangleIcon, MapPinIcon
} from '@heroicons/react/24/outline';

const NAV = {
  manager: [
    { to: '/dashboard', icon: HomeIcon,                  label: 'Dashboard'  },
    { to: '/products',  icon: CubeIcon,                  label: 'Products'   },
    { to: '/inventory', icon: ClipboardDocumentListIcon, label: 'Inventory'  },
    { to: '/donations', icon: HeartIcon,                 label: 'Donations'  },
    { to: '/analytics', icon: ChartBarIcon,              label: 'Analytics'  },
  ],
  staff: [
    { to: '/inventory', icon: ClipboardDocumentListIcon, label: 'Log Stock'  },
  ],
  charity_coordinator: [
    { to: '/map',       icon: MapPinIcon,                label: 'Live Map'   },
    { to: '/claims',    icon: HeartIcon,                 label: 'My Claims'  },
    { to: '/impact',    icon: ChartBarIcon,              label: 'Impact'     },
  ],
  admin: [
    { to: '/admin',       icon: HomeIcon,      label: 'Overview'       },
    { to: '/admin/orgs',  icon: UserGroupIcon, label: 'Organisations'  },
    { to: '/admin/users', icon: UserGroupIcon, label: 'Users'          },
  ]
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const nav              = NAV[user?.role] || [];

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-lg font-bold text-brand-700">🌱 FoodLoop</span>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {user?.organisation?.name || 'Platform Admin'}
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}