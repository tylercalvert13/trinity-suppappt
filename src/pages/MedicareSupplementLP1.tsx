import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, CheckCircle, Clock, Shield, Users, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

import { supabase } from "@/integrations/supabase/client";
import { useFunnelAnalytics } from "@/hooks/useFunnelAnalytics";

// Taboola pixel type declaration
declare global {
  interface Window {
    _tfa?: Array<{ notify: string; name: string; id: number }>;
    fbq?: (...args: any[]) => void;
  }
}

type FunnelStep = "q1" | "q2" | "q3" | "loading" | "qualified" | "disqualified";
type DisqualReason = "no-plan" | "health-issues" | "medications";

const PHONE_NUMBER = "+1 (888) 525-1179";
const PHONE_TEL = "tel:+18885251179";

// Track Taboola conversion for qualified leads
const trackTaboolaConversion = () => {
  if (typeof window !== 'undefined' && window._tfa) {
    window._tfa.push({
      notify: 'event',
      name: 'qualified_lead',
      id: 1977536
    });
  }
};

// Get Facebook cookies for deduplication
const getFacebookCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return {
    fbc: cookies['_fbc'] || undefined,
    fbp: cookies['_fbp'] || undefined,
  };
};

// Generate or retrieve persistent visitor ID for improved match quality
const getVisitorId = (): string => {
  const storageKey = 'hh_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }
  
  return visitorId;
};

// Generate unique event ID for deduplication
const generateEventId = (): string => {
  return crypto.randomUUID();
};

// Track Facebook Conversion API event
const trackFacebookConversion = async () => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    const event_id = generateEventId();
    const external_id = getVisitorId();
    
    // Send server-side event via Edge Function
    const { error } = await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'InboundCall',
        event_source_url: window.location.href,
        fbc,
        fbp,
        event_id,
        external_id,
      },
    });

    if (error) {
      console.error('Facebook Conversion API error:', error);
    }
  } catch (err) {
    console.error('Failed to track Facebook conversion:', err);
  }
};

// Combined tracking function for call clicks
const handleCallClick = () => {
  trackTaboolaConversion();
  trackFacebookConversion();
};

const MedicareSupplementLP1 = () => {
  const [step, setStep] = useState<FunnelStep>("q1");
  const [disqualReason, setDisqualReason] = useState<DisqualReason | null>(null);
  const [applicationNumber, setApplicationNumber] = useState("");
  const [countdown, setCountdown] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  
  // Analytics tracking
  const { trackStepChange, trackQualification, trackCallClick } = useFunnelAnalytics('supp1');

  // SEO Metadata Management
  useEffect(() => {
    // Store original values for cleanup
    const originalTitle = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const originalDescription = metaDescription?.getAttribute("content") || "";
    
    // Set page-specific title
    document.title = "Medicare Supplement Rate Check | Health Helpers";
    
    // Set page-specific description
    if (metaDescription) {
      metaDescription.setAttribute("content", "Check if you qualify for a Medicare Supplement rate reduction. Free 30-second check for Plan G, F, and N policyholders.");
    }
    
    // Add noindex, nofollow for paid landing page
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');
    
    // Add canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', 'https://healthhelpers.co/supp1');
    
    // Update Open Graph tags
    const updateMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    
    updateMetaTag('og:title', 'Medicare Supplement Rate Check | Health Helpers');
    updateMetaTag('og:description', 'Check if you qualify for a Medicare Supplement rate reduction. Free 30-second check for Plan G, F, and N policyholders.');
    updateMetaTag('og:url', 'https://healthhelpers.co/supp1');
    updateMetaTag('og:type', 'website');
    
    // Update Twitter tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    
    updateTwitterTag('twitter:title', 'Medicare Supplement Rate Check | Health Helpers');
    updateTwitterTag('twitter:description', 'Check if you qualify for a Medicare Supplement rate reduction. Free 30-second check for Plan G, F, and N policyholders.');
    
    // Cleanup function to restore original values
    return () => {
      document.title = originalTitle;
      if (metaDescription) {
        metaDescription.setAttribute("content", originalDescription);
      }
      // Remove robots tag (allow indexing on other pages)
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
      // Remove canonical
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.remove();
    };
  }, []);

  // Generate random application number
  useEffect(() => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setApplicationNumber(`SM${randomNum}`);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!timerActive || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return { mins: mins.toString().padStart(2, "0"), secs: secs.toString().padStart(2, "0") };
  };

  const handleQ1Answer = (answer: string) => {
    if (answer === "yes") {
      setStep("q2");
      trackStepChange("q2", answer);
    } else {
      setDisqualReason("no-plan");
      setStep("disqualified");
      trackStepChange("disqualified", answer);
      trackQualification("disqualified", "no-plan");
    }
  };

  const handleQ2Answer = (answer: string) => {
    if (answer === "no") {
      setStep("q3");
      trackStepChange("q3", answer);
    } else {
      setDisqualReason("health-issues");
      setStep("disqualified");
      trackStepChange("disqualified", answer);
      trackQualification("disqualified", "health-issues");
    }
  };

  const handleQ3Answer = (answer: string) => {
    if (answer === "no") {
      setStep("loading");
      trackStepChange("loading", answer);
      setTimeout(() => {
        setStep("qualified");
        setTimerActive(true);
        trackStepChange("qualified");
        trackQualification("qualified");
      }, 2500);
    } else {
      setDisqualReason("medications");
      setStep("disqualified");
      trackStepChange("disqualified", answer);
      trackQualification("disqualified", "medications");
    }
  };

  const handleCallClickWithAnalytics = () => {
    handleCallClick();
    trackCallClick();
  };

  const getDisqualMessage = () => {
    switch (disqualReason) {
      case "no-plan":
        return "Unfortunately, this program is only available for current Medicare Supplement Plan G, F, or N policyholders. If you'd like to learn more about Medicare Supplement options, please call us.";
      case "health-issues":
        return "Unfortunately, based on your health history, we may not be able to offer immediate rate reductions through this program. However, our licensed agents can discuss your specific situation.";
      case "medications":
        return "Unfortunately, based on your current medications, we may not be able to offer immediate rate reductions through this program. However, our licensed agents can discuss your specific situation.";
      default:
        return "";
    }
  };

  const time = formatTime(countdown);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-background">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 text-center">
          {/* Headline */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            Paying Too Much for Plan G, F, or N?{" "}
            <span className="text-green-600">Get Your Free Rate Check in 30 Seconds</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Same coverage. Same doctors. Lower premium. Answer 3 quick questions to see if you qualify.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Licensed Agents</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">No Obligation</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-muted-foreground">Free Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Qualification Funnel */}
      <section className="py-4 md:py-8">
        <div className="max-w-xl mx-auto px-4">
          
          {/* Question 1 */}
          {step === "q1" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Question 1 of 3</span>
                  <span className="text-sm text-muted-foreground">33%</span>
                </div>
                <Progress value={33} className="h-2" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
                Do you currently have Medicare Supplement Plan G, F, or N?
              </h2>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleQ1Answer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="q1-yes" className="h-6 w-6" />
                  <Label htmlFor="q1-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleQ1Answer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="q1-no" className="h-6 w-6" />
                  <Label htmlFor="q1-no" className="text-lg cursor-pointer flex-1">No</Label>
                </div>
                <div
                  onClick={() => handleQ1Answer("not-sure")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="not-sure" id="q1-not-sure" className="h-6 w-6" />
                  <Label htmlFor="q1-not-sure" className="text-lg cursor-pointer flex-1">Not Sure</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Social Proof - shown during questions */}
          {(step === "q1" || step === "q2" || step === "q3") && (
            <div className="bg-white rounded-xl p-6 border space-y-4 mt-6">
              <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wide">Real Savings from Real People</p>
              
              <div className="space-y-3">
                {/* Patricia's Review */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Patricia</span>
                        <span className="text-green-600 font-bold text-sm">Saved $178/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">"I couldn't believe it was this easy. Same Plan G coverage, just with a different company. Now I'm saving over $2,000 a year!"</p>
                    </div>
                  </div>
                </div>

                {/* Loyce's Review */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Loyce</span>
                        <span className="text-green-600 font-bold text-sm">Saved $213/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">"The agent was so helpful and made the switch seamless. My Plan F benefits stayed exactly the same—just paying a lot less now."</p>
                    </div>
                  </div>
                </div>

                {/* Ronald's Review */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">R</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Ronald</span>
                        <span className="text-green-600 font-bold text-sm">Saved $291/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">"I was skeptical at first, but the savings are real. Same Plan G, same coverage—just $291 less every month."</p>
                    </div>
                  </div>
                </div>

                {/* Gayle's Review */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">Gayle</span>
                        <span className="text-green-600 font-bold text-sm">Saved $249/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">"My Plan N benefits didn't change at all. I wish I had done this years ago—$249 a month adds up fast!"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question 2 */}
          {step === "q2" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Question 2 of 3</span>
                  <span className="text-sm text-muted-foreground">66%</span>
                </div>
                <Progress value={66} className="h-2" />
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                In the last 2 years, have you had any of the following?
              </h2>
              
              <ul className="text-muted-foreground mb-6 space-y-1 text-sm md:text-base">
                <li>• Cancer, heart attack, stroke, or congestive heart failure</li>
                <li>• Kidney failure or needed oxygen at home</li>
                <li>• Live in a nursing home or assisted living</li>
                <li>• Need daily help with bathing, dressing, or eating</li>
              </ul>

              <RadioGroup className="space-y-4">
                <div
                  onClick={() => handleQ2Answer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="q2-yes" className="h-6 w-6" />
                  <Label htmlFor="q2-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleQ2Answer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="q2-no" className="h-6 w-6" />
                  <Label htmlFor="q2-no" className="text-lg cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Question 3 */}
          {step === "q3" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Question 3 of 3</span>
                  <span className="text-sm text-muted-foreground">99%</span>
                </div>
                <Progress value={99} className="h-2" />
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
                  onClick={() => handleQ3Answer("yes")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="yes" id="q3-yes" className="h-6 w-6" />
                  <Label htmlFor="q3-yes" className="text-lg cursor-pointer flex-1">Yes</Label>
                </div>
                <div
                  onClick={() => handleQ3Answer("no")}
                  className="flex items-center space-x-4 p-4 md:p-5 border-2 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <RadioGroupItem value="no" id="q3-no" className="h-6 w-6" />
                  <Label htmlFor="q3-no" className="text-lg cursor-pointer flex-1">No</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Loading Screen */}
          {step === "loading" && (
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border text-center">
              <div className="mb-6">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                Checking available rates...
              </h2>
              <p className="text-muted-foreground">This will only take a moment</p>
            </div>
          )}

          {/* Qualified Screen */}
          {step === "qualified" && (
            <div className="space-y-6">
              {/* Success Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Congratulations!
                </h2>
                <p className="text-xl text-green-600 font-semibold mb-4">
                  You Pre-Qualify for a Reduced Rate
                </p>
                <p className="text-muted-foreground mb-6">
                  Based on your answers, you pre-qualify for a Medicare Supplement rate reduction without changing your coverage.
                </p>

                {/* Application Number */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 inline-block">
                  <span className="text-sm text-muted-foreground">Application Reference: </span>
                  <span className="font-mono font-bold text-foreground">{applicationNumber}</span>
                </div>

                {/* Live Agent Badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-green-600 font-medium">US Based Licensed Agent Holding Your Spot</span>
                </div>

                {/* Call Button */}
                <a href={PHONE_TEL} className="block" onClick={handleCallClick}>
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xl py-8 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <Phone className="mr-3 h-6 w-6" />
                    Tap To Call Now
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
                      Agent Holding Your Spot For:
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



              {/* Trust Elements */}
              <div className="bg-white rounded-xl p-6 border">
                <p className="text-center text-muted-foreground mb-4">
                  A licensed agent can explain your options and handle everything for you.
                </p>
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
            </div>
          )}

          {/* Disqualified Screen */}
          {step === "disqualified" && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                We'd Still Like to Help
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {getDisqualMessage()}
              </p>

              <a href={PHONE_TEL} className="block" onClick={handleCallClick}>
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 h-auto rounded-xl"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call {PHONE_NUMBER}
                </Button>
              </a>
              
              <p className="text-sm text-muted-foreground mt-4">
                Our licensed agents are available to discuss your options.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Spacer to push footer below fold */}
      <div className="h-[50vh]" />

      {/* Footer Disclaimers */}
      <footer className="py-8 md:py-12 bg-gray-50 mt-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-4">
            <p>
              This is a free rate comparison service. We do not charge fees. By calling, you consent to speak with a licensed insurance agent about Medicare Supplement insurance.
            </p>
            <p>
              Health Helpers is not connected with or endorsed by the U.S. government or the federal Medicare program. Medicare Supplement insurance is sold by private insurance companies.
            </p>
            <p>
              Eligibility for rate reduction depends on factors including your current health, age, and location. Pre-qualification does not guarantee acceptance or a specific rate.
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

export default MedicareSupplementLP1;
