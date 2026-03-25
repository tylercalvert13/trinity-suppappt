import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, Loader2, ArrowRight, Shield, FileText, Phone, Users, Star, Clock, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { initAdvancedMatching, trackPixelEvent } from '@/lib/facebookPixel';

const PHONE_NUMBER = "(201) 426-9898";
const PHONE_TEL = "tel:+12014269898";

const QUESTION_STEPS = ['plan', 'gender', 'spouse', 'health', 'age', 'payment', 'zip', 'contact'];

type FunnelStep =
  | 'landing' | 'plan' | 'gender' | 'spouse' | 'health'
  | 'age' | 'payment' | 'zip' | 'contact' | 'loading' | 'confirmation';

interface FormData {
  plan: string;
  gender: string;
  spouse: string;
  healthScreen: string;
  age: string;
  currentPayment: string;
  zipCode: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

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

const trackFacebookSubmissionEvent = async (formData: FormData) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();

    initAdvancedMatching({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
    });

    trackPixelEvent('Lead', eventId, 0);

    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'Lead',
        event_source_url: window.location.href,
        external_id: getVisitorIdForTracking(),
        fbc, fbp,
        event_id: eventId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        zip_code: formData.zipCode,
        currency: 'USD',
      }
    });
  } catch (error) {
    console.error('Error tracking Facebook submission event:', error);
  }
};

// Facebook-style StepCard — thin blue progress bar, no question numbers, compact white card
interface StepCardProps {
  children: React.ReactNode;
  progress: number;
}

const StepCard = ({ children, progress }: StepCardProps) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-lg mx-auto">
    {/* Thin progress bar at top of card */}
    <div className="h-1 bg-gray-200 w-full">
      <div
        className="h-full bg-[#1877F2] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
    <div className="p-5 md:p-6">
      {children}
    </div>
  </div>
);

// Facebook-style BinaryChoice — simple tappable rows
const BinaryChoice = ({ onYes, onNo }: { onYes: () => void; onNo: () => void }) => (
  <div className="space-y-2">
    <div
      onClick={onYes}
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#1877F2] hover:bg-blue-50/50 transition-all"
    >
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
      <span className="text-base">Yes</span>
    </div>
    <div
      onClick={onNo}
      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#1877F2] hover:bg-blue-50/50 transition-all"
    >
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
      <span className="text-base">No</span>
    </div>
  </div>
);

// Loading screen — blue themed
const LOADING_STEPS = [
  { label: 'Connecting to carriers...', duration: 1500 },
  { label: 'Scanning available rates...', duration: 2000 },
  { label: 'Comparing options...', duration: 2000 },
  { label: 'Calculating potential savings...', duration: 2000 },
  { label: 'Finalizing results...', duration: 3000 },
];

const FormLoadingProgress = React.forwardRef<HTMLDivElement, { planType?: string; firstName?: string }>(
  ({ planType = 'Plan G', firstName }, ref) => {
    const steps = LOADING_STEPS.map((s, i) =>
      i === 2 ? { ...s, label: `Comparing ${planType} options...` } : s
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [isSlowLoading, setIsSlowLoading] = useState(false);

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
      const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }, []);

    const progressValue = ((currentStep + 1) / steps.length) * 100;

    return (
      <div ref={ref} className="scroll-mt-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-1 bg-gray-200 w-full">
            <div className="h-full bg-[#1877F2] transition-all duration-300" style={{ width: `${progressValue}%` }} />
          </div>
          <div className="p-6 md:p-8">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 text-center">
              {firstName ? `Checking rates for you, ${firstName}...` : 'Checking rates...'}
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">This usually takes 5–10 seconds</p>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${i <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                  {i < currentStep ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : i === currentStep ? (
                    <Loader2 className="h-5 w-5 text-[#1877F2] animate-spin flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${
                    i < currentStep ? 'text-green-700 font-medium' :
                    i === currentStep ? 'text-gray-800 font-medium' :
                    'text-gray-400'
                  }`}>{step.label}</span>
                </div>
              ))}
            </div>

            {isSlowLoading && (
              <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">Taking longer than usual... please wait a moment.</p>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center mt-6">🔒 Your information is secure and never shared</p>
          </div>
        </div>
      </div>
    );
  }
);
FormLoadingProgress.displayName = 'FormLoadingProgress';

const MedicareLeadForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FunnelStep>('landing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    plan: '',
    gender: '',
    spouse: '',
    healthScreen: '',
    age: '',
    currentPayment: '',
    zipCode: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const { visitorId, sessionId, trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('form');

  useEffect(() => {
    if (QUESTION_STEPS.includes(step)) {
      setTimeout(() => {
        questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (step === 'loading') {
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 50);
    }
  }, [step]);

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

  useEffect(() => {
    document.title = 'Free Medicare Supplement Rate Check | Health Helpers';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');
    return () => {
      document.title = 'Medicare Self-Enrollment Online | Health Helpers';
      if (robotsMeta) robotsMeta.setAttribute('content', 'index, follow');
    };
  }, []);

  const scrollToFunnel = () => {
    setStep('plan');
    trackStepChange('plan');
    setTimeout(() => {
      funnelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getProgress = (): number => {
    const idx = QUESTION_STEPS.indexOf(step);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / QUESTION_STEPS.length) * 100);
  };

  const handlePlanSelect = (plan: string) => {
    setFormData(prev => ({ ...prev, plan }));
    setStep('gender');
    trackStepChange('gender', plan);
  };

  const handleGenderSelect = (gender: string) => {
    setFormData(prev => ({ ...prev, gender }));
    setStep('spouse');
    trackStepChange('spouse', gender);
  };

  const handleSpouseAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, spouse: answer }));
    setStep('health');
    trackStepChange('health', answer);
  };

  const handleHealthAnswer = (answer: string) => {
    setFormData(prev => ({ ...prev, healthScreen: answer }));
    if (answer === 'yes') {
      trackQualification('disqualified', 'health_screen');
      saveSubmission('disqualified', 'health_screen');
      navigate('/disqualified?reason=health');
      return;
    }
    setStep('age');
    trackStepChange('age', answer);
  };

  const handleAgeSubmit = () => {
    const age = parseInt(formData.age);
    if (isNaN(age) || age < 65 || age > 120) return;
    setStep('payment');
    trackStepChange('payment', formData.age);
  };

  const handlePaymentSubmit = () => {
    if (!formData.currentPayment || parseFloat(formData.currentPayment) <= 0) return;
    setStep('zip');
    trackStepChange('zip', formData.currentPayment);
  };

  const handleZipSubmit = () => {
    if (!/^\d{5}$/.test(formData.zipCode)) return;
    setStep('contact');
    trackStepChange('contact', formData.zipCode);
  };

  const handleContactSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) return;

    try {
      const { data: validationData } = await supabase.functions.invoke('validate-contact', {
        body: { email: 'placeholder@example.com', phone: phoneDigits }
      });
      if (validationData && !validationData.phone?.valid) {
        setError("This phone number doesn't appear to be valid. Please double-check it.");
        return;
      }
    } catch (err) {
      console.error('Validation error:', err);
    }

    setError(null);
    setStep('loading');
    setIsSubmitting(true);
    trackStepChange('loading');

    try {
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

      const quotePromise = supabase.functions.invoke('crm-quote-webhook', {
        body: {
          name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          phone: phoneDigits,
          age: parseInt(formData.age),
          currentPremium: parseFloat(formData.currentPayment),
          currentType: formData.plan,
          zip: formData.zipCode,
          gender: formData.gender,
          spouse: formData.spouse,
          trustedFormCertUrl,
        }
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Quote request timed out')), 30000)
      );

      let result: any;
      try {
        result = await Promise.race([quotePromise, timeoutPromise]);
      } catch (err) {
        try {
          result = await Promise.race([
            supabase.functions.invoke('crm-quote-webhook', {
              body: {
                name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                phone: phoneDigits,
                age: parseInt(formData.age),
                currentPremium: parseFloat(formData.currentPayment),
                currentType: formData.plan,
                zip: formData.zipCode,
                gender: formData.gender,
                spouse: formData.spouse,
                trustedFormCertUrl,
              }
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Retry timed out')), 30000))
          ]);
        } catch {
          throw new Error('Quote request failed after retry');
        }
      }

      const { data, error: quoteError } = result;

      if (quoteError) {
        setError("We're having trouble retrieving rates right now. Please try again.");
        setStep('contact');
        return;
      }

      const status = data?.status;

      await saveSubmission(
        status === 'quoted' ? 'success' : 'knockout',
        status !== 'quoted' ? 'no_savings' : undefined,
      );

      await trackFacebookSubmissionEvent(formData);

      if (status === 'no_savings' || status === 'no_quotes') {
        navigate('/great-rate');
        return;
      }

      trackQualification('qualified');
      setStep('confirmation');

    } catch (err) {
      console.error('Error getting quote:', err);
      setError('An error occurred. Please try again.');
      setStep('contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveSubmission = async (
    submissionType: 'success' | 'disqualified' | 'knockout',
    disqualificationReason?: string,
  ) => {
    try {
      await supabase.from('submissions').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        plan: formData.plan || null,
        current_payment: formData.currentPayment ? parseFloat(formData.currentPayment) : null,
        care_or_condition: formData.healthScreen || null,
        gender: formData.gender || null,
        spouse: formData.spouse || null,
        age: formData.age ? parseInt(formData.age) : null,
        zip_code: formData.zipCode || null,
        first_name: formData.firstName || null,
        last_name: formData.lastName || null,
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : null,
        submission_type: submissionType,
        disqualification_reason: disqualificationReason || null,
        page: 'form',
      }] as any);
    } catch (error) {
      console.error('Error saving submission:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* TrustedForm hidden fields */}
      <noscript>
        <img src="https://api.trustedform.com/ns.gif" height="1" width="1" style={{ display: 'none' }} alt="" />
      </noscript>
      <form style={{ position: 'absolute', left: '-9999px' }}>
        <input type="hidden" id="xxTrustedFormCertUrl_0" name="xxTrustedFormCertUrl" />
      </form>

      {/* Compact header — Facebook-style, no dark hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1877F2] rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Health Helpers</p>
            <p className="text-xs text-gray-500">Sponsored</p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <section ref={funnelRef} className="py-4 md:py-8">
        <div ref={questionContainerRef} className="max-w-lg mx-auto px-4 scroll-mt-4">

          {/* Landing state */}
          {step === 'landing' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-5 md:p-6">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                  Free Medicare Supplement Rate Check
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  Find out if you're overpaying — takes 60 seconds.
                </p>

                <Button
                  onClick={scrollToFunnel}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-base py-3 h-auto rounded-lg font-medium"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center gap-4 mt-5 text-gray-400 text-xs">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed Agents</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> 100% Free</span>
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> No Obligation</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Plan */}
          {step === 'plan' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Which Medicare Supplement plan do you currently have?
              </h2>
              <p className="text-gray-500 text-sm mb-4">Select your plan below.</p>
              <div className="space-y-2">
                {['Plan G', 'Plan N', 'Plan F'].map((plan) => (
                  <div
                    key={plan}
                    onClick={() => handlePlanSelect(plan)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#1877F2] hover:bg-blue-50/50 transition-all"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-base">{plan}</span>
                  </div>
                ))}
              </div>
            </StepCard>
          )}

          {/* Step 2: Gender */}
          {step === 'gender' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                What is your gender?
              </h2>
              <div className="space-y-2">
                {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map(({ value, label }) => (
                  <div
                    key={value}
                    onClick={() => handleGenderSelect(value)}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-[#1877F2] hover:bg-blue-50/50 transition-all"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-base">{label}</span>
                  </div>
                ))}
              </div>
            </StepCard>
          )}

          {/* Step 3: Spouse */}
          {step === 'spouse' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Do you have a spouse or partner that's also on Medicare?
              </h2>
              <BinaryChoice
                onYes={() => handleSpouseAnswer('yes')}
                onNo={() => handleSpouseAnswer('no')}
              />
            </StepCard>
          )}

          {/* Step 4: Health */}
          {step === 'health' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Quick Health Check
              </h2>
              <p className="text-gray-500 text-sm mb-4">Do any of the following apply to you?</p>

              <ul className="text-gray-700 mb-5 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Use oxygen or a wheelchair</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Need daily care assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Have dementia or Parkinson's</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Had cancer, heart attack, or stroke in the past 2 years</span>
                </li>
              </ul>

              <BinaryChoice
                onYes={() => handleHealthAnswer('yes')}
                onNo={() => handleHealthAnswer('no')}
              />
            </StepCard>
          )}

          {/* Step 5: Age */}
          {step === 'age' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                What is your current age?
              </h2>
              <p className="text-gray-500 text-sm mb-4">You must be 65 or older.</p>
              <div className="space-y-3">
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="65"
                  className="text-xl h-14 text-center rounded-lg border-gray-200 focus-visible:ring-[#1877F2]"
                  min="65"
                  max="120"
                />
                <Button
                  onClick={handleAgeSubmit}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-base py-3 h-auto rounded-lg font-medium"
                  disabled={!formData.age || parseInt(formData.age) < 65}
                >
                  Next
                </Button>
              </div>
            </StepCard>
          )}

          {/* Step 6: Payment */}
          {step === 'payment' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                How much do you pay each month?
              </h2>
              <p className="text-gray-500 text-sm mb-4">Enter your current monthly premium.</p>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
                  <Input
                    type="number"
                    value={formData.currentPayment}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPayment: e.target.value }))}
                    placeholder="0.00"
                    className="pl-10 text-xl h-14 rounded-lg border-gray-200 focus-visible:ring-[#1877F2]"
                    min="0"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handlePaymentSubmit}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-base py-3 h-auto rounded-lg font-medium"
                  disabled={!formData.currentPayment || parseFloat(formData.currentPayment) <= 0}
                >
                  Next
                </Button>
              </div>
            </StepCard>
          )}

          {/* Step 7: ZIP */}
          {step === 'zip' && (
            <StepCard progress={getProgress()}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                What is your ZIP code?
              </h2>
              <p className="text-gray-500 text-sm mb-4">Rates vary by location.</p>
              <div className="space-y-3">
                <Input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setFormData(prev => ({ ...prev, zipCode: val }));
                  }}
                  placeholder="12345"
                  className="text-xl h-14 text-center rounded-lg border-gray-200 focus-visible:ring-[#1877F2]"
                  maxLength={5}
                />
                <Button
                  onClick={handleZipSubmit}
                  className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-base py-3 h-auto rounded-lg font-medium"
                  disabled={!/^\d{5}$/.test(formData.zipCode)}
                >
                  Next
                </Button>
              </div>
            </StepCard>
          )}

          {/* Step 8: Contact */}
          {step === 'contact' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-lg mx-auto" data-tf-element-role="offer">
              <div className="h-1 bg-gray-200 w-full">
                <div className="h-full bg-[#1877F2] w-full" />
              </div>
              <div className="p-5 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Where should we send your results?
                </h2>
                <p className="text-gray-500 text-sm mb-4">Enter your name and phone number so a licensed agent can share your rate.</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="First name"
                      className="text-base h-12 rounded-lg border-gray-200 focus-visible:ring-[#1877F2]"
                      autoFocus
                    />
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Last name"
                      className="text-base h-12 rounded-lg border-gray-200 focus-visible:ring-[#1877F2]"
                    />
                  </div>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setFormData(prev => ({ ...prev, phone: formatted }));
                      if (error) setError(null);
                    }}
                    placeholder="(555) 123-4567"
                    className="text-base h-12 rounded-lg border-gray-200 focus-visible:ring-[#1877F2]"
                    maxLength={14}
                  />
                  <Button
                    onClick={handleContactSubmit}
                    className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white text-base py-3 h-auto rounded-lg font-medium"
                    disabled={!formData.firstName.trim() || !formData.lastName.trim() || formData.phone.replace(/\D/g, '').length !== 10 || isSubmitting}
                    data-tf-element-role="submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed" data-tf-element-role="consent-language">
                  By clicking "Submit," I expressly consent to receive marketing calls, text messages, and emails from Health Helpers Insurance Agency and its licensed insurance agents regarding Medicare and related insurance products, including through the use of an automatic telephone dialing system, artificial or prerecorded voice messages, and AI technologies. Message and data rates may apply. Message frequency varies. Consent is not a condition of purchase. You may opt out at any time by replying STOP to text messages. By submitting this form, you agree to the{' '}
                  <Link to="/terms-of-service" className="underline hover:text-gray-600">Terms and Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <FormLoadingProgress
              ref={loadingRef}
              planType={formData.plan}
              firstName={formData.firstName}
            />
          )}
        </div>

        {/* Confirmation Screen */}
        {step === 'confirmation' && (
          <div className="max-w-lg mx-auto px-4">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Thank You, {formData.firstName}!
              </h2>

              <p className="text-gray-600 text-base leading-relaxed mb-6 max-w-md mx-auto">
                We found potential savings on your Medicare Supplement. A licensed agent will reach out by phone and text shortly to walk you through your options — at no cost to you.
              </p>

              <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-xs mb-6">
                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Licensed Agents</span>
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> 100% Free</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> No Obligation</span>
              </div>

              <div className="border-t border-gray-200 pt-5">
                <p className="text-gray-500 text-sm mb-2">
                  Need immediate help? Call us directly:
                </p>
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center gap-2 text-[#1877F2] hover:text-[#166FE5] font-semibold text-lg"
                >
                  <Phone className="h-5 w-5" />
                  {PHONE_NUMBER}
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mobile spacer */}
      <div className="h-[50vh]" />

      {/* Footer — minimal */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6 text-center text-[11px] text-gray-400 leading-relaxed">
        <div className="max-w-lg mx-auto px-4 space-y-3">
          <p>
            This is a free rate comparison service. We are paid a commission by insurance carriers when a policy is sold.
          </p>
          <p>
            Health Helpers is not connected with or endorsed by the U.S. government or the federal Medicare program. Medicare Supplement insurance is sold by private insurance companies.
          </p>
          <p>
            Quoted rates are estimates based on information provided and may vary. Final rates are determined by the insurance carrier based on underwriting.
          </p>
          <p>&copy; {new Date().getFullYear()} Health Helpers. All rights reserved.</p>
          <div className="space-x-4 text-gray-500">
            <Link to="/privacy-policy" className="underline hover:text-gray-600">Privacy Policy</Link>
            <Link to="/terms-of-service" className="underline hover:text-gray-600">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MedicareLeadForm;
