
import { supabase } from './supabase';
import { QRCodeData, Folder, Scan, AnalyticsData } from '../types';

export const API = {
  // --- Folders ---
  getFolders: async () => {
    const { data, error } = await supabase.functions.invoke('folder-api', {
      method: 'GET'
    });
    
    if (error) throw error;
    // Map snake_case to camelCase if needed (folders usually just have id, name, user_id, created_at, color)
    return data?.map((f: any) => ({
        ...f,
        userId: f.user_id,
        createdAt: f.created_at
    })) as Folder[];
  },

  createFolder: async (name: string, color: string) => {
    const { data, error } = await supabase.functions.invoke('folder-api', {
      method: 'POST',
      body: { name, color }
    });

    if (error) throw error;
    return { ...data, userId: data.user_id, createdAt: data.created_at } as Folder;
  },

  deleteFolder: async (id: string) => {
    // Using query param as discussed or body if supported. Edge function expects ID in query param for DELETE.
    // supabase.functions.invoke handles url construction. 
    // We append query string manually to function name as a workaround or rely on invoke supporting it.
    // Based on community examples, invoke('func?param=val') works.
    const { error } = await supabase.functions.invoke(`folder-api?id=${id}`, {
      method: 'DELETE'
    });
    if (error) throw error;
  },

  // --- QRs ---
  getQRs: async () => {
    const { data, error } = await supabase.functions.invoke('qr-api', { method: 'GET' });
    if (error) throw error;
    return data?.map((qr: any) => ({
      ...qr,
      folderId: qr.folder_id,
      userId: qr.user_id,
      createdAt: qr.created_at
    })) as QRCodeData[];
  },

  getQRBySlug: async (slug: string) => {
    const { data, error } = await supabase.functions.invoke(`qr-api?slug=${slug}`, { method: 'GET' });
    
    if (error || !data) return null;
    return {
      ...data,
      folderId: data.folder_id,
      userId: data.user_id,
      createdAt: data.created_at
    } as QRCodeData;
  },

  createQR: async (qr: Partial<QRCodeData>) => {
    // Payload mapping manually if needed to match DB columns? 
    // Edge function takes body and does insert. Supabase JS insert expects snake_case for columns usually?
    // My Edge Function: `const payload = { ...body, user_id: user.id }`.
    // It passes `body` directly to `insert`. So body keys MUST be snake_case.
    // Except `user.id` which is overridden.
    // So I must map inputs to snake_case here.
    
    const payload = {
        name: qr.name,
        type: qr.type,
        slug: qr.slug,
        content: qr.content,
        design: qr.design,
        folder_id: qr.folderId || null,
        active: true
    };

    const { data, error } = await supabase.functions.invoke('qr-api', {
      method: 'POST',
      body: payload
    });

    if (error) throw error;
    return { ...data, folderId: data.folder_id, userId: data.user_id, createdAt: data.created_at } as QRCodeData;
  },

  updateQR: async (id: string, updates: Partial<QRCodeData>) => {
    const payload: any = { id }; // ID required for update in my Edge Function logic
    if (updates.name) payload.name = updates.name;
    if (updates.folderId !== undefined) payload.folder_id = updates.folderId || null;
    if (updates.content) payload.content = updates.content;
    if (updates.design) payload.design = updates.design;
    if (updates.type) payload.type = updates.type;
    // ... map others

    const { error } = await supabase.functions.invoke('qr-api', {
      method: 'POST', // My Edge Function uses POST for both Create and Update (checks for ID)
      body: payload
    });

    if (error) throw error;
  },

  deleteQR: async (id: string) => {
    const { error } = await supabase.functions.invoke(`qr-api?id=${id}`, { method: 'DELETE' });
    if (error) throw error;
  },

  // --- Short Links ---
  getShortLinks: async () => {
    const { data, error } = await supabase.functions.invoke('shortener-api', { method: 'GET' });
    
    if (error) throw error;
    return data?.map((link: any) => ({
      ...link,
      userId: link.user_id,
      qrId: link.qr_id,
      originalUrl: link.original_url,
      createdAt: link.created_at
    })) as unknown as import('../types').ShortenedLink[];
  },

  createShortLink: async (link: Partial<import('../types').ShortenedLink>) => {
    const payload = {
        original_url: link.originalUrl,
        slug: link.slug,
        alias: link.alias,
        qr_id: link.qrId || null
    };

    const { data, error } = await supabase.functions.invoke('shortener-api', {
      method: 'POST',
      body: payload
    });

    if (error) throw error;
    return { 
      ...data, 
      userId: data.user_id,
      qrId: data.qr_id,
      createdAt: data.created_at,
      originalUrl: data.original_url 
    } as unknown as import('../types').ShortenedLink;
  },

  deleteShortLink: async (id: string) => {
    const { error } = await supabase.functions.invoke(`shortener-api?id=${id}`, { method: 'DELETE' });
    if (error) throw error;
  },

  getShortLinkBySlug: async (slug: string) => {
    const { data, error } = await supabase.functions.invoke(`shortener-api?slug=${slug}`, { method: 'GET' });
    
    if (error || !data) return null;
    return {
      ...data,
      userId: data.user_id,
      qrId: data.qr_id,
      createdAt: data.created_at,
      originalUrl: data.original_url
    } as unknown as import('../types').ShortenedLink;
  },

  incrementShortLinkClicks: async (id: string) => {
    // Using action param
    await supabase.functions.invoke('shortener-api?action=increment', {
        method: 'POST',
        body: { id }
    });
  },

  // --- Scans / Analytics ---
  recordScan: async (scan: Partial<Scan>) => {
    // snake_case mapping for Edge Function payload
    const payload = {
        qrId: scan.qrId,
        shortLinkId: scan.shortLinkId,
        device: scan.device,
        browser: scan.browser,
        city: scan.city,
        country: scan.country,
        ip: scan.ip
    };
    
    const { error } = await supabase.functions.invoke('analytics-api', {
        method: 'POST',
        body: payload
    });
    if (error) console.error("Failed to record scan", error);
  },

  getAnalytics: async (qrId?: string): Promise<AnalyticsData> => {
    let url = 'analytics-api';
    if (qrId) url += `?qrId=${qrId}`;

    const { data: scans, error } = await supabase.functions.invoke(url, { method: 'GET' });
    if (error) throw error;

    if (!scans || scans.length === 0) {
        return {
            totalScans: 0,
            uniqueVisitors: 0,
            scansByDate: [],
            scansByDevice: [],
            scansByCountry: []
        };
    }

    // Client-side processing (same as before)
    const scanCount = scans.length;
    const uniqueIPs = new Set(scans.map((s: any) => s.ip)).size;

    const dateMap: Record<string, number> = {};
    scans.forEach((s: any) => {
        const date = new Date(s.timestamp || s.created_at).toLocaleDateString('en-CA');
        dateMap[date] = (dateMap[date] || 0) + 1;
    });
    const scansByDate = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const deviceMap: Record<string, number> = {};
    scans.forEach((s: any) => {
        const d = s.device || 'unknown';
        deviceMap[d] = (deviceMap[d] || 0) + 1;
    });
    const scansByDevice = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));

    const countryMap: Record<string, number> = {};
    scans.forEach((s: any) => {
        const c = s.country || 'Unknown';
        countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const scansByCountry = Object.entries(countryMap).map(([name, value]) => ({ name, value }));

    return {
        totalScans: scanCount,
        uniqueVisitors: uniqueIPs,
        scansByDate,
        scansByDevice,
        scansByCountry
    };
  }
};
