import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  FileText,
  ClipboardList,
  Lock,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sections: SidebarSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    title: 'Assessment',
    items: [
      { label: 'Controls', path: '/controls', icon: <Shield size={18} /> },
      { label: 'POA&M Items', path: '/poam', icon: <ClipboardList size={18} /> },
    ],
  },
  {
    title: 'Evidence',
    items: [
      { label: 'Evidence', path: '/evidence', icon: <FileText size={18} /> },
      { label: 'Upload Evidence', path: '/upload-evidence', icon: <Upload size={18} /> },
    ],
  },
  {
    title: 'Scope',
    items: [
      { label: 'Boundary Assets', path: '/boundary', icon: <Lock size={18} /> },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  collapsed,
  onToggle,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const showLabels = isMobile || !collapsed;

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 bg-white border-r border-eaw-border z-40 overflow-y-auto transition-all duration-200 ${
        isMobile
          ? `w-56 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`
          : collapsed
          ? 'w-12'
          : 'w-56'
      }`}
    >
      {/* Collapse toggle — hidden on mobile */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 px-3 py-3 text-xs font-semibold text-eaw-muted uppercase tracking-wider hover:bg-gray-50 border-b border-eaw-border-light"
        >
          {collapsed ? (
            <ChevronRight size={16} className="mx-auto" />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span>Navigation</span>
            </>
          )}
        </button>
      )}

      {sections.map((section) => (
        <div key={section.title}>
          {showLabels && (
            <div className="px-3 pt-4 pb-1 text-[10px] font-semibold text-eaw-muted uppercase tracking-widest">
              {section.title}
            </div>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              end={item.path === '/'}
              onClick={() => {
                if (isMobile && onMobileClose) onMobileClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 min-h-[44px] text-sm transition-colors ${
                  !showLabels ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-eaw-primary text-white'
                    : 'text-eaw-font hover:bg-gray-50'
                }`
              }
              title={!showLabels ? item.label : undefined}
            >
              {item.icon}
              {showLabels && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
