import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Enroll Online?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start your Medicare enrollment using our digital platform. If you need assistance 
            along the way, our support team is here to help - but only if you want it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-2xl">Need Support? (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">First Name</label>
                    <Input placeholder="Enter your first name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Last Name</label>
                    <Input placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Phone Number</label>
                    <Input placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                    <Input placeholder="your.email@example.com" type="email" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">How can we assist you?</label>
                  <Textarea 
                    placeholder="I'm having trouble with online enrollment, need help comparing plans, etc." 
                    rows={4}
                  />
                </div>
                
                {/* TCPA Consent Checkbox */}
                <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
                  <Checkbox id="tcpa-consent" className="mt-1" />
                  <label htmlFor="tcpa-consent" className="text-sm text-foreground leading-relaxed cursor-pointer">
                    <span className="font-medium">Communication Consent:</span> By checking this box, I consent to receive calls, text messages, and emails from Health Helpers regarding my Medicare enrollment inquiry. I understand these communications may be made using an automatic telephone dialing system or prerecorded messages. I may receive up to 8 text messages per month. Message and data rates may apply. I can opt out at any time by texting STOP or calling directly. This consent is not required as a condition of service.
                  </label>
                </div>
                
                <Button variant="hero" size="lg" className="w-full">
                  Request Support
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
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
                    <div className="font-medium text-foreground">(908) 224-5410</div>
                    <div className="text-sm text-muted-foreground">Optional support line</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-healthcare rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">info@healthhelpers.co</div>
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
                    <div className="font-medium text-foreground">Mon-Fri: 8AM-6PM</div>
                    <div className="text-sm text-muted-foreground">Saturday: 9AM-2PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-0 bg-primary text-primary-foreground">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2">Prefer to Start Online?</h3>
                <p className="text-primary-foreground/90 mb-4 text-sm">
                  Most people can complete their Medicare enrollment entirely online using our digital platform.
                </p>
                <Button variant="outline" className="w-full bg-background text-primary hover:bg-background/90">
                  Begin Online Enrollment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;