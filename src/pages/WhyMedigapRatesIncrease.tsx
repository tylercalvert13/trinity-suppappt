import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

const WhyMedigapRatesIncrease = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Why Your Medicare Supplement Rate Keeps Going Up | Health Helpers";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Discover why your Medigap premium increases every year and how switching carriers can save you $50-150/month on the same Plan G, F, or N coverage.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-6">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Rate Increase Alert</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Why Your Medicare Supplement Rate Keeps Going Up
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            If your Medigap premium has increased year after year, you're not alone. 
            Here's what's really happening—and how to stop overpaying.
          </p>
        </header>

        {/* First CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12 text-center">
          <p className="text-lg mb-4">Paying more than $150/month for Plan G?</p>
          <Button size="lg" className="text-lg px-8" onClick={() => navigate('/suppappt')}>
            See If You're Overpaying
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Price Optimization Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            How Insurance Companies "Optimize" Your Price
          </h2>
          <p className="text-muted-foreground mb-4">
            Insurance carriers know that most policyholders don't shop around. They count on your 
            loyalty—and use it against you. This practice, called <strong>price optimization</strong>, 
            means long-term customers often pay significantly more than new customers for identical coverage.
          </p>
          <p className="text-muted-foreground mb-4">
            Think about it: A 70-year-old who's had the same Plan G for 5 years might be paying 
            $220/month, while a new customer the same age gets quoted $140/month for the exact same benefits.
          </p>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <p className="font-semibold text-amber-800">
                💡 The coverage is federally standardized. Plan G is Plan G, no matter which carrier 
                you buy it from. The only difference is price.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Pricing Methods Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            The 3 Ways Carriers Price Your Premium
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">1. Attained-Age Pricing (Most Common)</h3>
                <p className="text-muted-foreground">
                  Your premium increases as you age, regardless of when you enrolled. This is the 
                  pricing method used by most carriers. Expect annual increases of 3-8% just from aging, 
                  plus any general rate increases the carrier applies.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">2. Issue-Age Pricing</h3>
                <p className="text-muted-foreground">
                  Your premium is based on the age you were when you first enrolled. Someone who 
                  enrolled at 65 pays the "65-year-old rate" forever. You'll still see increases, 
                  but they're usually smaller and only from inflation/claims adjustments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">3. Community-Rated (No-Age) Pricing</h3>
                <p className="text-muted-foreground">
                  Everyone pays the same rate regardless of age. This is rare and typically only 
                  available in certain states. Younger enrollees pay more initially, but rates 
                  stay more stable over time.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Real Savings Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Real Savings: Carrier Switch Examples</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <p className="text-sm text-green-700 mb-2">Plan G, Age 72, Florida</p>
                <p className="font-bold text-lg">Mutual of Omaha → Aflac</p>
                <p className="text-2xl font-bold text-green-700">$87/month saved</p>
                <p className="text-sm text-muted-foreground mt-2">Same exact coverage, $1,044/year back in pocket</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <p className="text-sm text-green-700 mb-2">Plan G, Age 68, Texas</p>
                <p className="font-bold text-lg">AARP/UnitedHealthcare → Medico</p>
                <p className="text-2xl font-bold text-green-700">$62/month saved</p>
                <p className="text-sm text-muted-foreground mt-2">Same exact coverage, $744/year back in pocket</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How Often to Compare */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            How Often Should You Compare Rates?
          </h2>
          <p className="text-muted-foreground mb-4">
            We recommend comparing rates <strong>at least once a year</strong>, especially:
          </p>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>After receiving a rate increase notice from your current carrier</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>If you've had the same policy for 2+ years without shopping around</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>If you're paying more than $150/month for Plan G (varies by state/age)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>When new carriers enter your market with competitive rates</span>
            </li>
          </ul>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Stop Overpaying for the Same Coverage
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Get a free rate comparison in 2 minutes. See how much you could save by 
            switching to a more competitive carrier.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/suppappt')}
          >
            See If You're Overpaying
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm opacity-75 mt-4">
            Licensed agents • A-rated carriers • No pressure
          </p>
        </section>
      </article>

      <Footer />
    </div>
  );
};

export default WhyMedigapRatesIncrease;
