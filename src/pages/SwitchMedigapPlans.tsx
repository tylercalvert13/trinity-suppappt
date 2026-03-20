import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Clock, FileText, Shield, AlertCircle, Calendar } from "lucide-react";
import RelatedArticles from "@/components/RelatedArticles";

const SwitchMedigapPlans = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "How to Switch Medicare Supplement Plans Without Losing Coverage | Health Helpers";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Step-by-step guide to switching Medigap carriers. Keep your Plan G, F, or N coverage while paying less. Learn about underwriting and guaranteed issue rights.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "How to Switch Medicare Supplement Plans Without Losing Coverage",
          "description": "Step-by-step guide to switching Medigap carriers. Keep your Plan G, F, or N coverage while paying less.",
          "author": { "@type": "Organization", "name": "Health Helpers", "url": "https://healthhelpers.co" },
          "publisher": { "@type": "Organization", "name": "Health Helpers", "logo": { "@type": "ImageObject", "url": "https://healthhelpers.co/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" } },
          "datePublished": "2025-02-02",
          "dateModified": "2026-03-20",
          "mainEntityOfPage": "https://healthhelpers.co/switch-medigap-plans"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://healthhelpers.co/" },
            { "@type": "ListItem", "position": 2, "name": "Medicare Supplement Plans", "item": "https://healthhelpers.co/" },
            { "@type": "ListItem", "position": 3, "name": "How to Switch Medigap Plans", "item": "https://healthhelpers.co/switch-medigap-plans" }
          ]
        })}</script>
      </Helmet>
      <Header />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Coverage Guide</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>Updated March 2026</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How to Switch Medicare Supplement Carriers Without Losing Coverage
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Switching Medigap carriers is simpler than you think. Here's exactly how to do it—and 
            what to expect during the process.
          </p>
        </header>

        {/* First CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12 text-center">
          <p className="text-lg mb-4">Ready to see if switching makes sense for you?</p>
          <Button size="lg" className="text-lg px-8" onClick={() => navigate('/suppappt')}>
            Compare Plans & Switch
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Step-by-Step Process */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            The 5-Step Switching Process
          </h2>
          
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Compare rates from multiple carriers",
                description: "Get quotes from at least 3-5 carriers to see your options. Remember, all Plan G policies offer identical coverage—you're only comparing price and carrier reputation."
              },
              {
                step: 2,
                title: "Apply with the new carrier",
                description: "Submit an application with your chosen carrier. This typically takes 10-15 minutes and can often be done over the phone with a licensed agent."
              },
              {
                step: 3,
                title: "Complete underwriting (if required)",
                description: "Most carriers require medical underwriting. You'll answer health questions, and the carrier will review your application. This usually takes 1-3 weeks."
              },
              {
                step: 4,
                title: "Receive approval and new policy",
                description: "Once approved, you'll receive your new policy documents with your coverage effective date. Review everything carefully."
              },
              {
                step: 5,
                title: "Cancel your old policy",
                description: "IMPORTANT: Only cancel your current policy AFTER your new coverage is active. This ensures no gap in coverage. Your new carrier can help coordinate timing."
              }
            ].map((item) => (
              <Card key={item.step}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Underwriting FAQs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            Understanding Underwriting
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">What health questions will I be asked?</h3>
                <p className="text-muted-foreground">
                  Carriers typically ask about conditions diagnosed or treated in the past 2-5 years, 
                  current medications, recent hospitalizations, and specific conditions like cancer, 
                  heart disease, diabetes, COPD, and kidney disease. Each carrier has different 
                  underwriting guidelines.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">What if I have a pre-existing condition?</h3>
                <p className="text-muted-foreground">
                  Having a health condition doesn't automatically disqualify you. Many conditions 
                  are acceptable if well-controlled. Some carriers are more lenient than others. 
                  A licensed agent can help identify carriers most likely to approve your application.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">What if I get denied?</h3>
                <p className="text-muted-foreground">
                  If one carrier denies your application, you can try others with different 
                  underwriting criteria. Your current coverage remains in place—you only cancel 
                  after approval. There's no penalty for applying and being declined.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Guaranteed Issue Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            When You Have Guaranteed Issue Rights
          </h2>
          <p className="text-muted-foreground mb-4">
            In certain situations, you have the right to switch carriers without answering health 
            questions or being denied. These include:
          </p>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Your Medicare Advantage plan leaves your area or stops participating in Medicare</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>You move out of your Medicare Advantage plan's service area</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Your Medigap carrier goes bankrupt or becomes insolvent</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>You're within your Medigap Open Enrollment Period (first 6 months of Part B)</span>
            </li>
          </ul>
          <Card className="bg-blue-50 border-blue-200 mt-6">
            <CardContent className="p-6">
              <p className="font-semibold text-blue-800">
                💡 Some states have additional guaranteed issue rights. A licensed agent can tell 
                you what protections apply in your state.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What Stays the Same */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">What Changes vs. What Stays the Same</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-green-700">✓ Stays the Same</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Your plan benefits (Plan G is Plan G)</li>
                  <li>• Access to any Medicare-accepting doctor</li>
                  <li>• No network restrictions</li>
                  <li>• No referrals needed for specialists</li>
                  <li>• Coverage travels with you nationwide</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 text-blue-700">↔ Changes</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Your monthly premium (hopefully lower!)</li>
                  <li>• The insurance company name on your card</li>
                  <li>• Customer service contact information</li>
                  <li>• Payment processing details</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Clock className="h-6 w-6 text-primary" />
            Timeline: What to Expect
          </h2>
          
          <div className="relative border-l-2 border-primary/30 pl-8 space-y-8">
            <div className="relative">
              <div className="absolute -left-10 w-4 h-4 bg-primary rounded-full"></div>
              <h3 className="font-bold">Day 1: Get quotes & apply</h3>
              <p className="text-muted-foreground">Compare rates and submit your application (15-20 minutes)</p>
            </div>
            <div className="relative">
              <div className="absolute -left-10 w-4 h-4 bg-primary rounded-full"></div>
              <h3 className="font-bold">Week 1-2: Underwriting review</h3>
              <p className="text-muted-foreground">Carrier reviews your application and health history</p>
            </div>
            <div className="relative">
              <div className="absolute -left-10 w-4 h-4 bg-primary rounded-full"></div>
              <h3 className="font-bold">Week 2-3: Approval & policy issued</h3>
              <p className="text-muted-foreground">Receive approval letter and new policy documents</p>
            </div>
            <div className="relative">
              <div className="absolute -left-10 w-4 h-4 bg-primary rounded-full"></div>
              <h3 className="font-bold">Week 3-4: Coverage begins</h3>
              <p className="text-muted-foreground">New policy active, then cancel old coverage</p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Start Your Switch Today
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Get a free rate comparison and see how much you could save. Our licensed agents 
            handle all the paperwork and coordinate the transition.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/suppappt')}
          >
            Compare Plans & Switch
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm opacity-75 mt-4">
            Licensed agents • A-rated carriers • No pressure
          </p>
        </section>

        <RelatedArticles currentSlug="/switch-medigap-plans" />
      </article>

      <Footer />
    </div>
  );
};

export default SwitchMedigapPlans;
