
export type Mood = 'peaceful' | 'anxious' | 'grateful' | 'heavy' | 'hopeful';

export interface JournalEntry {
  id: string;
  timestamp: number;
  transcript: string;
  summary: string;
  keywords: string[];
  mood?: Mood;
  prayerRequests?: PrayerRequest[];
}

export interface PrayerRequest {
  id: string;
  personName: string;
  request: string;
  status: 'active' | 'answered';
  createdAt: number;
}

export interface StressData {
  time: string;
  level: number;
  hrv: number;
}

export interface Devotional {
  verse: string;
  reference: string;
  reflection: string;
  prayer: string;
}

export enum AppTab {
  JOURNAL = 'journal',
  HEALTH = 'health',
  DEVOTIONAL = 'devotional',
  PRAYER = 'prayer'
}
