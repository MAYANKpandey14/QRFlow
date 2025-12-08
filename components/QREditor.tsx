import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from './QRCodeCanvas';
import { DB, AuthService } from '../services/db';
import { Folder, QRCodeData, QRDesign, QRType } from '../types';
import { Link2, Type, UserSquare, Globe, Share2, Palette, Save, Image as ImageIcon, Layout, Box, ArrowLeft, Upload, PenLine } from 'lucide-react';

const DEFAULT_DESIGN: QRDesign = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  dotStyle: 'square',
  cornerStyle: 'square',
  logoSize: 0.2,
};

export const QREditor: React.FC = () => {
  const navigate = useNavigate();
  // Fix: Memoize user to prevent infinite loop in useEffect
  const user = useMemo(() => AuthService.getCurrentUser(), []);
  const [folders, setFolders] = useState<Folder[]>([]);
  
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
  
  // Design State
  const [design, setDesign] = useState<QRDesign>(DEFAULT_DESIGN);

  useEffect(() => {
    if (user) setFolders(DB.getFolders(user.id));
  }, [user]);

  const handleWikiSearch = async () => {
      if(wikiQuery.length > 3) {
          setUrl(`https://en.wikipedia.org/wiki/${wikiQuery.replace(/\s/g, '_')}`);
      }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 100000) {
              alert("Image too large. Please use an image under 100KB.");
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
    
    // Validation
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

    const newQR: QRCodeData = {
      id: Math.random().toString(36).substring(7),
      userId: user.id,
      folderId: selectedFolder || undefined,
      name: name.trim(),
      type: activeType,
      slug: Math.random().toString(36).substring(7),
      content,
      design,
      createdAt: new Date().toISOString(),
      active: true
    };

    DB.saveQR(newQR);
    navigate('/');
  };

  const getPreviewValue = () => {
      if (activeType === 'url') return url || 'https://qrflow.app';
      if (activeType === 'text') return text || 'Sample Text';
      if (activeType === 'vcard') return `BEGIN:VCARD\nVERSION:3.0\nN:${vcard.lastName};${vcard.firstName}\nTEL:${vcard.phone}\nEMAIL:${vcard.email}\nORG:${vcard.company}\nURL:${vcard.website}\nADR:;;${vcard.address};;;;\nEND:VCARD`;
      if (activeType === 'social') return `https://${social.platform}.com/${social.username}`;
      if (activeType === 'wiki') return `https://en.wikipedia.org/wiki/${wikiQuery}`;
      return 'https://qrflow.app';
  };

  const TabButton = ({ type, icon: Icon, label }: { type: QRType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveType(type)}
      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
        activeType === type 
          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
          : 'border-slate-200 hover:border-slate-300 text-slate-600'
      }`}
    >
      <Icon size={24} className="mb-2" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      <div className="flex-1 space-y-8 pb-20">
        
        <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                 <ArrowLeft size={20} />
             </button>
             <h1 className="text-2xl font-bold text-slate-900">Create QR Code</h1>
        </div>

        {/* 0. Naming (Prominent) */}
        <section className={`bg-white p-6 rounded-xl shadow-sm border transition-colors ${nameError ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}>
            <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                     <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${nameError ? 'text-red-600' : 'text-slate-800'}`}>
                         <PenLine size={16} /> QR Code Name <span className="text-red-500">*</span>
                     </label>
                     <input 
                        type="text" 
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if(e.target.value.trim()) setNameError(false);
                        }}
                        placeholder="e.g. Summer Marketing Campaign 2024"
                        className={`w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 outline-none ${nameError ? 'border-red-300 focus:ring-red-200 bg-white' : 'border-slate-300 focus:ring-indigo-500'}`}
                        autoFocus
                     />
                     {nameError && <p className="text-red-600 text-xs mt-1 font-medium">Please name your QR code to continue.</p>}
                </div>
                <div className="md:w-1/3">
                     <label className="block text-sm font-medium text-slate-700 mb-2">Folder (Optional)</label>
                     <select 
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                     >
                         <option value="">No Folder</option>
                         {folders.map(f => (
                             <option key={f.id} value={f.id}>{f.name}</option>
                         ))}
                     </select>
                </div>
            </div>
        </section>

        {/* 1. Content Type */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">1. Select Content Type</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <TabButton type="url" icon={Link2} label="Website" />
            <TabButton type="social" icon={Share2} label="Social" />
            <TabButton type="vcard" icon={UserSquare} label="vCard" />
            <TabButton type="wiki" icon={Globe} label="Wikipedia" />
            <TabButton type="text" icon={Type} label="Plain Text" />
          </div>
        </section>

        {/* 2. Content Input */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">2. Enter Content</h2>
          
          {activeType === 'url' && (
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                <input 
                    type="url" 
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
             </div>
          )}

          {activeType === 'social' && (
              <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube'].map(p => (
                        <button 
                            key={p}
                            onClick={() => setSocial({ ...social, platform: p as any})}
                            className={`px-3 py-1.5 rounded-lg border capitalize text-sm font-medium ${social.platform === p ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600'}`}
                        >
                            {p}
                        </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username / ID</label>
                    <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                            {social.platform}.com/
                        </span>
                        <input 
                            type="text" 
                            value={social.username}
                            onChange={(e) => setSocial({ ...social, username: e.target.value })}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                  </div>
              </div>
          )}

          {activeType === 'text' && (
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea 
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  ></textarea>
              </div>
          )}

          {activeType === 'vcard' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="First Name" className="input-std" value={vcard.firstName} onChange={e => setVcard({...vcard, firstName: e.target.value})} />
                  <input placeholder="Last Name" className="input-std" value={vcard.lastName} onChange={e => setVcard({...vcard, lastName: e.target.value})} />
                  <input placeholder="Phone" className="input-std" value={vcard.phone} onChange={e => setVcard({...vcard, phone: e.target.value})} />
                  <input placeholder="Email" className="input-std" value={vcard.email} onChange={e => setVcard({...vcard, email: e.target.value})} />
                  <input placeholder="Company" className="input-std" value={vcard.company} onChange={e => setVcard({...vcard, company: e.target.value})} />
                  <input placeholder="Website" className="input-std" value={vcard.website} onChange={e => setVcard({...vcard, website: e.target.value})} />
                  <div className="md:col-span-2">
                    <input placeholder="Address" className="input-std" value={vcard.address} onChange={e => setVcard({...vcard, address: e.target.value})} />
                  </div>
              </div>
          )}
          
          {activeType === 'wiki' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Search Article</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="E.g. Eiffel Tower"
                        value={wikiQuery}
                        onChange={(e) => setWikiQuery(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button onClick={handleWikiSearch} className="px-4 py-2 bg-slate-200 rounded-lg font-medium text-slate-700">Search</button>
                </div>
              </div>
          )}
        </section>

        {/* 3. Design */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h2 className="text-lg font-semibold text-slate-800 mb-4">3. Customize Design</h2>
           
           <div className="space-y-6">
                {/* Shapes */}
                <div>
                     <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Box size={16}/> Styles</h3>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                             <label className="text-xs text-slate-500 mb-2 block">Dots</label>
                             <div className="flex gap-2">
                                {['square', 'rounded', 'dots'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setDesign({...design, dotStyle: s as any})}
                                        className={`w-10 h-10 border rounded flex items-center justify-center hover:bg-slate-50 ${design.dotStyle === s ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-slate-800 ${s === 'rounded' ? 'rounded-sm' : s === 'dots' ? 'rounded-full' : ''}`} />
                                    </button>
                                ))}
                             </div>
                        </div>
                        <div>
                             <label className="text-xs text-slate-500 mb-2 block">Corners</label>
                             <div className="flex gap-2">
                                {['square', 'rounded', 'dots'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setDesign({...design, cornerStyle: s as any})}
                                        className={`w-10 h-10 border rounded flex items-center justify-center hover:bg-slate-50 ${design.cornerStyle === s ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 border-2 border-slate-800 ${s === 'rounded' ? 'rounded-md' : s === 'dots' ? 'rounded-full' : ''}`} />
                                    </button>
                                ))}
                             </div>
                        </div>
                     </div>
                </div>

                {/* Colors */}
                <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Palette size={16}/> Colors</h3>
                    <div className="flex gap-6">
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Foreground</label>
                            <input type="color" value={design.fgColor} onChange={(e) => setDesign({...design, fgColor: e.target.value})} className="h-10 w-20 rounded cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block">Background</label>
                            <input type="color" value={design.bgColor} onChange={(e) => setDesign({...design, bgColor: e.target.value})} className="h-10 w-20 rounded cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Frame */}
                <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><Layout size={16}/> Frame</h3>
                    <div className="flex gap-2 mb-3">
                         <button onClick={() => setDesign({...design, frame: undefined})} className={`px-3 py-1 text-sm border rounded ${!design.frame ? 'border-indigo-500 bg-indigo-50' : ''}`}>None</button>
                         <button onClick={() => setDesign({...design, frame: 'basic', frameColor: '#000000', frameText: 'SCAN ME'})} className={`px-3 py-1 text-sm border rounded ${design.frame ? 'border-indigo-500 bg-indigo-50' : ''}`}>Standard</button>
                    </div>
                    {design.frame && (
                        <div className="grid grid-cols-2 gap-4">
                             <input 
                                type="text" 
                                placeholder="Frame Text" 
                                maxLength={15}
                                value={design.frameText} 
                                onChange={e => setDesign({...design, frameText: e.target.value})}
                                className="input-std"
                             />
                             <input 
                                type="color" 
                                value={design.frameColor} 
                                onChange={e => setDesign({...design, frameColor: e.target.value})}
                                className="h-10 w-full rounded cursor-pointer border border-slate-200"
                             />
                        </div>
                    )}
                </div>

                 {/* Logo */}
                 <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2"><ImageIcon size={16}/> Logo</h3>
                    <div className="flex items-center gap-4">
                         <label className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                             <Upload size={16} />
                             <span className="text-sm">Upload Image</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                         </label>
                         {design.logoUrl && (
                             <button onClick={() => setDesign({...design, logoUrl: undefined})} className="text-xs text-red-500 hover:underline">Remove</button>
                         )}
                    </div>
                    {design.logoUrl && (
                        <div className="mt-2 text-xs text-slate-400 truncate max-w-xs">{design.logoUrl.substring(0, 30)}...</div>
                    )}
                 </div>
           </div>
        </section>

      </div>

      {/* RIGHT COLUMN: Preview Sticky */}
      <div className="w-full lg:w-96">
         <div className="sticky top-6">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center">
                 <h3 className="text-slate-500 font-medium mb-6 uppercase tracking-wider text-sm">Live Preview</h3>
                 
                 <QRCodeCanvas 
                    value={getPreviewValue()} 
                    design={design} 
                    size={220}
                    className="mb-8"
                 />

                 <div className="w-full space-y-3">
                     <button 
                        onClick={handleSave}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                     >
                         <Save size={20} />
                         Create QR Code
                     </button>
                     <p className="text-center text-xs text-slate-400">
                         Your QR code is saved dynamically. <br/>You can change the URL destination anytime.
                     </p>
                 </div>
            </div>
         </div>
      </div>
    </div>
  );
};