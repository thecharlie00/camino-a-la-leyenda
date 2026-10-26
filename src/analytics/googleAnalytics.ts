// Google Analytics 4 (gtag.js) Integration for Camino a la Leyenda
// Supports runtime configuration (via Admin Panel) and build-time env vars (VITE_GA_MEASUREMENT_ID)

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const STORAGE_GA_ID_KEY = 'camino.ga_measurement_id';
const GA_DEBUG_LOG_KEY = 'camino.ga_recent_logs';

export interface GaEventPayload {
  action: string;
  params?: Record<string, any>;
  timestamp: number;
}

// Default Measurement ID provided for Google Analytics 4
export const DEFAULT_GA_MEASUREMENT_ID = 'G-LGPGHRGSSC';

// Memory cache for recent events sent to GA
let recentGaLogs: GaEventPayload[] = [];

/**
 * Returns the currently active Google Analytics Measurement ID
 * Preference: LocalStorage (configured dynamically by user) -> Vite Env var -> Default G-LGPGHRGSSC
 */
export function getGaMeasurementId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_GA_ID_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch (e) {}

  const envId = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string) || '';
  if (envId && envId.trim()) {
    return envId.trim();
  }

  return DEFAULT_GA_MEASUREMENT_ID;
}

/**
 * Validates a Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)
 */
export function isValidGaId(id: string): boolean {
  return /^G-[A-Za-z0-9]{4,15}$/i.test(id.trim());
}

/**
 * Saves a new Measurement ID into LocalStorage and re-initializes gtag
 */
export function setGaMeasurementId(id: string): boolean {
  const cleanId = id.trim().toUpperCase();
  if (!cleanId) {
    try {
      localStorage.removeItem(STORAGE_GA_ID_KEY);
    } catch (e) {}
    return true;
  }

  if (!isValidGaId(cleanId)) {
    return false;
  }

  try {
    localStorage.setItem(STORAGE_GA_ID_KEY, cleanId);
    initGoogleAnalytics(cleanId);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Checks if GA4 is loaded and configured with an ID
 */
export function isGaConfigured(): boolean {
  return Boolean(getGaMeasurementId() && isValidGaId(getGaMeasurementId()));
}

export function isGaLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function' && isGaConfigured();
}

/**
 * Injects gtag.js script and sets up window.dataLayer & window.gtag
 */
export function initGoogleAnalytics(overrideId?: string): void {
  if (typeof window === 'undefined') return;

  const measurementId = (overrideId || getGaMeasurementId()).trim().toUpperCase();
  if (!measurementId || !isValidGaId(measurementId)) {
    return;
  }

  // Ensure dataLayer exists
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  // Check if script is already present (from index.html or previous dynamic call)
  const scriptId = 'google-analytics-gtag';
  let scriptElement = (document.getElementById(scriptId) ||
    document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) as HTMLScriptElement | null;

  if (!scriptElement) {
    scriptElement = document.createElement('script');
    scriptElement.id = scriptId;
    scriptElement.async = true;
    scriptElement.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(scriptElement);
  } else {
    scriptElement.id = scriptId;
    if (!scriptElement.src.includes(measurementId)) {
      // If ID changed dynamically, update script source
      scriptElement.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    }
  }

  // Configure gtag
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We control page_view manually for SPA navigation
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });
}

/**
 * Dispatches an event to Google Analytics 4
 */
export function trackGaEvent(action: string, params?: Record<string, any>): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId) return;

  const payload: Record<string, any> = {
    ...params,
    send_to: measurementId,
  };

  // Keep a local log of outgoing events for inspection in Admin Panel
  try {
    const entry: GaEventPayload = {
      action,
      params,
      timestamp: Date.now(),
    };
    recentGaLogs.unshift(entry);
    recentGaLogs = recentGaLogs.slice(0, 20);
  } catch (e) {}

  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    try {
      window.gtag('event', action, payload);
    } catch (e) {
      console.warn('[GA4] Error dispatching event:', e);
    }
  }
}

/**
 * Tracks a SPA page view in Google Analytics
 */
export function trackGaPageView(path: string, title?: string): void {
  const measurementId = getGaMeasurementId();
  if (!measurementId) return;

  trackGaEvent('page_view', {
    page_path: path,
    page_title: title || document.title || 'Camino a la Leyenda',
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
}

/**
 * Sends a test verification event to GA4
 */
export function sendGaTestEvent(): boolean {
  if (!isGaConfigured()) return false;
  
  trackGaEvent('ga4_test_ping', {
    test_timestamp: new Date().toISOString(),
    event_category: 'admin_test',
    client_version: '5.2.0',
    status: 'connected',
  });
  return true;
}

/**
 * Returns recent events sent to GA4 during this browser session
 */
export function getRecentGaLogs(): GaEventPayload[] {
  return [...recentGaLogs];
}
