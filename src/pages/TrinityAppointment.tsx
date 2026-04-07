import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Users, FileCheck, CheckCircle, AlertCircle, Loader2, Phone, Lock, Star, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';

import { useQuoteWarmup } from '@/hooks/useQuoteWarmup';
import { useCalendarWarmup } from '@/hooks/useCalendarWarmup';


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
  { name: 'Joe McElwee', firstName: 'Joe', phone: '(561) 839-6057', telLink: 'tel:+15618396057', ghlUserId: '902v9xFN3c1GidD38xnk', states: [] },
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

async function getNextAgent(_stateName?: string): Promise<Agent> {
  return AGENTS[0];
}

// Contact form validation schema
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
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
  email?: string;
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
FN:Trinity Health & Wealth
ORG:Trinity Health & Wealth
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
        email: '' as string,
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
      email: '' as string,
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
        email: '' as string,
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
    const normalizedEmail = normalizeEmailForBing('' as string);
    
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
      email: await hashSHA256('' as string),
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
        email: '' as string,
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
      email: await hashSHA256('' as string),
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
        email: '' as string,
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
  const agentCardRef = useRef<HTMLDivElement>(null);
  
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

  // Scroll to agent card helper
  const scrollToAgentCard = useCallback(() => {
    agentCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      // Scroll to results header
      setTimeout(() => {
        resultsHeaderRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
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
    document.title = "Medicare Supplement Appointment | Trinity Health & Wealth";
    
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
      document.title = "Medicare Self-Enrollment Online | Trinity Health & Wealth";
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
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
      email: formData.email.trim(),
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
        email: '' as string,
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

      {/* Hero Section — only visible on landing */}
      {step === "landing" && (
      <section className="bg-gradient-to-b from-slate-50 to-blue-50 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Trusted by 10,000+ Seniors Since 2021</span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-slate-800">
            Your Medicare Supplement Rate Went Up. We Find You a Lower One for the Same Coverage.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Plan G, F, and N rates go up every year. But some carriers charge way less than others for the exact same coverage. We'll find you the lowest one — free, 2 minutes.
          </p>

          <Button
            onClick={scrollToFunnel}
            size="lg"
            className="bg-teal-600 hover:bg-teal-700 text-white text-lg md:text-xl py-6 px-6 md:py-8 md:px-12 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
          >
            Check My Rate — Free, 2 Minutes
          </Button>

          {/* Real Results Cards — proof below CTA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto mt-8">
            {[
              { name: "Eddie", state: "TX", saved: "$252", carrier: "Mutual of Omaha" },
              { name: "Alice", state: "OH", saved: "$235", carrier: "Mutual of Omaha" },
              { name: "Vera", state: "TX", saved: "$150", carrier: "Cigna" },
            ].map((result, i) => (
              <div key={i} className="bg-white rounded-xl border shadow-sm p-5 text-center">
                <p className="font-bold text-slate-800 text-lg">{result.name}, {result.state}</p>
                <p className="text-3xl font-bold text-teal-600 my-2">Saved {result.saved}/mo</p>
                <p className="text-sm text-slate-400">Switched from {result.carrier}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center mt-4 italic">
            Savings based on actual client rate comparisons. Individual results vary by state, age, and carrier.
          </p>

          {/* Trust Bar */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-8 text-slate-600">
            <span className="text-sm">✅ US Licensed Agents</span>
            <span className="text-sm">✅ 195 Switches This Quarter</span>
            <span className="text-sm">✅ 100% Free</span>
            <span className="text-sm">✅ No Obligation</span>
          </div>
        </div>
      </section>
      )}

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
                  <span className="text-sm font-medium text-green-600">Almost done! Last step</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2 [&>div]:bg-green-500" />
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
                      Call (561) 839-6057 for immediate assistance
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="john@email.com"
                    className={`h-12 rounded-xl ${validationErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
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
                  disabled={isSubmitting || isValidating || !formData.firstName || !formData.lastName || !formData.email || !formData.phone}
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

                {/* TCPA consent - always visible below button */}
                <p 
                  className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed"
                  data-tf-element-role="consent-language"
                >
                  By clicking "<span data-tf-element-role="submit-text">See My New Rate</span>," I expressly consent to receive marketing calls, text messages, and emails from <span data-tf-element-role="consent-advertiser-name">Trinity Health & Wealth Insurance Agency</span> and its licensed insurance agents regarding Medicare and related insurance products, including through the use of an automatic telephone dialing system, artificial or prerecorded voice messages, and AI technologies. Message and data rates may apply. Message frequency varies. Consent is not a condition of purchase. You may opt out at any time by replying STOP to text messages. By submitting this form, you agree to the{' '}
                  <a href="https://trinityhealthandwealth.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Terms and Conditions</a>
                  {' '}and{' '}
                  <a href="https://trinityhealthandwealth.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Privacy Policy</a>.
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
              {/* Thank You + Agent Info Card */}
              <div ref={resultsHeaderRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      Thank You, {formData.firstName}!
                    </h1>
                  </div>

                  <div className="space-y-4 text-base text-foreground leading-relaxed">
                    <p>
                      <span className="font-semibold">{assignedAgent.name}</span> is looking into your Medicare Supplement rates right now.
                    </p>
                    <p>
                      We compare plans from top-rated carriers to make sure you're not paying more than you need to.{' '}
                      <span className="font-semibold">{assignedAgent.firstName}</span> will text you shortly from{' '}
                      <a 
                        href={assignedAgent.telLink} 
                        className="font-semibold text-primary hover:underline"
                        onClick={() => trackEvent({ eventType: 'agent_phone_clicked', metadata: { agent: assignedAgent.firstName } })}
                      >
                        {assignedAgent.phone}
                      </a>{' '}
                      with what they find.
                    </p>
                  </div>

                  {/* What to expect */}
                  <div className="mt-6 bg-muted/50 rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-3">What to expect:</h2>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>A text from <span className="font-semibold">{assignedAgent.firstName}</span> with your personalized savings</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>No pressure, no obligation — just the numbers</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>If it makes sense, <span className="font-semibold">{assignedAgent.firstName}</span> can walk you through everything in a quick phone call</span>
                      </li>
                    </ul>
                  </div>

                  <p className="mt-6 text-center text-base font-semibold text-foreground">
                    Most of our members save $100–$200/month with the same exact coverage.
                  </p>

                  {/* Save Contact CTA */}
                  <div ref={agentCardRef} className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground font-medium">
                      📱 Save {assignedAgent.firstName}'s number so you recognize the text!
                    </p>
                    <button
                      onClick={() => {
                        const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${assignedAgent.firstName} (Trinity Health & Wealth)\nORG:Trinity Health & Wealth\nTEL;TYPE=CELL:${assignedAgent.phone.replace(/[^+\d]/g, '')}\nNOTE:Your Medicare Supplement Specialist\nEND:VCARD`;
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
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground text-center">What Our Members Are Saying</h3>
                {[
                  { quote: "I was paying $220/mo and they got me the exact same Plan G for $134. Easiest switch I've ever made.", name: "Patricia M.", state: "FL", savings: "$86/mo" },
                  { quote: "My agent called me within 5 minutes. No pressure, just showed me my options. Saved $89/month.", name: "Robert K.", state: "TX", savings: "$89/mo" },
                  { quote: "I didn't think I could save anything — turns out I was overpaying by $156/month for the same coverage.", name: "Mary S.", state: "OH", savings: "$156/mo" },
                  { quote: "The whole process took 10 minutes. Same Plan G, same benefits, just $112 less per month.", name: "James W.", state: "AZ", savings: "$112/mo" },
                  { quote: "I was skeptical but my agent was so patient. Ended up saving over $1,100 a year.", name: "Linda P.", state: "PA", savings: "$92/mo" },
                  { quote: "They found me a rate $94/month cheaper. I wish I'd done this sooner.", name: "William T.", state: "CA", savings: "$94/mo" },
                  { quote: "My neighbor told me about this. Saved $137/month — I tell everyone now.", name: "Barbara R.", state: "MI", savings: "$137/mo" },
                  { quote: "I've been overpaying for 3 years. In 5 minutes they showed me I could save $168/month.", name: "Richard H.", state: "GA", savings: "$168/mo" },
                ].map((testimonial, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm text-foreground italic mb-2">"{testimonial.quote}"</p>
                    <p className="text-xs text-muted-foreground font-medium">— {testimonial.name}, {testimonial.state} · Saved {testimonial.savings}</p>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center">
                This is a free rate comparison service. Quoted rates are estimates and subject to underwriting approval.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section — only on landing and results */}
      {(step === "landing" || step === "qualified") && (
      <section className="py-10 md:py-14 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8">Real Numbers From Real Clients</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              { value: "195", label: "Approved Switches" },
              { value: "$109", label: "Avg Monthly Savings" },
              { value: "$1,308", label: "Avg Annual Savings" },
              { value: "$25–$252", label: "Monthly Savings Range" },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                <p className="text-2xl md:text-3xl font-bold text-teal-600">{stat.value}</p>
                <p className="text-xs md:text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-base font-semibold text-slate-700 mb-3">Top Carriers Switched From</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Mutual of Omaha (52)",
              "Aetna (53)",
              "Cigna (28)",
              "AARP/UHC (34)",
              "Humana (9)",
            ].map((carrier, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1 rounded-full bg-white border text-xs text-slate-600 shadow-sm">
                {carrier}
              </span>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Spacer to push footer off-screen during form steps */}
      {step !== "landing" && step !== "qualified" && (
        <div className="h-[60vh] md:h-96 bg-gray-50" />
      )}

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-4">
            <p>
              This is a free rate comparison service. We do not charge fees. By calling, you consent to speak with a licensed insurance agent about Medicare Supplement insurance.
            </p>
            <p>
              Trinity Health & Wealth is not connected with or endorsed by the U.S. government or the federal Medicare program. Medicare Supplement insurance is sold by private insurance companies.
            </p>
            <p>
              Quoted rates are estimates based on the information provided. Actual rates may vary based on underwriting approval and other factors.
            </p>
            <p>
              Savings data reflects actual Trinity Health & Wealth client results from Jan–Mar 2026. Past results do not guarantee future savings.
            </p>
            <div className="pt-4 border-t flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <a href="https://trinityhealthandwealth.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>
                <span>•</span>
                <a href="https://trinityhealthandwealth.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms of Service</a>
              </div>
              <p>© {new Date().getFullYear()} Trinity Health & Wealth. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Social Proof Popup - show after health questions (step 5+) */}
      {['gender', 'tobacco', 'spouse', 'age', 'zip', 'contact', 'loading', 'qualified'].includes(step) && (
        <SocialProofPopup delayMs={5000} visibleMs={4000} />
      )}


    </div>
  );
};

export default MedicareSupplementAppointment;
