import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Your Free Medicare Supplement Rate Comparison
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See if you're overpaying for your Medigap coverage. Our licensed agents will compare 
            rates from top carriers and show you exactly how much you could save.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Contact Information */}
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-xl">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-healthcare rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">(201) 298-8393</div>
                  <div className="text-sm text-muted-foreground">Speak with an agent</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-healthcare rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">support@healthhelpers.co</div>
                  <div className="text-sm text-muted-foreground">Email us anytime</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-healthcare rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Serving Nationwide</div>
                  <div className="text-sm text-muted-foreground">Licensed in all 50 states</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-healthcare rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Mon-Fri: 9AM-5PM EST</div>
                  <div className="text-sm text-muted-foreground">Saturday: 10AM-2PM EST</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Card */}
          <Card className="shadow-card border-0 bg-primary text-primary-foreground">
            <CardContent className="pt-8 pb-8 flex flex-col justify-center h-full">
              <h3 className="font-bold text-2xl mb-4">Ready to Compare Rates?</h3>
              <p className="text-primary-foreground/90 mb-6">
                Call now to speak with a licensed Medicare Supplement specialist. We'll compare 
                rates from top-rated carriers and show you how much you could save—with no 
                obligation and no pressure.
              </p>
              <ul className="space-y-2 mb-6 text-primary-foreground/90">
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Free rate comparison
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> Takes just 2 minutes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> No obligation to switch
                </li>
              </ul>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full bg-background text-primary hover:bg-background/90 text-lg" 
                onClick={() => window.location.href = 'tel:+12012988393'}
              >
                Call (201) 298-8393
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
