
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQRs, useFolders, useDeleteQR, useCreateQR } from '../hooks/useData';
import { QRCodeCanvas } from './QRCodeCanvas';
import { Plus, Folder as FolderIcon, Trash2, Edit, BarChart2, Download, Move, Share2, Copy, X, Mail, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './ui/Modal';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export const Dashboard: React.FC = () => {
    const { data: qrs, isLoading: qrsLoading, error: qrsError } = useQRs();
    const { data: folders } = useFolders();
    const deleteMutation = useDeleteQR();

    const [searchTerm, setSearchTerm] = useState('');
    const [shareModalQr, setShareModalQr] = useState<any | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId);
            setDeleteId(null);
        }
    };

    const downloadQR = async (qr: any) => {
        try {
            const url = await QRCode.toDataURL(qr.content.url || `https://qrflow.app/r/${qr.slug}`, {
                width: 1200,
                margin: 2,
                color: {
                    dark: qr.design.fgColor,
                    light: qr.design.bgColor
                },
                errorCorrectionLevel: 'H'
            });

            const link = document.createElement('a');
            link.download = `${qr.name.replace(/\s+/g, '_')}_QR.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Downloaded!');
        } catch (err) {
            console.error("Download failed", err);
            toast.error("Failed to generate download.");
        }
    };

    if (qrsLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-muted rounded-xl"></div>)}
        </div>
    );

    if (qrsError) return <div className="text-destructive">Failed to load QRs</div>;

    const filteredQrs = qrs?.filter(q => q.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];

    // Share Modal Component
    const ShareModal = ({ qr, onClose }: { qr: any, onClose: () => void }) => {
        const [copied, setCopied] = useState(false);
        const shareUrl = `${window.location.origin}/#/r/${qr.slug}`;
        const shareText = `Check out this QR Code: ${qr.name}`;

        const handleCopy = () => {
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success("Link copied!");
        };

        const shareLinks = [
            { name: 'Email', icon: Mail, color: 'bg-muted text-muted-foreground hover:bg-muted/80', url: `mailto:?subject=${encodeURIComponent(qr.name)}&body=${encodeURIComponent(shareText + '\\n' + shareUrl)}` },
            { name: 'Twitter', icon: Twitter, color: 'bg-sky-100 text-sky-600 hover:bg-sky-200', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` },
            { name: 'Facebook', icon: Facebook, color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
            { name: 'LinkedIn', icon: Linkedin, color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
            { name: 'WhatsApp', icon: MessageCircle, color: 'bg-green-100 text-green-600 hover:bg-green-200', url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` }
        ];

        return (
            <Modal isOpen={true} onClose={onClose} title="Share QR Code">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">QR Link</label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={shareUrl}
                                className="flex-1 bg-muted"
                            />
                            <Button onClick={handleCopy} className="gap-2">
                                {copied ? 'Copied!' : <><Copy size={16} /> Copy</>}
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Share via</label>
                        <div className="grid grid-cols-5 gap-2">
                            {shareLinks.map((link) => (
                                <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center justify-center p-3 rounded-lg gap-2 transition-colors ${link.color}`} title={link.name}>
                                    <link.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        );
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">
                    <CardContent className="p-6">
                        <h3 className="font-medium opacity-80">Total QR Codes</h3>
                        <p className="text-4xl font-bold mt-2">{qrs?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-muted-foreground font-medium">Active Folders</h3>
                        <p className="text-4xl font-bold text-foreground mt-2">{folders?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-muted-foreground font-medium">Total Scans</h3>
                        <p className="text-4xl font-bold text-foreground mt-2">--</p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <Input
                    type="text"
                    placeholder="Search QR codes..."
                    className="w-full md:w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" asChild className="flex-1 md:flex-none">
                        <Link to="/folders">Manage Folders</Link>
                    </Button>
                    <Button asChild className="flex-1 md:flex-none gap-2">
                        <Link to="/create">
                            <Plus size={18} /> Create QR
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {filteredQrs.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No QR codes found.</p>
                        {searchTerm && <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">Clear search</Button>}
                    </CardContent>
                </Card>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredQrs.map((qr) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                key={qr.id}
                            >
                                <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                    <CardContent className="p-6 flex gap-6">
                                        <div className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            <QRCodeCanvas value={`#/r/${qr.slug}`} design={qr.design as any} size={80} className="!p-0 !bg-transparent border-0" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-foreground truncate">{qr.name}</h4>
                                                    <Badge variant="secondary" className="uppercase text-xs">
                                                        {qr.type}
                                                    </Badge>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(qr.id)} className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <Button variant="secondary" size="sm" asChild className="flex-1 gap-1">
                                                    <Link to={`/analytics?id=${qr.id}`}>
                                                        <BarChart2 size={14} /> Stats
                                                    </Link>
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => setShareModalQr(qr)} className="flex-1 gap-1">
                                                    <Share2 size={14} /> Share
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => downloadQR(qr)} className="flex-1 gap-1">
                                                    <Download size={14} /> PNG
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modals */}
            {shareModalQr && <ShareModal qr={shareModalQr} onClose={() => setShareModalQr(null)} />}

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Delete QR Code"
                type="danger"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">Are you sure you want to delete this QR code? This action cannot be undone and will break any existing links.</p>
                    <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete Forever</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};