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
              Your Trusted Medicare Partner
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              At Health Helpers, we believe choosing the right Medicare plan shouldn't be overwhelming. 
              Our experienced, licensed agents provide personalized guidance to help you understand your 
              options and find coverage that truly meets your healthcare needs and budget.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Expert Guidance</h3>
                  <p className="text-muted-foreground">Licensed Medicare specialists who understand your unique healthcare needs and budget concerns.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Personalized Service</h3>
                  <p className="text-muted-foreground">One-on-one assistance to compare plans and find the best coverage for your situation.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Ongoing Support</h3>
                  <p className="text-muted-foreground">We're here to help not just during enrollment, but throughout the year as your needs change.</p>
                </div>
              </div>
            </div>
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