import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';
import { QRCodeCanvas } from './QRCodeCanvas';
import { useFolders, useCreateQR } from '../hooks/useData';
import { QRCodeData, QRDesign, QRType } from '../types';
import { Link2, Type, UserSquare, Globe, Share2, Palette, Save, Image as ImageIcon, Layout, Box, ArrowLeft, Upload, PenLine, Mail, Wifi, Phone, MessageSquare, Calendar, Download, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { cn } from '@/lib/utils';

const DEFAULT_DESIGN: QRDesign = {
    fgColor: '#000000',
    bgColor: '#ffffff',
    gradientType: 'none',
    dotStyle: 'square',
    cornerStyle: 'square',
    logoSize: 0.2,
};

export const QREditor: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: folders } = useFolders();
    const createMutation = useCreateQR();
    const qrRef = useRef<HTMLDivElement>(null);

    // Form State
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [activeType, setActiveType] = useState<QRType>('url');

    // Content State
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [vcard, setVcard] = useState({ firstName: '', lastName: '', phone: '', email: '', company: '', website: '', address: '' });
    const [social, setSocial] = useState({ platform: 'instagram' as const, username: '' });
    const [wikiQuery, setWikiQuery] = useState('');

    // New Types State
    const [email, setEmail] = useState({ email: '', subject: '', body: '' });
    const [phone, setPhone] = useState('');
    const [sms, setSms] = useState({ phone: '', message: '' });
    const [wifi, setWifi] = useState({ ssid: '', encryption: 'WPA' as const, password: '', hidden: false });
    const [event, setEvent] = useState({ summary: '', description: '', location: '', start: '', end: '' });

    // Design State
    const [design, setDesign] = useState<QRDesign>(DEFAULT_DESIGN);

    // Download State
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'jpeg'>('png');
    const [downloadSize, setDownloadSize] = useState<string>('2000');

    const handleWikiSearch = async () => {
        if (wikiQuery.length > 3) {
            setUrl(`https://en.wikipedia.org/wiki/${wikiQuery.replace(/\s/g, '_')}`);
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 200000) {
                alert("Image too large. Please use an image under 200KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setDesign({ ...design, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!user) return;

        if (!name.trim()) {
            setNameError(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const content: any = {};
        if (activeType === 'url') content.url = url;
        if (activeType === 'text') content.text = text;
        if (activeType === 'vcard') content.vcard = vcard;
        if (activeType === 'social') content.social = social;
        if (activeType === 'wiki') {
            content.wiki = { article: wikiQuery, url: url || `https://en.wikipedia.org/wiki/${wikiQuery}` };
        }
        if (activeType === 'email') content.email = email;
        if (activeType === 'phone') content.phone = phone;
        if (activeType === 'sms') content.sms = sms;
        if (activeType === 'wifi') content.wifi = wifi;
        if (activeType === 'event') content.event = event;

        const newQR: Partial<QRCodeData> = {
            folderId: selectedFolder || undefined,
            name: name.trim(),
            type: activeType,
            slug: Math.random().toString(36).substring(7),
            content,
            design,
        };

        createMutation.mutate(newQR, {
            onSuccess: () => navigate('/')
        });
    };

    const handleDownload = async () => {
        if (!qrRef.current) return;
        try {
            // Force rendering at high resolution
            // We use the pixelRatio or strict width/height to html-to-image
            const size = parseInt(downloadSize);
            const options = {
                width: size,
                height: size,
                style: { transform: `scale(${size / 220})`, transformOrigin: 'top left', width: '220px', height: '220px' } // temporary scale up
            };

            // Simpler approach: clone node, scale it, rasterize
            // html-to-image usually handles SVG well.
            // Let's just try basic export first, scaling might need styling tweaks.
            // Actually, for SVG source, we can just export the SVG code directly for 'svg'.

            let dataUrl = '';
            if (downloadFormat === 'svg') {
                dataUrl = await htmlToImage.toSvg(qrRef.current);
            } else if (downloadFormat === 'jpeg') {
                dataUrl = await htmlToImage.toJpeg(qrRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
            } else {
                dataUrl = await htmlToImage.toPng(qrRef.current);
            }

            const link = document.createElement('a');
            link.download = `${name || 'qrcode'}.${downloadFormat}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Download failed", err);
            alert("Could not generate download. Please try again.");
        }
    };

    const getPreviewValue = () => {
        if (activeType === 'url') return url || 'https://qrflow.app';
        if (activeType === 'text') return text || 'Sample Text';
        if (activeType === 'vcard') return `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName}\nTEL:${vcard.phone}\nEMAIL:${vcard.email}\nORG:${vcard.company}\nURL:${vcard.website}\nADR:;;${vcard.address};;;;\nEND:VCARD`;
        if (activeType === 'social') return `https://${social.platform}.com/${social.username}`;
        if (activeType === 'wiki') return `https://en.wikipedia.org/wiki/${wikiQuery}`;
        if (activeType === 'email') return `mailto:${email.email}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
        if (activeType === 'phone') return `tel:${phone}`;
        if (activeType === 'sms') return `smsto:${sms.phone}:${sms.message}`;
        if (activeType === 'wifi') return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};H:${wifi.hidden};;`;
        if (activeType === 'event') return `BEGIN:VEVENT\nSUMMARY:${event.summary}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nDTSTART:${event.start.replace(/[-:]/g, '')}\nDTEND:${event.end.replace(/[-:]/g, '')}\nEND:VEVENT`;
        return 'https://qrflow.app';
    };

    const TabButton = ({ type, icon: Icon, label }: { type: QRType, icon: any, label: string }) => (
        <button
            onClick={() => setActiveType(type)}
            className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-24",
                activeType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
            )}
        >
            <Icon size={24} className="mb-2" />
            <span className="text-xs font-medium text-center">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-full">
            <div className="flex-1 space-y-4 pb-20">

                <div className="flex items-center gap-4 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">Create QR Code</h1>
                </div>

                <Accordion type="single" collapsible defaultValue="naming" className="space-y-4">

                    {/* 0. Naming (Prominent) */}
                    <AccordionItem value="naming" className="border-0">
                        <Card className={cn(nameError && 'border-destructive bg-destructive/5')}>
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label className={cn("flex items-center gap-2", nameError && 'text-destructive')}>
                                            <PenLine size={16} /> QR Code Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                if (e.target.value.trim()) setNameError(false);
                                            }}
                                            placeholder="e.g. Summer Marketing Campaign 2024"
                                            className={cn("text-lg py-6", nameError && 'border-destructive')}
                                        />
                                        {nameError && <p className="text-destructive text-xs font-medium">Please name your QR code to continue.</p>}
                                    </div>
                                    <div className="md:w-1/3 space-y-2">
                                        <Label>Folder (Optional)</Label>
                                        <Select
                                            value={selectedFolder || "no_folder"}
                                            onValueChange={(val) => setSelectedFolder(val === "no_folder" ? "" : val)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="No Folder" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="no_folder">No Folder</SelectItem>
                                                {folders?.map(f => (
                                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </AccordionItem>

                    {/* 1. Content Type */}
                    <AccordionItem value="type" className="bg-card rounded-lg border">
                        <AccordionTrigger className="px-6">
                            <span className="text-lg font-semibold flex items-center gap-2">1. Select Content Type <span className="text-primary text-sm font-normal uppercase">({activeType})</span></span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                <TabButton type="url" icon={Link2} label="Website" />
                                <TabButton type="text" icon={Type} label="Plain Text" />
                                <TabButton type="vcard" icon={UserSquare} label="vCard" />
                                <TabButton type="social" icon={Share2} label="Social" />
                                <TabButton type="wifi" icon={Wifi} label="WiFi" />
                                <TabButton type="email" icon={Mail} label="Email" />
                                <TabButton type="phone" icon={Phone} label="Phone" />
                                <TabButton type="sms" icon={MessageSquare} label="SMS" />
                                <TabButton type="event" icon={Calendar} label="Event" />
                                <TabButton type="wiki" icon={Globe} label="Wikipedia" />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    {/* 2. Content Input */}
                    <AccordionItem value="content" className="bg-card rounded-lg border">
                        <AccordionTrigger className="px-6">
                            <span className="text-lg font-semibold">2. Enter Content</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-4">
                            {/* ... Content Inputs (Same as before) ... */}
                            {activeType === 'url' && <div className="space-y-2"><Label>Website URL</Label><Input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} /></div>}
                            {activeType === 'text' && <div className="space-y-2"><Label>Message</Label><Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} /></div>}

                            {activeType === 'social' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'].map(p => (
                                            <Button key={p} variant={social.platform === p ? 'default' : 'outline'} size="sm" onClick={() => setSocial({ ...social, platform: p as any })} className="capitalize">{p}</Button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Username / ID</Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">{social.platform}.com/</span>
                                            <Input value={social.username} onChange={(e) => setSocial({ ...social, username: e.target.value })} className="rounded-l-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeType === 'vcard' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="First Name" value={vcard.firstName} onChange={e => setVcard({ ...vcard, firstName: e.target.value })} />
                                    <Input placeholder="Last Name" value={vcard.lastName} onChange={e => setVcard({ ...vcard, lastName: e.target.value })} />
                                    <Input placeholder="Phone" value={vcard.phone} onChange={e => setVcard({ ...vcard, phone: e.target.value })} />
                                    <Input placeholder="Email" value={vcard.email} onChange={e => setVcard({ ...vcard, email: e.target.value })} />
                                    <Input placeholder="Company" value={vcard.company} onChange={e => setVcard({ ...vcard, company: e.target.value })} />
                                    <Input placeholder="Website" value={vcard.website} onChange={e => setVcard({ ...vcard, website: e.target.value })} />
                                    <div className="md:col-span-2"><Input placeholder="Address" value={vcard.address} onChange={e => setVcard({ ...vcard, address: e.target.value })} /></div>
                                </div>
                            )}

                            {activeType === 'email' && (
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>To Email</Label><Input type="email" placeholder="recipient@example.com" value={email.email} onChange={e => setEmail({ ...email, email: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Subject</Label><Input placeholder="Email Subject" value={email.subject} onChange={e => setEmail({ ...email, subject: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Body</Label><Textarea placeholder="Email body..." rows={4} value={email.body} onChange={e => setEmail({ ...email, body: e.target.value })} /></div>
                                </div>
                            )}

                            {activeType === 'phone' && <div className="space-y-2"><Label>Phone Number</Label><Input type="tel" placeholder="+1 234 567 8900" value={phone} onChange={e => setPhone(e.target.value)} /></div>}

                            {activeType === 'sms' && (
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Phone Number</Label><Input type="tel" placeholder="+1 234 567 8900" value={sms.phone} onChange={e => setSms({ ...sms, phone: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Message</Label><Textarea placeholder="SMS Message..." rows={3} value={sms.message} onChange={e => setSms({ ...sms, message: e.target.value })} /></div>
                                </div>
                            )}

                            {activeType === 'wifi' && (
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Network Name (SSID)</Label><Input placeholder="WiFi Network Name" value={wifi.ssid} onChange={e => setWifi({ ...wifi, ssid: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Password</Label><Input type="text" placeholder="WiFi Password" value={wifi.password} onChange={e => setWifi({ ...wifi, password: e.target.value })} /></div>
                                    <div className="flex gap-4">
                                        <div className="space-y-2 flex-1">
                                            <Label>Encryption</Label>
                                            <Select value={wifi.encryption} onValueChange={(v: any) => setWifi({ ...wifi, encryption: v })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value="WPA">WPA/WPA2</SelectItem><SelectItem value="WEP">WEP</SelectItem><SelectItem value="nopass">None</SelectItem></SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2 pt-8">
                                            <input type="checkbox" id="hiddenWifi" checked={wifi.hidden} onChange={e => setWifi({ ...wifi, hidden: e.target.checked })} className="rounded border-gray-300" />
                                            <Label htmlFor="hiddenWifi">Hidden Network</Label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeType === 'event' && (
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label>Event Title</Label><Input placeholder="Event Summary" value={event.summary} onChange={e => setEvent({ ...event, summary: e.target.value })} /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Start Date/Time</Label><Input type="datetime-local" value={event.start} onChange={e => setEvent({ ...event, start: e.target.value })} /></div>
                                        <div className="space-y-2"><Label>End Date/Time</Label><Input type="datetime-local" value={event.end} onChange={e => setEvent({ ...event, end: e.target.value })} /></div>
                                    </div>
                                    <div className="space-y-2"><Label>Location</Label><Input placeholder="Event Location" value={event.location} onChange={e => setEvent({ ...event, location: e.target.value })} /></div>
                                    <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Event Description..." rows={3} value={event.description} onChange={e => setEvent({ ...event, description: e.target.value })} /></div>
                                </div>
                            )}

                            {activeType === 'wiki' && (
                                <div className="space-y-2">
                                    <Label>Search Article</Label>
                                    <div className="flex gap-2">
                                        <Input placeholder="E.g. Eiffel Tower" value={wikiQuery} onChange={(e) => setWikiQuery(e.target.value)} className="flex-1" />
                                        <Button variant="secondary" onClick={handleWikiSearch}>Search</Button>
                                    </div>
                                </div>
                            )}
                        </AccordionContent>
                    </AccordionItem>

                    {/* 3. Design */}
                    <AccordionItem value="design" className="bg-card rounded-lg border">
                        <AccordionTrigger className="px-6">
                            <span className="text-lg font-semibold">3. Customize Design</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 space-y-6">

                            {/* Shapes */}
                            <div>
                                <Label className="flex items-center gap-2 mb-3"><Box size={16} /> Styles</Label>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <span className="text-xs text-muted-foreground">Dots</span>
                                        <div className="flex gap-2">
                                            {['square', 'rounded', 'dots'].map((s) => (
                                                <button key={s} onClick={() => setDesign({ ...design, dotStyle: s as any })} className={cn("w-10 h-10 border rounded flex items-center justify-center hover:bg-accent", design.dotStyle === s ? 'ring-2 ring-primary border-primary' : 'border-input')}>
                                                    <div className={cn("w-4 h-4 bg-foreground", s === 'rounded' ? 'rounded-sm' : s === 'dots' ? 'rounded-full' : '')} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs text-muted-foreground">Corners</span>
                                        <div className="flex gap-2">
                                            {['square', 'rounded', 'dots'].map((s) => (
                                                <button key={s} onClick={() => setDesign({ ...design, cornerStyle: s as any })} className={cn("w-10 h-10 border rounded flex items-center justify-center hover:bg-accent", design.cornerStyle === s ? 'ring-2 ring-primary border-primary' : 'border-input')}>
                                                    <div className={cn("w-4 h-4 border-2 border-foreground", s === 'rounded' ? 'rounded-md' : s === 'dots' ? 'rounded-full' : '')} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Colors */}
                            <div>
                                <Label className="flex items-center gap-2 mb-3"><Palette size={16} /> Colors</Label>
                                <div className="flex gap-6 items-end">
                                    <div className="space-y-2">
                                        <span className="text-xs text-muted-foreground">Foreground</span>
                                        <input type="color" value={design.fgColor} onChange={(e) => setDesign({ ...design, fgColor: e.target.value })} className="h-10 w-20 rounded cursor-pointer border border-input" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-xs text-muted-foreground">Type</span>
                                        <Select value={design.gradientType || 'none'} onValueChange={(v: any) => setDesign({ ...design, gradientType: v })}>
                                            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Solid</SelectItem>
                                                <SelectItem value="linear">Linear</SelectItem>
                                                <SelectItem value="radial">Radial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {design.gradientType && design.gradientType !== 'none' && (
                                        <div className="space-y-2">
                                            <span className="text-xs text-muted-foreground">Gradient Color</span>
                                            <input type="color" value={design.gradientColor2 || design.fgColor} onChange={(e) => setDesign({ ...design, gradientColor2: e.target.value })} className="h-10 w-20 rounded cursor-pointer border border-input" />
                                        </div>
                                    )}
                                    <div className="space-y-2 ml-auto">
                                        <span className="text-xs text-muted-foreground">Background</span>
                                        <input type="color" value={design.bgColor} onChange={(e) => setDesign({ ...design, bgColor: e.target.value })} className="h-10 w-20 rounded cursor-pointer border border-input" />
                                    </div>
                                </div>
                            </div>

                            {/* Frame */}
                            <div>
                                <Label className="flex items-center gap-2 mb-3"><Layout size={16} /> Frame</Label>
                                <div className="flex gap-2 mb-3">
                                    <Button variant={!design.frame ? 'default' : 'outline'} size="sm" onClick={() => setDesign({ ...design, frame: undefined })}>None</Button>
                                    <Button variant={design.frame === 'basic' ? 'default' : 'outline'} size="sm" onClick={() => setDesign({ ...design, frame: 'basic', frameColor: '#000000', frameText: 'SCAN ME' })}>Standard</Button>
                                    <Button variant={design.frame === 'rounded' ? 'default' : 'outline'} size="sm" onClick={() => setDesign({ ...design, frame: 'rounded', frameColor: '#000000', frameText: 'SCAN ME' })}>Rounded</Button>
                                    <Button variant={design.frame === 'bubble' ? 'default' : 'outline'} size="sm" onClick={() => setDesign({ ...design, frame: 'bubble', frameColor: '#000000', frameText: 'SCAN ME' })}>Bubble</Button>
                                </div>
                                {design.frame && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="Frame Text" maxLength={15} value={design.frameText} onChange={e => setDesign({ ...design, frameText: e.target.value })} />
                                        <input type="color" value={design.frameColor} onChange={e => setDesign({ ...design, frameColor: e.target.value })} className="h-10 w-full rounded cursor-pointer border border-input" />
                                    </div>
                                )}
                            </div>

                            {/* Logo */}
                            <div>
                                <Label className="flex items-center gap-2 mb-3"><ImageIcon size={16} /> Logo</Label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer">
                                        <Button variant="outline" className="gap-2" asChild><span><Upload size={16} /> Upload Image</span></Button>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                    {design.logoUrl && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDesign({ ...design, logoUrl: undefined })}>Remove</Button>}
                                </div>
                                {design.logoUrl && <div className="mt-2 text-xs text-muted-foreground truncate max-w-xs">{design.logoUrl.substring(0, 30)}...</div>}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </div>

            {/* RIGHT COLUMN: Preview Sticky */}
            <div className="w-full lg:w-96">
                <div className="sticky top-6">
                    <Card className="shadow-lg">
                        <CardContent className="p-8 flex flex-col items-center">
                            <h3 className="text-muted-foreground font-medium mb-6 uppercase tracking-wider text-sm">Live Preview</h3>

                            <div ref={qrRef} className="bg-white p-2 rounded">
                                <QRCodeCanvas
                                    value={getPreviewValue()}
                                    design={design}
                                    size={220}
                                    className="mb-8"
                                />
                            </div>

                            {/* Download Section */}
                            <div className="grid grid-cols-2 gap-2 w-full mb-4">
                                <Select value={downloadFormat} onValueChange={(v: any) => setDownloadFormat(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">PNG</SelectItem>
                                        <SelectItem value="jpeg">JPEG</SelectItem>
                                        <SelectItem value="svg">SVG</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={handleDownload} className="gap-2">
                                    <Download size={16} /> Download
                                </Button>
                            </div>

                            <div className="w-full space-y-3">
                                <Button
                                    onClick={handleSave}
                                    disabled={createMutation.isPending}
                                    className="w-full py-6 gap-2"
                                >
                                    <Save size={20} />
                                    {createMutation.isPending ? 'Creating...' : 'Save QR Code'}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    Your QR code is saved dynamically. <br />You can change the URL destination anytime.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};