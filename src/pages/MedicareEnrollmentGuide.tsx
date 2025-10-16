import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, FileText, Phone } from "lucide-react";

const MedicareEnrollmentGuide = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Complete Medicare Enrollment Guide 2024
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about enrolling in Medicare online by yourself. 
            No phone calls, no pressure - just clear, step-by-step guidance.
          </p>
        </div>

        {/* Quick Start Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Quick Start: Are You Ready to Enroll?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">You can enroll if you're:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>65 years or older</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Under 65 with qualifying disability</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Have End-Stage Renal Disease (ESRD)</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Start Enrollment Now</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Skip the phone calls and meetings. Use our digital platform to compare and enroll in Medicare plans from home.
                </p>
                <Button className="w-full" onClick={() => window.location.href = 'tel:201-589-1901'}>Call Now</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Guide */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Step-by-Step Enrollment Process</h2>
          <div className="space-y-6">
            {[
              {
                step: 1,
                title: "Determine Your Eligibility",
                description: "Confirm you meet Medicare eligibility requirements and understand your enrollment periods.",
                icon: <FileText className="h-6 w-6" />
              },
              {
                step: 2,
                title: "Choose Your Coverage Type",
                description: "Decide between Original Medicare + Supplement or Medicare Advantage plans based on your needs.",
                icon: <CheckCircle className="h-6 w-6" />
              },
              {
                step: 3,
                title: "Compare Plan Options",
                description: "Use our online tools to compare costs, coverage, and provider networks in your area.",
                icon: <FileText className="h-6 w-6" />
              },
              {
                step: 4,
                title: "Enroll Online",
                description: "Complete your enrollment through our secure digital platform - no phone calls required.",
                icon: <CheckCircle className="h-6 w-6" />
              }
            ].map((item) => (
              <Card key={item.step}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        {item.icon}
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enrollment Periods */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Important Enrollment Periods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Initial Enrollment</h3>
                <p className="text-sm text-muted-foreground">
                  7-month period around your 65th birthday (3 months before, birth month, 3 months after)
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Annual Open Enrollment</h3>
                <p className="text-sm text-muted-foreground">
                  October 15 - December 7 each year. Changes take effect January 1st.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Special Enrollment</h3>
                <p className="text-sm text-muted-foreground">
                  Qualifying life events may allow enrollment outside normal periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Ready to Enroll in Medicare?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Use our online platform to compare plans and enroll in Medicare coverage that fits your needs and budget. 
            No phone calls or high-pressure sales tactics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.href = 'tel:201-589-1901'}>Call Now</Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = 'tel:201-589-1901'}>
              Call Now
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MedicareEnrollmentGuide;