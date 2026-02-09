
export type Mood = 'peaceful' | 'anxious' | 'grateful' | 'heavy' | 'hopeful';
/** Mood level from 1 (terrible) to 5 (great) */
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  id: string;
  timestamp: number;
  transcript: string;
  summary: string;
  keywords: string[];
  mood?: Mood;
  /** Mood level from 1 (terrible) to 5 (great), displayed as emoji next to timestamp. Auto-detected from ring biometrics, but editable. */
  moodLevel: MoodLevel;
  prayerRequests?: PrayerRequest[];
  /** Scripture reference (e.g. Lev 19:32) matched to the entry theme */
  scripture?: string;
}

export interface PrayerRequest {
  id: string;
  personName: string;
  request: string;
  status: 'active' | 'answered';
  createdAt: number;
  /** Short-term (e.g. one-off) vs long-term (ongoing) prayer. Default 'short' when omitted. */
  term?: 'short' | 'long';
}

export interface StressData {
  time: string;
  level: number;
  hrv: number;
}

export interface Devotional {
  verse: string;
  reference: string;
  /** Short title for the reflection card (e.g. "Truth Over Approval"). When set, shown instead of "The Reflection". */
  title?: string;
  reflection: string;
  prayer: string;
  quote?: string;
  sections?: Array<{ title: string; content: string }>;
}

export type CurrentUserId = 'erica' | 'roman';

export interface UserProfile {
  id: CurrentUserId;
  displayName: string;
  avatarSeed: string;
  /** When set, used instead of DiceBear avatar (e.g. /avatars/erica.jpg for African woman, /avatars/roman.jpg for Filipino male). */
  avatarUrl?: string;
}

export enum AppTab {
  JOURNAL = 'journal',
  HEALTH = 'health',
  DEVOTIONAL = 'devotional',
  PRAYER = 'prayer',
  SETTINGS = 'settings',
}

export interface PrayerReminderTimeSlot {
  id: string; // 唯一标识符
  label: string; // 显示名称，如 "Morning Prayer"、"Evening Reflection"、"Custom 1"
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean; // 该时间点是否启用
}

export interface PrayerReminderSettings {
  enabled: boolean; // 总开关
  timeSlots: PrayerReminderTimeSlot[]; // 时间点列表，默认包含 Morning Prayer 和 Evening Reflection
}

export interface PrayerCompletionRecord {
  date: string; // 'yyyy-MM-dd'
  completedSlots: string[]; // 已完成的时间点 ID 数组，如 ['morning', 'evening']
  completedAt: Record<string, number>; // 每个时间点的完成时间戳，如 { 'morning': 1234567890, 'evening': 1234567891 }
}
