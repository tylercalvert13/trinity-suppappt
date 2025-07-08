import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Users, Award } from "lucide-react";

const About = () => {
  const stats = [
    { number: "15+", label: "Years Experience", icon: Clock },
    { number: "5000+", label: "Clients Served", icon: Users },
    { number: "98%", label: "Client Satisfaction", icon: Award },
    { number: "24/7", label: "Support Available", icon: CheckCircle }
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Your Trusted Healthcare Insurance Partner
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              At Health Helpers, we understand that navigating Medicare and health insurance 
              can be overwhelming. That's why we're here to simplify the process and provide 
              personalized guidance every step of the way.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Licensed & Certified</h3>
                  <p className="text-muted-foreground">Our agents are fully licensed and certified to help you make informed decisions.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">No-Cost Consultations</h3>
                  <p className="text-muted-foreground">All our consultations and plan comparisons are completely free with no hidden fees.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Ongoing Support</h3>
                  <p className="text-muted-foreground">We're here for you long after enrollment with continued support and annual reviews.</p>
                </div>
              </div>
            </div>
            <Button variant="trust" size="lg">
              Meet Our Team
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="text-center p-6 shadow-card border-0">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-healthcare rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;