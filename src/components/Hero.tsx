import { Button } from "@/components/ui/button";
import { Shield, Heart, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-hero text-primary-foreground py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Expert Medicare Guidance
            <span className="block text-accent"> Personalized for You</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Get personalized help choosing the right Medicare plan. Our licensed agents guide you through 
            every step to find coverage that fits your needs and budget.
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
              <span className="text-sm font-medium">Licensed Agents</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Heart className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Personal Service</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Expert Guidance</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Award className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Trusted Service</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;