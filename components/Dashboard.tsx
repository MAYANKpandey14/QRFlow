import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DB, AuthService } from '../services/db';
import { QRCodeData, Folder } from '../types';
import { QRCodeCanvas } from './QRCodeCanvas';
import { Plus, Folder as FolderIcon, Trash2, Edit, BarChart2, Download, Move, Share2, Copy, X, Mail, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import QRCode from 'qrcode';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [qrs, setQrs] = useState<QRCodeData[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [movingQr, setMovingQr] = useState<string | null>(null);
  const [shareModalQr, setShareModalQr] = useState<QRCodeData | null>(null);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setQrs(DB.getQRs(user.id));
      setFolders(DB.getFolders(user.id));
    }
  }, []);

  const refreshData = () => {
      const user = AuthService.getCurrentUser();
      if(user) setQrs(DB.getQRs(user.id));
  };

  const handleDelete = (id: string) => {
    if(confirm('Are you sure? This will break the QR link.')) {
        DB.deleteQR(id);
        refreshData();
    }
  };

  const handleMove = (qrId: string, folderId: string) => {
      const qr = qrs.find(q => q.id === qrId);
      if (qr) {
          DB.saveQR({ ...qr, folderId: folderId || undefined });
          setMovingQr(null);
          refreshData();
      }
  };

  const downloadQR = async (qr: QRCodeData) => {
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
      } catch (err) {
          console.error("Download failed", err);
          alert("Failed to generate download.");
      }
  };

  const filteredQrs = qrs.filter(q => q.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Share Modal Component Helper
  const ShareModal = ({ qr, onClose }: { qr: QRCodeData, onClose: () => void }) => {
    const [copied, setCopied] = useState(false);
    
    // Construct the shareable URL (using current origin + hash routing)
    const shareUrl = `${window.location.origin}${window.location.pathname}#/r/${qr.slug}`;
    const shareText = `Check out this QR Code: ${qr.name}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareLinks = [
        { 
            name: 'Email', 
            icon: Mail, 
            color: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            url: `mailto:?subject=${encodeURIComponent(qr.name)}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}` 
        },
        { 
            name: 'Twitter', 
            icon: Twitter, 
            color: 'bg-sky-100 text-sky-600 hover:bg-sky-200',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` 
        },
        { 
            name: 'Facebook', 
            icon: Facebook, 
            color: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
        },
        { 
            name: 'LinkedIn', 
            icon: Linkedin, 
            color: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` 
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-100 text-green-600 hover:bg-green-200',
            url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-900">Share QR Code</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Link Copy Section */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">QR Link</label>
                        <div className="flex gap-2">
                            <input 
                                readOnly 
                                value={shareUrl} 
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-600 focus:outline-none"
                            />
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                            >
                                {copied ? 'Copied!' : <><Copy size={16} /> Copy</>}
                            </button>
                        </div>
                    </div>

                    {/* Social Grid */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Share via</label>
                        <div className="grid grid-cols-5 gap-2">
                            {shareLinks.map((link) => (
                                <a 
                                    key={link.name}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg gap-2 transition-colors ${link.color}`}
                                    title={link.name}
                                >
                                    <link.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-100">
                    Anyone with the link can scan and view this QR code.
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="text-indigo-100 font-medium">Total QR Codes</h3>
            <p className="text-4xl font-bold mt-2">{qrs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 font-medium">Active Folders</h3>
            <p className="text-4xl font-bold text-slate-800 mt-2">{folders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
             <h3 className="text-slate-500 font-medium">Total Scans</h3>
             <p className="text-4xl font-bold text-slate-800 mt-2">
                 {qrs.reduce((acc, curr) => acc + DB.getAnalytics(curr.id).totalScans, 0)}
             </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <input 
            type="text" 
            placeholder="Search QR codes..." 
            className="w-full md:w-80 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2 w-full md:w-auto">
            <Link to="/folders" className="flex-1 md:flex-none text-center px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
                Manage Folders
            </Link>
            <Link to="/create" className="flex-1 md:flex-none text-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> Create QR
            </Link>
        </div>
      </div>

      {/* Grid */}
      {filteredQrs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">No QR codes found.</p>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="text-indigo-600 hover:underline mt-2">Clear search</button>}
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQrs.map((qr) => (
                <div key={qr.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    <div className="p-6 flex gap-6">
                        <div className="flex-shrink-0">
                            <QRCodeCanvas value={`#/r/${qr.slug}`} design={qr.design} size={80} className="!p-0 !bg-transparent border-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-slate-900 truncate">{qr.name}</h4>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-medium">{qr.type}</span>
                                </div>
                                <div className="relative flex gap-1">
                                    <button onClick={() => setMovingQr(movingQr === qr.id ? null : qr.id)} className="text-slate-400 hover:text-indigo-500 transition-colors p-1" title="Move to Folder">
                                        <Move size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(qr.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Move Dropdown */}
                            {movingQr === qr.id && (
                                <div className="absolute bg-white border border-slate-200 shadow-xl rounded-lg p-2 z-10 mt-1 w-48">
                                    <p className="text-xs font-semibold text-slate-500 mb-2 px-2">Move to...</p>
                                    <button onClick={() => handleMove(qr.id, '')} className="block w-full text-left px-2 py-1 text-sm hover:bg-slate-50 rounded">None (Root)</button>
                                    {folders.map(f => (
                                        <button key={f.id} onClick={() => handleMove(qr.id, f.id)} className="block w-full text-left px-2 py-1 text-sm hover:bg-slate-50 rounded truncate">{f.name}</button>
                                    ))}
                                </div>
                            )}

                            <div className="mt-4 flex gap-2">
                                <Link to={`/analytics?id=${qr.id}`} className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors" title="Analytics">
                                    <BarChart2 size={14} /> Stats
                                </Link>
                                <button onClick={() => setShareModalQr(qr)} className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors" title="Share">
                                    <Share2 size={14} /> Share
                                </button>
                                <button onClick={() => downloadQR(qr)} className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors" title="Download PNG">
                                    <Download size={14} /> PNG
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>{new Date(qr.createdAt).toLocaleDateString()}</span>
                        <span>{DB.getAnalytics(qr.id).totalScans} Scans</span>
                    </div>
                </div>
            ))}
        </div>
      )}
      
      {/* Share Modal */}
      {shareModalQr && <ShareModal qr={shareModalQr} onClose={() => setShareModalQr(null)} />}
    </div>
  );
};