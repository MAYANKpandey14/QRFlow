
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QREditor } from './components/QREditor';
import { Analytics } from './components/Analytics';
import { Redirect } from './components/Redirect';
import { FolderView } from './components/FolderView';
import { Settings } from './components/Settings';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthService } from './services/auth';

import { URLShortener } from './components/URLShortener';
import { ShortLinkRedirect } from './components/ShortLinkRedirect';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Separator } from './components/ui/separator';

const queryClient = new QueryClient();

// -- Login Component with Google Auth --
const Login: React.FC = () => {
    const { user, loading } = useAuth();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [authLoading, setAuthLoading] = React.useState(false);

    if (user) return <Navigate to="/" />;
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
    );

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            if (isSignUp) {
                await AuthService.signUp(email, password);
                alert("Check your email for the confirmation link!");
            } else {
                await AuthService.signIn(email, password);
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            await AuthService.signInWithGoogle();
        } catch (error: any) {
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold">QRFlow</CardTitle>
                    <CardDescription>Dynamic QR Management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full py-6"
                        onClick={handleGoogle}
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Continue with Google
                    </Button>

                    <div className="flex items-center gap-4">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={authLoading}
                        >
                            {authLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        {isSignUp ? 'Already have an account?' : 'No account?'}
                        <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="px-1">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </Button>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
    return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <Toaster position="top-right" />
                    <Routes>
                        <Route path="/r/:slug" element={<Redirect />} />
                        <Route path="/s/:slug" element={<ShortLinkRedirect />} />
                        <Route path="/login" element={<Login />} />

                        <Route path="/" element={
                            <PrivateRoute>
                                <Layout onLogout={AuthService.signOut}>
                                    <Dashboard />
                                </Layout>
                            </PrivateRoute>
                        } />

                        <Route path="/create" element={
                            <PrivateRoute>
                                <Layout onLogout={AuthService.signOut}>
                                    <QREditor />
                                </Layout>
                            </PrivateRoute>
                        } />

                        <Route path="/folders" element={
                            <PrivateRoute>
                                <Layout onLogout={AuthService.signOut}>
                                    <FolderView />
                                </Layout>
                            </PrivateRoute>
                        } />

                        <Route path="/analytics" element={
                            <PrivateRoute>
                                <Layout onLogout={AuthService.signOut}>
                                    <Analytics />
                                </Layout>
                            </PrivateRoute>
                        } />

                        <Route path="/shorten" element={
                            <PrivateRoute>
                                <Layout onLogout={AuthService.signOut}>
                                    <URLShortener />
                                </Layout>
                            </PrivateRoute>
                        } />

                        <Route path="/settings" element={
                            <PrivateRoute>
                                <Layout onLogout={AuthService.signOut}>
                                    <Settings />
                                </Layout>
                            </PrivateRoute>
                        } />

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default App;