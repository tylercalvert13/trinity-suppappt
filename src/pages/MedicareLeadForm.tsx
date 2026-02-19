import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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

// StepCard component (extracted outside to avoid remount)
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

// Loading screen
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
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-800 mb-2 text-center">
            {firstName ? `Checking rates for you, ${firstName}...` : 'Checking rates...'}
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

  // Auto-scroll
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

  const getStepNumber = (): number => QUESTION_STEPS.indexOf(step) + 1;

  // Step handlers
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
      console.error('Validation error:', err);
    }

    setError(null);
    setStep('loading');
    setIsSubmitting(true);
    trackStepChange('loading');

    try {
      // Get TrustedForm cert
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

      // Call crm-quote-webhook — it quotes + posts to GHL
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
        // Retry once
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

      // Save submission
      await saveSubmission(
        status === 'quoted' ? 'success' : 'knockout',
        status !== 'quoted' ? 'no_savings' : undefined,
      );

      // Track Facebook
      await trackFacebookSubmissionEvent(formData);

      if (status === 'no_savings' || status === 'no_quotes') {
        navigate('/great-rate');
        return;
      }

      // Quoted — show confirmation
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
    <div className="min-h-screen bg-stone-50">
      {/* TrustedForm hidden fields */}
      <noscript>
        <img src="https://api.trustedform.com/ns.gif" height="1" width="1" style={{ display: 'none' }} alt="" />
      </noscript>
      <form style={{ position: 'absolute', left: '-9999px' }}>
        <input type="hidden" id="xxTrustedFormCertUrl_0" name="xxTrustedFormCertUrl" />
      </form>

      {/* Hero Section */}
      <section className="bg-stone-900 text-stone-100 py-12 md:py-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <p className="text-sm tracking-widest uppercase text-stone-400 mb-6 font-sans">
            Free Rate Check · No Obligation
          </p>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight mb-6 text-white">
            Are You Overpaying for Your Medicare Supplement?
          </h1>

          <p className="text-lg md:text-xl text-stone-300 mb-4 font-serif leading-relaxed max-w-lg mx-auto">
            Same coverage, different price. Find out if you could be paying less — it takes less than 60 seconds.
          </p>

          {step === 'landing' && (
            <>
              <Button
                onClick={scrollToFunnel}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white text-lg md:text-xl py-7 px-10 h-auto rounded-lg shadow-lg transition-all font-serif mt-4"
              >
                Check My Rate
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

          {/* Step 1: Plan */}
          {step === 'plan' && (
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                Which Medicare Supplement plan do you currently have?
              </h2>
              <p className="text-stone-500 mb-6">Select your plan below.</p>
              <RadioGroup className="space-y-3">
                {['Plan G', 'Plan N', 'Plan F'].map((plan) => (
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

          {/* Step 2: Gender */}
          {step === 'gender' && (
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
                What is your gender?
              </h2>
              <RadioGroup className="space-y-3">
                {[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map(({ value, label }) => (
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

          {/* Step 3: Spouse */}
          {step === 'spouse' && (
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6">
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
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
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
                onYes={() => handleHealthAnswer('yes')}
                onNo={() => handleHealthAnswer('no')}
              />
            </StepCard>
          )}

          {/* Step 5: Age */}
          {step === 'age' && (
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
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

          {/* Step 6: Payment */}
          {step === 'payment' && (
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
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

          {/* Step 7: ZIP */}
          {step === 'zip' && (
            <StepCard stepNumber={getStepNumber()} totalSteps={8} progress={getProgress()}>
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

          {/* Step 8: Contact */}
          {step === 'contact' && (
            <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 md:p-10 max-w-xl mx-auto" data-tf-element-role="offer">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500 font-serif">Last step</span>
                  <span className="text-sm text-stone-400">100%</span>
                </div>
                <Progress value={100} className="h-1.5" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">
                Where should we send your results?
              </h2>
              <p className="text-stone-500 mb-6">Enter your name and phone number so a licensed agent can share your rate.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                    className="text-lg h-14 rounded-lg border-stone-200 focus-visible:ring-stone-400"
                    autoFocus
                  />
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                    className="text-lg h-14 rounded-lg border-stone-200 focus-visible:ring-stone-400"
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
                  className="text-lg h-14 rounded-lg border-stone-200 focus-visible:ring-stone-400"
                  maxLength={14}
                />
                <Button
                  onClick={handleContactSubmit}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-lg py-6 h-auto rounded-lg font-serif"
                  disabled={!formData.firstName.trim() || !formData.lastName.trim() || formData.phone.replace(/\D/g, '').length !== 10 || isSubmitting}
                  data-tf-element-role="submit"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-stone-400 text-center mt-6 leading-relaxed" data-tf-element-role="consent-language">
                By clicking "Submit," I consent to receive calls, text messages, and emails
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
          <div className="max-w-xl mx-auto px-4">
            <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-800 mb-3">
                Thank You, {formData.firstName}!
              </h2>

              <p className="text-stone-600 font-serif text-lg leading-relaxed mb-8 max-w-md mx-auto">
                We found potential savings on your Medicare Supplement. A licensed agent will reach out by phone and text shortly to walk you through your options — at no cost to you.
              </p>

              <div className="flex flex-wrap justify-center gap-6 text-stone-500 text-sm mb-8">
                <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Licensed Agents</span>
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> 100% Free</span>
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> No Obligation</span>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <p className="text-stone-500 text-sm font-serif mb-3">
                  Need immediate help? Call us directly:
                </p>
                <a
                  href={PHONE_TEL}
                  className="inline-flex items-center gap-2 text-amber-700 hover:text-amber-800 font-serif font-bold text-lg"
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

      {/* Footer */}
      <footer className="bg-stone-100 border-t border-stone-200 py-8 text-center text-xs text-stone-400 leading-relaxed">
        <div className="max-w-xl mx-auto px-4 space-y-4">
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
          <div className="space-x-4 text-stone-500">
            <Link to="/privacy-policy" className="underline hover:text-stone-600">Privacy Policy</Link>
            <Link to="/terms-of-service" className="underline hover:text-stone-600">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MedicareLeadForm;
