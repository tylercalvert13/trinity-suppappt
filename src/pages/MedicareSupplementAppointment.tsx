import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Users, FileCheck, CheckCircle, AlertCircle, Loader2, Phone, Lock, Star, UserPlus, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';

import { useQuoteWarmup } from '@/hooks/useQuoteWarmup';
import { useCalendarWarmup } from '@/hooks/useCalendarWarmup';
import { AppointmentBookingWidgetWithOptIn } from '@/components/AppointmentBookingWidgetWithOptIn';
import { StickyBookingCTA } from '@/components/StickyBookingCTA';
import { ExitIntentModal } from '@/components/ExitIntentModal';
import { getStateFromZip } from '@/lib/zipToState';
import { z } from 'zod';
import { SocialProofPopup } from '@/components/SocialProofPopup';
import { QuoteLoadingProgress } from '@/components/QuoteLoadingProgress';
import { initAdvancedMatching, trackPixelEvent } from '@/lib/facebookPixel';

// TypeScript declarations for tracking pixels
declare global {
  interface Window {
    uetq?: any[];
    gtag?: (...args: any[]) => void;
    vbpx?: (...args: any[]) => void;
    ttq?: { identify: (data: any) => void; track: (event: string, params?: any) => void; };
  }
}

// Question steps that should trigger auto-scroll
const QUESTION_STEPS = ['plan', 'payment', 'care', 'gender', 'tobacco', 'spouse', 'age', 'zip', 'contact'];

// Agent data for speed-to-lead round-robin assignment
interface Agent {
  name: string;
  firstName: string;
  phone: string;
  telLink: string;
  ghlUserId: string;
  states: string[]; // empty = all states (for future state-based filtering)
}

const AGENTS: Agent[] = [
  { name: 'Maria Castro', firstName: 'Maria', phone: '(908) 224-5410', telLink: 'tel:+19082245410', ghlUserId: 'xh3zAJstdrOjv6G60sR6', states: ['AR','AZ','DE','GA','IA','KY','LA','MO','NC','NE','NJ','OH','OK','SC','TN','TX'] },
  { name: 'Claude Washington', firstName: 'Claude', phone: '(908) 498-9806', telLink: 'tel:+19084989806', ghlUserId: 'ABUX6hMZHC1sxkTg33T8', states: ['AL','AR','AZ','DE','FL','GA','IA','IL','KY','LA','ME','MI','MO','MS','NC','NE','NJ','NM','NV','OH','OK','PA','SC','TN','TX','WI','WV'] },
  { name: 'Jerome Hinds', firstName: 'Jerome', phone: '(908) 681-8962', telLink: 'tel:+19086818962', ghlUserId: 'nVHKSQneg56OHykfIvi8', states: ['AR','AZ','FL','GA','MO','NC','NE','NJ','OH','OK','SC','TN','TX'] },
  { name: 'Rosa Silva', firstName: 'Rosa', phone: '(908) 829-9820', telLink: 'tel:+19088299820', ghlUserId: 'GHG8mhKx8321E3EzVNQj', states: ['AL','AR','AZ','DE','IA','IL','KY','LA','MO','MS','NC','NE','NJ','NM','OH','OK','PA','SC','TN','TX','WI'] },
  { name: 'Tiyanna Alexander', firstName: 'Tiyanna', phone: '(908) 830-3039', telLink: 'tel:+19088303039', ghlUserId: 'y48XmZvsa1HGzQv4ewXW', states: ['AL','AR','AZ','DE','FL','GA','IA','KY','MI','MO','MS','NC','NE','NJ','OH','OK','PA','SC','TN','TX'] },
  { name: 'Jay Ortega', firstName: 'Jay', phone: '(908) 987-2783', telLink: 'tel:+19089872783', ghlUserId: 'dXRwG0TzNKEnlkY9RuzO', states: ['NJ','OH','TX'] },
  { name: 'Joey Jimenez', firstName: 'Joey', phone: '(908) 829-6944', telLink: 'tel:+19088296944', ghlUserId: '6nCN3NDWyUugUCGz22hD', states: ['AL','AZ','GA','LA','NC','NJ','OH','PA','SC','TN','TX','VA'] },
];

// Map full state names to abbreviations for agent filtering
const STATE_NAME_TO_ABBREV: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "Washington DC": "DC", "West Virginia": "WV", "Wisconsin": "WI",
  "Wyoming": "WY",
};

async function getNextAgent(stateName?: string): Promise<Agent> {
  const stateAbbrev = stateName ? STATE_NAME_TO_ABBREV[stateName] : undefined;
  const eligible = stateAbbrev
    ? AGENTS.filter(a => a.states.includes(stateAbbrev))
    : [];
  const pool = eligible.length > 0 ? eligible : AGENTS;
  const funnelId = eligible.length > 0 ? `suppappt-${stateAbbrev}` : 'suppappt';

  try {
    const { data, error } = await supabase.rpc('get_next_agent_index', {
      funnel_id: funnelId,
      agent_count: pool.length,
    });
    if (error || data === null || data === undefined) {
      console.error('Round-robin RPC error, falling back to random:', error);
      return pool[Math.floor(Math.random() * pool.length)];
    }
    return pool[data % pool.length];
  } catch (err) {
    console.error('Round-robin fetch failed, falling back to random:', err);
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

// Contact form validation schema
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, "Phone must be 10 digits")
    .refine(val => !val.startsWith('0') && !val.startsWith('1'), "Please enter a valid US phone number"),
});

// Format phone number for display as user types
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

type FunnelStep = 
  | "landing" 
  | "plan" 
  | "payment" 
  | "care" 
  | "gender"
  | "tobacco"
  | "spouse"
  | "age"
  | "zip"
  | "contact"
  | "loading"
  | "qualified";

type DisqualReason = "health";

interface FormData {
  plan: string;
  currentPayment: string;
  careOrCondition: string;
  recentTreatment: string;
  medicationUse: string;
  gender: string;
  tobacco: string;
  spouse: string;
  age: string;
  zipCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface QuoteResult {
  rate: number;
  carrier: string;
  amBestRating: string;
  monthlySavings: number;
  annualSavings: number;
  savingsPercent: number;
  cannotBeatRate?: boolean;
  error?: string;
}

// Generate application reference number
const generateApplicationNumber = (): string => {
  return `SM${Math.floor(10000 + Math.random() * 90000)}`;
};

// Download vCard contact for iOS/Android
const downloadContactCard = () => {
  const vcardString = `BEGIN:VCARD
VERSION:3.0
FN:Health Helpers
ORG:Health Helpers
TEL;TYPE=WORK,VOICE:+12014269898
TEL;TYPE=WORK,VOICE:+12012988393
NOTE:Medicare Supplement Quote Team - Save this contact so you know it's us calling!
END:VCARD`;

  const blob = new Blob([vcardString], { type: 'text/vcard' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'Health-Helpers.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

// Get Facebook cookies for conversion tracking
const getFacebookCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return { fbc: cookies._fbc, fbp: cookies._fbp };
};

// Get TikTok tracking params (ttclid from URL, _ttp from cookie)
const getTikTokCookies = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const ttclid = urlParams.get('ttclid') || '';
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return { ttclid, ttp: cookies._ttp || '' };
};

// Get persistent visitor ID for Facebook external_id matching
const getVisitorIdForTracking = (): string => {
  const storageKey = 'funnel_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }
  return visitorId;
};

// Generate unique event ID for deduplication
const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Track appointment booking event via Facebook Conversion API + Browser Pixel
const trackFacebookAppointmentEvent = async (
  formData: FormData,
  quoteResult: QuoteResult | null
) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    const conversionValue = quoteResult?.monthlySavings || quoteResult?.rate || 0;
    
    // Browser-side pixel event (deduplicates with CAPI via eventID)
    trackPixelEvent('Appointment', eventId, conversionValue);
    
    // CAPI server-side event
    console.log('[FB CAPI] Sending Appointment event (suppappt)...');
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'Appointment',
        event_source_url: window.location.href,
        external_id: getVisitorIdForTracking(),
        fbc,
        fbp,
        event_id: eventId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        zip_code: formData.zipCode,
        value: conversionValue,
        currency: 'USD',
      }
    });
    console.log('[FB CAPI] Appointment conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Facebook Appointment event:', error);
  }
};

// Track submission event via Facebook Conversion API + Browser Pixel
const trackFacebookSubmissionEvent = async (
  formData: FormData,
  quoteResult: QuoteResult | null
) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    const conversionValue = quoteResult?.monthlySavings || quoteResult?.rate || 0;
    
    // Initialize Advanced Matching with user data (re-init is idempotent)
    initAdvancedMatching({
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      zipCode: formData.zipCode,
    });
    
    // Browser-side pixel event (deduplicates with CAPI via eventID)
    trackPixelEvent('Lead', eventId, conversionValue);
    
    // CAPI server-side event
    console.log('[FB CAPI] Sending submission event (suppappt)...');
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'submission',
        event_source_url: window.location.href,
        external_id: getVisitorIdForTracking(),
        fbc,
        fbp,
        event_id: eventId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        zip_code: formData.zipCode,
        value: conversionValue,
        currency: 'USD',
      }
    });
    console.log('[FB CAPI] Submission conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Facebook submission event:', error);
  }
};

// Normalize email for Bing UET enhanced conversions per Microsoft spec
const normalizeEmailForBing = (email: string): string => {
  let normalized = email.trim().toLowerCase();
  // Remove +alias (name+alias@domain.com → name@domain.com)
  normalized = normalized.replace(/\+[^@]*@/, '@');
  const [localPart, domain] = normalized.split('@');
  if (!domain) return normalized;
  // Remove periods from local part only
  const cleanLocal = localPart.replace(/\./g, '');
  return `${cleanLocal}@${domain}`;
};

// Track lead submission via Bing UET Enhanced Conversions
const trackBingSubmissionEvent = (formData: FormData) => {
  try {
    if (typeof window === 'undefined' || !window.uetq) {
      console.log('Bing UET not loaded yet, skipping conversion');
      return;
    }
    
    // Normalize email per Microsoft spec
    const normalizedEmail = normalizeEmailForBing(formData.email);
    
    // Format phone to E.164 (add +1 for US)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const e164Phone = `+1${phoneDigits}`;
    
    // Step 1: Push enhanced conversion PII data
    window.uetq.push('set', { 
      'pid': { 
        'em': normalizedEmail,
        'ph': e164Phone,
      } 
    });
    
    // Step 2: Fire the conversion event
    window.uetq.push('event', 'submit_lead_form', {});
    
    console.log('Bing UET submit_lead_form conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Bing conversion:', error);
  }
};

// Track lead submission via Google Ads conversion
const trackGoogleAdsConversion = () => {
  try {
    if (typeof window === 'undefined' || !window.gtag) {
      console.log('Google Ads gtag not loaded yet, skipping conversion');
      return;
    }
    
    window.gtag('event', 'conversion', {
      'send_to': 'AW-17916268698/760DCPf-lO8bEJqhkt9C',
      'value': 1.0,
      'currency': 'USD'
    });
    
    console.log('Google Ads submit_lead_form conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Google Ads conversion:', error);
  }
};

// Track lead submission via Vibe.co TV Ads
const trackVibeCoLeadEvent = () => {
  try {
    if (typeof window === 'undefined' || !window.vbpx) {
      console.log('Vibe.co pixel not loaded yet, skipping lead event');
      return;
    }
    
    window.vbpx('event', 'lead');
    
    console.log('Vibe.co lead event tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking Vibe.co lead event:', error);
  }
};

// SHA-256 hashing utility for TikTok Advanced Matching
const hashSHA256 = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
};

// Track funnel button clicks via TikTok pixel (no PII needed)
const trackTikTokClickButton = (stepName: string) => {
  try {
    if (!window.ttq) return;
    window.ttq.track('ClickButton', {
      contents: [{ content_id: 'suppappt', content_type: 'product',
        content_name: `Medicare Supplement - ${stepName}` }],
      value: 0, currency: 'USD',
    });
    console.log(`TikTok ClickButton tracked (suppappt - ${stepName})`);
  } catch (error) {
    console.error('Error tracking TikTok ClickButton:', error);
  }
};

// Track lead submission via TikTok pixel (with hashed PII)
const trackTikTokLeadEvent = async (formData: FormData, quoteResult: QuoteResult | null) => {
  try {
    if (!window.ttq) return;
    window.ttq.identify({
      email: await hashSHA256(formData.email),
      phone_number: await hashSHA256(formData.phone.replace(/\D/g, '')),
      external_id: await hashSHA256(getVisitorIdForTracking()),
    });
    window.ttq.track('Lead', {
      contents: [{ content_id: 'suppappt', content_type: 'product',
        content_name: `Medicare Supplement ${formData.plan}` }],
      value: quoteResult?.monthlySavings || quoteResult?.rate || 0,
      currency: 'USD',
    });
    console.log('TikTok Lead event tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking TikTok Lead event:', error);
  }
};

// Track lead submission via TikTok Events API (server-side, dedup with browser pixel)
const trackTikTokLeadEventServer = async (formData: FormData, quoteResult: QuoteResult | null, eventId: string) => {
  try {
    const { ttclid, ttp } = getTikTokCookies();
    const conversionValue = quoteResult?.monthlySavings || quoteResult?.rate || 0;
    console.log('[TikTok CAPI] Sending Lead event (suppappt)...');
    await supabase.functions.invoke('tiktok-conversion', {
      body: {
        event: 'Lead',
        event_id: eventId,
        event_source_url: window.location.href,
        email: formData.email,
        phone: formData.phone,
        external_id: getVisitorIdForTracking(),
        ttclid,
        ttp,
        value: conversionValue,
        currency: 'USD',
        content_id: 'suppappt',
        content_type: 'product',
        content_name: `Medicare Supplement ${formData.plan}`,
      }
    });
    console.log('[TikTok CAPI] Lead conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking TikTok Lead server event:', error);
  }
};

// Track appointment booking via TikTok pixel (with hashed PII)
const trackTikTokScheduleEvent = async (formData: FormData, quoteResult: QuoteResult | null) => {
  try {
    if (!window.ttq) return;
    window.ttq.identify({
      email: await hashSHA256(formData.email),
      phone_number: await hashSHA256(formData.phone.replace(/\D/g, '')),
      external_id: await hashSHA256(getVisitorIdForTracking()),
    });
    window.ttq.track('Schedule', {
      contents: [{ content_id: 'suppappt', content_type: 'product',
        content_name: `Medicare Supplement ${formData.plan}` }],
      value: quoteResult?.monthlySavings || quoteResult?.rate || 0,
      currency: 'USD',
    });
    console.log('TikTok Schedule event tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking TikTok Schedule event:', error);
  }
};

// Track appointment booking via TikTok Events API (server-side, dedup with browser pixel)
const trackTikTokScheduleEventServer = async (formData: FormData, quoteResult: QuoteResult | null, eventId: string) => {
  try {
    const { ttclid, ttp } = getTikTokCookies();
    const conversionValue = quoteResult?.monthlySavings || quoteResult?.rate || 0;
    console.log('[TikTok CAPI] Sending Schedule event (suppappt)...');
    await supabase.functions.invoke('tiktok-conversion', {
      body: {
        event: 'Schedule',
        event_id: eventId,
        event_source_url: window.location.href,
        email: formData.email,
        phone: formData.phone,
        external_id: getVisitorIdForTracking(),
        ttclid,
        ttp,
        value: conversionValue,
        currency: 'USD',
        content_id: 'suppappt',
        content_type: 'product',
        content_name: `Medicare Supplement ${formData.plan}`,
      }
    });
    console.log('[TikTok CAPI] Schedule conversion tracked (suppappt)');
  } catch (error) {
    console.error('Error tracking TikTok Schedule server event:', error);
  }
};

const MedicareSupplementAppointment = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<FunnelStep>("landing");
  const [disqualReason, setDisqualReason] = useState<DisqualReason | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationNumber] = useState(() => generateApplicationNumber());
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const resultsHeaderRef = useRef<HTMLDivElement>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [assignedAgent, setAssignedAgent] = useState<Agent | null>(null);
  const bookingWidgetRef = useRef<HTMLDivElement>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string | null>(null);
  const [selectedTimeDisplay, setSelectedTimeDisplay] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    plan: '',
    currentPayment: '',
    careOrCondition: '',
    recentTreatment: '',
    medicationUse: '',
    gender: '',
    tobacco: '',
    spouse: '',
    age: '',
    zipCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  

  const { visitorId, sessionId, trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('suppappt', 'calm_trust_v1');
  
  // Warmup the calendar edge function early to prevent cold starts
  useCalendarWarmup();
  
  // Warmup the quote API to pre-cache CSG token
  useQuoteWarmup();

  // Handle booking completed - fire Facebook Appointment tracking
  const handleBookingCompleted = useCallback((contactData: { firstName: string; lastName: string; email: string; phone: string }) => {
    trackFacebookAppointmentEvent(formData, quoteResult);
    trackTikTokScheduleEvent(formData, quoteResult);
    const ttEventId = generateEventId();
    trackTikTokScheduleEventServer(formData, quoteResult, ttEventId);
  }, [formData, quoteResult]);

  // Scroll to booking widget helper
  const scrollToBookingWidget = useCallback(() => {
    bookingWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Auto-scroll behavior based on step changes
  useEffect(() => {
    if (QUESTION_STEPS.includes(step)) {
      // Scroll to question container for question steps
      setTimeout(() => {
        questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (step === "loading") {
      // Scroll to loading component
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
    } else if (step === "qualified") {
      // Scroll to results header ("Great news")
      setTimeout(() => {
        resultsHeaderRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
      // Auto-scroll to booking widget after 5 seconds so user can read savings first
      const autoScrollTimer = setTimeout(() => {
        bookingWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 5000);
      return () => clearTimeout(autoScrollTimer);
    }
  }, [step]);

  // Detect user's state via IP geolocation on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-user-location');
        if (error) {
          console.error('Location detection error:', error);
          return;
        }
        if (data?.state) {
          setDetectedState(data.state);
          console.log('Detected user state:', data.state);
        }
      } catch (err) {
        console.error('Failed to detect location:', err);
      } finally {
        setIsLoadingLocation(false);
      }
    };
    
    // Set a timeout fallback in case the API is slow
    const timeout = setTimeout(() => {
      setIsLoadingLocation(false);
    }, 1500);
    
    detectLocation().finally(() => clearTimeout(timeout));
  }, []);

  // Load TrustedForm script for lead consent certification
  useEffect(() => {
    // Only load once
    if (document.getElementById('trustedform-script')) return;
    
    const tf = document.createElement('script');
    tf.type = 'text/javascript';
    tf.async = true;
    tf.id = 'trustedform-script';
    tf.src = 'https://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&ping_field=xxTrustedFormPingUrl&use_tagged_consent=true&l=' +
      new Date().getTime() + Math.random();
    
    const s = document.getElementsByTagName('script')[0];
    s.parentNode?.insertBefore(tf, s);
    
    // Cleanup on unmount
    return () => {
      const script = document.getElementById('trustedform-script');
      if (script) script.remove();
    };
  }, []);

  // SEO meta tags
  useEffect(() => {
    document.title = "Medicare Supplement Appointment | Health Helpers";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get a personalized Medicare Supplement quote and speak directly with a licensed agent.');
    }

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    return () => {
      document.title = "Medicare Self-Enrollment Online | Health Helpers";
      if (metaDescription) {
        metaDescription.setAttribute('content', 'Enroll in Medicare plans online by yourself. No phone calls, no meetings.');
      }
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  const scrollToFunnel = () => {
    setStep("plan");
    trackStepChange("plan");
    setTimeout(() => {
      funnelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getProgress = (): number => {
    const steps: FunnelStep[] = ["plan", "payment", "care", "gender", "tobacco", "spouse", "age", "zip", "contact"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const getStepNumber = (): number => {
    const steps: FunnelStep[] = ["plan", "payment", "care", "gender", "tobacco", "spouse", "age", "zip", "contact"];
    return steps.indexOf(step) + 1;
  };

  const handlePlanSelect = (plan: string) => {
    setFormData(prev => ({ ...prev, plan }));
    setStep("payment");
    trackStepChange("payment", plan);
    trackTikTokClickButton('plan');
  };

  const handlePaymentSubmit = () => {
    if (!formData.currentPayment || parseFloat(formData.currentPayment) <= 0) return;
    setStep("care");
    trackStepChange("care", formData.currentPayment);
    trackTikTokClickButton('payment');
  };

  const handleCareAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, careOrCondition: answer }));
    trackTikTokClickButton('care');
    if (answer === "yes") {
      setDisqualReason("health");
      trackQualification("disqualified", "health");
      saveSubmission("disqualified", "health");
      navigate("/disqualified?reason=health");
      return;
    }
    setStep("gender");
    trackStepChange("gender", answer);
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setStep("tobacco");
    trackStepChange("tobacco", gender);
    trackTikTokClickButton('gender');
  };

  const handleTobaccoAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, tobacco: answer }));
    setStep("spouse");
    trackStepChange("spouse", answer);
    trackTikTokClickButton('tobacco');
  };

  const handleSpouseAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, spouse: answer }));
    setStep("age");
    trackStepChange("age", answer);
    trackTikTokClickButton('spouse');
  };

  const handleAgeSubmit = () => {
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 65 || age > 120) return;
    setStep("zip");
    trackStepChange("zip", formData.age);
    trackTikTokClickButton('age');
  };

  const handleZipSubmit = () => {
    if (!/^\d{5}$/.test(formData.zipCode)) return;
    setStep("contact");
    trackStepChange("contact", formData.zipCode);
    trackTikTokClickButton('zip');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setError(null);
    
    // Step 1: Client-side Zod validation
    const validationResult = contactSchema.safeParse({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone,
    });

    if (!validationResult.success) {
      const errors: ValidationErrors = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    // Step 2: Server-side API validation (phone only)
    setIsValidating(true);
    
    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-contact', {
        body: {
          phone: formData.phone.replace(/\D/g, ''),
        }
      });

      if (validationError) {
        console.error("Validation API error:", validationError);
        // Continue anyway - fail open
      } else if (validationData && !validationData.valid) {
        const errors: ValidationErrors = {};
        if (!validationData.phone?.valid) {
          errors.phone = "This phone number doesn't appear to be valid. Please double-check it.";
        }
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setIsValidating(false);
          return;
        }
      }
    } catch (err) {
      console.error("Validation error:", err);
      // Continue anyway - fail open
    }

    setIsValidating(false);
    setStep("loading");
    setIsSubmitting(true);
    trackStepChange("loading");

    try {
      // Get quote from CSG API with 30-second timeout and one retry on transient failures
      const fetchQuote = async (isRetry = false): Promise<{ data: any; error: any }> => {
        const quotePromise = supabase.functions.invoke('get-medicare-quote', {
          body: {
            plan: formData.plan,
            currentPayment: parseFloat(formData.currentPayment),
            gender: formData.gender,
            tobacco: formData.tobacco,
            spouse: formData.spouse,
            age: parseInt(formData.age),
            zipCode: formData.zipCode,
          }
        });
        
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Quote request timed out after 30 seconds')), 30000)
        );

        try {
          const result = await Promise.race([quotePromise, timeoutPromise]);
          
          // Retry once on transient server errors (500, 502, 503, 504)
          if (!isRetry && result.error) {
            const status = result.error?.context?.status || result.error?.status;
            if ([500, 502, 503, 504].includes(status)) {
              console.log('Retrying quote after transient error:', status);
              trackEvent({ 
                eventType: 'quote_retry', 
                metadata: { status, attempt: 2 } 
              });
              return fetchQuote(true);
            }
          }
          return result;
        } catch (err) {
          // Retry once on timeout or network errors
          if (!isRetry) {
            console.log('Retrying quote after error:', err);
            trackEvent({ 
              eventType: 'quote_retry', 
              metadata: { error: String(err), attempt: 2 } 
            });
            return fetchQuote(true);
          }
          throw err;
        }
      };

      const { data, error: quoteError } = await fetchQuote();

      if (quoteError) {
        console.error("Quote error:", quoteError);
        // Log analytics event for quote failure
        trackEvent({ 
          eventType: 'quote_error', 
          step: 'contact',
          metadata: { 
            errorMessage: quoteError?.message || 'Unknown error',
            status: quoteError?.context?.status,
            zip: formData.zipCode,
            age: formData.age,
            plan: formData.plan,
          } 
        });
        setError("We're having trouble retrieving rates right now. Please try again in a moment or call us directly.");
        setStep("contact");
        return;
      }

      if (data?.cannotBeatRate) {
        await saveSubmission("knockout");
        navigate("/great-rate");
        return;
      }

      if (data?.error) {
        setError(data.error);
        setStep("contact");
        return;
      }

      // Success - we have a quote
      setQuoteResult(data);
      await saveSubmission("success", undefined, data);
      
      // Resolve lead's state from zip code
      const leadState = getStateFromZip(formData.zipCode);
      
      // Assign agent via state-filtered round-robin (server-side)
      const agent = await getNextAgent(leadState);
      setAssignedAgent(agent);
      
      // Get user's timezone from browser (IANA format for GHL)
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Capture TrustedForm certificate URL with robust detection + polling
      const getTrustedFormCertUrl = async (): Promise<string | null> => {
        const selectors = [
          '#xxTrustedFormCertUrl_0',
          '#xxTrustedFormCertUrl',
          'input[name="xxTrustedFormCertUrl"]',
        ];
        for (let attempt = 0; attempt < 20; attempt++) {
          for (const selector of selectors) {
            const el = document.querySelector(selector) as HTMLInputElement | null;
            if (el?.value && el.value.startsWith('https://cert.trustedform.com/')) {
              console.log('[TrustedForm] Certificate captured:', el.value);
              return el.value;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.warn('[TrustedForm] Certificate URL not found after polling.');
        return null;
      };
      
      const trustedFormCertUrl = await getTrustedFormCertUrl();
      
      // Send lead to GHL webhook with agent assignment (fire-and-forget)
      supabase.functions.invoke('send-lead-webhook-suppappt', {
        body: {
          ...formData,
          currentPayment: parseFloat(formData.currentPayment),
          age: parseInt(formData.age),
          quotedRate: data.rate,
          quotedCarrier: data.carrier,
          amBestRating: data.amBestRating,
          savingsPercent: data.savingsPercent,
          visitorId,
          sessionId,
          page: 'suppappt',
          timezone: userTimezone,
          trustedFormCertUrl,
          assigned_agent_user_id: agent.ghlUserId,
          assigned_agent_name: agent.name,
          assigned_agent_phone: agent.phone,
          lead_state: leadState,
        }
      }).catch(err => console.error('Webhook failed (non-critical):', err));

      // Track qualification and conversions
      trackQualification("qualified");
      await trackFacebookSubmissionEvent(formData, data);
      trackBingSubmissionEvent(formData);
      trackGoogleAdsConversion();
      trackVibeCoLeadEvent();
      trackTikTokLeadEvent(formData, data);
      const tiktokLeadEventId = generateEventId();
      trackTikTokLeadEventServer(formData, data, tiktokLeadEventId);
      
      setStep("qualified");

    } catch (err) {
      console.error("Error getting quote:", err);
      setError("An error occurred. Please try again or call us directly.");
      setStep("contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveSubmission = async (
    submissionType: "success" | "disqualified" | "knockout",
    disqualificationReason?: string,
    quoteData?: QuoteResult
  ) => {
    try {
      await supabase.from('submissions').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        plan: formData.plan,
        current_payment: formData.currentPayment ? parseFloat(formData.currentPayment) : null,
        care_or_condition: formData.careOrCondition,
        recent_treatment: formData.recentTreatment,
        medication_use: formData.medicationUse,
        gender: formData.gender,
        tobacco: formData.tobacco,
        spouse: formData.spouse,
        age: formData.age ? parseInt(formData.age) : null,
        zip_code: formData.zipCode,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        submission_type: submissionType,
        disqualification_reason: disqualificationReason || null,
        quoted_rate: quoteData?.rate || null,
        quoted_carrier: quoteData?.carrier || null,
        am_best_rating: quoteData?.amBestRating || null,
        monthly_savings: quoteData?.monthlySavings || null,
        annual_savings: quoteData?.annualSavings || null,
        page: 'suppappt',
      }]);
    } catch (error) {
      console.error("Error saving submission:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* TrustedForm noscript fallback (outside form is fine for this) */}
      <noscript>
        <img src="https://api.trustedform.com/ns.gif" height="1" width="1" style={{ display: 'none' }} alt="" />
      </noscript>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 to-blue-50 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Free Medicare Savings Check</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-slate-800">
            See How Much You Can Save on Your Medicare Supplement in Under 2 Minutes
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-4 max-w-2xl mx-auto">
            Plan G, F, and N rates increase every year —  If you're not checking for the best rates in your area every year, you're likely paying more for the exact same coverage.
          </p>
          <p className="text-base text-slate-500 mb-8 max-w-2xl mx-auto">
            We can check this for you now and we check this  for our clients so they always have the best price for their medicare supplement in their geographical area every year.
          </p>

          {step === "landing" && (
            <Button
              onClick={scrollToFunnel}
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 text-white text-xl py-8 px-12 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              See How Much I Can Save
            </Button>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-slate-500">
              <Shield className="h-5 w-5" />
              <span className="text-sm">US Based Licensed Agents</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Users className="h-5 w-5" />
              <span className="text-sm">10,000+ Seniors Helped</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <FileCheck className="h-5 w-5" />
              <span className="text-sm">100% Free Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Funnel Section */}
      <section ref={funnelRef} className="py-8 md:py-12 bg-gray-50">
        <div ref={questionContainerRef} className="max-w-2xl mx-auto px-4 scroll-mt-4">
          
          {/* Plan Selection */}
          {step === "plan" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              {/* Trust Bar */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Which Medicare Supplement plan are you paying for today?
              </h2>

              <RadioGroup className="space-y-4">
                {["Plan G", "Plan N", "Plan F"].map((plan) => (
                  <div
                    key={plan}
                    onClick={() => handlePlanSelect(plan)}
                    className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <RadioGroupItem value={plan} id={`plan-${plan}`} className="h-6 w-6" />
                    <Label htmlFor={`plan-${plan}`} className="text-lg cursor-pointer flex-1">{plan}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Payment Input */}
          {step === "payment" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                How much does your insurance company charge you each month?
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={formData.currentPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPayment: e.target.value }))}
                    placeholder="0.00"
                    className="pl-10 text-2xl h-16 rounded-xl"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handlePaymentSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 h-auto rounded-xl"
                  disabled={!formData.currentPayment || parseFloat(formData.currentPayment) <= 0}
                >
                  Continue
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Join 10,000+ seniors who've compared rates for free
                </p>
              </div>
            </div>
          )}

          {/* Quick Health Check - Combined Question */}
          {step === "care" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Quick Health Check
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                In the last 2 years, have any of these applied to you?
              </p>
              
              <ul className="text-foreground mb-8 space-y-3">
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Cancer, heart attack, stroke, or heart surgery</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Oxygen use, dialysis, or organ transplant</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Hospice, nursing home, or need daily care help</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Insulin or 3+ diabetes medications</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Biologic injections (e.g., Humira, Enbrel)</span>
                </li>
              </ul>

              <div className="space-y-4">
                <Button
                  onClick={() => handleCareAnswer("no")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg md:text-xl py-6 h-auto rounded-xl"
                >
                  No, none of these apply to me
                </Button>
                <Button
                  onClick={() => handleCareAnswer("yes")}
                  variant="outline"
                  className="w-full text-lg md:text-xl py-6 h-auto rounded-xl border-2"
                >
                  Yes, one or more applies
                </Button>
              </div>
            </div>
          )}

          {/* Gender Question */}
          {step === "gender" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                What is your gender?
              </h2>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleGenderSelect("male")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="male" id="gender-male" className="h-6 w-6" />
                  <Label htmlFor="gender-male" className="text-lg cursor-pointer flex-1">Male</Label>
                </div>
                <div
                  onClick={() => handleGenderSelect("female")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="female" id="gender-female" className="h-6 w-6" />
                  <Label htmlFor="gender-female" className="text-lg cursor-pointer flex-1">Female</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Tobacco Question */}
          {step === "tobacco" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Have you used tobacco products in the last 12 months?
              </h2>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleTobaccoAnswer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="tobacco-yes" className="h-6 w-6" />
                  <Label htmlFor="tobacco-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleTobaccoAnswer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="tobacco-no" className="h-6 w-6" />
                  <Label htmlFor="tobacco-no" className="text-lg cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Spouse Question */}
          {step === "spouse" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Do you have a spouse or domestic partner?
              </h2>
              
              <p className="text-muted-foreground mb-6 text-sm">
                Some carriers offer household discounts when both partners have coverage.
              </p>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleSpouseAnswer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="spouse-yes" className="h-6 w-6" />
                  <Label htmlFor="spouse-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleSpouseAnswer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="spouse-no" className="h-6 w-6" />
                  <Label htmlFor="spouse-no" className="text-lg cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Age Input */}
          {step === "age" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                What is your current age?
              </h2>

              <div className="space-y-4">
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Enter your age"
                  className="text-2xl h-16 rounded-xl text-center"
                  min="65"
                  max="120"
                />
                <Button
                  onClick={handleAgeSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 h-auto rounded-xl"
                  disabled={!formData.age || parseInt(formData.age) < 65}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* ZIP Code Input */}
          {step === "zip" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-600">Almost done!</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2 [&>div]:bg-green-500" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                What is your ZIP code?
              </h2>

              <div className="space-y-4">
                <Input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
                  placeholder="12345"
                  className="text-2xl h-16 rounded-xl text-center"
                  maxLength={5}
                />
                <Button
                  onClick={handleZipSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 h-auto rounded-xl"
                  disabled={!/^\d{5}$/.test(formData.zipCode)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Contact Form - ALWAYS mounted (hidden until contact step) for TrustedForm SDK */}
          <div className={step === "contact" ? "block" : "hidden"}>
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 9</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Your info is secure</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed agents</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> A+ Rated carriers</span>
              </div>

              {/* Testimonial moved above form for social proof */}
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-800 italic">
                  "I was nervous to share my info, but they called me right on time and saved me $89/month." — Robert, TX
                </p>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Final Step: Enter Your Details to See Your New Rate
              </h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Your information is 100% secure and will never be sold.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800">{error}</p>
                    <a href="tel:+19082245410" className="text-red-600 hover:underline font-medium">
                      Call (908) 224-5410 for immediate assistance
                    </a>
                  </div>
                </div>
              )}

              <form 
                onSubmit={handleContactSubmit} 
                className="space-y-4"
                data-tf-element-role="offer"
              >
                {/* TrustedForm hidden fields - MUST be inside the form */}
                <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl_0" />
                <input type="hidden" name="xxTrustedFormPingUrl" id="xxTrustedFormPingUrl_0" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, firstName: e.target.value }));
                        if (validationErrors.firstName) setValidationErrors(prev => ({ ...prev, firstName: undefined }));
                      }}
                      placeholder="John"
                      className={`h-12 rounded-xl ${validationErrors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      required
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, lastName: e.target.value }));
                        if (validationErrors.lastName) setValidationErrors(prev => ({ ...prev, lastName: undefined }));
                      }}
                      placeholder="Smith"
                      className={`h-12 rounded-xl ${validationErrors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      required
                    />
                    {validationErrors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setFormData(prev => ({ ...prev, phone: formatted }));
                      if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="(555) 123-4567"
                    className={`h-12 rounded-xl ${validationErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    maxLength={14}
                    required
                  />
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Submit button immediately after fields */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 h-auto rounded-xl mt-4"
                  disabled={isSubmitting || isValidating || !formData.firstName || !formData.lastName || !formData.phone}
                  data-tf-element-role="submit"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying your information...
                    </>
                  ) : isSubmitting ? (
                    "Comparing Rates..."
                  ) : (
                    <span data-tf-element-role="submit-text">See My New Rate</span>
                  )}
                </Button>

                {/* Condensed TCPA consent - always visible below button */}
                <p 
                  className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed"
                  data-tf-element-role="consent-language"
                >
                  By clicking "<span data-tf-element-role="submit-text">See My New Rate</span>," I consent to calls, texts, and emails 
                  from <span data-tf-element-role="consent-advertiser-name">Health Helpers</span> about Medicare, including via autodialer, AI, or prerecorded messages. 
                  Msg &amp; data rates apply. Consent not required to purchase. Text STOP to opt out.{' '}
                  <Link to="/terms-of-service" className="underline hover:text-foreground">Terms</Link>
                  {' '}·{' '}
                  <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy</Link>
                </p>
              </form>
            </div>
          </div>

          {/* Loading Screen - Animated Progress Indicator */}
          {step === "loading" && (
            <div ref={loadingRef}>
              <QuoteLoadingProgress planType={formData.plan} firstName={formData.firstName} />
            </div>
          )}

          {/* Qualified/Results Screen */}
          {step === "qualified" && quoteResult && assignedAgent && (
            <div className="space-y-6">
              {/* Success + Rate + Savings Card */}
              <div ref={resultsHeaderRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 md:p-8 text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    Great News, {formData.firstName}!
                  </h1>
                  <p className="text-base text-muted-foreground mb-1">
                    You qualify for {formData.plan} at
                  </p>
                  <p className="text-3xl md:text-4xl font-bold text-green-600 mb-3">
                    ${quoteResult.rate.toFixed(2)}<span className="text-lg font-normal text-muted-foreground">/month</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You're paying <span className="line-through">${parseFloat(formData.currentPayment).toFixed(2)}</span> → <span className="font-semibold text-green-600">${quoteResult.rate.toFixed(2)}/mo</span>
                  </p>

                  {/* Savings Row */}
                  <div className="flex justify-center gap-6 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Savings</p>
                      <p className="text-2xl md:text-3xl font-bold text-green-600">${quoteResult.monthlySavings.toFixed(2)}</p>
                    </div>
                    <div className="w-px bg-border"></div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual Savings</p>
                      <p className="text-2xl md:text-3xl font-bold text-green-600">${quoteResult.annualSavings.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border mx-6"></div>

                {/* Trust Badges */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>Licensed Medicare agents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>No obligation consultation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>Same coverage, lower price</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>Free comparison of all carriers</span>
                    </div>
                  </div>
                </div>
              </div>



              {/* Appointment Booking Widget - prefilled with contact data */}
              <div ref={bookingWidgetRef}>
                <AppointmentBookingWidgetWithOptIn
                  quotedPremium={quoteResult.rate}
                  monthlySavings={quoteResult.monthlySavings}
                  planType={formData.plan}
                  currentPayment={parseFloat(formData.currentPayment)}
                  age={parseInt(formData.age)}
                  zipCode={formData.zipCode}
                  gender={formData.gender}
                  tobacco={formData.tobacco}
                  spouse={formData.spouse}
                  quotedCarrier={quoteResult.carrier}
                  amBestRating={quoteResult.amBestRating}
                  savingsPercent={quoteResult.savingsPercent}
                  userTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                  userState={getStateFromZip(formData.zipCode)}
                  visitorId={visitorId}
                  sessionId={sessionId}
                  onTrackEvent={trackEvent}
                  onBookingCompleted={handleBookingCompleted}
                  prefilledContact={{
                    firstName: formData.firstName,
                    phone: formData.phone,
                  }}
                />
              </div>

              {/* Secondary — Agent Call Fallback */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
                <div className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Or call your assigned specialist directly</p>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-base text-foreground leading-relaxed">
                    Your Medicare Specialist <span className="font-bold">{assignedAgent.firstName}</span> is reviewing your savings and will call you shortly from
                  </p>
                  <a
                    href={assignedAgent.telLink}
                    className="block text-2xl md:text-3xl font-bold text-primary hover:underline"
                    onClick={() => trackEvent({ eventType: 'agent_phone_clicked', metadata: { agent: assignedAgent.firstName } })}
                  >
                    {assignedAgent.phone}
                  </a>
                  <p className="text-sm text-foreground font-bold">
                    📱 Save this number so you recognize our call!
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${assignedAgent.firstName} (Health Helpers)\nORG:Health Helpers\nTEL;TYPE=CELL:${assignedAgent.phone.replace(/[^+\d]/g, '')}\nNOTE:Your Medicare Supplement Specialist\nEND:VCARD`;
                        const blob = new Blob([vCard], { type: 'text/vcard' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${assignedAgent.firstName}-Health-Helpers.vcf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        trackEvent({ eventType: 'save_contact_clicked', metadata: { agent: assignedAgent.firstName } });
                      }}
                      className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm rounded-xl px-5 py-2.5 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      Save {assignedAgent.firstName} to Contacts
                    </button>
                    <a
                      href={assignedAgent.telLink}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-base rounded-xl px-6 py-3 transition-colors"
                      onClick={() => trackEvent({ eventType: 'call_directly_clicked', metadata: { agent: assignedAgent.firstName } })}
                    >
                      <Phone className="h-5 w-5" />
                      Call {assignedAgent.firstName} Now
                    </a>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-white rounded-xl p-4 border">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground italic mb-2">"I was nervous to share my info, but they called me right on time and saved me $89/month."</p>
                <p className="text-xs text-muted-foreground font-medium">— Robert K., TX · Saved $89/mo</p>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center">
                This is a free rate comparison service. Quoted rates are estimates and subject to underwriting approval.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Spacer */}
      <div className="h-64 md:h-96"></div>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-4">
            <p>
              This is a free rate comparison service. We do not charge fees. By calling, you consent to speak with a licensed insurance agent about Medicare Supplement insurance.
            </p>
            <p>
              Health Helpers is not connected with or endorsed by the U.S. government or the federal Medicare program. Medicare Supplement insurance is sold by private insurance companies.
            </p>
            <p>
              Quoted rates are estimates based on the information provided. Actual rates may vary based on underwriting approval and other factors.
            </p>
            <div className="pt-4 border-t flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
              </div>
              <p>© {new Date().getFullYear()} Health Helpers. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Social Proof Popup - show after health questions (step 5+) */}
      {['gender', 'tobacco', 'spouse', 'age', 'zip', 'contact', 'loading', 'qualified'].includes(step) && (
        <SocialProofPopup delayMs={5000} visibleMs={4000} />
      )}

      {/* Exit Intent Modal - only show when qualified */}
      {step === "qualified" && quoteResult && (
        <ExitIntentModal
          monthlySavings={quoteResult.monthlySavings}
          onBookClick={scrollToBookingWidget}
        />
      )}

      {/* Sticky Floating CTA - mobile only, when qualified */}
      {step === "qualified" && quoteResult && (
        <StickyBookingCTA
          targetRef={bookingWidgetRef}
          selectedTime={selectedTimeDisplay || undefined}
          dayLabel={selectedDayLabel || undefined}
        />
      )}

    </div>
  );
};

export default MedicareSupplementAppointment;
