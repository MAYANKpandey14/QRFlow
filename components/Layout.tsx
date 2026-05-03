import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, PieChart, Folder, Settings, LogOut, PlusCircle, Menu, Search, X, ChevronRight, Link2 } from 'lucide-react';
import { AuthService, DB } from '../services/db';
import { QRCodeData } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = AuthService.getCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<QRCodeData[]>([]);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim() && user) {
        const allQrs = DB.getQRs(user.id);
        const results = allQrs.filter(q =>
          q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery, user]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      AuthService.logout();
      window.location.reload();
    }
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
          isActive
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  const GlobalSearchModal = () => {
    if (!searchOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center pt-24 modal-enter">
        <div className="bg-card w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Search className="text-muted-foreground" size={24} />
            <Input
              autoFocus
              placeholder="Search your QR codes..."
              className="flex-1 text-lg border-0 shadow-none focus-visible:ring-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
              <X size={24} />
            </Button>
          </div>

          <div className="overflow-y-auto p-2">
            {searchQuery && searchResults.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No results found for "{searchQuery}"</div>
            )}
            {searchResults.map(qr => (
              <div
                key={qr.id}
                onClick={() => {
                  setSearchOpen(false);
                  navigate(`/analytics?id=${qr.id}`);
                }}
                className="flex items-center justify-between p-4 hover:bg-accent rounded-lg cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{qr.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase">{qr.type} • {new Date(qr.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
              </div>
            ))}
          </div>

          <div className="bg-muted p-3 text-xs text-muted-foreground text-center border-t border-border">
            Press ESC to close
          </div>
        </div>
        {/* Backdrop Click */}
        <div className="absolute inset-0 -z-10" onClick={() => setSearchOpen(false)}></div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <GlobalSearchModal />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static",
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <QrCode className="text-primary mr-2" size={28} />
            <span className="text-xl font-bold text-foreground">QRFlow</span>
          </div>

          <div className="p-4">
            <Button
              variant="outline"
              onClick={() => setSearchOpen(true)}
              className="w-full justify-start gap-2"
            >
              <Search size={16} />
              <span>Search...</span>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <div className="px-3 mb-6 mt-2">
              <Button asChild className="w-full py-6 gap-2">
                <Link to="/create">
                  <PlusCircle size={20} />
                  Create QR
                </Link>
              </Button>
            </div>

            <NavItem to="/" icon={QrCode} label="My QR Codes" />
            <NavItem to="/folders" icon={Folder} label="Folders" />
            <NavItem to="/analytics" icon={PieChart} label="Analytics" />
            <NavItem to="/shorten" icon={Link2} label="URL Shortener" />
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-card h-16 border-b border-border flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center">
            <QrCode className="text-primary mr-2" size={24} />
            <span className="font-bold text-lg text-foreground">QRFlow</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
              <Search size={24} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={24} />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Animated Page Transition Wrapper */}
          <div key={location.pathname} className="page-enter max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};