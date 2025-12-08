import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DB } from '../services/db';
import { QRCodeData } from '../types';
import { Loader } from 'lucide-react';

export const Redirect: React.FC = () => {
  const { slug } = useParams();
  const [error, setError] = useState('');
  const [target, setTarget] = useState<QRCodeData | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;

    // 1. Find QR
    const qr = DB.getQRBySlug(slug);
    
    if (!qr) {
      setError('QR Code not found.');
      return;
    }

    setTarget(qr);

    // 2. Record Scan
    DB.recordScan(qr.id);

    // 3. Redirect (Delayed slightly for UX)
    setTimeout(() => {
        let destination = '';
        
        switch(qr.type) {
            case 'url': destination = qr.content.url || ''; break;
            case 'social': destination = `https://${qr.content.social?.platform}.com/${qr.content.social?.username}`; break;
            case 'wiki': destination = qr.content.wiki?.url || ''; break;
            default: destination = '';
        }

        if (destination) {
            window.location.href = destination;
        }
    }, 1500);

  }, [slug]);

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-xl font-bold text-red-600">Error</h1>
                <p className="text-slate-600 mt-2">{error}</p>
            </div>
        </div>
    );
  }

  // View for non-redirect types (Text, VCard) or while loading
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        {target?.type === 'text' ? (
             <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
                 <h2 className="text-xl font-bold mb-4 text-slate-800">Message</h2>
                 <p className="text-lg text-slate-700 whitespace-pre-wrap">{target.content.text}</p>
             </div>
        ) : target?.type === 'vcard' ? (
             <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                  <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                          {target.content.vcard?.firstName.charAt(0)}
                      </div>
                      <h2 className="text-2xl font-bold">{target.content.vcard?.firstName} {target.content.vcard?.lastName}</h2>
                      <p className="text-slate-500">{target.content.vcard?.company}</p>
                  </div>
                  <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                          <label className="text-xs text-slate-400 block">Phone</label>
                          <a href={`tel:${target.content.vcard?.phone}`} className="text-indigo-600 font-medium block">{target.content.vcard?.phone}</a>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                          <label className="text-xs text-slate-400 block">Email</label>
                          <a href={`mailto:${target.content.vcard?.email}`} className="text-indigo-600 font-medium block">{target.content.vcard?.email}</a>
                      </div>
                  </div>
             </div>
        ) : (
            <div className="text-center">
                <Loader className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                <h2 className="text-xl font-semibold text-slate-800">Redirecting...</h2>
                <p className="text-slate-500">Please wait while we take you to the destination.</p>
                <p className="text-xs text-slate-400 mt-8">Powered by QRFlow</p>
            </div>
        )}
    </div>
  );
};