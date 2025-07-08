import { Button } from "@/components/ui/button";
import { Shield, Heart, Users, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-hero text-primary-foreground py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Medicare Made Simple for
            <span className="block text-accent"> Seniors & Families</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Expert guidance for Medicare Advantage, Supplements, DVH plans, and ancillary health benefits. 
            Personalized service you can trust.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="outline" className="bg-background text-primary hover:bg-background/90">
              Free Consultation
            </Button>
            <Button size="lg" variant="healthcare">
              Compare Plans
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
              <span className="text-sm font-medium">Compassionate Care</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Senior Focused</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Award className="h-8 w-8 text-accent" />
              <span className="text-sm font-medium">Trusted Partners</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;