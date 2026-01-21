import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, Shield, Users, FileCheck, Heart } from 'lucide-react';

const PHONE_NUMBER = "(888) 525-1179";
const PHONE_TEL = "tel:+18885251179";

const getReasonMessage = (reason: string | null) => {
  switch (reason) {
    case 'care':
      return {
        title: "We Understand Your Situation",
        message: "Based on your current living situation or care needs, you may not qualify for a standard rate reduction through our online process. However, our licensed agents specialize in finding options for people in all situations.",
        subtext: "Many of our clients with similar circumstances have found coverage options they didn't know existed.",
      };
    case 'treatment':
      return {
        title: "Health History Doesn't Disqualify You",
        message: "While recent health events may affect standard underwriting, our agents work with carriers that have special programs for people with various health histories.",
        subtext: "Let us review your specific situation - you may have more options than you think.",
      };
    case 'medications':
      return {
        title: "Medication Use? We Can Still Help",
        message: "Certain medications can affect standard rate quotes, but that doesn't mean you're without options. Our agents are experts at finding carriers with more flexible underwriting guidelines.",
        subtext: "Many clients using insulin or pain medications have successfully found competitive rates through our agents.",
      };
    default:
      return {
        title: "Let's Discuss Your Options",
        message: "Based on your answers, we'd like to have one of our licensed agents review your situation personally. There may be options available that aren't shown in our standard quote process.",
        subtext: "A quick phone call can help us understand your needs better.",
      };
  }
};

const Disqualified = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const { title, message, subtext } = getReasonMessage(reason);

  useEffect(() => {
    document.title = "Let's Talk | Health Helpers";
    
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    return () => {
      document.title = "Medicare Self-Enrollment Online | Health Helpers";
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-blue-600/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
            {message}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
            <p className="text-muted-foreground mb-8 text-lg">
              {subtext}
            </p>

            {/* Call CTA */}
            <a href={PHONE_TEL} className="block mb-6">
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl py-8 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="mr-3 h-6 w-6" />
                Speak With an Agent Now
              </Button>
            </a>
            <p className="text-lg font-semibold text-foreground mb-8">{PHONE_NUMBER}</p>

            {/* Live Agent Badge */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-600 font-medium">Agents Available Now</span>
            </div>

            {/* Trust Elements */}
            <div className="border-t pt-8">
              <p className="text-muted-foreground mb-6">
                Our licensed agents are here to help, not to pressure you.
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

          {/* Alternative Options */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-foreground mb-3">What Our Agents Can Do</h3>
            <ul className="text-muted-foreground text-sm space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Review your specific health situation confidentially</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Check carriers with more flexible underwriting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Explain all your coverage options clearly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">✓</span>
                <span>Answer questions about Medicare Supplement plans</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-gray-50 mt-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-4">
            <p>
              This is a free service. We do not charge fees. By calling, you consent to speak with a licensed insurance agent about Medicare Supplement insurance.
            </p>
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

      {/* Sticky Call Button (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
        <a href={PHONE_TEL} className="block">
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-4 h-auto rounded-xl"
          >
            <Phone className="mr-2 h-5 w-5" />
            Call Now - {PHONE_NUMBER}
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Disqualified;
