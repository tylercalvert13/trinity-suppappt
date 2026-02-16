import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Shield, Users, FileCheck, CheckCircle, Play, Phone, Loader2 } from 'lucide-react';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';

const SUNFIRE_URL = "https://www.sunfirematrix.com/app/consumer/ember/?sfpath=int&sfagid=20273920#/";

const PHONE_NUMBER = "(201) 426-9898";
const PHONE_TEL = "tel:+12014269898";

type FunnelStep = "landing" | "iep" | "medicare_card" | "video" | "confirm" | "enroll";

const MedicareAdvantage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<FunnelStep>("landing");
  const funnelRef = useRef<HTMLDivElement>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [checklist, setChecklist] = useState({
    watchedVideo: false,
    hasMedicareCard: false,
    understandsSelfEnroll: false,
  });

  // Start preloading iframe once user passes medicare_card step
  const shouldPreload = step === "video" || step === "confirm" || step === "enroll";

  const { trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('advantage');

  // Auto-scroll on step changes
  useEffect(() => {
    if (step !== "landing") {
      setTimeout(() => {
        questionContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [step]);

  // SEO meta tags
  useEffect(() => {
    document.title = "Medicare Advantage Self-Enrollment | Health Helpers";

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Enroll in the best Medicare Advantage plan by yourself. No agent needed.');
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
        metaDescription.setAttribute('content', 'Enroll in Medicare plans online by yourself.');
      }
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  const scrollToFunnel = () => {
    setStep("iep");
    trackStepChange("iep");
    setTimeout(() => {
      funnelRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const getProgress = (): number => {
    const steps: FunnelStep[] = ["iep", "medicare_card", "video", "confirm", "enroll"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex === -1) return 0;
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const getStepNumber = (): number => {
    const steps: FunnelStep[] = ["iep", "medicare_card", "video", "confirm", "enroll"];
    return steps.indexOf(step) + 1;
  };

  const handleIEPAnswer = (answer: string) => {
    if (answer === "no") {
      trackQualification("disqualified", "iep");
      navigate("/disqualified?reason=iep");
      return;
    }
    setStep("medicare_card");
    trackStepChange("medicare_card", answer);
  };

  const handleMedicareCardAnswer = (answer: string) => {
    if (answer === "no") {
      trackQualification("disqualified", "medicare_card");
      navigate("/disqualified?reason=medicare_card");
      return;
    }
    setStep("video");
    trackStepChange("video", answer);
  };

  const handleVideoWatched = () => {
    setStep("confirm");
    trackStepChange("confirm");
  };

  const handleConfirmProceed = () => {
    trackQualification("qualified", "self_enroll");
    setStep("enroll");
    trackStepChange("enroll");
  };

  const allChecked = checklist.watchedVideo && checklist.hasMedicareCard && checklist.understandsSelfEnroll;

  // ─── RENDER ───

  const renderLanding = () => (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
          <Shield className="h-4 w-4 text-blue-200" />
          <span className="text-sm text-blue-100">Self-Service Enrollment Tool</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
          Enroll in the Best Medicare Advantage Plan — <span className="text-blue-200">By Yourself</span>
        </h1>

        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8">
          Turning 65? Watch our quick guide, then enroll in a top-rated Medicare Advantage plan — no agent, no phone call needed.
        </p>

        <Button
          onClick={scrollToFunnel}
          size="lg"
          className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8 py-6 rounded-xl shadow-lg font-semibold"
        >
          Get Started
        </Button>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>100% Free</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>No Agent Required</span>
          </div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            <span>Licensed & Secure</span>
          </div>
        </div>
      </div>
    </section>
  );

  const renderIEP = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-2">
        Are you turning 65 within the next 3 months, or have you turned 65 in the last 3 months?
      </h2>
      <p className="text-muted-foreground text-center mb-6 text-sm">
        You must be in your Initial Election Period (IEP) to use this tool.
      </p>
      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={() => handleIEPAnswer("yes")}
          variant="outline"
          className="w-full py-6 text-lg font-semibold border-2 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
        >
          Yes
        </Button>
        <Button
          onClick={() => handleIEPAnswer("no")}
          variant="outline"
          className="w-full py-6 text-lg font-semibold border-2 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
        >
          No
        </Button>
      </div>
    </div>
  );

  const renderMedicareCard = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-2">
        Do you have your Medicare card or know your MBI number?
      </h2>
      <p className="text-muted-foreground text-center mb-6 text-sm">
        You'll need your Medicare Beneficiary Identifier (MBI) number to enroll.
      </p>
      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={() => handleMedicareCardAnswer("yes")}
          variant="outline"
          className="w-full py-6 text-lg font-semibold border-2 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
        >
          Yes, I have it ready
        </Button>
        <Button
          onClick={() => handleMedicareCardAnswer("no")}
          variant="outline"
          className="w-full py-6 text-lg font-semibold border-2 hover:border-blue-500 hover:bg-blue-50 rounded-xl"
        >
          No, I don't have it yet
        </Button>
      </div>
    </div>
  );

  const renderVideo = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-2">
        Watch This Quick Guide
      </h2>
      <p className="text-muted-foreground text-center mb-6 text-sm">
        Watch the full video to unlock the self-enrollment tool.
      </p>

      {/* Video placeholder */}
      <div className="rounded-xl overflow-hidden mb-6 border">
        <AspectRatio ratio={16 / 9}>
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
              <Play className="h-8 w-8 text-white ml-1" />
            </div>
            <span className="text-muted-foreground font-medium">Video Coming Soon</span>
          </div>
        </AspectRatio>
      </div>

      <Button
        onClick={handleVideoWatched}
        className="w-full py-6 text-lg font-semibold rounded-xl"
      >
        I've Watched the Full Video
      </Button>
    </div>
  );

  const renderConfirm = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-center mb-2">
        Before You Enroll, Confirm You're Ready
      </h2>
      <p className="text-muted-foreground text-center mb-6 text-sm">
        Check all boxes to proceed to self-enrollment.
      </p>

      <div className="space-y-4 mb-8">
        <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <Checkbox
            checked={checklist.watchedVideo}
            onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, watchedVideo: !!checked }))}
            className="mt-0.5"
          />
          <span className="text-base font-medium">I watched the full video</span>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <Checkbox
            checked={checklist.hasMedicareCard}
            onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, hasMedicareCard: !!checked }))}
            className="mt-0.5"
          />
          <span className="text-base font-medium">I have my Medicare card or MBI number ready</span>
        </label>

        <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
          <Checkbox
            checked={checklist.understandsSelfEnroll}
            onCheckedChange={(checked) => setChecklist(prev => ({ ...prev, understandsSelfEnroll: !!checked }))}
            className="mt-0.5"
          />
          <span className="text-base font-medium">I understand I'm enrolling myself without an agent</span>
        </label>
      </div>

      <Button
        onClick={handleConfirmProceed}
        disabled={!allChecked}
        className="w-full py-6 text-lg font-semibold rounded-xl"
      >
        Proceed to Self-Enrollment
      </Button>
    </div>
  );

  const renderEnroll = () => (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 rounded-full px-4 py-2 mb-4">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">You're Ready to Enroll!</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Self-Enrollment Tool
        </h2>
        <p className="text-muted-foreground">
          Use the tool below to find and enroll in the best Medicare Advantage plan for you.
        </p>
      </div>

      {/* Iframe */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden relative">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Loading enrollment tool…</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={SUNFIRE_URL}
          title="Medicare Advantage Self-Enrollment"
          width="100%"
          height="800"
          className="border-0 w-full min-h-[600px] md:min-h-[800px]"
          allow="payment"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>

      {/* Help text */}
      <div className="text-center mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Phone className="h-4 w-4 text-blue-700" />
          <span className="font-semibold text-blue-900">Need help?</span>
        </div>
        <p className="text-blue-700">
          Call us at{' '}
          <a href={PHONE_TEL} className="font-bold underline">{PHONE_NUMBER}</a>
        </p>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case "iep": return renderIEP();
      case "medicare_card": return renderMedicareCard();
      case "video": return renderVideo();
      case "confirm": return renderConfirm();
      case "enroll": return renderEnroll();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Landing or Hero */}
      {step === "landing" && renderLanding()}

      {/* Funnel steps */}
      {step !== "landing" && (
        <>
          {/* Compact header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-4">
            <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-200" />
                <span className="font-semibold text-sm md:text-base">Health Helpers</span>
              </div>
              <span className="text-xs text-blue-200">Self-Enrollment Tool</span>
            </div>
          </div>

          {/* Progress bar (hide on enroll step) */}
          {step !== "enroll" && (
            <div className="bg-white border-b py-3 sticky top-0 z-30">
              <div className="max-w-2xl mx-auto px-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {getStepNumber()} of 4
                  </span>
                  <span className="text-sm font-medium text-primary">{getProgress()}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
            </div>
          )}
        </>
      )}

      {/* Question / step content */}
      {step !== "landing" && (
        <div ref={funnelRef} className="py-8 md:py-12 px-4">
          <div ref={questionContainerRef}>
            {renderCurrentStep()}
          </div>

          {/* Hidden iframe preload — loads Sunfire in background during video/confirm steps */}
          {shouldPreload && step !== "enroll" && (
            <iframe
              src={SUNFIRE_URL}
              title="Preload enrollment tool"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute -left-[9999px] w-px h-px overflow-hidden"
              allow="payment"
            />
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-gray-50 mt-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-4">
            <p>
              Health Helpers is not connected with or endorsed by the U.S. government or the federal Medicare program.
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

export default MedicareAdvantage;
