import { User, QRCodeData, Folder, Scan, AnalyticsData } from '../types';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const STORAGE_KEYS = {
  USERS: 'qrflow_users',
  QRS: 'qrflow_qrs',
  FOLDERS: 'qrflow_folders',
  SCANS: 'qrflow_scans',
  SESSION: 'qrflow_session',
};

// --- Auth ---
export const AuthService = {
  login: async (email: string): Promise<User> => {
    // Simulating login - in a real app, verify password
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let user = users.find((u: User) => u.email === email);
    
    if (!user) {
      user = { id: uuid(), email, name: email.split('@')[0] };
      users.push(user);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return user;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getCurrentUser: (): User | null => {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  updateUser: (updatedUser: User) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex((u: User) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
    }
  },

  deleteAccount: (userId: string) => {
      // Cleanup all user data
      let users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      users = users.filter((u: User) => u.id !== userId);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // Remove QRs
      let qrs = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
      qrs = qrs.filter((q: QRCodeData) => q.userId !== userId);
      localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));

      // Remove Folders
      let folders = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');
      folders = folders.filter((f: Folder) => f.userId !== userId);
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));

      // Remove Session
      localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

// --- Database ---
export const DB = {
  // folders
  getFolders: (userId: string): Folder[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');
    return all.filter((f: Folder) => f.userId === userId);
  },
  
  createFolder: (userId: string, name: string, color: string = 'blue'): Folder => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');
    const newFolder: Folder = { id: uuid(), userId, name, color };
    all.push(newFolder);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(all));
    return newFolder;
  },

  deleteFolder: (folderId: string) => {
    let all = JSON.parse(localStorage.getItem(STORAGE_KEYS.FOLDERS) || '[]');
    all = all.filter((f: Folder) => f.id !== folderId);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(all));
    
    // Move QRs in this folder to root (undefined folderId)
    let qrs = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
    qrs = qrs.map((q: QRCodeData) => q.folderId === folderId ? { ...q, folderId: undefined } : q);
    localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(qrs));
  },

  // QRs
  getQRs: (userId: string): QRCodeData[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
    return all.filter((q: QRCodeData) => q.userId === userId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getQRById: (id: string): QRCodeData | undefined => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
    return all.find((q: QRCodeData) => q.id === id);
  },
  
  getQRBySlug: (slug: string): QRCodeData | undefined => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
    return all.find((q: QRCodeData) => q.slug === slug);
  },

  saveQR: (qr: QRCodeData) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
    const index = all.findIndex((q: QRCodeData) => q.id === qr.id);
    if (index >= 0) {
      all[index] = qr;
    } else {
      all.push(qr);
      // Simulate historical data for new QRs for demo purposes
      if (Math.random() > 0.5) DB.seedScans(qr.id); 
    }
    localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(all));
  },

  deleteQR: (id: string) => {
    let all = JSON.parse(localStorage.getItem(STORAGE_KEYS.QRS) || '[]');
    all = all.filter((q: QRCodeData) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QRS, JSON.stringify(all));
  },

  // Scans / Analytics
  recordScan: (qrId: string) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
    const devices: Scan['device'][] = ['mobile', 'desktop', 'tablet'];
    const cities = ['New York', 'London', 'Berlin', 'Tokyo', 'Paris', 'San Francisco'];
    const countries = ['USA', 'UK', 'Germany', 'Japan', 'France', 'USA'];
    
    const r = Math.floor(Math.random() * 6);
    
    const newScan: Scan = {
      id: uuid(),
      qrId,
      timestamp: new Date().toISOString(),
      device: devices[Math.floor(Math.random() * 3)],
      city: cities[r],
      country: countries[r],
      browser: 'Chrome'
    };
    all.push(newScan);
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(all));
  },

  // Generates fake analytics for demo
  seedScans: (qrId: string) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
    const now = new Date();
    for (let i = 0; i < 20; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        const devices: Scan['device'][] = ['mobile', 'desktop', 'tablet'];
        const cities = ['New York', 'London', 'Berlin', 'Tokyo', 'Paris'];
        const countries = ['USA', 'UK', 'Germany', 'Japan', 'France'];
        const r = Math.floor(Math.random() * 5);

        all.push({
            id: uuid(),
            qrId,
            timestamp: date.toISOString(),
            device: devices[Math.floor(Math.random() * 3)],
            city: cities[r],
            country: countries[r],
            browser: 'Chrome'
        });
    }
    localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(all));
  },

  getAnalytics: (qrId: string | null, userId?: string): AnalyticsData => {
    const allScans = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCANS) || '[]');
    let qrScans: Scan[] = [];

    if (qrId) {
        qrScans = allScans.filter((s: Scan) => s.qrId === qrId);
    } else if (userId) {
        // Aggregate all scans for user
        const userQRs = DB.getQRs(userId).map(q => q.id);
        qrScans = allScans.filter((s: Scan) => userQRs.includes(s.qrId));
    }

    // Group by Date
    const scansByDateMap: Record<string, number> = {};
    qrScans.forEach((s: Scan) => {
      const date = s.timestamp.split('T')[0];
      scansByDateMap[date] = (scansByDateMap[date] || 0) + 1;
    });
    const scansByDate = Object.entries(scansByDateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by Device
    const deviceMap: Record<string, number> = {};
    qrScans.forEach((s: Scan) => {
      deviceMap[s.device] = (deviceMap[s.device] || 0) + 1;
    });
    const scansByDevice = Object.entries(deviceMap).map(([name, value]) => ({ name, value }));

    // Group by Country
    const countryMap: Record<string, number> = {};
    qrScans.forEach((s: Scan) => {
      countryMap[s.country] = (countryMap[s.country] || 0) + 1;
    });
    const scansByCountry = Object.entries(countryMap).map(([name, value]) => ({ name, value }));

    return {
      totalScans: qrScans.length,
      uniqueVisitors: Math.floor(qrScans.length * 0.8), // Mock logic
      scansByDate,
      scansByDevice,
      scansByCountry
    };
  }
};