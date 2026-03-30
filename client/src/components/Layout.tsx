import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Settings,
  Grid3X3,
  Users,
  BookOpen,
  CheckCircle,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'officer', 'management'] },
    ],
  },
  {
    section: 'Configuration',
    items: [
      { to: '/masters', label: 'Master Setup', icon: Settings, roles: ['admin'] },
      { to: '/quotas', label: 'Seat Matrix', icon: Grid3X3, roles: ['admin'] },
    ],
  },
  {
    section: 'Admissions',
    items: [
      { to: '/applicants', label: 'Applicants', icon: Users, roles: ['admin', 'officer'] },
      { to: '/allocation', label: 'Seat Allocation', icon: BookOpen, roles: ['admin', 'officer'] },
      { to: '/admissions', label: 'Confirmations', icon: CheckCircle, roles: ['admin', 'officer'] },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/masters': 'Master Setup',
  '/quotas': 'Seat Matrix & Quotas',
  '/applicants': 'Applicant Management',
  '/allocation': 'Seat Allocation',
  '/admissions': 'Admission Confirmations',
};

export function Layout() {
  const { username, role, logout } = useAuthStore();
  const location = useLocation();

  const pageTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/applicants/') ? 'Applicant Detail' : 'Dashboard');

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">A</div>
          <div>
            <div className="sidebar-logo-text">AdmissionCRM</div>
            <div className="sidebar-logo-sub">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((section) => {
            const filtered = section.items.filter((i) => role && i.roles.includes(role));
            if (filtered.length === 0) return null;
            return (
              <div key={section.section} className="sidebar-section">
                <div className="sidebar-section-title">{section.section}</div>
                {filtered.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <item.icon />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{username}</div>
              <div className="sidebar-user-role">{role}</div>
            </div>
            <button className="btn-icon" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <h1 className="topbar-title">{pageTitle}</h1>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
