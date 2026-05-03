
import React, { useState } from 'react';
import { useFolders, useCreateFolder, useDeleteFolder, useQRs } from '../hooks/useData';
import { Folder, QRCodeData } from '../types';
import { Folder as FolderIcon, Trash, ArrowLeft, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

const FOLDER_COLORS = [
    { name: 'Blue', value: 'blue', class: 'text-blue-500 bg-blue-50 border-blue-200 hover:border-blue-300' },
    { name: 'Red', value: 'red', class: 'text-red-500 bg-red-50 border-red-200 hover:border-red-300' },
    { name: 'Green', value: 'green', class: 'text-green-500 bg-green-50 border-green-200 hover:border-green-300' },
    { name: 'Purple', value: 'purple', class: 'text-purple-500 bg-purple-50 border-purple-200 hover:border-purple-300' },
    { name: 'Orange', value: 'orange', class: 'text-orange-500 bg-orange-50 border-orange-200 hover:border-orange-300' },
    { name: 'Gray', value: 'gray', class: 'text-slate-500 bg-slate-50 border-slate-200 hover:border-slate-300' },
];

export const FolderView: React.FC = () => {
    const { data: folders } = useFolders();
    const { data: qrs } = useQRs();
    const createMutation = useCreateFolder();
    const deleteMutation = useDeleteFolder();

    const [newFolderName, setNewFolderName] = useState('');
    const [selectedColor, setSelectedColor] = useState('blue');
    const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleCreate = () => {
        if (!newFolderName) return;
        createMutation.mutate({ name: newFolderName, color: selectedColor });
        setNewFolderName('');
        setSelectedColor('blue');
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId);
            if (selectedFolder?.id === deleteId) setSelectedFolder(null);
            setDeleteId(null);
        }
    }

    const getFolderColorClass = (colorName: string) => {
        return FOLDER_COLORS.find(c => c.value === colorName)?.class || FOLDER_COLORS[0].class;
    };

    if (selectedFolder) {
        const folderQrs = qrs?.filter(q => q.folderId === selectedFolder.id) || [];

        return (
            <div className="space-y-6">
                <Button variant="ghost" onClick={() => setSelectedFolder(null)} className="gap-2 text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={20} /> Back to Folders
                </Button>
                <div className="flex items-center gap-3">
                    <FolderIcon className={`w-8 h-8 ${getFolderColorClass(selectedFolder.color).split(' ')[0]}`} />
                    <h1 className="text-2xl font-bold text-foreground">{selectedFolder.name}</h1>
                    <Badge variant="secondary">{folderQrs.length} Items</Badge>
                </div>

                {folderQrs.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">This folder is empty.</p>
                            <Button variant="link" asChild className="mt-2">
                                <Link to="/create">Create QR Code</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {folderQrs.map(qr => (
                            <motion.div
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={qr.id}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                            <QrCode size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-foreground truncate">{qr.name}</h4>
                                            <p className="text-xs text-muted-foreground uppercase">{qr.type}</p>
                                        </div>
                                        <Button variant="secondary" size="sm" asChild>
                                            <Link to={`/analytics?id=${qr.id}`}>Stats</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Folder Management</h1>
            <p className="text-muted-foreground -mt-4">Organize your QR codes into colored folders.</p>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Folder Name</Label>
                            <Input
                                placeholder="e.g. Marketing Campaign"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Color Tag</Label>
                            <div className="flex gap-2">
                                {FOLDER_COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setSelectedColor(c.value)}
                                        className={cn(
                                            "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                                        )}
                                        title={c.name}
                                    >
                                        <div className={`w-6 h-6 rounded-full ${c.class.split(' ')[1].replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleCreate} disabled={!newFolderName} className="h-10">
                                Create Folder
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                    {folders?.map(f => {
                        const colorStyle = getFolderColorClass(f.color);
                        return (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                key={f.id}
                                onClick={() => setSelectedFolder(f)}
                                className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between h-36 cursor-pointer transition-all group ${colorStyle}`}
                            >
                                <div className="flex items-start justify-between">
                                    <FolderIcon className="opacity-80" size={32} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => { e.stopPropagation(); setDeleteId(f.id); }}
                                        className="text-muted-foreground hover:text-destructive hover:bg-white/50"
                                    >
                                        <Trash size={18} />
                                    </Button>
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground group-hover:underline decoration-2 underline-offset-2 transition-all">{f.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">Open to view QRs</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Folder" type="danger">
                <p className="text-muted-foreground mb-6">Are you sure? QR codes inside this folder will be moved to the main list.</p>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            </Modal>
        </div>
    );
};