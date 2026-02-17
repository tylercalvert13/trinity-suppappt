// Facebook Pixel Advanced Matching + Browser-Side Events
// Used alongside CAPI (fb-conversion edge function) for dual-tracking with deduplication

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const FB_PIXEL_ID = '731657259428655';

interface UserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  zipCode?: string;
}

/**
 * Re-initialize the Facebook pixel with Advanced Matching parameters.
 * This associates the browser cookie identity with user PII for improved match quality.
 * fbq hashes automatically — pass unhashed values.
 */
export const initAdvancedMatching = (userData: UserData) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

  try {
    window.fbq('init', FB_PIXEL_ID, {
      em: userData.email?.trim().toLowerCase(),
      fn: userData.firstName?.trim().toLowerCase(),
      ln: userData.lastName?.trim().toLowerCase(),
      ph: userData.phone?.replace(/\D/g, ''),
      zp: userData.zipCode?.substring(0, 5),
      country: 'us',
    });
    console.log('[FB Pixel] Advanced Matching initialized with user data');
  } catch (err) {
    console.error('[FB Pixel] Error initializing Advanced Matching:', err);
  }
};

/**
 * Fire a browser-side pixel event with eventID for deduplication with CAPI.
 */
export const trackPixelEvent = (
  eventName: string,
  eventId: string,
  value?: number,
  currency = 'USD'
) => {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;

  try {
    const customData: Record<string, any> = {};
    if (value && value > 0) {
      customData.value = value;
      customData.currency = currency;
    }

    window.fbq('track', eventName, customData, { eventID: eventId });
    console.log(`[FB Pixel] Browser event fired: ${eventName} (eventID: ${eventId})`);
  } catch (err) {
    console.error(`[FB Pixel] Error firing ${eventName}:`, err);
  }
};
