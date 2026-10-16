import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { UserRole } from '../../types';

interface AppShellProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userRole: UserRole;
  currentUser: { name: string; email: string; avatarUrl?: string };
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenExport: () => void;
  onOpenAuditLogs: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  darkMode,
  onToggleDarkMode,
  userRole,
  currentUser,
  onLogout,
  onOpenUpload,
  onOpenExport,
  onOpenAuditLogs,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        userRole={userRole}
        onOpenUpload={onOpenUpload}
        onOpenExport={onOpenExport}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <Header
          userRole={userRole}
          darkMode={darkMode}
          onToggleDarkMode={onToggleDarkMode}
          onOpenAuditLogs={onOpenAuditLogs}
          onLogout={onLogout}
          currentUser={currentUser}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>

        {/* Futuristic SC TECH Footer */}
        <Footer />
      </div>
    </div>
  );
};
