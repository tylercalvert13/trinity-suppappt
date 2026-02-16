import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

const getReasonMessage = (reason: string | null) => {
  switch (reason) {
    case 'care':
      return {
        title: "Thank You for Your Time",
        message: "Based on your current situation, our online rate comparison tool isn't able to find you savings at this time.",
        subtext: "We appreciate you taking the time to check. We wish you all the best with your Medicare coverage.",
      };
    case 'treatment':
      return {
        title: "Thank You for Checking",
        message: "Based on your recent health history, our carriers are unable to offer reduced rates through this program.",
        subtext: "We appreciate your interest and wish you continued good health.",
      };
    case 'medications':
      return {
        title: "Thank You for Your Interest",
        message: "Based on your current medications, our rate comparison tool isn't able to find savings for you at this time.",
        subtext: "We wish you the best with your Medicare coverage.",
      };
    case 'iep':
      return {
        title: "Not Quite Eligible Yet",
        message: "You need to be in your Initial Election Period (turning 65 within 3 months, or turned 65 in the last 3 months) to use this self-enrollment tool.",
        subtext: "Contact us at (201) 426-9898 if you have questions about your eligibility.",
      };
    case 'medicare_card':
      return {
        title: "You'll Need Your Medicare Card",
        message: "To enroll in a Medicare Advantage plan, you'll need your Medicare card or MBI (Medicare Beneficiary Identifier) number.",
        subtext: "Contact us at (201) 426-9898 if you need help getting your Medicare card.",
      };
    default:
      return {
        title: "Thank You",
        message: "Unfortunately, we're unable to find you savings through our online comparison tool at this time.",
        subtext: "We appreciate you taking the time to check.",
      };
  }
};

const Disqualified = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const { title, message, subtext } = getReasonMessage(reason);

  useEffect(() => {
    document.title = "Thank You | Health Helpers";
    
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

            <Link to="/">
              <Button variant="outline" size="lg" className="px-8">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

export default Disqualified;
