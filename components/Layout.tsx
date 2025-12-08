import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, PieChart, Folder, Settings, LogOut, PlusCircle, Menu, Search, X, ChevronRight } from 'lucide-react';
import { AuthService, DB } from '../services/db';
import { QRCodeData } from '../types';

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
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
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
         <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
               <Search className="text-slate-400" size={24} />
               <input 
                  autoFocus
                  placeholder="Search your QR codes..." 
                  className="flex-1 text-lg outline-none text-slate-700 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
               <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                 <X size={24} />
               </button>
            </div>
            
            <div className="overflow-y-auto p-2">
               {searchQuery && searchResults.length === 0 && (
                 <div className="p-8 text-center text-slate-400">No results found for "{searchQuery}"</div>
               )}
               {searchResults.map(qr => (
                 <div 
                    key={qr.id} 
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(`/analytics?id=${qr.id}`);
                    }}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg cursor-pointer group transition-colors"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <QrCode size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-800">{qr.name}</h4>
                          <p className="text-xs text-slate-500 uppercase">{qr.type} • {new Date(qr.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
                 </div>
               ))}
            </div>
            
            <div className="bg-slate-50 p-3 text-xs text-slate-400 text-center border-t border-slate-100">
               Press ESC to close
            </div>
         </div>
         {/* Backdrop Click */}
         <div className="absolute inset-0 -z-10" onClick={() => setSearchOpen(false)}></div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <GlobalSearchModal />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <QrCode className="text-indigo-600 mr-2" size={28} />
            <span className="text-xl font-bold text-slate-800">QRFlow</span>
          </div>

          <div className="p-4">
              <button 
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors text-sm text-left"
              >
                  <Search size={16} />
                  <span>Search...</span>
              </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <div className="px-3 mb-6 mt-2">
                <Link to="/create" className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg shadow-sm font-semibold transition-colors">
                    <PlusCircle size={20} />
                    Create QR
                </Link>
            </div>

            <NavItem to="/" icon={QrCode} label="My QR Codes" />
            <NavItem to="/folders" icon={Folder} label="Folders" />
            <NavItem to="/analytics" icon={PieChart} label="Analytics" />
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
            <div className="flex items-center">
                 <QrCode className="text-indigo-600 mr-2" size={24} />
                 <span className="font-bold text-lg text-slate-800">QRFlow</span>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setSearchOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Search size={24} />
                </button>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Menu size={24} />
                </button>
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