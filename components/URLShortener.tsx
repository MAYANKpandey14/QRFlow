
import React, { useState } from 'react';
import { useShortLinks, useCreateShortLink, useDeleteShortLink } from '../hooks/useData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Link2, Copy, Trash2, ExternalLink, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from './QRCodeCanvas';
import { Modal } from './ui/Modal';

export const URLShortener: React.FC = () => {
    const { data: links, isLoading } = useShortLinks();
    const createMutation = useCreateShortLink();
    const deleteMutation = useDeleteShortLink();

    const [url, setUrl] = useState('');
    const [alias, setAlias] = useState('');
    const [qrPreview, setQrPreview] = useState<any>(null);

    const generateSlug = () => Math.random().toString(36).substring(2, 8);

    const handleCreate = () => {
        if (!url) return;

        let validUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            validUrl = 'https://' + url;
        }

        const slug = alias.trim() || generateSlug();

        createMutation.mutate({
            originalUrl: validUrl,
            slug,
            alias: alias.trim() || undefined
        }, {
            onSuccess: () => {
                setUrl('');
                setAlias('');
            }
        });
    };

    const handleCopy = (slug: string) => {
        const shortUrl = `${window.location.origin}/#/s/${slug}`;
        navigator.clipboard.writeText(shortUrl);
        toast.success("Short link copied!");
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this short link?")) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">URL Shortener</h1>
                    <p className="text-muted-foreground">Shorten long URLs, track clicks, and generate QRs.</p>
                </div>
            </div>

            {/* Create Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 className="text-primary" /> Create New Short Link
                    </CardTitle>
                    <CardDescription>Enter a long URL to generate a short, trackable link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full space-y-2">
                            <Label>Destination URL</Label>
                            <Input
                                placeholder="https://very-long-url.com/some/page"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-64 space-y-2">
                            <Label>Custom Alias (Optional)</Label>
                            <Input
                                placeholder="my-link"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreate} disabled={!url || createMutation.isPending} className="w-full md:w-auto">
                            {createMutation.isPending ? 'Creating...' : 'Shorten URL'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Links</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">Loading...</div>
                    ) : links?.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No short links created yet.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Short Link</TableHead>
                                    <TableHead>Original URL</TableHead>
                                    <TableHead>Clicks</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {links?.map((link) => (
                                    <TableRow key={link.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-primary">/{link.slug}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(link.slug)}>
                                                    <Copy size={12} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={link.originalUrl}>
                                            {link.originalUrl}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{link.clicks} clicks</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(link.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => setQrPreview(link)}>
                                                    <QrCode size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(link.id)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* QR Preview Modal */}
            {qrPreview && (
                <Modal isOpen={!!qrPreview} onClose={() => setQrPreview(null)} title="QR Code">
                    <div className="flex flex-col items-center gap-4">
                        <QRCodeCanvas
                            value={`${window.location.origin}/#/s/${qrPreview.slug}`}
                            size={200}
                            design={{
                                fgColor: '#000000',
                                bgColor: '#ffffff',
                                dotStyle: 'square',
                                cornerStyle: 'square',
                                logoSize: 0.2
                            }}
                        />
                        <p className="text-sm text-muted-foreground text-center break-all">
                            {window.location.origin}/#/s/{qrPreview.slug}
                        </p>
                        <Button onClick={() => setQrPreview(null)}>Close</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};
