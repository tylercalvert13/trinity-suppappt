import { Button } from "@/components/ui/button";
import { Shield, Heart, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-hero text-primary-foreground py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Enroll in Medicare Plans
            <span className="block text-accent"> Online by Yourself</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Skip the phone calls and meetings. Use our digital platform to compare and enroll in 
            Medicare plans from the comfort of your home. No pressure, no waiting.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="outline" className="bg-background text-primary hover:bg-background/90" onClick={() => window.location.href = 'tel:201-589-1901'}>
              Call Now
            </Button>
            <Button size="lg" variant="healthcare" onClick={() => window.location.href = 'tel:201-589-1901'}>
              Call Now
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-2">
              <Shield className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Online Platform</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Heart className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">No Phone Calls</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Self-Service</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Award className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Enroll at Home</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;