
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../services/api';
import { QRCodeData } from '../types';
import { Loader } from 'lucide-react';

export const Redirect: React.FC = () => {
    const { slug } = useParams();
    const [error, setError] = useState('');
    const [target, setTarget] = useState<QRCodeData | undefined>(undefined);
    const recorded = useRef(false);

    useEffect(() => {
        if (!slug || recorded.current) return;
        recorded.current = true; // Prevent double recording in strict mode

        const handleRedirect = async () => {
            try {
                const qr = await API.getQRBySlug(slug);

                if (!qr || !qr.active) {
                    setError('QR Code not found or inactive.');
                    return;
                }

                setTarget(qr);

                // Record Scan (Fire and forget)
                // In a real production app, use an Edge Function to get IP/Geo accurately.
                // Here we use browser info and placeholders or external service if allowed (skipping external calls for safety unless requested).
                API.recordScan({
                    qrId: qr.id,
                    device: getDeviceType(),
                    browser: getBrowserName(),
                    city: 'Unknown', // Requires IP Geolocation API
                    country: 'Unknown', // Requires IP Geolocation API
                    ip: '0.0.0.0' // Requires Server-side or IP API
                });

                // Redirect Logic
                let destination = '';
                switch (qr.type) {
                    case 'url': destination = qr.content.url || ''; break;
                    case 'social': destination = `https://${qr.content.social?.platform}.com/${qr.content.social?.username}`; break;
                    case 'wiki': destination = qr.content.wiki?.url || ''; break;
                    default: destination = '';
                }

                if (destination) {
                    // Determine if we need a delay or direct
                    // Direct for best speed, but if we showed a loading spinner we might want a tiny flashy delay or just go.
                    // "Immediate" usually means window.location.replace
                    window.location.replace(destination);
                }

            } catch (err) {
                console.error(err);
                setError('System Error');
            }
        };

        handleRedirect();
    }, [slug]);

    const getDeviceType = () => {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
        return 'desktop';
    };

    const getBrowserName = () => {
        const ua = navigator.userAgent;
        if (ua.includes("Chrome")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari")) return "Safari";
        if (ua.includes("Edge")) return "Edge";
        return "Other";
    };

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

    // View for non-redirect types (Text, VCard)
    if (target && (target.type === 'text' || target.type === 'vcard')) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                {target.type === 'text' && (
                    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">Message</h2>
                        <p className="text-lg text-slate-700 whitespace-pre-wrap">{target.content.text}</p>
                    </div>
                )}
                {target.type === 'vcard' && (
                    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                {target.content.vcard?.firstName.charAt(0)}
                            </div>
                            <h2 className="text-2xl font-bold">{target.content.vcard?.firstName} {target.content.vcard?.lastName}</h2>
                            <p className="text-slate-500">{target.content.vcard?.company}</p>
                        </div>
                        {/* ... VCard Details (Same as before) ... */}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader className="animate-spin text-indigo-600 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-slate-800">Redirecting...</h2>
        </div>
    );
};