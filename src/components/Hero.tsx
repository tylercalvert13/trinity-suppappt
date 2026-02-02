import { Button } from "@/components/ui/button";
import { Shield, DollarSign, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-hero text-primary-foreground py-20" aria-label="Medicare Supplement Rate Comparison">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading - Optimized for LLM/SEO */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Are You Overpaying for
            <span className="block text-accent">Medicare Supplement Insurance?</span>
          </h1>
          
          {/* Subheading - LLM-friendly with specific details */}
          <p className="text-lg sm:text-xl md:text-2xl mb-4 text-primary-foreground/90 max-w-3xl mx-auto">
            Plan G, F, and N policyholders across America are saving <strong>$100-200/month</strong> by switching 
            carriers—with the exact same coverage. All Medigap plans are federally standardized: 
            <em>Plan G is Plan G</em>, no matter which company you buy from.
          </p>
          
          {/* Target audience qualifier for LLM context */}
          <p className="text-base sm:text-lg mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
            If you're a current Medicare Supplement policyholder and haven't compared rates recently, 
            you could be paying more than necessary for identical coverage.
          </p>

          {/* Call to Action - Redirects to /suppappt funnel */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              variant="hero" 
              className="text-lg px-8 py-6 bg-accent text-accent-foreground hover:bg-accent/90" 
              onClick={() => window.location.href = '/suppappt'}
            >
              See How Much I Can Save
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => window.location.href = '/suppappt'}
            >
              Compare Rates in 2 Minutes
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-2">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Licensed in All 50 States</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <DollarSign className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">No-Obligation Rate Comparison</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Same Coverage, Lower Price</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Award className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">A+ Rated Carriers Only</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
