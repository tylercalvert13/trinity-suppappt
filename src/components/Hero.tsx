import { Button } from "@/components/ui/button";
import { Shield, DollarSign, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-hero text-primary-foreground py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Are You Overpaying for
            <span className="block text-accent">Medicare Supplement Coverage?</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Plan G, F, and N policyholders across America are saving $100-200/month by switching 
            carriers—with the exact same coverage. Our licensed agents help you compare rates and 
            keep more money in your pocket.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="hero" className="text-lg px-8 py-6" onClick={() => window.location.href = 'tel:+12012988393'}>
              Call (201) 298-8393
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
              <span className="text-sm font-medium">Trusted by Thousands</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
