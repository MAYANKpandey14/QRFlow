import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/db';
import { User, Save, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
    const [user, setUser] = useState(AuthService.getCurrentUser());
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

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
            <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>

            {/* Profile Section */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{name}</h2>
                        <p className="text-slate-500">{email}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-4">
                        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                            <Save size={18} /> Save Changes
                        </button>
                        {message && (
                            <div className={`flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100">
                <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} /> Danger Zone
                </h3>
                <p className="text-slate-600 mb-6 text-sm">
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button 
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-2 px-6 py-2 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={18} /> Delete Account
                </button>
            </div>
        </div>
    );
};