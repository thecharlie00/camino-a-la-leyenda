export type Language = 'es' | 'en' | 'de' | 'it' | 'fr';

export type ActiveView = 'game' | 'pitch' | 'goat' | 'guide' | 'admin';

export interface SaveSlotMeta {
  id: string;
  mode: 'p' | 'pm' | 'mgr' | 'club';
  n: string;
  club: number;
  cn: string;
  cu?: { ab: string; col: [string, string] } | null;
  yr: number;
  ts: number;
  lv: number;
  pos: string;
  ret?: boolean;
  draft?: boolean;
  g?: 'm' | 'f';
}

export interface GoatCareerEntry {
  id: string;
  name: string;
  mode: 'player' | 'manager';
  score: number;
  club: string;
  nationality?: string;
  seasons: number;
  appearances: number;
  goals?: number;
  assists?: number;
  trophies: number;
  awards?: number;
  clean_sheets?: number;
  international_caps?: number;
  international_goals?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  unbeaten_seasons?: number;
  promotions?: number;
  win_percentage?: number;
  history?: Array<{
    season: string;
    club: string;
    competition: string;
    appearances?: number;
    goals?: number;
    assists?: number;
    wins?: number;
    draws?: number;
    losses?: number;
    trophies?: string[];
  }>;
}

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  type: 'pageview' | 'game_start' | 'match_sim' | 'goat_view' | 'guide_view' | 'lang_change';
  view?: string;
  details?: string;
  device: 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux';
  browser: string;
  lang: string;
  country: string;
}

export interface TrafficSummary {
  totalPageviews: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgDurationSecs: number;
  bounceRatePct: number;
  matchesSimulated: number;
  careersCreated: number;
  liveVisitors: number;
}
