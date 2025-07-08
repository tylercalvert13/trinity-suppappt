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
              Medicare Enrollment Made Digital
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Unlike traditional agencies that require phone calls and meetings, Health Helpers provides 
              a modern digital platform where you can research, compare, and enroll in Medicare plans 
              entirely online. Take control of your healthcare decisions on your own schedule.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Digital-First Platform</h3>
                  <p className="text-muted-foreground">Complete your Medicare enrollment online without any phone calls or pressure tactics.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Self-Service Tools</h3>
                  <p className="text-muted-foreground">Easy-to-use comparison tools and enrollment wizards guide you through every step.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Optional Support</h3>
                  <p className="text-muted-foreground">Need help? Our support team is available if you prefer assistance, but it's entirely optional.</p>
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