import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QREditor } from './components/QREditor';
import { Analytics } from './components/Analytics';
import { Redirect } from './components/Redirect';
import { FolderView } from './components/FolderView';
import { Settings } from './components/Settings';
import { AuthService } from './services/db';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if(email) {
            setLoading(true);
            try {
                await AuthService.login(email);
                onLogin();
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">QRFlow</h1>
                    <p className="text-slate-500">Dynamic QR Management</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="demo@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing In...' : 'Sign In / Sign Up'}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-4">
                        (Simulated Auth - Enter any email to continue)
                    </p>
                </form>
            </div>
        </div>
    );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const user = AuthService.getCurrentUser();
    return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const [user, setUser] = useState(AuthService.getCurrentUser());

  const handleLogout = () => {
      AuthService.logout();
      setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public Route for Redirection */}
        <Route path="/r/:slug" element={<Redirect />} />
        
        {/* Auth Route */}
        <Route path="/login" element={!user ? <Login onLogin={() => setUser(AuthService.getCurrentUser())} /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route path="/" element={
            <PrivateRoute>
                <Layout onLogout={handleLogout}>
                    <Dashboard />
                </Layout>
            </PrivateRoute>
        } />
        
        <Route path="/create" element={
            <PrivateRoute>
                <Layout onLogout={handleLogout}>
                    <QREditor />
                </Layout>
            </PrivateRoute>
        } />

        <Route path="/folders" element={
            <PrivateRoute>
                <Layout onLogout={handleLogout}>
                    <FolderView />
                </Layout>
            </PrivateRoute>
        } />

        <Route path="/analytics" element={
            <PrivateRoute>
                <Layout onLogout={handleLogout}>
                    <Analytics />
                </Layout>
            </PrivateRoute>
        } />

        <Route path="/settings" element={
            <PrivateRoute>
                <Layout onLogout={handleLogout}>
                    <Settings />
                </Layout>
            </PrivateRoute>
        } />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;