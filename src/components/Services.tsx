import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Wallet, Info } from "lucide-react";

const Services = () => {
  const plans = [
    {
      icon: Shield,
      title: "Plan G",
      subtitle: "Most Popular Choice",
      description: "The gold standard in Medigap coverage. Plan G covers nearly all out-of-pocket costs, leaving you with only the Part B deductible.",
      features: [
        "Covers Part A deductible & hospital costs",
        "No referrals needed for specialists",
        "Works with any Medicare-accepting doctor"
      ],
      bestFor: "Seniors who want comprehensive coverage with predictable costs"
    },
    {
      icon: FileText,
      title: "Plan F",
      subtitle: "Legacy Full Coverage",
      description: "Complete coverage for those who qualified before 2020. Plan F covers 100% of Medicare gaps, including the Part B deductible.",
      features: [
        "Zero out-of-pocket costs for covered services",
        "Covers Part B deductible (grandfathered)",
        "Nationwide acceptance at any provider"
      ],
      bestFor: "Existing policyholders who want to keep full coverage"
    },
    {
      icon: Wallet,
      title: "Plan N",
      subtitle: "Budget-Friendly Option",
      description: "Lower premiums with minimal cost-sharing. Plan N offers excellent coverage while keeping your monthly payments affordable.",
      features: [
        "Lower monthly premium than G or F",
        "Small copays for office visits ($20 max)",
        "Same freedom to choose any doctor"
      ],
      bestFor: "Healthy seniors looking to save on monthly premiums"
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Medicare Supplement Plans Explained
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Medigap plans help cover the costs that Original Medicare doesn't—like 
            deductibles, copays, and coinsurance. Here's what you need to know.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300 border-0">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-healthcare rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-1">{plan.title}</CardTitle>
                  <CardDescription className="text-accent font-semibold">
                    {plan.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-center">
                    {plan.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-foreground">
                        <div className="w-2 h-2 bg-accent rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <span className="text-xs text-muted-foreground">Best for:</span>
                    <p className="text-sm font-medium text-foreground">{plan.bestFor}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Educational Callout */}
        <Card className="bg-primary/5 border-primary/20 mb-12">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-2">Why Switching Carriers Can Save You Money</h3>
                <p className="text-muted-foreground">
                  All Medigap plans are standardized by federal law—<strong>Plan G is Plan G</strong> regardless 
                  of which company you buy from. The coverage is identical. The only difference is the price 
                  you pay. Many carriers quietly raise rates on loyal customers, which is why comparing rates 
                  annually can save you hundreds of dollars per year.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="hero" size="lg" className="text-lg px-8" onClick={() => window.location.href = 'tel:+12012988393'}>
            Compare Your Rate Today
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
