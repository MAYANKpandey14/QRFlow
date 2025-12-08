export interface User {
  id: string;
  email: string;
  name: string;
}

export type QRType = 'url' | 'social' | 'vcard' | 'text' | 'wiki';

export interface QRDesign {
  fgColor: string;
  bgColor: string;
  logoUrl?: string;
  logoSize: number; // 0.1 to 0.3
  dotStyle: 'square' | 'dots' | 'rounded';
  cornerStyle: 'square' | 'rounded' | 'dots';
  frame?: string;
  frameText?: string;
  frameColor?: string;
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

export interface Scan {
  id: string;
  qrId: string;
  timestamp: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  city: string;
  country: string;
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