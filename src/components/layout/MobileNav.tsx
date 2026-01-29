import { useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, User, Settings } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Assessments', url: '/assessments', icon: ClipboardList },
  { title: 'Profile', url: '/profile', icon: User },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => (
          <NavLink
            key={item.title}
            to={item.url}
            end
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors',
              isActive(item.url) && 'text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
