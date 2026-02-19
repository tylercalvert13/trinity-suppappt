import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Loader2, FileText, Phone, ArrowRight, Shield, Star, Clock, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { useCalendarWarmup } from '@/hooks/useCalendarWarmup';
import { useQuoteWarmup } from '@/hooks/useQuoteWarmup';

import { AppointmentBookingWidgetWithOptIn } from '@/components/AppointmentBookingWidgetWithOptIn';
import { initAdvancedMatching, trackPixelEvent } from '@/lib/facebookPixel';

// TypeScript declarations for tracking pixels
declare global {
  interface Window {
    ttq?: { identify: (data: any) => void; track: (event: string, params?: any) => void; };
  }
}

const PHONE_NUMBER = "(201) 426-9898";
const PHONE_TEL = "tel:+12014269898";

// Steps for progress tracking
const QUESTION_STEPS = ['plan', 'payment', 'health', 'gender', 'tobacco', 'spouse', 'age', 'zip', 'firstName', 'phone'];

type FunnelStep = 
  | "landing" | "plan" | "payment" | "health" 
  | "gender" | "tobacco" | "spouse" | "age" | "zip" 
  | "firstName" | "phone" | "loading" | "qualified";

interface FormData {
  plan: string;
  currentPayment: string;
  healthScreen: string;
  gender: string;
  tobacco: string;
  spouse: string;
  age: string;
  zipCode: string;
  firstName: string;
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

// Format phone number
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Facebook helpers
const getFacebookCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return { fbc: cookies._fbc, fbp: cookies._fbp };
};

const getVisitorIdForTracking = (): string => {
  const storageKey = 'funnel_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }
  return visitorId;
};

const generateEventId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Track submission via Facebook CAPI + Pixel
const trackFacebookSubmissionEvent = async (formData: FormData, quoteResult: QuoteResult | null) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    const conversionValue = quoteResult?.monthlySavings || quoteResult?.rate || 0;
    
    initAdvancedMatching({
      firstName: formData.firstName,
      phone: formData.phone,
    });
    
    trackPixelEvent('Lead', eventId, conversionValue);
    
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'submission',
        event_source_url: window.location.href,
        external_id: getVisitorIdForTracking(),
        fbc, fbp,
        event_id: eventId,
        first_name: formData.firstName,
        phone: formData.phone,
        zip_code: formData.zipCode,
        value: conversionValue,
        currency: 'USD',
      }
    });
  } catch (error) {
    console.error('Error tracking Facebook submission event:', error);
  }
};

// Track appointment via Facebook CAPI + Pixel
const trackFacebookAppointmentEvent = async (formData: FormData, quoteResult: QuoteResult | null) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    const conversionValue = quoteResult?.monthlySavings || quoteResult?.rate || 0;
    
    trackPixelEvent('Appointment', eventId, conversionValue);
    
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'Appointment',
        event_source_url: window.location.href,
        external_id: getVisitorIdForTracking(),
        fbc, fbp,
        event_id: eventId,
        first_name: formData.firstName,
        phone: formData.phone,
        zip_code: formData.zipCode,
        value: conversionValue,
        currency: 'USD',
      }
    });
  } catch (error) {
    console.error('Error tracking Facebook Appointment event:', error);
  }
};
// Extracted outside component to prevent unmount/remount on re-renders
interface StepCardProps {
  children: React.ReactNode;
  stepNumber: number;
  totalSteps: number;
  progress: number;
}

const StepCard = ({ children, stepNumber, totalSteps, progress }: StepCardProps) => (
  <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 md:p-10 max-w-xl mx-auto">
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-stone-500 font-serif">Question {stepNumber} of {totalSteps}</span>
        <span className="text-sm text-stone-400">{progress}%</span>
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
    {children}
  </div>
);

const BinaryChoice = ({ onYes, onNo }: { onYes: () => void; onNo: () => void }) => (
  <RadioGroup className="space-y-3">
    <div onClick={onYes} className="flex items-center space-x-4 p-5 border border-stone-200 rounded-lg cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all">
      <RadioGroupItem value="yes" id="yes" className="h-6 w-6" />
      <Label htmlFor="yes" className="text-lg font-serif cursor-pointer flex-1">Yes</Label>
    </div>
    <div onClick={onNo} className="flex items-center space-x-4 p-5 border border-stone-200 rounded-lg cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all">
      <RadioGroupItem value="no" id="no" className="h-6 w-6" />
      <Label htmlFor="no" className="text-lg font-serif cursor-pointer flex-1">No</Label>
    </div>
  </RadioGroup>
);

const REPORT_TESTIMONIALS = [
  { name: 'Patricia', state: 'FL', savings: 127, stars: 5 },
  { name: 'Robert', state: 'TX', savings: 89, stars: 5 },
  { name: 'Mary', state: 'OH', savings: 156, stars: 5 },
  { name: 'James', state: 'AZ', savings: 112, stars: 5 },
  { name: 'Linda', state: 'PA', savings: 94, stars: 5 },
];

const REPORT_FACTS = [
  "Your plan benefits are identical no matter which company you choose — the only difference is price.",
  "The average senior saves $1,200/year by switching to a lower-cost carrier.",
  "Insurance companies can charge different rates for the exact same coverage.",
  "You can switch carriers anytime without losing any benefits.",
  "Most people who compare rates find a lower price within 60 seconds.",
];

const REPORT_LOADING_STEPS = [
  { label: 'Connecting to carriers...', duration: 1500 },
  { label: 'Scanning available rates...', duration: 2000 },
  { label: 'Comparing options...', duration: 2000 },
  { label: 'Calculating potential savings...', duration: 2000 },
  { label: 'Preparing your savings report...', duration: 3000 },
];

const ReportLoadingProgress = React.forwardRef<HTMLDivElement, { planType?: string; firstName?: string }>(
  ({ planType = "Plan G", firstName }, ref) => {
    const steps = REPORT_LOADING_STEPS.map((s, i) =>
      i === 2 ? { ...s, label: `Comparing ${planType} options...` } : s
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [isSlowLoading, setIsSlowLoading] = useState(false);
    const [testimonialIndex, setTestimonialIndex] = useState(0);
    const [factIndex, setFactIndex] = useState(0);

    useEffect(() => {
      const timers = steps.map((_, i) => {
        if (i === 0) return null;
        const delay = steps.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
        return setTimeout(() => setCurrentStep(i), delay);
      });
      const slowTimer = setTimeout(() => setIsSlowLoading(true), 15000);
      return () => { timers.forEach(t => t && clearTimeout(t)); clearTimeout(slowTimer); };
    }, []);

    useEffect(() => {
      const interval = setInterval(() => setTestimonialIndex(prev => (prev + 1) % REPORT_TESTIMONIALS.length), 3000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      const interval = setInterval(() => setFactIndex(prev => (prev + 1) % REPORT_FACTS.length), 4000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }, []);

    const progressValue = ((currentStep + 1) / steps.length) * 100;
    const testimonial = REPORT_TESTIMONIALS[testimonialIndex];

    return (
      <div ref={ref} className="scroll-mt-4">
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-800 mb-2 text-center">
            {firstName ? `Preparing your savings report, ${firstName}...` : 'Preparing your savings report...'}
          </h2>
          <p className="text-stone-500 text-center mb-6 font-serif">This usually takes 5–10 seconds</p>

          <div className="mb-8">
            <Progress value={progressValue} className="h-2 [&>div]:bg-stone-700" />
          </div>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                {i < currentStep ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : i === currentStep ? (
                  <Loader2 className="h-5 w-5 text-stone-600 animate-spin flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-stone-300 flex-shrink-0" />
                )}
                <span className={`text-sm md:text-base font-serif ${
                  i < currentStep ? 'text-green-700 font-medium' :
                  i === currentStep ? 'text-stone-800 font-medium' :
                  'text-stone-400'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
            <p className="text-sm text-stone-700 font-medium mb-1 font-serif">💡 Did you know?</p>
            <p className="text-sm text-stone-600 font-serif transition-opacity duration-500">{REPORT_FACTS[factIndex]}</p>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-1 mb-1">
              {Array.from({ length: testimonial.stars }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-stone-700 font-medium font-serif transition-opacity duration-500">
              "{testimonial.name} from {testimonial.state} saved ${testimonial.savings}/mo on the same coverage"
            </p>
          </div>

          {isSlowLoading && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm font-medium font-serif">Taking longer than usual... please wait a moment.</p>
              </div>
            </div>
          )}

          <p className="text-xs text-stone-400 text-center mt-8 font-serif">🔒 Your information is secure and never shared</p>
        </div>
      </div>
    );
  }
);
ReportLoadingProgress.displayName = 'ReportLoadingProgress';

const MedicareSupplementReport = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FunnelStep>("landing");
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const bookingWidgetRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const resultsHeaderRef = useRef<HTMLDivElement>(null);
  const [autoScrollDone, setAutoScrollDone] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    plan: '',
    currentPayment: '',
    healthScreen: '',
    gender: '',
    tobacco: '',
    spouse: '',
    age: '',
    zipCode: '',
    firstName: '',
    phone: '',
  });

  const { visitorId, sessionId, trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('report');
  
  useCalendarWarmup();
  useQuoteWarmup();

  // Auto-scroll
  useEffect(() => {
    if (QUESTION_STEPS.includes(step)) {
      setTimeout(() => {
        questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (step === "loading") {
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
    } else if (step === "qualified") {
      setTimeout(() => {
        resultsHeaderRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
    }
  }, [step]);

  // Auto-scroll to booking widget after qualification
  useEffect(() => {
    if (step === "qualified" && quoteResult && !autoScrollDone) {
      const timer = setTimeout(() => {
        bookingWidgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setAutoScrollDone(true);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [step, quoteResult, autoScrollDone]);

  // Load TrustedForm script
  useEffect(() => {
    if (document.getElementById('trustedform-script')) return;
    const tf = document.createElement('script');
    tf.type = 'text/javascript';
    tf.async = true;
    tf.id = 'trustedform-script';
    tf.src = 'https://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&ping_field=xxTrustedFormPingUrl&use_tagged_consent=true&l=' +
      new Date().getTime() + Math.random();
    const s = document.getElementsByTagName('script')[0];
    s.parentNode?.insertBefore(tf, s);
    return () => {
      const script = document.getElementById('trustedform-script');
      if (script) script.remove();
    };
  }, []);

  // SEO meta
  useEffect(() => {
    document.title = "Free Medigap Savings Report | Health Helpers";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get your free Medigap Savings Report. Find out if you\'re overpaying for the same coverage.');
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
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
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
    const steps: FunnelStep[] = ["plan", "payment", "health", "gender", "tobacco", "spouse", "age", "zip", "firstName", "phone"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const getStepNumber = (): number => {
    const steps: FunnelStep[] = ["plan", "payment", "health", "gender", "tobacco", "spouse", "age", "zip", "firstName", "phone"];
    return steps.indexOf(step) + 1;
  };

  const handlePlanSelect = (plan: string) => {
    setFormData(prev => ({ ...prev, plan }));
    setStep("payment");
    trackStepChange("payment", plan);
  };

  const handlePaymentSubmit = () => {
    if (!formData.currentPayment || parseFloat(formData.currentPayment) <= 0) return;
    setStep("health");
    trackStepChange("health", formData.currentPayment);
  };

  const handleHealthAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, healthScreen: answer }));
    if (answer === "yes") {
      trackQualification("disqualified", "health_screen");
      saveSubmission("disqualified", "health_screen");
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
    setStep("firstName");
    trackStepChange("firstName", formData.zipCode);
  };

  const handleFirstNameSubmit = () => {
    if (!formData.firstName.trim()) return;
    setStep("phone");
    trackStepChange("phone", formData.firstName);
  };

  const handlePhoneSubmit = async () => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) return;

    // Validate phone
    try {
      const { data: validationData } = await supabase.functions.invoke('validate-contact', {
        body: { email: 'placeholder@example.com', phone: phoneDigits }
      });
      if (validationData && !validationData.phone?.valid) {
        setError("This phone number doesn't appear to be valid. Please double-check it.");
        return;
      }
    } catch (err) {
      console.error("Validation error:", err);
    }

    setError(null);
    setStep("loading");
    setIsSubmitting(true);
    trackStepChange("loading");

    try {
      // Get quote with retry
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
          setTimeout(() => reject(new Error('Quote request timed out')), 30000)
        );

        try {
          const result = await Promise.race([quotePromise, timeoutPromise]);
          if (!isRetry && result.error) {
            const status = result.error?.context?.status || result.error?.status;
            if ([500, 502, 503, 504].includes(status)) {
              return fetchQuote(true);
            }
          }
          return result;
        } catch (err) {
          if (!isRetry) return fetchQuote(true);
          throw err;
        }
      };

      const { data, error: quoteError } = await fetchQuote();

      if (quoteError) {
        setError("We're having trouble retrieving rates right now. Please try again.");
        setStep("phone");
        return;
      }

      if (data?.cannotBeatRate) {
        await saveSubmission("knockout");
        navigate("/great-rate");
        return;
      }

      if (data?.error) {
        setError(data.error);
        setStep("phone");
        return;
      }

      setQuoteResult(data);
      await saveSubmission("success", undefined, data);
      
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // TrustedForm cert
      const getTrustedFormCertUrl = async (): Promise<string | null> => {
        const selectors = ['#xxTrustedFormCertUrl_0', '#xxTrustedFormCertUrl', 'input[name="xxTrustedFormCertUrl"]'];
        for (let attempt = 0; attempt < 20; attempt++) {
          for (const selector of selectors) {
            const el = document.querySelector(selector) as HTMLInputElement | null;
            if (el?.value && el.value.startsWith('https://cert.trustedform.com/')) {
              return el.value;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
      };
      
      const trustedFormCertUrl = await getTrustedFormCertUrl();
      
      // Send lead webhook
      await supabase.functions.invoke('send-lead-webhook-report', {
        body: {
          firstName: formData.firstName,
          phone: phoneDigits,
          age: parseInt(formData.age),
          zipCode: formData.zipCode,
          gender: formData.gender,
          tobacco: formData.tobacco,
          spouse: formData.spouse,
          plan: formData.plan,
          currentPayment: parseFloat(formData.currentPayment),
          quotedRate: data.rate,
          quotedCarrier: data.carrier,
          amBestRating: data.amBestRating,
          savingsPercent: data.savingsPercent,
          visitorId, sessionId,
          timezone: userTimezone,
          trustedFormCertUrl,
        }
      });

      trackQualification("qualified");
      await trackFacebookSubmissionEvent(formData, data);
      setStep("qualified");

    } catch (err) {
      console.error("Error getting quote:", err);
      setError("An error occurred. Please try again.");
      setStep("phone");
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
        plan: formData.plan || null,
        current_payment: formData.currentPayment ? parseFloat(formData.currentPayment) : null,
        care_or_condition: formData.healthScreen || null,
        gender: formData.gender || null,
        tobacco: formData.tobacco || null,
        spouse: formData.spouse || null,
        age: formData.age ? parseInt(formData.age) : null,
        zip_code: formData.zipCode || null,
        first_name: formData.firstName || null,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        submission_type: submissionType,
        disqualification_reason: disqualificationReason || null,
        quoted_rate: quoteData?.rate || null,
        quoted_carrier: quoteData?.carrier || null,
        am_best_rating: quoteData?.amBestRating || null,
        monthly_savings: quoteData?.monthlySavings || null,
        annual_savings: quoteData?.annualSavings || null,
        page: 'report',
      }] as any);
    } catch (error) {
      console.error('Error saving submission:', error);
    }
  };

  const handleBookingCompleted = useCallback((contactData: { firstName: string; lastName: string; email: string; phone: string }) => {
    trackFacebookAppointmentEvent(formData, quoteResult);
    trackEvent({ eventType: 'booking_completed_report' });
  }, [formData, quoteResult, trackEvent]);

  // StepCard and BinaryChoice are defined outside the component (above) to prevent
  // unmount/remount on every keystroke.

  return (
    <div className="min-h-screen bg-stone-50">
      {/* TrustedForm hidden fields */}
      <noscript>
        <img src="https://api.trustedform.com/ns.gif" height="1" width="1" style={{ display: 'none' }} alt="" />
      </noscript>
      {/* Persistent hidden input for TrustedForm */}
      <form style={{ position: 'absolute', left: '-9999px' }}>
        <input type="hidden" id="xxTrustedFormCertUrl_0" name="xxTrustedFormCertUrl" />
      </form>

      {/* Hero Section — Agora editorial style */}
      <section className="bg-stone-900 text-stone-100 py-12 md:py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-sm tracking-widest uppercase text-stone-400 mb-6 font-sans">
            Free Medigap Savings Report · No Obligation
          </p>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-6 text-white">
            Is Your Medicare Supplement Company Overcharging You?
          </h1>
          
          <p className="text-lg md:text-xl text-stone-300 mb-4 font-serif leading-relaxed max-w-lg mx-auto">
            Your benefits are <em>federally standardized</em> — the only difference between carriers is the price you pay each month.
          </p>
          
          <p className="text-base text-stone-400 mb-8 max-w-md mx-auto">
            Request your free, personalized Medigap Savings Report and find out if you could be paying less for the exact same coverage.
          </p>

          {step === "landing" && (
            <>
              <Button
                onClick={scrollToFunnel}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white text-lg md:text-xl py-7 px-10 h-auto rounded-lg shadow-lg transition-all font-serif"
              >
                Get My Free Savings Report
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="mt-6 text-xs text-stone-500">
                By continuing, you agree to our{' '}
                <Link to="/privacy-policy" className="underline hover:text-stone-300">Privacy Policy</Link>
                {' '}and{' '}
                <Link to="/terms-of-service" className="underline hover:text-stone-300">Terms of Service</Link>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-center gap-6 mt-10 text-stone-400 text-sm">
            <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Licensed Agents</span>
            <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> 100% Free</span>
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> No Obligation</span>
          </div>
        </div>
      </section>

      {/* Funnel Section */}
      <section ref={funnelRef} className="py-8 md:py-12">
        <div ref={questionContainerRef} className="max-w-xl mx-auto px-4 scroll-mt-4">
          
          {/* Plan Selection */}
          {step === "plan" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                Which plan do you currently have?
              </h2>
              <p className="text-stone-500 mb-6">Select your Medicare Supplement plan below.</p>
              <RadioGroup className="space-y-3">
                {["Plan G", "Plan N", "Plan F"].map((plan) => (
                  <div
                    key={plan}
                    onClick={() => handlePlanSelect(plan)}
                    className="flex items-center space-x-4 p-5 border border-stone-200 rounded-lg cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all"
                  >
                    <RadioGroupItem value={plan} id={`plan-${plan}`} className="h-6 w-6" />
                    <Label htmlFor={`plan-${plan}`} className="text-lg font-serif cursor-pointer flex-1">{plan}</Label>
                  </div>
                ))}
              </RadioGroup>
            </StepCard>
          )}

          {/* Payment */}
          {step === "payment" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                How much do you pay each month?
              </h2>
              <p className="text-stone-500 mb-6">Enter your current monthly premium.</p>
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-stone-400">$</span>
                  <Input
                    type="number"
                    value={formData.currentPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPayment: e.target.value }))}
                    placeholder="0.00"
                    className="pl-10 text-2xl h-16 rounded-lg border-stone-200 focus-visible:ring-stone-400"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handlePaymentSubmit}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white text-lg py-6 h-auto rounded-lg font-serif"
                  disabled={!formData.currentPayment || parseFloat(formData.currentPayment) <= 0}
                >
                  Continue
                </Button>
              </div>
            </StepCard>
          )}

          {/* Health Screen (single combined question) */}
          {step === "health" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-3">
                Quick Health Check
              </h2>
              <p className="text-stone-500 mb-6">Do any of the following apply to you?</p>
              
              <ul className="text-stone-700 mb-8 space-y-3 font-serif">
                <li className="flex items-start gap-3 text-base">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Use oxygen or a wheelchair</span>
                </li>
                <li className="flex items-start gap-3 text-base">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Need daily care assistance</span>
                </li>
                <li className="flex items-start gap-3 text-base">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Have dementia or Parkinson's</span>
                </li>
                <li className="flex items-start gap-3 text-base">
                  <span className="text-stone-400 mt-0.5">•</span>
                  <span>Had cancer, heart attack, or stroke in the past 2 years</span>
                </li>
              </ul>

              <BinaryChoice
                onYes={() => handleHealthAnswer("yes")}
                onNo={() => handleHealthAnswer("no")}
              />
            </StepCard>
          )}

          {/* Gender */}
          {step === "gender" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                What is your gender?
              </h2>
              <RadioGroup className="space-y-3">
                {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }].map(({ value, label }) => (
                  <div
                    key={value}
                    onClick={() => handleGenderSelect(value)}
                    className="flex items-center space-x-4 p-5 border border-stone-200 rounded-lg cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-all"
                  >
                    <RadioGroupItem value={value} id={`gender-${value}`} className="h-6 w-6" />
                    <Label htmlFor={`gender-${value}`} className="text-lg font-serif cursor-pointer flex-1">{label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </StepCard>
          )}

          {/* Tobacco */}
          {step === "tobacco" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                Have you used tobacco in the last 12 months?
              </h2>
              <BinaryChoice
                onYes={() => handleTobaccoAnswer("yes")}
                onNo={() => handleTobaccoAnswer("no")}
              />
            </StepCard>
          )}

          {/* Spouse */}
          {step === "spouse" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                Do you have a spouse on the same plan?
              </h2>
              <BinaryChoice
                onYes={() => handleSpouseAnswer("yes")}
                onNo={() => handleSpouseAnswer("no")}
              />
            </StepCard>
          )}

          {/* Age */}
          {step === "age" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                What is your current age?
              </h2>
              <p className="text-stone-500 mb-6">You must be 65 or older.</p>
              <div className="space-y-4">
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="65"
                  className="text-2xl h-16 text-center rounded-lg border-stone-200 focus-visible:ring-stone-400"
                  min="65"
                  max="120"
                />
                <Button
                  onClick={handleAgeSubmit}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white text-lg py-6 h-auto rounded-lg font-serif"
                  disabled={!formData.age || parseInt(formData.age) < 65}
                >
                  Continue
                </Button>
              </div>
            </StepCard>
          )}

          {/* Zip */}
          {step === "zip" && (
            <StepCard stepNumber={getStepNumber()} totalSteps={10} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                What is your ZIP code?
              </h2>
              <p className="text-stone-500 mb-6">Rates vary by location.</p>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setFormData(prev => ({ ...prev, zipCode: val }));
                  }}
                  placeholder="12345"
                  className="text-2xl h-16 text-center rounded-lg border-stone-200 focus-visible:ring-stone-400"
                  maxLength={5}
                />
                <Button
                  onClick={handleZipSubmit}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white text-lg py-6 h-auto rounded-lg font-serif"
                  disabled={!/^\d{5}$/.test(formData.zipCode)}
                >
                  Continue
                </Button>
              </div>
            </StepCard>
          )}

          {/* First Name */}
          {step === "firstName" && (
            <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 md:p-10 max-w-xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500 font-serif">Almost there</span>
                  <span className="text-sm text-stone-400">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-1.5" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                What's your first name?
              </h2>
              <p className="text-stone-500 mb-6">We'll personalize your savings report.</p>
              <div className="space-y-4">
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Your first name"
                  className="text-xl h-14 rounded-lg border-stone-200 focus-visible:ring-stone-400"
                  autoFocus
                />
                <Button
                  onClick={handleFirstNameSubmit}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white text-lg py-6 h-auto rounded-lg font-serif"
                  disabled={!formData.firstName.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Phone Number */}
          {step === "phone" && (
            <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 md:p-10 max-w-xl mx-auto" data-tf-element-role="offer">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500 font-serif">Last step</span>
                  <span className="text-sm text-stone-400">100%</span>
                </div>
                <Progress value={100} className="h-1.5" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                Where should we send your report, {formData.firstName}?
              </h2>
              <p className="text-stone-500 mb-6">Enter your phone number and we'll prepare your personalized savings report.</p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData(prev => ({ ...prev, phone: formatted }));
                    if (error) setError(null);
                  }}
                  placeholder="(555) 123-4567"
                  className="text-xl h-14 rounded-lg border-stone-200 focus-visible:ring-stone-400"
                  maxLength={14}
                  autoFocus
                />
                <Button
                  onClick={handlePhoneSubmit}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-lg py-6 h-auto rounded-lg font-serif"
                  disabled={formData.phone.replace(/\D/g, '').length !== 10 || isSubmitting}
                  data-tf-element-role="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Preparing Report...
                    </>
                  ) : (
                    <>
                      Get My Free Savings Report
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-stone-400 text-center mt-6 leading-relaxed" data-tf-element-role="consent-language">
                By clicking "Get My Free Savings Report," I consent to receive calls, text messages, and emails 
                from Health Helpers regarding my Medicare inquiry. I understand these 
                communications may be made using automated telephone dialing systems, artificial intelligence, 
                and/or prerecorded messages. Message frequency varies. Message and data rates may apply. 
                I can opt out at any time by texting STOP or calling directly. This consent is not required 
                to receive a quote. I agree to the{' '}
                <Link to="/terms-of-service" className="underline hover:text-stone-600">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="underline hover:text-stone-600">Privacy Policy</Link>.
              </p>
            </div>
          )}

          {/* Loading */}
          {step === "loading" && (
            <ReportLoadingProgress 
              ref={loadingRef}
              planType={formData.plan} 
              firstName={formData.firstName}
            />
          )}
        </div>

        {/* Results — Rate Report */}
        {step === "qualified" && quoteResult && (
          <div className="max-w-2xl mx-auto px-4">
            <div ref={resultsHeaderRef} className="scroll-mt-4">
              
              {/* Report Document */}
              <div className="bg-white border border-stone-200 rounded-lg shadow-md overflow-hidden">
                {/* Report Header */}
                <div className="bg-stone-800 text-white p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8 text-amber-400" />
                    <div>
                      <h1 className="text-xl md:text-2xl font-serif font-bold">Medigap Savings Report</h1>
                      <p className="text-stone-300 text-sm">Confidential · Prepared {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <p className="text-stone-300 font-serif">
                    Prepared for: <span className="text-white font-semibold">{formData.firstName}</span>
                  </p>
                </div>

                {/* Report Body */}
                <div className="p-6 md:p-8 space-y-6">
                  
                  {/* Key Finding */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                    <h2 className="text-lg font-serif font-bold text-stone-800 mb-2">Key Finding</h2>
                    <p className="text-stone-700 font-serif leading-relaxed">
                      Based on our analysis, you may be overpaying by{' '}
                      <span className="font-bold text-amber-700">${quoteResult.monthlySavings.toFixed(2)}/month</span>{' '}
                      for the exact same {formData.plan} coverage. That's{' '}
                      <span className="font-bold text-amber-700">${quoteResult.annualSavings.toFixed(2)} per year</span>{' '}
                      you could keep in your pocket.
                    </p>
                  </div>

                  {/* Rate Comparison Table */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-stone-800 mb-4">Rate Comparison</h3>
                    <div className="border border-stone-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <tbody>
                          <tr className="border-b border-stone-100">
                            <td className="p-4 text-stone-600 font-serif">Your Current Rate</td>
                            <td className="p-4 text-right font-bold text-stone-800 text-lg">${parseFloat(formData.currentPayment).toFixed(2)}/mo</td>
                          </tr>
                          <tr className="border-b border-stone-100 bg-green-50">
                            <td className="p-4 text-stone-600 font-serif">Lowest Available Rate</td>
                            <td className="p-4 text-right font-bold text-green-700 text-lg">${quoteResult.rate.toFixed(2)}/mo</td>
                          </tr>
                          <tr className="border-b border-stone-100">
                            <td className="p-4 text-stone-600 font-serif">Monthly Savings</td>
                            <td className="p-4 text-right font-bold text-amber-700 text-lg">${quoteResult.monthlySavings.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td className="p-4 text-stone-600 font-serif">Annual Savings</td>
                            <td className="p-4 text-right font-bold text-amber-700 text-lg">${quoteResult.annualSavings.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Same coverage reassurance */}
                  <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-stone-800 font-serif font-semibold">Same {formData.plan} benefits you have today</p>
                      <p className="text-stone-500 text-sm">Your coverage doesn't change — only the price does.</p>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-xs text-stone-400 italic font-serif leading-relaxed">
                    This report is based on publicly available rate data and is for informational purposes only. 
                    Final rates may vary based on underwriting. A licensed agent can confirm your exact rate 
                    and walk you through the switching process at no cost.
                  </p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="mt-8 text-center">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-3">
                  Ready to Lock In Your Savings?
                </h2>
                <p className="text-stone-500 mb-6 font-serif max-w-md mx-auto">
                  Speak with a licensed agent who can confirm your rate and handle everything for you — at no cost.
                </p>
                
                {/* Direct call CTA */}
                <a 
                  href={PHONE_TEL}
                  onClick={() => {
                    trackEvent({ eventType: 'call_click', step: 'report_results' });
                  }}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg text-xl font-serif font-semibold transition-colors shadow-lg mb-4"
                >
                  <Phone className="h-5 w-5" />
                  Call Now: {PHONE_NUMBER}
                </a>
                <p className="text-stone-400 text-sm mb-8">Available Mon–Fri, 9am–5pm ET</p>
              </div>

              {/* Booking Widget */}
              <div ref={bookingWidgetRef} className="scroll-mt-4">
                <div className="text-center mb-4">
                  <p className="text-stone-500 font-serif text-lg">Prefer to schedule a time?</p>
                  <p className="text-stone-400 text-sm mt-1">Pick a day and time that works for you.</p>
                </div>
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
                  prefilledContact={{
                    firstName: formData.firstName,
                    phone: formData.phone.replace(/\D/g, ''),
                  }}
                  visitorId={visitorId}
                  sessionId={sessionId}
                  onTrackEvent={trackEvent}
                  onBookingCompleted={handleBookingCompleted}
                />
              </div>
            </div>
            
            <div className="h-16" />
          </div>
        )}
      </section>

      {/* Minimal Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-6 text-center text-sm text-stone-400">
        <div className="max-w-xl mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} Health Helpers. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link to="/privacy-policy" className="underline hover:text-stone-600">Privacy Policy</Link>
            <Link to="/terms-of-service" className="underline hover:text-stone-600">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MedicareSupplementReport;
