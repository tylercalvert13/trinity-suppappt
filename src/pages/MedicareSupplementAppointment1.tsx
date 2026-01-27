import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Users, FileCheck, CheckCircle, AlertCircle, Loader2, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { useCalendarWarmup } from '@/hooks/useCalendarWarmup';
import { AppointmentBookingWidgetWithOptIn } from '@/components/AppointmentBookingWidgetWithOptIn';
import { getStateFromZip } from '@/lib/zipToState';

// Outbound call number for this funnel
const PHONE_NUMBER = "(201) 426-9898";
const PHONE_TEL = "tel:+12014269898";

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

const MedicareSupplementAppointment1 = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FunnelStep>("landing");
  const [disqualReason, setDisqualReason] = useState<DisqualReason | null>(null);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  const [detectedState, setDetectedState] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
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
  });

  const { visitorId, sessionId, trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('suppappt1');
  
  // Warmup the calendar edge function early
  useCalendarWarmup();

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
    
    const timeout = setTimeout(() => {
      setIsLoadingLocation(false);
    }, 1500);
    
    detectLocation().finally(() => clearTimeout(timeout));
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
    // 10 steps now (no contact step)
    const steps: FunnelStep[] = ["plan", "payment", "care", "treatment", "medications", "gender", "tobacco", "spouse", "age", "zip"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const getStepNumber = (): number => {
    const steps: FunnelStep[] = ["plan", "payment", "care", "treatment", "medications", "gender", "tobacco", "spouse", "age", "zip"];
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

  // Go directly to loading after zip (no contact step)
  const handleZipSubmit = async () => {
    if (!/^\d{5}$/.test(formData.zipCode)) return;
    
    setStep("loading");
    setIsSubmitting(true);
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
        setStep("zip");
        return;
      }

      if (data?.cannotBeatRate) {
        await saveSubmission("knockout");
        navigate("/great-rate");
        return;
      }

      if (data?.error) {
        setError(data.error);
        setStep("zip");
        return;
      }

      // Success - we have a quote
      setQuoteResult(data);
      await saveSubmission("success", undefined, data);
      
      // Track qualification (no Facebook tracking for suppappt1!)
      trackQualification("qualified");
      
      setStep("qualified");

    } catch (err) {
      console.error("Error getting quote:", err);
      setError("An error occurred. Please try again or call us directly.");
      setStep("zip");
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
        // No contact info in suppappt1 - collected later in booking widget
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        submission_type: submissionType,
        disqualification_reason: disqualificationReason || null,
        quoted_rate: quoteData?.rate || null,
        quoted_carrier: quoteData?.carrier || null,
        am_best_rating: quoteData?.amBestRating || null,
        monthly_savings: quoteData?.monthlySavings || null,
        annual_savings: quoteData?.annualSavings || null,
        page: 'suppappt1',
      }]);
    } catch (error) {
      console.error("Error saving submission:", error);
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

          {(() => {
            const displayState = formData.zipCode 
              ? getStateFromZip(formData.zipCode) 
              : detectedState;
            const stateText = displayState && displayState !== "American" 
              ? `in ${displayState} ` 
              : "";
            
            if (isLoadingLocation && !formData.zipCode) {
              return (
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Seniors <span className="inline-block bg-white/20 rounded animate-pulse w-24 h-8 align-middle mx-1"></span> on Plan G, F, or N Are Overpaying by $100-200/Month
                </h1>
              );
            }
            
            return (
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Seniors {stateText}on Plan G, F, or N Are Overpaying by $100-200/Month
              </h1>
            );
          })()}
          
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
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

          {/* ZIP Code Input - triggers quote on submit */}
          {step === "zip" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Step {getStepNumber()} of 10</span>
                  <span className="text-sm text-muted-foreground">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                What is your ZIP code?
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
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6 h-auto rounded-xl"
                  disabled={!/^\d{5}$/.test(formData.zipCode) || isSubmitting}
                >
                  {isSubmitting ? "Getting Your Quote..." : "See My New Rate"}
                </Button>
              </div>
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

          {/* Qualified/Results Screen - Booking Widget with Opt-In */}
          {step === "qualified" && quoteResult && (
            <div className="space-y-6">
              {/* Success Header */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Great News!
                </h1>
                <p className="text-xl md:text-2xl font-semibold text-green-600 mb-2">
                  You Qualify for {formData.plan} at ${quoteResult.rate.toFixed(2)}/month
                </p>
                <p className="text-lg text-foreground font-medium">
                  That's <span className="text-green-600 font-bold">${quoteResult.monthlySavings.toFixed(2)} LESS</span> than what you're paying now!
                </p>
              </div>

              {/* Lock In Rate CTA */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-800 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">This rate won't last forever</span>
                </div>
                <p className="text-lg text-foreground">
                  To lock in your <span className="font-bold text-green-600">${quoteResult.monthlySavings.toFixed(2)}/month savings</span>,
                  <br />pick a time below for a quick 2-minute call — no obligation.
                </p>
                <div className="mt-4 flex justify-center">
                  <ChevronDown className="h-8 w-8 text-amber-600 animate-bounce" />
                </div>
              </div>

              {/* Appointment Booking Widget with Contact Opt-In */}
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

    </div>
  );
};

export default MedicareSupplementAppointment1;
