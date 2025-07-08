import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Shield, Clock, CheckCircle, Smartphone, Wifi } from "lucide-react";

const HowToEnrollMedicareOnline = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How to Enroll in Medicare Online by Yourself
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Skip the phone calls and meetings. Learn how to enroll in Medicare plans completely online 
            using our secure digital platform from the comfort of your home.
          </p>
        </div>

        {/* Benefits of Online Enrollment */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Why Enroll Online?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Clock className="h-8 w-8 text-primary" />,
                title: "Save Time",
                description: "No waiting for appointments or sitting through lengthy phone calls. Enroll at your own pace, 24/7."
              },
              {
                icon: <Shield className="h-8 w-8 text-primary" />,
                title: "No Pressure",
                description: "Compare plans without sales pressure. Take your time to review options and make informed decisions."
              },
              {
                icon: <Monitor className="h-8 w-8 text-primary" />,
                title: "Easy Comparison",
                description: "Side-by-side plan comparisons with clear pricing and coverage details right on your screen."
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

        {/* What You Need */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>What You'll Need to Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Required Information
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Social Security Number</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Medicare Number (if you have one)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Date of Birth</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Current address and ZIP code</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Current insurance information (if any)</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Technical Requirements
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span>Stable internet connection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span>Computer, tablet, or smartphone</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Email address</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>Secure browser (Chrome, Firefox, Safari, Edge)</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Online Process */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Online Enrollment Process</h2>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Enter Your Information",
                description: "Provide your basic information to see available plans in your area. All data is encrypted and secure."
              },
              {
                step: 2,
                title: "View Available Plans",
                description: "See all Medicare plans available in your ZIP code with clear pricing and coverage details."
              },
              {
                step: 3,
                title: "Compare Side-by-Side",
                description: "Use our comparison tool to see how different plans stack up for costs, benefits, and provider networks."
              },
              {
                step: 4,
                title: "Select Your Plan",
                description: "Choose the plan that best fits your healthcare needs and budget."
              },
              {
                step: 5,
                title: "Complete Enrollment",
                description: "Submit your application online. You'll receive confirmation and plan documents via email."
              }
            ].map((item) => (
              <Card key={item.step}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security & Privacy */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Your Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Secure Platform</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 256-bit SSL encryption</li>
                  <li>• HIPAA compliant systems</li>
                  <li>• No information shared without consent</li>
                  <li>• Licensed insurance professionals</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Your Data Protection</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Information used only for enrollment</li>
                  <li>• No spam or unwanted calls</li>
                  <li>• Secure document storage</li>
                  <li>• Right to delete your data</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Start Your Online Medicare Enrollment</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands who have successfully enrolled in Medicare online. 
            Fast, secure, and pressure-free enrollment from your own home.
          </p>
          <Button size="lg" className="mr-4">Begin Online Enrollment</Button>
          <Button variant="outline" size="lg">View Sample Plans</Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default HowToEnrollMedicareOnline;