import React, { useState, useEffect, useMemo } from 'react';
import { DB, AuthService } from '../services/db';
import { Folder, QRCodeData } from '../types';
import { Folder as FolderIcon, Trash, ArrowLeft, QrCode, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';

const FOLDER_COLORS = [
    { name: 'Blue', value: 'blue', class: 'text-blue-500 bg-blue-50 border-blue-200 hover:border-blue-300' },
    { name: 'Red', value: 'red', class: 'text-red-500 bg-red-50 border-red-200 hover:border-red-300' },
    { name: 'Green', value: 'green', class: 'text-green-500 bg-green-50 border-green-200 hover:border-green-300' },
    { name: 'Purple', value: 'purple', class: 'text-purple-500 bg-purple-50 border-purple-200 hover:border-purple-300' },
    { name: 'Orange', value: 'orange', class: 'text-orange-500 bg-orange-50 border-orange-200 hover:border-orange-300' },
    { name: 'Gray', value: 'gray', class: 'text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-300' },
];

export const FolderView: React.FC = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState('blue');
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [folderQrs, setFolderQrs] = useState<QRCodeData[]>([]);
    
    // Fix: Memoize user to prevent infinite loop in useEffect
    const user = useMemo(() => AuthService.getCurrentUser(), []);

    useEffect(() => {
        if(user) setFolders(DB.getFolders(user.id));
    }, [user]);

    useEffect(() => {
        if(selectedFolder && user) {
            setFolderQrs(DB.getQRs(user.id).filter(q => q.folderId === selectedFolder.id));
        }
    }, [selectedFolder, user]);

    const handleCreate = () => {
        if(!newFolderName || !user) return;
        DB.createFolder(user.id, newFolderName, selectedColor);
        setFolders(DB.getFolders(user.id));
        setNewFolderName('');
        setSelectedColor('blue');
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(confirm('Are you sure you want to delete this folder? QR codes inside will be moved to the main list.')) {
            DB.deleteFolder(id);
            if(user) setFolders(DB.getFolders(user.id));
            if(selectedFolder?.id === id) setSelectedFolder(null);
        }
    }

    const getFolderColorClass = (colorName: string) => {
        return FOLDER_COLORS.find(c => c.value === colorName)?.class || FOLDER_COLORS[0].class;
    };

    if (selectedFolder) {
        return (
            <div className="space-y-6">
                <button onClick={() => setSelectedFolder(null)} className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors">
                    <ArrowLeft size={20} /> Back to Folders
                </button>
                <div className="flex items-center gap-3">
                    <FolderIcon className={`w-8 h-8 ${getFolderColorClass(selectedFolder.color).split(' ')[0]}`} />
                    <h1 className="text-2xl font-bold text-slate-900">{selectedFolder.name}</h1>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">{folderQrs.length} Items</span>
                </div>

                {folderQrs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">This folder is empty.</p>
                        <Link to="/create" className="text-indigo-600 font-medium hover:underline mt-2 inline-block">Create QR Code</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {folderQrs.map(qr => (
                             <div key={qr.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                                 <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                     <QrCode size={24} />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                     <h4 className="font-bold text-slate-900 truncate">{qr.name}</h4>
                                     <p className="text-xs text-slate-500 uppercase">{qr.type}</p>
                                 </div>
                                 <Link to={`/analytics?id=${qr.id}`} className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 font-medium transition-colors">Stats</Link>
                             </div>
                         ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Folder Management</h1>
            <p className="text-slate-500 -mt-4">Organize your QR codes into colored folders.</p>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-slate-700">Folder Name</label>
                        <input 
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                            placeholder="e.g. Marketing Campaign"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-medium text-slate-700">Color Tag</label>
                         <div className="flex gap-2">
                             {FOLDER_COLORS.map(c => (
                                 <button
                                    key={c.value}
                                    onClick={() => setSelectedColor(c.value)}
                                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor === c.value ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                    title={c.name}
                                 >
                                     <div className={`w-6 h-6 rounded-full ${c.class.split(' ')[1].replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                                 </button>
                             ))}
                         </div>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleCreate} disabled={!newFolderName} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-11">
                            Create Folder
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {folders.map(f => {
                    const colorStyle = getFolderColorClass(f.color);
                    return (
                        <div 
                            key={f.id} 
                            onClick={() => setSelectedFolder(f)}
                            className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between h-36 cursor-pointer transition-all group ${colorStyle}`}
                        >
                            <div className="flex items-start justify-between">
                                <FolderIcon className="opacity-80" size={32} />
                                <button 
                                    onClick={(e) => handleDelete(f.id, e)} 
                                    className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-white/50 transition-colors"
                                    title="Delete Folder"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 group-hover:underline decoration-2 underline-offset-2 transition-all">{f.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">Open to view QRs</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}