export type ContentType = 'note' | 'link' | 'quote' | 'screenshot' | 'image';

export interface MindItem {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  source?: string;
  imageData?: string; // base64
  ocrText?: string;
  isFavorite?: boolean;
  linkedItemIds?: string[];
  summary?: string;
  autoCategory?: string;
}

export type WellnessType = 'app-lock' | 'focus-session';

export interface AppLockEntry {
  id: string;
  name: string;
  url: string;
  category: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: number;
  aiInsight?: string;
}

export interface DigitalImport {
  id: string;
  source: 'youtube' | 'instagram' | 'tiktok' | 'reddit' | 'screentime' | 'other';
  fileName: string;
  importedAt: number;
  dataCount: number;
  status: 'processing' | 'ready' | 'error';
}

export interface ScreenTimeMetric {
  date: string;
  totalMinutes: number;
  categories: Record<string, number>;
}
