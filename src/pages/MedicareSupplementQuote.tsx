import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Phone, Shield, Users, FileCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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

const trackFacebookConversion = async () => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const eventId = generateEventId();
    
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: window.location.href,
        external_id: getVisitorId(),
        fbc,
        fbp,
        event_id: eventId,
      }
    });
    console.log('Facebook Lead conversion tracked');
  } catch (error) {
    console.error('Error tracking Facebook conversion:', error);
  }
};

const MedicareSupplementQuote = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FunnelStep>("landing");
  const [disqualReason, setDisqualReason] = useState<DisqualReason | null>(null);
  const [countdown, setCountdown] = useState(90);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  
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

  const { visitorId, sessionId, trackStepChange, trackQualification, trackCallClick } = useFunnelAnalytics('suppquote');

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

      // Track conversions
      trackQualification("qualified");
      trackTaboolaConversion();
      await trackFacebookConversion();
      
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
    trackFacebookConversion();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          {/* Breaking News Badge */}
          <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
            <span className="mr-2">📰</span>
            BREAKING: Medicare Supplement Rate Reductions Available
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Find Out If You're Paying Too Much for Medicare Supplement
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get a personalized quote from top-rated carriers in under 2 minutes
          </p>

          {step === "landing" && (
            <Button
              onClick={scrollToFunnel}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white text-xl py-8 px-12 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get My Free Quote
            </Button>
          )}

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-blue-100">
              <Shield className="h-5 w-5" />
              <span className="text-sm">Licensed Agents</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Users className="h-5 w-5" />
              <span className="text-sm">No Obligation</span>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <FileCheck className="h-5 w-5" />
              <span className="text-sm">Free Service</span>
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
                What Medicare Supplement plan do you currently have?
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
                How much do you currently pay per month?
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

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                Almost done! Where should we send your quote?
              </h2>

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
                  {isSubmitting ? "Getting Your Quote..." : "Get My Personalized Quote"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By submitting, you agree to be contacted by a licensed insurance agent.
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
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Great News, {formData.firstName}!
                </h2>
                <p className="text-xl text-green-600 font-semibold mb-6">
                  We found the same coverage for {quoteResult.savingsPercent?.toFixed(0)}% less
                </p>

                {/* Rate Comparison */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Current Rate</p>
                      <p className="text-2xl font-bold text-muted-foreground line-through">
                        ${parseFloat(formData.currentPayment).toFixed(2)}/mo
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-green-600 mb-1">New Rate</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${quoteResult.rate.toFixed(2)}/mo
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold text-foreground">
                      You could save <span className="text-green-600">${quoteResult.annualSavings.toFixed(0)}/year</span>
                    </p>
                  </div>
                </div>

                {/* Carrier Info */}
                <div className="flex items-center justify-center gap-2 mb-6 text-muted-foreground">
                  <span>Quote from: <strong className="text-foreground">{quoteResult.carrier}</strong></span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm font-medium">
                    AM Best: {quoteResult.amBestRating}
                  </span>
                </div>

                {/* Live Agent Badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-green-600 font-medium">Agent Ready to Finalize Your Quote</span>
                </div>

                {/* Call Button */}
                <a href={PHONE_TEL} className="block" onClick={handleCallClick}>
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Phone className="mr-3 h-6 w-6" />
                    Yes, Call Me About This Rate
                  </Button>
                </a>
                <p className="text-lg font-semibold text-foreground mt-3">{PHONE_NUMBER}</p>
              </div>

              {/* Countdown Timer */}
              {countdown > 0 && (
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

              {/* What Happens Next */}
              <div className="bg-white rounded-xl p-6 border">
                <h3 className="font-bold text-foreground mb-4">What Happens Next?</h3>
                <ol className="space-y-3 text-muted-foreground text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                    <span>Call the number above to speak with a licensed agent</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                    <span>They'll verify your information and confirm your rate</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                    <span>If approved, your new coverage starts with no gap in protection</span>
                  </li>
                </ol>
              </div>

              {/* Trust Elements */}
              <div className="bg-white rounded-xl p-6 border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <Shield className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">Licensed Agents</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">No Obligation</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <FileCheck className="h-6 w-6 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">Free Service</span>
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

      {/* Sticky Call Button (Mobile - Qualified Only) */}
      {step === "qualified" && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
          <a href={PHONE_TEL} className="block" onClick={handleCallClick}>
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-4 h-auto rounded-xl"
            >
              <Phone className="mr-2 h-5 w-5" />
              Call Now - {PHONE_NUMBER}
            </Button>
          </a>
        </div>
      )}
    </div>
  );
};

export default MedicareSupplementQuote;
