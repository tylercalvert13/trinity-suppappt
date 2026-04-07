import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Users, Award, DollarSign } from "lucide-react";

const About = () => {
  const stats = [
    { number: "50", label: "States Licensed", icon: MapPin },
    { number: "1000+", label: "Seniors Helped", icon: Users },
    { number: "A+", label: "Rated Carriers", icon: Award },
    { number: "$0", label: "Rate Comparison", icon: DollarSign }
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Specializing in Medicare Supplement Plans
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              At Trinity Health & Wealth, we focus on one thing: helping seniors find the best rates on 
              Medicare Supplement insurance. Many policyholders don't realize they're overpaying 
              because insurers quietly raise premiums on loyal customers year after year.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Same Coverage, Lower Price</h3>
                  <p className="text-muted-foreground">Your Plan G, F, or N coverage stays exactly the same—only your premium changes. No gaps, no hassle.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Top-Rated Carriers Only</h3>
                  <p className="text-muted-foreground">We work with financially stable, A-rated carriers like Aflac and Medico that you can trust for the long term.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">No Pressure, No Obligation</h3>
                  <p className="text-muted-foreground">Our licensed agents provide honest rate comparisons with zero pressure. If we can't save you money, we'll tell you.</p>
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
