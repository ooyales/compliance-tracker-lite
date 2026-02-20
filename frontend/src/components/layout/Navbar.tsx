import { Search, User, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface NavbarProps {
  isMobile?: boolean;
  onMenuToggle?: () => void;
}

export default function Navbar({ isMobile, onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-gray-800 text-white flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuToggle}
            className="p-2 rounded hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded bg-eaw-primary text-white font-bold text-sm">
            CT
          </div>
          <span className="hidden sm:inline text-base font-semibold tracking-wide">
            Compliance Tracker Lite
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search controls..."
            className="w-40 sm:w-56 pl-8 pr-3 py-1.5 text-sm bg-gray-700 text-white rounded border border-gray-600 outline-none placeholder-gray-400 focus:border-eaw-primary focus:ring-1 focus:ring-eaw-primary"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
          <User size={16} />
          <span>{user?.username ?? 'Guest'}</span>
          <span className="text-xs text-gray-500">({user?.role})</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1 p-2 text-sm text-gray-300 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
