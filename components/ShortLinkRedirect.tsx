
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { API } from '../services/api';
import { Loader } from 'lucide-react';

export const ShortLinkRedirect: React.FC = () => {
    const { slug } = useParams();
    const [error, setError] = useState('');
    const recorded = useRef(false);

    useEffect(() => {
        if (!slug || recorded.current) return;
        recorded.current = true;

        const handleRedirect = async () => {
            try {
                const link = await API.getShortLinkBySlug(slug);

                if (!link) {
                    setError('Link not found.');
                    return;
                }

                // Increment Clicks (Async)
                API.incrementShortLinkClicks(link.id);

                // Record Scan/Click (Fire and forget)
                // Use default device detection
                const getDeviceType = () => {
                    const ua = navigator.userAgent;
                    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
                    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
                    return 'desktop';
                };

                API.recordScan({
                    shortLinkId: link.id,
                    device: getDeviceType(),
                    browser: navigator.userAgent, // Simplified
                    city: 'Unknown',
                    country: 'Unknown',
                    ip: '0.0.0.0'
                });

                // Redirect
                window.location.replace(link.originalUrl);

            } catch (err) {
                console.error(err);
                setError('System Error');
            }
        };

        handleRedirect();
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <Loader className="animate-spin text-primary mb-4" size={48} />
            <h2 className="text-xl font-semibold text-foreground">Redirecting...</h2>
        </div>
    );
};
