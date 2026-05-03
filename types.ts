export interface User {
  id: string;
  email: string;
  name: string;
}

export type QRType = 'url' | 'social' | 'vcard' | 'text' | 'wiki' | 'email' | 'wifi' | 'phone' | 'sms' | 'event';

export interface QRDesign {
  fgColor: string;
  bgColor: string;
  // Gradient Support
  gradientType?: 'none' | 'linear' | 'radial';
  gradientColor2?: string;

  dotStyle: 'square' | 'dots' | 'rounded';
  cornerStyle: 'square' | 'rounded' | 'dots';

  // Logo
  logoUrl?: string;
  logoSize: number; // 0.1 to 0.3

  // Advanced Frame
  frame?: 'basic' | 'rounded' | 'bubble'; // Extended variants
  frameColor?: string;
  frameText?: string;
}

export interface QRContent {
  url?: string;
  text?: string;
  vcard?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    company: string;
    website: string;
    address?: string;
    photoUrl?: string;
  };
  social?: {
    platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';
    username: string;
  };
  wiki?: {
    article: string;
    url: string;
  };
  email?: {
    email: string;
    subject: string;
    body: string;
  };
  phone?: string; // number
  sms?: {
    phone: string;
    message: string;
  };
  wifi?: {
    ssid: string;
    encryption: 'WPA' | 'WEP' | 'nopass';
    password?: string;
    hidden: boolean;
  };
  event?: {
    summary: string;
    description: string;
    location: string;
    start: string; // ISO string
    end: string;
  };
}

export interface QRCodeData {
  id: string;
  userId: string;
  folderId?: string;
  name: string;
  type: QRType;
  slug: string; // For dynamic redirection
  content: QRContent;
  design: QRDesign;
  createdAt: string;
  active: boolean;
}

export interface ShortenedLink {
  id: string;
  userId: string;
  originalUrl: string;
  slug: string;
  alias?: string;
  createdAt: string;
  clicks: number;
  qrId?: string; // Optional link to a QR code
}

export interface Scan {
  id: string;
  qrId?: string;
  shortLinkId?: string;
  timestamp: string;
  device: 'mobile' | 'desktop' | 'tablet' | string; // Allow string for new devices
  browser?: string;
  city?: string;
  country?: string;
  ip?: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  color: string;
}

// Analytics Aggregation Types
export interface AnalyticsData {
  totalScans: number;
  uniqueVisitors: number;
  scansByDate: { date: string; count: number }[];
  scansByDevice: { name: string; value: number }[];
  scansByCountry: { name: string; value: number }[];
}