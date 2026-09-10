import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Image,
  ShoppingCart,
  CreditCard,
  Ticket,
  Users as UsersIcon,
  SlidersHorizontal,
  Trophy,
  Share2,
  Wallet,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import logoIcon from '../assets/logo-icon.png';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: Package },
      { to: '/categories', label: 'Categories', icon: Layers },
      { to: '/banners', label: 'Banners', icon: Image },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/payment-settings', label: 'Payment Settings', icon: CreditCard },
      { to: '/coupons', label: 'Coupons', icon: Ticket },
    ],
  },
  {
    label: 'Network Marketing',
    items: [
      { to: '/mlm-settings', label: 'MLM Settings', icon: SlidersHorizontal },
      { to: '/ranks', label: 'Ranks', icon: Trophy },
      { to: '/network', label: 'Network', icon: Share2 },
      { to: '/payouts', label: 'Payouts', icon: Wallet },
    ],
  },
  {
    label: 'People',
    items: [{ to: '/users', label: 'Users', icon: UsersIcon }],
  },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="w-64 shrink-0 border-r border-border flex flex-col p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 mb-8 px-2 pt-1">
          <img src={logoIcon} alt="Ampere" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold font-[family-name:var(--font-display)] tracking-tight text-fg">
            Ampere <span className="text-accent">Admin</span>
          </span>
        </div>

        <nav className="flex flex-col gap-5 flex-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-subtle">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent-soft text-accent'
                          : 'text-muted hover:text-fg hover:bg-surface-hover'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-accent" />
                        )}
                        <item.icon
                          size={17}
                          strokeWidth={2}
                          className={isActive ? 'text-accent' : 'text-subtle group-hover:text-muted'}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border pt-3.5 px-1 flex items-center gap-2.5">
          <Avatar name={user?.name ?? '?'} size={34} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-fg truncate">{user?.name}</p>
            <p className="text-[11px] text-subtle truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="shrink-0 text-subtle hover:text-danger hover:bg-danger-soft rounded-lg p-2 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto animate-fade-in">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
