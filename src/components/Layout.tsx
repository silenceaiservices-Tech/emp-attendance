import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Clock, 
  BarChart3, 
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  Shield
} from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSync } from '@/hooks/useSync';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', icon: QrCode, label: 'Attendance' },
  { to: '/dashboard', icon: Home, label: 'Dashboard', adminOnly: true },
  { to: '/employees', icon: Users, label: 'Employees', adminOnly: true },
  { to: '/records', icon: Clock, label: 'Records', adminOnly: true },
  { to: '/reports', icon: BarChart3, label: 'Reports', adminOnly: true },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { isSyncing, pendingCount, sync, lastSyncTime } = useSync();
  const { isAdmin, logout } = useAuth();

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">AttendanceHub</h1>
                <p className="text-xs text-muted-foreground">Employee Time Tracking</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Online/Offline Indicator */}
              <div className={cn('online-indicator', isOnline ? 'online' : 'offline')}>
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                )}
              </div>

              {/* Sync Status */}
              {pendingCount > 0 && (
                <div className="sync-badge pending">
                  <span>{pendingCount} pending</span>
                </div>
              )}

              {/* Sync Button */}
              {isOnline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={sync}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </Button>
              )}

              {/* Admin indicator & logout */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-16 z-40 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer with last sync time */}
      {lastSyncTime && (
        <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-2 text-center text-xs text-muted-foreground">
            Last synced: {lastSyncTime.toLocaleString()}
          </div>
        </footer>
      )}
    </div>
  );
};
