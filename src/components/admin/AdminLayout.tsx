import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, HelpCircle, LogOut, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Jobs', url: '/admin/jobs', icon: Briefcase },
  { title: 'Quiz Management', url: '/admin/quizzes', icon: HelpCircle },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#0f1117' }}>
      {/* Sidebar - Desktop */}
      <aside
        className="hidden w-60 flex-col md:flex"
        style={{ background: '#161821', borderRight: '1px solid #2a2d3a' }}
      >
        <div className="flex items-center gap-3 p-5" style={{ borderBottom: '1px solid #2a2d3a' }}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
          >
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">ADMIN</p>
            <p className="text-[11px] font-medium" style={{ color: '#6b7280' }}>IntelliHire Control</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-white shadow-lg'
                    : 'hover:text-white'
                )
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'linear-gradient(135deg, #ef4444, #f97316)' }
                  : { color: '#9ca3af' }
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '1px solid #2a2d3a' }}>
          <div className="mb-3 px-2">
            <p className="text-xs font-medium text-white truncate">{user?.email}</p>
            <p className="text-[11px]" style={{ color: '#6b7280' }}>Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-white"
            style={{ color: '#9ca3af', background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1f2233')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 h-full w-64 flex flex-col"
            style={{ background: '#161821' }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #2a2d3a' }}>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
                >
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">ADMIN</span>
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" style={{ color: '#9ca3af' }} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive ? 'text-white' : ''
                    )
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { background: 'linear-gradient(135deg, #ef4444, #f97316)' }
                      : { color: '#9ca3af' }
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-4" style={{ borderTop: '1px solid #2a2d3a' }}>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm"
                style={{ color: '#9ca3af' }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header
          className="flex h-14 items-center justify-between px-5"
          style={{ background: '#161821', borderBottom: '1px solid #2a2d3a' }}
        >
          <button className="md:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" style={{ color: '#9ca3af' }} />
          </button>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ef4444' }}>
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#6b7280' }}>{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-none text-xs md:hidden"
              style={{ color: '#9ca3af', background: '#1f2233' }}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6" style={{ background: '#0f1117' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
