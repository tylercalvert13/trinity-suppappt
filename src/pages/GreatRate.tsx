import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Phone, Shield, Users, FileCheck, ThumbsUp, Star } from 'lucide-react';

const PHONE_NUMBER = "(888) 525-1179";
const PHONE_TEL = "tel:+18885251179";

const GreatRate = () => {
  useEffect(() => {
    document.title = "Great News About Your Rate | Trinity Health & Wealth";
    
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    return () => {
      document.title = "Medicare Self-Enrollment Online | Trinity Health & Wealth";
      if (robotsMeta) {
        robotsMeta.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-800 via-green-700 to-green-600 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ThumbsUp className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            You Already Have a Competitive Rate!
          </h1>
          
          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto">
            After comparing quotes from our carrier partners, your current rate is within the best available pricing for your area and profile.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border text-center">
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              What This Means for You
            </h2>
            
            <p className="text-muted-foreground mb-6">
              The rate you're currently paying is competitive with what top carriers are offering. This tells us your current insurance company values your business and is giving you a fair price.
            </p>

            <div className="bg-green-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-green-800 mb-3">
                Good News Summary
              </h3>
              <ul className="text-green-700 text-sm space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Your rate is competitive in the current market</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>No need to switch carriers right now</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1">✓</span>
                  <span>Keep enjoying your current coverage</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-8">
              <h3 className="font-semibold text-foreground mb-4">
                Want Us to Double-Check?
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Our agents can review your specific situation in more detail. Sometimes there are discounts or programs we can only verify over the phone.
              </p>

              {/* Call CTA */}
              <a href={PHONE_TEL} className="block mb-4">
                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 h-auto rounded-xl"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Verify My Rate With an Agent
                </Button>
              </a>
              <p className="text-foreground font-medium">{PHONE_NUMBER}</p>
            </div>
          </div>

          {/* Rate Check Reminder */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-blue-800 mb-3">
              💡 Pro Tip: Check Back Annually
            </h3>
            <p className="text-blue-700 text-sm">
              Medicare Supplement rates can change over time. We recommend checking rates again in 6-12 months, or whenever your rate increases, to make sure you're still getting the best deal.
            </p>
          </div>

          {/* Trust Elements */}
          <div className="mt-8 bg-white rounded-xl p-6 border">
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
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-gray-50 mt-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center text-xs text-muted-foreground space-y-4">
            <p>
              This is a free rate comparison service. We do not charge fees.
            </p>
            <p>
              Trinity Health & Wealth is not connected with or endorsed by the U.S. government or the federal Medicare program.
            </p>
            <div className="pt-4 border-t flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
                <span>•</span>
                <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
              </div>
              <p>© {new Date().getFullYear()} Trinity Health & Wealth. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GreatRate;
