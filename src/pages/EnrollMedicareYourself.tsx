import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, PhoneOff, Clock, Shield, Zap, DollarSign } from "lucide-react";

const EnrollMedicareYourself = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Enroll in Medicare Yourself - No Agents Required
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Take control of your Medicare enrollment. Compare plans, make informed decisions, 
            and enroll completely online without pressure from insurance agents or salespeople.
          </p>
        </div>

        {/* Why Self-Enroll */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Why Enroll Yourself?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <PhoneOff className="h-8 w-8 text-primary" />,
                title: "No Sales Pressure",
                description: "Make decisions at your own pace without pushy sales tactics or pressure to choose expensive plans."
              },
              {
                icon: <Clock className="h-8 w-8 text-primary" />,
                title: "Your Timeline",
                description: "Enroll 24/7 from home. No scheduling appointments or waiting for callbacks from busy agents."
              },
              {
                icon: <UserCheck className="h-8 w-8 text-primary" />,
                title: "Your Choice",
                description: "Compare all available options objectively. Choose what's truly best for your health and budget."
              }
            ].map((benefit, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Common Concerns */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Common Concerns About Self-Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border-l-4 border-l-primary pl-4">
                <h3 className="font-semibold mb-2">"It's too complicated"</h3>
                <p className="text-sm text-muted-foreground">
                  Our platform simplifies Medicare enrollment with clear explanations, 
                  side-by-side comparisons, and step-by-step guidance. Thousands have 
                  successfully enrolled without assistance.
                </p>
              </div>
              
              <div className="border-l-4 border-l-primary pl-4">
                <h3 className="font-semibold mb-2">"I might miss something important"</h3>
                <p className="text-sm text-muted-foreground">
                  Our enrollment system checks all requirements and highlights important 
                  details you need to know. Plus, you can always call our licensed professionals 
                  for questions - without any sales pressure.
                </p>
              </div>
              
              <div className="border-l-4 border-l-primary pl-4">
                <h3 className="font-semibold mb-2">"Agents have special deals"</h3>
                <p className="text-sm text-muted-foreground">
                  Medicare plan prices are standardized - agents can't offer special discounts. 
                  You have access to the same plans and prices as any agent, plus unbiased comparisons.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Enrollment Advantages */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Advantages of Self-Enrollment</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Unbiased Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>See all available plans, not just high-commission ones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Compare costs and benefits objectively</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>No hidden agendas or sales quotas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Educational resources without sales pitch</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  Potential Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Find the lowest-cost plan for your needs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Avoid overpriced plans with unnecessary features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>No markup for agent commissions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>Access to all discount programs</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>How Self-Enrollment Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                {
                  step: 1,
                  title: "Enter ZIP Code",
                  description: "See all plans available in your area"
                },
                {
                  step: 2,
                  title: "Compare Options",
                  description: "Review costs, coverage, and provider networks"
                },
                {
                  step: 3,
                  title: "Choose Your Plan",
                  description: "Select the plan that fits your needs and budget"
                },
                {
                  step: 4,
                  title: "Enroll Online",
                  description: "Complete secure enrollment in minutes"
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support Available */}
        <Card className="mb-12 bg-primary/5">
          <CardHeader>
            <CardTitle>Support When You Need It</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Questions? We're Here to Help</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  While you can enroll completely on your own, our licensed professionals 
                  are available to answer questions - without any sales pressure.
                </p>
                <ul className="space-y-1 text-sm">
                  <li>• Educational guidance only</li>
                  <li>• No commission-based recommendations</li>
                  <li>• Help understanding your options</li>
                  <li>• Technical support with enrollment</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Get Help:</h3>
                <div className="space-y-2">
                  <p className="text-sm">📞 <strong>(908) 224-5410</strong></p>
                  <p className="text-sm">✉️ <strong>info@healthhelpers.co</strong></p>
                  <p className="text-sm">🕒 Monday-Friday, 8AM-6PM EST</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Take Control of Your Medicare?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands who have successfully enrolled in Medicare by themselves. 
            No sales pressure, no appointments, no waiting - just clear information and easy enrollment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">Start Self-Enrollment Now</Button>
            <Button variant="outline" size="lg">See Available Plans</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EnrollMedicareYourself;