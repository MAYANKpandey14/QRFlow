import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/db';
import { User, Save, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export const Settings: React.FC = () => {
    const [user, setUser] = useState(AuthService.getCurrentUser());
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const u = AuthService.getCurrentUser();
        if (u) {
            setUser(u);
            setName(u.name);
            setEmail(u.email);
        }
    }, []);

    const handleSave = () => {
        if (!user) return;

        try {
            const updatedUser = { ...user, name, email };
            AuthService.updateUser(updatedUser);
            setUser(updatedUser);
            setMessage({ type: 'success', text: 'Profile updated successfully.' });

            setTimeout(() => setMessage(null), 3000);
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    const handleDeleteAccount = () => {
        if (confirm("Are you sure? This action cannot be undone. All your QR codes and data will be permanently lost.")) {
            if (user) {
                AuthService.deleteAccount(user.id);
                window.location.reload();
            }
        }
    };

    return (
        <div className="max-w-2xl space-y-8 pb-10">
            <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>

            {/* Profile Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary text-3xl font-bold">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{name}</h2>
                            <p className="text-muted-foreground">{email}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="pt-4 border-t border-border flex items-center gap-4">
                            <Button onClick={handleSave} className="gap-2">
                                <Save size={18} /> Save Changes
                            </Button>
                            {message && (
                                <div className={`flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                                    {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                    {message.text}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/20">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle size={20} /> Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Once you delete your account, there is no going back. Please be certain.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="outline"
                        onClick={handleDeleteAccount}
                        className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                        <Trash2 size={18} /> Delete Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};