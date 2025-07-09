import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Heart, FileText, Stethoscope, Users, CreditCard } from "lucide-react";

const Services = () => {
  const services = [
    {
      icon: Shield,
      title: "Medicare Advantage",
      description: "Comprehensive Medicare plans that often include prescription drug coverage, dental, vision, and wellness programs.",
      features: ["Low or $0 monthly premiums", "All-in-one coverage", "Extra benefits included"]
    },
    {
      icon: FileText,
      title: "Medicare Supplements",
      description: "Medigap insurance that helps pay for costs not covered by Original Medicare, giving you peace of mind.",
      features: ["Nationwide coverage", "Predictable costs", "Doctor choice freedom"]
    },
    {
      icon: Stethoscope,
      title: "DVH Plans",
      description: "Dental, Vision, and Hearing plans to keep you healthy and active in your golden years.",
      features: ["Affordable monthly rates", "Extensive provider networks", "Preventive care covered"]
    },
    {
      icon: Heart,
      title: "Hospital Indemnity",
      description: "Financial protection for unexpected hospital stays, helping cover out-of-pocket expenses.",
      features: ["Cash benefits", "No network restrictions", "Quick claim processing"]
    },
    {
      icon: Users,
      title: "Life Insurance",
      description: "Protect your loved ones with affordable life insurance options designed for seniors.",
      features: ["No medical exam options", "Guaranteed acceptance", "Final expense coverage"]
    },
    {
      icon: CreditCard,
      title: "Critical Illness",
      description: "Lump-sum benefits for major health events like cancer, heart attack, or stroke.",
      features: ["Use benefits as needed", "Covers treatment gaps", "Peace of mind protection"]
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Healthcare Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive insurance plans tailored for seniors and their families. 
            We make healthcare affordable and accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300 border-0">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-healthcare rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => window.open('https://65.healthhelpers.co', '_blank')}>
                    Enroll Online
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="hero" size="lg" onClick={() => window.open('https://65.healthhelpers.co', '_blank')}>
            Start Your Enrollment Today
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;