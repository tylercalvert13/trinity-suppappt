import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Users, FileCheck, CheckCircle, AlertCircle, Loader2, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { getVariant } from '@/lib/abTest';
import { useCalendarWarmup } from '@/hooks/useCalendarWarmup';
import { useQuoteWarmup } from '@/hooks/useQuoteWarmup';
import { z } from 'zod';
import { AppointmentBookingWidget } from '@/components/AppointmentBookingWidget';
import { getStateFromZip } from '@/lib/zipToState';
import { toast } from 'sonner';
import { ExitIntentModal } from '@/components/ExitIntentModal';
import { SocialProofPopup } from '@/components/SocialProofPopup';
import { StickyBookingCTA } from '@/components/StickyBookingCTA';
import { QuoteLoadingProgress } from '@/components/QuoteLoadingProgress';
import { initAdvancedMatching, trackPixelEvent } from '@/lib/facebookPixel';

// TypeScript declarations for tracking pixels
declare global {
  interface Window {
    uetq?: any[];
    gtag?: (...args: any[]) => void;
    vbpx?: (...args: any[]) => void;
  }
}

// Question steps that should trigger auto-scroll
const QUESTION_STEPS = ['plan', 'payment', 'care', 'treatment', 'medications', 'gender', 'tobacco', 'spouse', 'age', 'zip', 'contact'];

// Outbound call number for this funnel
const PHONE_NUMBER = "(201) 426-9898";
const PHONE_TEL = "tel:+12014269898";

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
  | "treatment" 
  | "medications"
  | "gender"
  | "tobacco"
  | "spouse"
  | "age"
  | "zip"
  | "contact"
  | "loading"
  | "qualified";

type DisqualReason = "care" | "treatment" | "medications";

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
    trackPixelEvent('Schedule', eventId, conversionValue);
    
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

const MedicareSupplementAppointment = () => {
  const navigate = useNavigate();
  const [variant] = useState(() => getVariant('suppappt_hero_v1'));
  const [step, setStep] = useState<FunnelStep>("landing");
  const [disqualReason, setDisqualReason] = useState<DisqualReason | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationNumber] = useState(() => generateApplicationNumber());
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const bookingWidgetRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const resultsHeaderRef = useRef<HTMLDivElement>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [autoScrollDone, setAutoScrollDone] = useState(false);
  const [toastShown, setToastShown] = useState(false);
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

  const { visitorId, sessionId, trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('suppappt', variant);
  
  // Warmup the calendar edge function early to prevent cold starts
  useCalendarWarmup();
  
  // Warmup the quote API to pre-cache CSG token
  useQuoteWarmup();

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
    }
  }, [step]);

  // Auto-scroll to booking widget 5 seconds after qualification
  useEffect(() => {
    if (step === "qualified" && quoteResult && !autoScrollDone) {
      const timer = setTimeout(() => {
        bookingWidgetRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        setAutoScrollDone(true);
        // Track auto-scroll trigger
        trackEvent({ 
          eventType: 'conversion_trigger', 
          metadata: { trigger: 'auto_scroll' }
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, quoteResult, autoScrollDone, trackEvent]);

  // Urgency toast 10 seconds after qualification
  useEffect(() => {
    if (step === "qualified" && quoteResult && !toastShown) {
      const timer = setTimeout(() => {
        toast("⏰ Your rate is reserved — pick a time to lock it in", {
          duration: 5000,
        });
        setToastShown(true);
        // Track urgency toast trigger
        trackEvent({ 
          eventType: 'conversion_trigger', 
          metadata: { trigger: 'urgency_toast' }
        });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [step, quoteResult, toastShown, trackEvent]);

  // Callback to scroll to booking widget (for exit intent modal)
  const scrollToBookingWidget = useCallback(() => {
    bookingWidgetRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  }, []);

  // Handle slot change from booking widget
  const handleSlotChange = useCallback((dayLabel: string | null, timeDisplay: string | null) => {
    setSelectedDayLabel(dayLabel);
    setSelectedTimeDisplay(timeDisplay);
  }, []);

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
    const steps: FunnelStep[] = ["plan", "payment", "care", "treatment", "medications", "gender", "tobacco", "spouse", "age", "zip", "contact"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const getStepNumber = (): number => {
    const steps: FunnelStep[] = ["plan", "payment", "care", "treatment", "medications", "gender", "tobacco", "spouse", "age", "zip", "contact"];
    return steps.indexOf(step) + 1;
  };

  const handlePlanSelect = (plan: string) => {
    setFormData(prev => ({ ...prev, plan }));
    setStep("payment");
    trackStepChange("payment", plan);
  };

  const handlePaymentSubmit = () => {
    if (!formData.currentPayment || parseFloat(formData.currentPayment) <= 0) return;
    setStep("care");
    trackStepChange("care", formData.currentPayment);
  };

  const handleCareAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, careOrCondition: answer }));
    if (answer === "yes") {
      setDisqualReason("care");
      trackQualification("disqualified", "care_or_condition");
      saveSubmission("disqualified", "care_or_condition");
      navigate("/disqualified?reason=care");
      return;
    }
    setStep("treatment");
    trackStepChange("treatment", answer);
  };

  const handleTreatmentAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, recentTreatment: answer }));
    if (answer === "yes") {
      setDisqualReason("treatment");
      trackQualification("disqualified", "recent_treatment");
      saveSubmission("disqualified", "recent_treatment");
      navigate("/disqualified?reason=treatment");
      return;
    }
    setStep("medications");
    trackStepChange("medications", answer);
  };

  const handleMedicationsAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, medicationUse: answer }));
    if (answer === "yes") {
      setDisqualReason("medications");
      trackQualification("disqualified", "medication_use");
      saveSubmission("disqualified", "medication_use");
      navigate("/disqualified?reason=medications");
      return;
    }
    setStep("gender");
    trackStepChange("gender", answer);
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setStep("tobacco");
    trackStepChange("tobacco", gender);
  };

  const handleTobaccoAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, tobacco: answer }));
    setStep("spouse");
    trackStepChange("spouse", answer);
  };

  const handleSpouseAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, spouse: answer }));
    setStep("age");
    trackStepChange("age", answer);
  };

  const handleAgeSubmit = () => {
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 65 || age > 120) return;
    setStep("zip");
    trackStepChange("zip", formData.age);
  };

  const handleZipSubmit = () => {
    if (!/^\d{5}$/.test(formData.zipCode)) return;
    setStep("contact");
    trackStepChange("contact", formData.zipCode);
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

    // Step 2: Server-side API validation
    setIsValidating(true);
    
    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-contact', {
        body: {
          email: formData.email.trim(),
          phone: formData.phone.replace(/\D/g, ''),
        }
      });

      if (validationError) {
        console.error("Validation API error:", validationError);
        // Continue anyway - fail open
      } else if (validationData && !validationData.valid) {
        // Check which field failed
        const errors: ValidationErrors = {};
        if (!validationData.email?.valid) {
          if (validationData.email?.disposable) {
            errors.email = "Please use a permanent email address (no temporary emails)";
          } else {
            errors.email = "We couldn't verify this email. Please check it and try again.";
          }
        }
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
      
      // Get user's timezone from browser (IANA format for GHL)
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Capture TrustedForm certificate URL with robust detection + polling
      const getTrustedFormCertUrl = async (): Promise<string | null> => {
        // Selectors TrustedForm commonly uses
        const selectors = [
          '#xxTrustedFormCertUrl_0',
          '#xxTrustedFormCertUrl',
          'input[name="xxTrustedFormCertUrl"]',
        ];
        
        // Poll up to 2 seconds (20 * 100ms) for the value to be populated
        for (let attempt = 0; attempt < 20; attempt++) {
          for (const selector of selectors) {
            const el = document.querySelector(selector) as HTMLInputElement | null;
            if (el?.value && el.value.startsWith('https://cert.trustedform.com/')) {
              console.log('[TrustedForm] Certificate captured:', el.value);
              return el.value;
            }
          }
          // Wait 100ms before next attempt
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Log diagnostics if we failed to get a cert
        console.warn('[TrustedForm] Certificate URL not found after polling. Diagnostics:', {
          scriptLoaded: !!document.getElementById('trustedform-script'),
          hiddenInputsFound: selectors.map(s => ({
            selector: s,
            exists: !!document.querySelector(s),
            value: (document.querySelector(s) as HTMLInputElement | null)?.value || null,
          })),
        });
        return null;
      };
      
      const trustedFormCertUrl = await getTrustedFormCertUrl();
      
      // Send lead to GHL webhook (suppappt-specific)
      await supabase.functions.invoke('send-lead-webhook-suppappt', {
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
        }
      });

      // Track qualification and conversions
      trackQualification("qualified");
      await trackFacebookSubmissionEvent(formData, data);
      trackBingSubmissionEvent(formData);
      trackGoogleAdsConversion();
      trackVibeCoLeadEvent();
      
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
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Breaking News Badge */}
          <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
            <span className="mr-2">🚨</span>
            EXPOSED: Medicare Supplement "Rate Trap"
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Seniors on Plan G, F, or N Are Overpaying by $100-200/Month
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 mb-4 max-w-2xl mx-auto">
            Your benefits are <span className="font-bold text-white">federally standardized</span> — the only difference is the price.
          </p>
          
          <p className="text-base text-blue-200 mb-4 max-w-xl mx-auto">
            See your personalized rate in under 2 minutes. No obligation. No pressure.
          </p>

          {variant === 'B' && (
            <p className="text-base text-blue-100 mb-8 max-w-xl mx-auto font-medium">
              Answer a few quick questions about your current plan and we'll pull your personalized rate — it takes less than 2 minutes.
            </p>
          )}

          {variant === 'A' && <div className="mb-8" />}

          {step === "landing" && (
            <>
              <Button
                onClick={scrollToFunnel}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white text-xl py-8 px-12 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {variant === 'B' ? 'See How Much You\'ll Save' : 'Check If You Qualify'}
              </Button>
              <div className="mt-6 text-sm text-blue-200">
                <span>By continuing, you agree to our </span>
                <Link to="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link>
                <span> and </span>
                <Link to="/terms-of-service" className="underline hover:text-white">Terms of Service</Link>
              </div>
            </>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-blue-100">
              <Shield className="h-5 w-5" />
              <span className="text-sm">US Based Licensed Agents</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Users className="h-5 w-5" />
              <span className="text-sm">10,000+ Seniors Helped</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
              </div>
            </div>
          )}

          {/* Care/Condition Question */}
          {step === "care" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Quick Health Check
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                Do any of these apply to you?
              </p>
              
              <ul className="text-foreground mb-8 space-y-3">
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Nursing home or assisted living</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Need daily help with personal care</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Hospice or home health care</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Dementia or Alzheimer's</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Use oxygen at home</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Wheelchair-bound or bedridden</span>
                </li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleCareAnswer("yes")}
                  className="flex items-center space-x-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="care-yes" className="h-7 w-7 md:h-8 md:w-8" />
                  <Label htmlFor="care-yes" className="text-xl md:text-2xl cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleCareAnswer("no")}
                  className="flex items-center space-x-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="care-no" className="h-7 w-7 md:h-8 md:w-8" />
                  <Label htmlFor="care-no" className="text-xl md:text-2xl cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Recent Treatment Question */}
          {step === "treatment" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Recent Medical History
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                In the last 2 years, have you had:
              </p>
              
              <ul className="text-foreground mb-8 space-y-3">
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Cancer, heart attack, or stroke</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Congestive heart failure (CHF) or COPD</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Heart procedure: bypass, stent, or pacemaker</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Kidney dialysis or organ transplant</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>ALS, Parkinson's, or MS</span>
                </li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleTreatmentAnswer("yes")}
                  className="flex items-center space-x-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="treatment-yes" className="h-7 w-7 md:h-8 md:w-8" />
                  <Label htmlFor="treatment-yes" className="text-xl md:text-2xl cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleTreatmentAnswer("no")}
                  className="flex items-center space-x-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="treatment-no" className="h-7 w-7 md:h-8 md:w-8" />
                  <Label htmlFor="treatment-no" className="text-xl md:text-2xl cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Medications Question */}
          {step === "medications" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Current Medications
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground mb-6">
                Do any of these apply to you?
              </p>
              
              <ul className="text-foreground mb-8 space-y-3">
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Use insulin</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Take 3+ diabetes medications</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Daily prescription pain medicine (opioids)</span>
                </li>
                <li className="flex items-start gap-3 text-lg md:text-xl">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>Biologic injections or infusions (e.g., Humira, Enbrel)</span>
                </li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleMedicationsAnswer("yes")}
                  className="flex items-center space-x-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="meds-yes" className="h-7 w-7 md:h-8 md:w-8" />
                  <Label htmlFor="meds-yes" className="text-xl md:text-2xl cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleMedicationsAnswer("no")}
                  className="flex items-center space-x-4 p-5 md:p-6 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="meds-no" className="h-7 w-7 md:h-8 md:w-8" />
                  <Label htmlFor="meds-no" className="text-xl md:text-2xl cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Gender Question */}
          {step === "gender" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 11</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
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
                    <a href={PHONE_TEL} className="text-red-600 hover:underline font-medium">
                      Call {PHONE_NUMBER} for immediate assistance
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    placeholder="john@example.com"
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
                
                {/* Consent language with TrustedForm tagging */}
                <p 
                  className="text-xs text-muted-foreground text-center mt-4 leading-relaxed"
                  data-tf-element-role="consent-language"
                >
                  By clicking "<span data-tf-element-role="submit-text">See My New Rate</span>," I consent to receive calls, text messages, and emails 
                  from <span data-tf-element-role="consent-advertiser-name">Health Helpers</span> regarding my Medicare inquiry. I understand these 
                  communications may be made using automated telephone dialing systems, artificial intelligence, 
                  and/or prerecorded messages. Message frequency varies. Message and data rates may apply. 
                  I can opt out at any time by texting STOP or calling directly. This consent is not required 
                  to receive a quote. I agree to the{' '}
                  <Link to="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>

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
              </form>
            </div>
          </div>

          {/* Loading Screen - Animated Progress Indicator */}
          {step === "loading" && (
            <div ref={loadingRef}>
              <QuoteLoadingProgress planType={formData.plan} />
            </div>
          )}

          {/* Qualified/Results Screen - Appointment Booking Widget */}
          {step === "qualified" && quoteResult && (
            <div className="space-y-6">
              {/* Success Header */}
              <div ref={resultsHeaderRef} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Great News, {formData.firstName}!
                </h1>
                <p className="text-lg md:text-xl text-foreground mb-1">
                  You Qualify for {formData.plan} at
                </p>
                <p className="text-3xl md:text-4xl font-bold text-green-600">
                  ${quoteResult.rate.toFixed(2)}/month
                </p>
              </div>

              {/* Book Now CTA Button */}
              <Button
                onClick={() => {
                  scrollToBookingWidget();
                  trackEvent({ eventType: 'conversion_trigger', metadata: { trigger: 'header_book_now_clicked' } });
                }}
                className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-xl"
              >
                Book My Free Call Now
              </Button>

              {/* Lock In Rate CTA - Clickable */}
              <button
                onClick={() => {
                  scrollToBookingWidget();
                  trackEvent({ eventType: 'conversion_trigger', metadata: { trigger: 'amber_cta_clicked' } });
                }}
                className="w-full bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-amber-800 mb-3">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Rate Reserved — 15 Minutes</span>
                </div>
                <div className="mb-3">
                  <p className="text-2xl font-bold text-amber-700">
                    ${quoteResult.monthlySavings.toFixed(2)}/month
                  </p>
                  <p className="text-sm text-muted-foreground">in savings</p>
                </div>
                <p className="text-base text-foreground">
                  Tap to book your call →
                </p>
                <div className="mt-3 flex justify-center">
                  <ChevronDown className="h-6 w-6 text-amber-600 animate-bounce" />
                </div>
              </button>

              {/* Appointment Booking Widget */}
              <AppointmentBookingWidget
                firstName={formData.firstName}
                lastName={formData.lastName}
                phone={formData.phone}
                email={formData.email}
                quotedPremium={quoteResult.rate}
                monthlySavings={quoteResult.monthlySavings}
                planType={formData.plan}
                userTimezone={Intl.DateTimeFormat().resolvedOptions().timeZone}
                userState={getStateFromZip(formData.zipCode)}
                onTrackEvent={(params) => {
                  trackEvent(params);
                  if (params.eventType === 'booking_completed') {
                    trackFacebookAppointmentEvent(formData, quoteResult);
                  }
                }}
                autoSelectFirst={false}
                onSlotChange={handleSlotChange}
                widgetRef={bookingWidgetRef}
              />

              {/* Trust Elements */}
              <div className="bg-white rounded-xl p-4 border">
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

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center">
                This is a free rate comparison service. Quoted rates are estimates and subject to underwriting approval.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Spacer - reduced to push widget higher */}
      <div className="h-16"></div>

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

      {/* Exit Intent Modal - only show when qualified */}
      {step === "qualified" && quoteResult && (
        <ExitIntentModal
          monthlySavings={quoteResult.monthlySavings}
          onBookClick={scrollToBookingWidget}
        />
      )}

      {/* Social Proof Popup - only show when qualified */}
      {step === "qualified" && quoteResult && (
        <SocialProofPopup delayMs={8000} visibleMs={4000} />
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
