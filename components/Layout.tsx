import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, User, Scale, RefreshCcw, UserCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  currentUser: UserType | null;
  onChangeUser: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentUser, onChangeUser }) => {
  const location = useLocation();

  if (!currentUser) return <Outlet />;

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Home' },
    { to: '/add', icon: PlusCircle, label: 'Add' },
    { to: '/personal', icon: User, label: 'Personal' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
    { to: '/settlement', icon: Scale, label: 'Settle' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Bar - Now scrolls with page */}
      <header className="bg-white px-4 py-3 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Brotherhood</h1>
        <button
          onClick={onChangeUser}
          className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full"
        >
          <div className={`w-6 h-6 rounded-full ${currentUser.avatarColor} text-white text-xs flex items-center justify-center font-bold`}>
            {currentUser.id}
          </div>
          <span className="text-sm font-medium text-slate-700">{currentUser.name}</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        <Outlet />
      </main>

      {/* Bottom Nav - Added safe area padding */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe overflow-x-auto" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        <div className="flex items-center max-w-md mx-auto min-w-max">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-3 px-2 transition-colors min-w-[60px] ${isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[9px] font-medium mt-1">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};