import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Phone, Shield, Users, FileCheck, CheckCircle, Clock, AlertCircle, CalendarCheck, ChevronDown, Sun, Sunset, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';

const PHONE_NUMBER = "(888) 525-1179";
const PHONE_TEL = "tel:+18885251179";

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

const trackTaboolaConversion = () => {
  if (typeof window !== 'undefined' && (window as any)._tfa) {
    (window as any)._tfa.push({ notify: 'event', name: 'qualified_lead', id: 1852294 });
    console.log('Taboola conversion tracked');
  }
};

const getFacebookCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return { fbc: cookies._fbc, fbp: cookies._fbp };
};

const getVisitorId = (): string => {
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

// Track submission event - custom event fired when we find savings for the user
// Includes full lead data for Facebook's match quality optimization
const trackFacebookSubmissionEvent = async (
  formData: FormData,
  quoteResult: QuoteResult | null
) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'submission',
        event_source_url: window.location.href,
        external_id: getVisitorId(),
        fbc,
        fbp,
        event_id: eventId,
        // Lead data for improved match quality
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        zip_code: formData.zipCode,
        // Conversion value for optimization
        value: quoteResult?.monthlySavings || quoteResult?.rate || 0,
        currency: 'USD',
      }
    });
    console.log('Facebook submission conversion tracked with lead data');
  } catch (error) {
    console.error('Error tracking Facebook submission event:', error);
  }
};

// Track InboundCall event - fired when user clicks the call button
// Includes lead data when available for improved match quality
const trackFacebookCallEvent = async (
  formData?: FormData,
  quoteResult?: QuoteResult | null
) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    
    const body: Record<string, any> = {
      event_name: 'InboundCall',
      event_source_url: window.location.href,
      external_id: getVisitorId(),
      fbc,
      fbp,
      event_id: eventId,
    };

    // Add lead data if available (user has completed the form)
    if (formData?.firstName) body.first_name = formData.firstName;
    if (formData?.lastName) body.last_name = formData.lastName;
    if (formData?.email) body.email = formData.email;
    if (formData?.phone) body.phone = formData.phone;
    if (formData?.zipCode) body.zip_code = formData.zipCode;
    
    // Add conversion value if quote is available
    if (quoteResult) {
      body.value = quoteResult.monthlySavings || quoteResult.rate || 0;
      body.currency = 'USD';
    }

    await supabase.functions.invoke('fb-conversion', { body });
    console.log('Facebook InboundCall conversion tracked', formData ? 'with lead data' : 'without lead data');
  } catch (error) {
    console.error('Error tracking Facebook InboundCall event:', error);
  }
};

// Generate application reference number
const generateApplicationNumber = (): string => {
  return `SM${Math.floor(10000 + Math.random() * 90000)}`;
};

// Helper to check if current time is within business hours (9 AM - 5 PM Eastern, Mon-Fri)
const isWithinBusinessHours = (): boolean => {
  const now = new Date();
  
  // Convert to Eastern Time
  const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = easternTime.getHours();
  const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Business hours: Monday-Friday, 9 AM - 5 PM Eastern
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isBusinessHour = hour >= 9 && hour < 17;
  
  return isWeekday && isBusinessHour;
};

// Helper to get callback date info based on current Eastern Time
interface CallbackDateInfo {
  dateLabel: string;
  isToday: boolean;
  nextBusinessDay: string; // YYYY-MM-DD format for webhook
}

const getCallbackDateInfo = (): CallbackDateInfo => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = easternTime.getHours();
  const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday

  let callbackDate = new Date(easternTime);
  let dateLabel = "";
  let isToday = false;

  // Before 9 AM on a weekday = callback TODAY
  if (hour < 9 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    isToday = true;
    dateLabel = "today";
  } else {
    // Start from tomorrow
    callbackDate.setDate(callbackDate.getDate() + 1);
    
    // Skip weekends
    const nextDay = callbackDate.getDay();
    if (nextDay === 0) { // Sunday -> Monday
      callbackDate.setDate(callbackDate.getDate() + 1);
    } else if (nextDay === 6) { // Saturday -> Monday
      callbackDate.setDate(callbackDate.getDate() + 2);
    }

    // Determine label
    const tomorrowCheck = new Date(easternTime);
    tomorrowCheck.setDate(tomorrowCheck.getDate() + 1);
    
    if (callbackDate.toDateString() === tomorrowCheck.toDateString()) {
      dateLabel = "tomorrow";
    } else {
      // Format as day name (e.g., "Monday")
      dateLabel = callbackDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        timeZone: "America/New_York" 
      });
    }
  }

  // Format callback date as YYYY-MM-DD for webhook
  const nextBusinessDay = callbackDate.toISOString().split('T')[0];

  return { dateLabel, isToday, nextBusinessDay };
};

const MedicareSupplementQuote = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FunnelStep>("landing");
  const [disqualReason, setDisqualReason] = useState<DisqualReason | null>(null);
  const [countdown, setCountdown] = useState(90);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationNumber] = useState(() => generateApplicationNumber());
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  
  // Business hours and callback scheduling state
  const [isDuringBusinessHours, setIsDuringBusinessHours] = useState(true);
  const [callbackTimeSlot, setCallbackTimeSlot] = useState<'morning' | 'afternoon' | null>(null);
  const [callbackScheduled, setCallbackScheduled] = useState(false);
  const [isSchedulingCallback, setIsSchedulingCallback] = useState(false);
  const [showCallbackOptions, setShowCallbackOptions] = useState(false);
  const [callbackDateInfo, setCallbackDateInfo] = useState<CallbackDateInfo | null>(null);
  
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

  const { visitorId, sessionId, trackStepChange, trackQualification, trackCallClick, trackEvent } = useFunnelAnalytics('suppquote');

  // Check business hours and calculate callback date when reaching qualified step
  useEffect(() => {
    if (step === 'qualified') {
      const duringHours = isWithinBusinessHours();
      setIsDuringBusinessHours(duringHours);
      if (!duringHours) {
        setCallbackDateInfo(getCallbackDateInfo());
      }
    }
  }, [step]);

  // SEO meta tags
  useEffect(() => {
    document.title = "Medicare Supplement Quote | Health Helpers";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Get a personalized Medicare Supplement quote. Compare rates from top-rated carriers and see how much you could save.');
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

  // Countdown timer
  useEffect(() => {
    if (step !== "qualified" || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [step, countdown]);

  const time = {
    mins: String(Math.floor(countdown / 60)).padStart(2, '0'),
    secs: String(countdown % 60).padStart(2, '0'),
  };

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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) return;
    
    setStep("loading");
    setIsSubmitting(true);
    setError(null);
    trackStepChange("loading");

    try {
      // Get quote from CSG API
      const { data, error: quoteError } = await supabase.functions.invoke('get-medicare-quote', {
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

      if (quoteError) {
        console.error("Quote error:", quoteError);
        setError("Unable to retrieve quotes. Please try again or call us directly.");
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
      
      // Send lead to GHL webhook
      await supabase.functions.invoke('send-lead-webhook', {
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
          page: 'suppquote',
        }
      });

      // Track conversions - submission event fires here (we found savings)
      trackQualification("qualified");
      trackTaboolaConversion();
      await trackFacebookSubmissionEvent(formData, data);
      
      setStep("qualified");
      setCountdown(90);

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
        page: 'suppquote',
      }]);
    } catch (error) {
      console.error("Error saving submission:", error);
    }
  };

  const handleCallClick = () => {
    trackCallClick();
    trackTaboolaConversion();
    trackFacebookCallEvent(formData, quoteResult); // InboundCall event fires on call click with lead data
  };

  // Handle SMS nurture request (primary after-hours CTA)
  const handleSmsNurtureRequest = async () => {
    setIsSchedulingCallback(true);
    try {
      const dateInfo = callbackDateInfo || getCallbackDateInfo();
      
      const response = await supabase.functions.invoke('schedule-callback', {
        body: {
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          leadType: 'sms_nurture',
          callbackTime: null, // No specific time preference
          nextBusinessDay: dateInfo.nextBusinessDay,
          isToday: dateInfo.isToday,
          quotedRate: quoteResult?.rate,
          currentPayment: parseFloat(formData.currentPayment),
          monthlySavings: quoteResult?.monthlySavings,
          annualSavings: quoteResult?.annualSavings,
        }
      });

      if (response.error) {
        console.error("Error requesting SMS nurture:", response.error);
        toast.error("Something went wrong. Please try again.");
        return;
      }

      // Track the SMS nurture requested event
      await trackEvent({
        eventType: 'sms_nurture_requested',
        step: 'qualified',
        metadata: {
          dateLabel: dateInfo.dateLabel,
          isToday: dateInfo.isToday,
        }
      });

      setCallbackScheduled(true);
      toast.success(`Great! We'll text you ${dateInfo.dateLabel} when we're ready.`);

    } catch (error) {
      console.error("Error requesting SMS nurture:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSchedulingCallback(false);
    }
  };

  // Handle scheduling a callback for after-hours (secondary option)
  const handleScheduleCallback = async () => {
    if (!callbackTimeSlot) return;

    setIsSchedulingCallback(true);
    try {
      const dateInfo = callbackDateInfo || getCallbackDateInfo();
      
      const response = await supabase.functions.invoke('schedule-callback', {
        body: {
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
          leadType: 'callback_request',
          callbackTime: callbackTimeSlot,
          nextBusinessDay: dateInfo.nextBusinessDay,
          isToday: dateInfo.isToday,
          quotedRate: quoteResult?.rate,
          currentPayment: parseFloat(formData.currentPayment),
          monthlySavings: quoteResult?.monthlySavings,
          annualSavings: quoteResult?.annualSavings,
        }
      });

      if (response.error) {
        console.error("Error scheduling callback:", response.error);
        toast.error("Something went wrong. Please try again.");
        return;
      }

      // Track the callback scheduled event
      await trackEvent({
        eventType: 'callback_requested',
        step: 'qualified',
        answer: callbackTimeSlot,
        metadata: {
          timeSlot: callbackTimeSlot,
          dateLabel: dateInfo.dateLabel,
          isToday: dateInfo.isToday,
        }
      });

      setCallbackScheduled(true);
      toast.success(`Callback scheduled! We'll call you ${dateInfo.dateLabel}.`);

    } catch (error) {
      console.error("Error scheduling callback:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSchedulingCallback(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
          
          <p className="text-base text-blue-200 mb-8 max-w-xl mx-auto">
            See your personalized rate in under 2 minutes. No obligation. No pressure.
          </p>

          {step === "landing" && (
            <>
              <Button
                onClick={scrollToFunnel}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white text-xl py-8 px-12 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Check If You Qualify
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
        <div className="max-w-2xl mx-auto px-4">
          
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

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Do any of the following apply to you?
              </h2>
              
              <ul className="text-muted-foreground mb-6 space-y-1 text-sm md:text-base">
                <li>• Live in a nursing home or assisted living facility</li>
                <li>• Need daily help with bathing, dressing, or eating</li>
                <li>• Have been diagnosed with dementia or Alzheimer's</li>
                <li>• Currently use oxygen at home</li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleCareAnswer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="care-yes" className="h-6 w-6" />
                  <Label htmlFor="care-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleCareAnswer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="care-no" className="h-6 w-6" />
                  <Label htmlFor="care-no" className="text-lg cursor-pointer flex-1">No</Label>
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

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                In the last 2 years, have you had any of the following?
              </h2>
              
              <ul className="text-muted-foreground mb-6 space-y-1 text-sm md:text-base">
                <li>• Cancer, heart attack, stroke, or congestive heart failure</li>
                <li>• Kidney failure or dialysis</li>
                <li>• Organ transplant</li>
                <li>• ALS, Parkinson's, or multiple sclerosis</li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleTreatmentAnswer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="treatment-yes" className="h-6 w-6" />
                  <Label htmlFor="treatment-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleTreatmentAnswer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="treatment-no" className="h-6 w-6" />
                  <Label htmlFor="treatment-no" className="text-lg cursor-pointer flex-1">No</Label>
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

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Do any of the following apply to you?
              </h2>
              
              <ul className="text-muted-foreground mb-6 space-y-1 text-sm md:text-base">
                <li>• Use insulin for diabetes</li>
                <li>• Take 3 or more diabetes medications</li>
                <li>• Take strong prescription pain medicine daily (oxycodone, hydrocodone, morphine)</li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleMedicationsAnswer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="meds-yes" className="h-6 w-6" />
                  <Label htmlFor="meds-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleMedicationsAnswer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="meds-no" className="h-6 w-6" />
                  <Label htmlFor="meds-no" className="text-lg cursor-pointer flex-1">No</Label>
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

          {/* Contact Form */}
          {step === "contact" && (
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

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Smith"
                      className="h-12 rounded-xl"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 h-auto rounded-xl"
                  disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                >
                  {isSubmitting ? "Comparing Rates..." : "See My New Rate"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
                By clicking "See My New Rate," I consent to receive calls, text messages, and emails 
                from Health Helpers and its partners regarding my Medicare inquiry. I understand these 
                communications may be made using automated telephone dialing systems, artificial intelligence, 
                and/or prerecorded messages. Message frequency varies. Message and data rates may apply. 
                I can opt out at any time by texting STOP or calling directly. This consent is not required 
                to receive a quote. I agree to the{' '}
                <Link to="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.
              </p>
            </div>
          )}

          {/* Loading Screen */}
          {step === "loading" && (
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border text-center">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Finding your best rate...
              </h2>
              <p className="text-muted-foreground">Comparing quotes from top carriers</p>
            </div>
          )}

          {/* Qualified/Results Screen */}
          {step === "qualified" && quoteResult && (
            <div className="space-y-6">
              {/* Success Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
                {/* Application Number */}
                <div className="bg-gray-100 rounded-lg px-4 py-2 inline-block mb-4">
                  <span className="text-sm text-muted-foreground">Application Reference: </span>
                  <span className="font-mono font-bold text-foreground">{applicationNumber}</span>
                </div>

                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {formData.firstName}, You're Losing ${quoteResult.monthlySavings.toFixed(0)} Every Month.
                </h2>
                <p className="text-xl text-green-600 font-semibold mb-2">
                  We found the same {formData.plan} coverage for {quoteResult.savingsPercent?.toFixed(0)}% less
                </p>
                <p className="text-lg md:text-xl text-foreground mb-6">
                  That's <span className="font-bold text-green-600 text-2xl">${quoteResult.annualSavings.toFixed(0)}</span> back in your pocket every year.
                </p>

                {/* Rate Comparison - Mobile Optimized */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="text-center py-2 sm:py-0">
                      <p className="text-xs uppercase tracking-wide text-red-500 font-semibold mb-1">You're Paying</p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-500 line-through">
                        ${parseFloat(formData.currentPayment).toFixed(2)}/mo
                      </p>
                    </div>
                    <div className="border-b border-gray-200 sm:hidden my-2"></div>
                    <div className="text-center py-2 sm:py-0">
                      <p className="text-xs uppercase tracking-wide text-green-600 font-semibold mb-1">You Could Pay</p>
                      <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
                        ${quoteResult.rate.toFixed(2)}/mo
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xl md:text-2xl font-bold text-foreground">
                      Save <span className="text-green-600">${quoteResult.monthlySavings.toFixed(2)}/month</span>
                    </p>
                  </div>
                </div>

                {/* Conditional: During Business Hours = Call Now, After Hours = Schedule Callback */}
                {isDuringBusinessHours ? (
                  <>
                    {/* Tentative Rate Warning with Scarcity */}
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 mb-6">
                      <p className="text-amber-800 font-semibold text-center">
                        ⚠️ This rate is <span className="underline">tentative</span> and subject to verification.
                      </p>
                      <p className="text-amber-700 text-sm text-center mt-1">
                        This rate is reserved for the next {time.mins}:{time.secs}. Call now or you may lose this quote.
                      </p>
                    </div>

                    {/* US Based Licensed Agent Badge */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                      <span className="text-green-600 font-medium">US Based Licensed Agent Ready to Confirm Your Rate</span>
                    </div>

                    {/* Call Button */}
                    <a href={PHONE_TEL} className="block" onClick={handleCallClick}>
                      <Button
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
                      >
                        <Phone className="mr-3 h-6 w-6 animate-pulse" />
                        Tap To Lock In Your Rate
                      </Button>
                    </a>
                    <p className="text-lg font-semibold text-foreground mt-3">{PHONE_NUMBER}</p>
                    <p className="text-sm text-red-600 font-semibold mt-2">
                      ⚠️ If you don't call, your rate expires and you'll keep overpaying.
                    </p>
                  </>
                ) : (
                  <>
                    {/* AFTER HOURS: Hybrid SMS Nurture + Callback UI */}
                    {!callbackScheduled ? (
                      <div className="space-y-4">
                        {/* Office Closed Notice */}
                        <div className="flex items-center justify-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <span className="text-amber-700 font-medium text-sm">Our office is closed. Agents available Mon-Fri, 9 AM - 5 PM ET</span>
                        </div>

                        {/* Rate Saved Confirmation */}
                        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <span className="text-green-700 font-bold">Your rate of ${quoteResult.rate.toFixed(2)}/mo has been saved!</span>
                          </div>
                          <p className="text-foreground text-center mb-6">
                            We'll text you {callbackDateInfo?.dateLabel || "tomorrow"} when our agents are ready to lock in your rate.
                          </p>

                          {/* Primary CTA: Text Me When You're Open */}
                          <Button
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
                            onClick={handleSmsNurtureRequest}
                            disabled={isSchedulingCallback}
                          >
                            <MessageSquare className="mr-3 h-6 w-6" />
                            {isSchedulingCallback ? 'Setting Up...' : 'Text Me When You\'re Open'}
                          </Button>
                        </div>

                        {/* Secondary: Call us tomorrow */}
                        <p className="text-center text-muted-foreground">
                          Or call us {callbackDateInfo?.dateLabel || "tomorrow"} at <strong className="text-foreground">{PHONE_NUMBER}</strong>
                        </p>

                        {/* Expandable Callback Option */}
                        <div className="border-t pt-4">
                          <button
                            onClick={() => setShowCallbackOptions(!showCallbackOptions)}
                            className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center gap-1"
                          >
                            Prefer we call you instead?
                            <ChevronDown className={`h-4 w-4 transition-transform ${showCallbackOptions ? 'rotate-180' : ''}`} />
                          </button>

                          {showCallbackOptions && (
                            <div className="mt-4 bg-gray-50 border rounded-xl p-4">
                              <p className="font-semibold text-foreground mb-3 text-center">
                                When should we call you {callbackDateInfo?.dateLabel || "tomorrow"}?
                              </p>
                              
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                <Button
                                  variant="outline"
                                  className={`py-4 h-auto border-2 transition-all ${
                                    callbackTimeSlot === 'morning' 
                                      ? 'bg-blue-600 border-blue-600 text-white' 
                                      : 'border-gray-300 hover:border-blue-400'
                                  }`}
                                  onClick={() => setCallbackTimeSlot('morning')}
                                >
                                  <div className="text-center">
                                    <Sun className="h-5 w-5 mx-auto mb-1" />
                                    <p className="font-semibold text-sm">Morning</p>
                                    <p className="text-xs opacity-80">9 AM - 12 PM ET</p>
                                  </div>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  className={`py-4 h-auto border-2 transition-all ${
                                    callbackTimeSlot === 'afternoon' 
                                      ? 'bg-blue-600 border-blue-600 text-white' 
                                      : 'border-gray-300 hover:border-blue-400'
                                  }`}
                                  onClick={() => setCallbackTimeSlot('afternoon')}
                                >
                                  <div className="text-center">
                                    <Sunset className="h-5 w-5 mx-auto mb-1" />
                                    <p className="font-semibold text-sm">Afternoon</p>
                                    <p className="text-xs opacity-80">12 PM - 5 PM ET</p>
                                  </div>
                                </Button>
                              </div>

                              {callbackTimeSlot && (
                                <Button
                                  size="lg"
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 h-auto"
                                  onClick={handleScheduleCallback}
                                  disabled={isSchedulingCallback}
                                >
                                  <CalendarCheck className="mr-2 h-5 w-5" />
                                  {isSchedulingCallback ? 'Scheduling...' : 'Schedule Callback'}
                                </Button>
                              )}
                              
                              <p className="text-xs text-muted-foreground text-center mt-3">
                                We'll call <strong>{formData.phone}</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* CONFIRMED UI - Works for both SMS and Callback */
                      <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">You're All Set!</h3>
                        
                        {callbackTimeSlot ? (
                          <>
                            <p className="text-green-700">
                              We'll call you {callbackDateInfo?.dateLabel || "tomorrow"} {callbackTimeSlot === 'morning' ? 'between 9 AM - 12 PM' : 'between 12 PM - 5 PM'} Eastern.
                            </p>
                            <p className="text-sm text-muted-foreground mt-3">
                              We'll call <strong>{formData.phone}</strong>. Make sure your phone is on!
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-green-700">
                              We'll text you {callbackDateInfo?.dateLabel || "tomorrow"} at 9 AM ET when our agents are ready.
                            </p>
                            <p className="text-sm text-muted-foreground mt-3">
                              Keep an eye on <strong>{formData.phone}</strong> for our message.
                            </p>
                            <div className="mt-4 pt-4 border-t border-green-200">
                              <p className="text-sm text-foreground font-medium">Save our number:</p>
                              <p className="text-lg font-bold text-green-700">{PHONE_NUMBER}</p>
                              <p className="text-xs text-muted-foreground">Health Helpers</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Countdown Timer - Only show during business hours */}
              {isDuringBusinessHours && countdown > 0 && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 md:p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-800 font-semibold uppercase tracking-wide text-sm">
                      Quote Reserved For:
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-amber-600 text-white rounded-lg px-4 py-2">
                      <span className="text-3xl font-bold font-mono">{time.mins}</span>
                      <span className="text-xs block">MIN</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">:</span>
                    <div className="bg-amber-600 text-white rounded-lg px-4 py-2">
                      <span className="text-3xl font-bold font-mono">{time.secs}</span>
                      <span className="text-xs block">SEC</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Proof Stats */}
              <div className="bg-white rounded-xl p-6 border">
                <p className="text-sm text-muted-foreground mb-4 text-center">Thousands of seniors have already saved:</p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">$2.4M+</p>
                    <p className="text-xs text-muted-foreground">Saved This Year</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">10,000+</p>
                    <p className="text-xs text-muted-foreground">Seniors Helped</p>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-bold text-foreground mb-4">What Happens When You Call?</h3>
                <ol className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">1</span>
                    <span><strong className="text-foreground">Speak directly</strong> with a US based licensed agent — no transfers, no hold music</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</span>
                    <span><strong className="text-foreground">Verify your rate</strong> — takes less than 5 minutes over the phone</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">3</span>
                    <span><strong className="text-foreground">Start saving immediately</strong> — new coverage starts with no gap in protection</span>
                  </li>
                </ol>
              </div>

              {/* Trust Elements */}
              <div className="bg-white rounded-xl p-6 border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <Shield className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">US Based Agents</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">No Obligation</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FileCheck className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">100% Free</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center px-4">
                This is a free rate comparison service. Quoted rates are estimates and subject to underwriting approval. Final rates may vary based on health history and other factors.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Spacer */}
      <div className="h-[50vh]"></div>

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

      {/* Sticky Footer (Mobile - Qualified Only) */}
      {step === "qualified" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
          {isDuringBusinessHours ? (
            <a href={PHONE_TEL} className="block" onClick={handleCallClick}>
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 h-auto rounded-xl"
              >
                <Phone className="mr-2 h-5 w-5 animate-pulse" />
                Call Now - Save ${quoteResult?.monthlySavings.toFixed(0)}/mo
              </Button>
            </a>
          ) : !callbackScheduled ? (
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 h-auto rounded-xl"
              onClick={handleSmsNurtureRequest}
              disabled={isSchedulingCallback}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              {isSchedulingCallback ? 'Setting Up...' : `Text Me ${callbackDateInfo?.isToday ? 'Today' : 'When You\'re Open'}`}
            </Button>
          ) : (
            <div className="text-center py-2">
              <p className="text-green-600 font-semibold">✓ We'll text you {callbackDateInfo?.dateLabel || 'tomorrow'} at 9 AM ET</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicareSupplementQuote;
