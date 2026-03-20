import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, DollarSign, MapPin, Users, Award, Calendar } from "lucide-react";
import RelatedArticles from "@/components/RelatedArticles";

const CheapestPlanGRates = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Find the Cheapest Plan G Rates in Your Area | Health Helpers";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Plan G rates vary by $50-150/month between carriers for identical coverage. Find the lowest rates from A-rated carriers like Aflac, Medico, and Aetna.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Find the Cheapest Plan G Rates in Your Area",
          "description": "Plan G rates vary by $50-150/month between carriers for identical coverage. Find the lowest rates from A-rated carriers.",
          "author": { "@type": "Organization", "name": "Health Helpers", "url": "https://healthhelpers.co" },
          "publisher": { "@type": "Organization", "name": "Health Helpers", "logo": { "@type": "ImageObject", "url": "https://healthhelpers.co/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" } },
          "datePublished": "2025-02-02",
          "dateModified": "2026-03-20",
          "mainEntityOfPage": "https://healthhelpers.co/cheapest-plan-g-rates"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://healthhelpers.co/" },
            { "@type": "ListItem", "position": 2, "name": "Medicare Supplement Plans", "item": "https://healthhelpers.co/" },
            { "@type": "ListItem", "position": 3, "name": "Cheapest Plan G Rates", "item": "https://healthhelpers.co/cheapest-plan-g-rates" }
          ]
        })}</script>
      </Helmet>
      <Header />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Rate Guide</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>Updated March 2026</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Is Your Plan G Too Expensive? Find the Lowest Rate
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The same Plan G coverage can cost $50-150 more per month depending on which 
            carrier you choose. Here's how to find the best price.
          </p>
        </header>

        {/* First CTA */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-12 text-center">
          <p className="text-lg mb-4">Paying more than $150/month for Plan G?</p>
          <Button size="lg" className="text-lg px-8 bg-green-600 hover:bg-green-700" onClick={() => navigate('/suppappt')}>
            Find Your Lowest Rate
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Why Prices Vary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            Why Plan G Prices Vary So Much
          </h2>
          <p className="text-muted-foreground mb-4">
            Medicare Supplement plans are standardized by the federal government. This means 
            <strong> Plan G from Aflac covers exactly the same things as Plan G from Mutual of Omaha</strong>. 
            Same benefits, same coverage, same claims process.
          </p>
          <p className="text-muted-foreground mb-4">
            So why the price difference? Carriers compete on three things:
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Risk Pool</h3>
                <p className="text-sm text-muted-foreground">
                  Carriers with younger, healthier policyholders can charge less
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Market Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Some carriers price aggressively to gain market share in certain areas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Overhead</h3>
                <p className="text-sm text-muted-foreground">
                  Marketing spend and administrative costs affect premiums
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Top Low-Cost Carriers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Top Carriers with Competitive Plan G Rates</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Aflac</span>
                  <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">A+ Rated</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Often the lowest-priced option in many states. Strong financial rating and 
                  excellent claims service. One of our most recommended carriers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Medico</span>
                  <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">A Rated</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Competitive rates with household discounts available. Lenient underwriting 
                  makes them a good option for those with some health history.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Aetna</span>
                  <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">A Rated</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Major national carrier with competitive rates in many markets. Strong brand 
                  recognition and reliable claims processing.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Cigna</span>
                  <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">A Rated</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Aggressive pricing in select states. Worth comparing, especially if you're 
                  in a state where they're actively competing for market share.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-amber-50 border-amber-200 mt-6">
            <CardContent className="p-6">
              <p className="font-semibold text-amber-800">
                ⚠️ Common higher-priced carriers: AARP/UnitedHealthcare, Mutual of Omaha, and 
                Blue Cross plans often cost $40-80 more per month than the options above for 
                identical Plan G coverage.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Geographic Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            Geographic Rate Differences
          </h2>
          <p className="text-muted-foreground mb-4">
            Your zip code significantly affects your rate. Carriers price based on local healthcare 
            costs, competition, and claims experience in your area.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">Lower-Cost States</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Plan G rates often under $130/month:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Florida (varies by county)</li>
                  <li>• Texas</li>
                  <li>• Ohio</li>
                  <li>• Missouri</li>
                  <li>• Indiana</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-700">Higher-Cost States</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Plan G rates often over $180/month:</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• New York</li>
                  <li>• New Jersey</li>
                  <li>• Connecticut</li>
                  <li>• Massachusetts</li>
                  <li>• California (some areas)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Available Discounts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Discounts That Can Lower Your Rate</h2>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Household Discount (7-12% off)</h3>
                    <p className="text-muted-foreground">
                      If you and your spouse both have Medicare Supplement plans (or sometimes just 
                      live together), many carriers offer a household discount. This can save $10-25/month.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Payment Method Discount (2-5% off)</h3>
                    <p className="text-muted-foreground">
                      Paying annually instead of monthly, or using automatic bank draft, can 
                      qualify you for additional savings with some carriers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Non-Tobacco Discount</h3>
                    <p className="text-muted-foreground">
                      Non-smokers typically pay 10-30% less than tobacco users. Most carriers 
                      define "non-tobacco" as no use in the past 12 months.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Same Coverage Message */}
        <section className="mb-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-800">
                Remember: The Coverage is Identical
              </h2>
              <p className="text-blue-900 mb-4">
                Whether you pay $120/month or $220/month for Plan G, you get the exact same benefits:
              </p>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Same coverage for Part A hospital costs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Same 20% Part B coinsurance coverage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Same access to any Medicare-accepting doctor</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Same nationwide coverage when you travel</span>
                </li>
              </ul>
              <p className="text-blue-900 mt-4 font-semibold">
                The only difference is the check you write each month.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Find the Lowest Plan G Rate in Your Area
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Get quotes from top carriers in 2 minutes. See exactly how much you could 
            save by switching to a more competitive carrier.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/suppappt')}
          >
            Compare Plan G Rates
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm opacity-75 mt-4">
            Licensed agents • A-rated carriers • No pressure
          </p>
        </section>

        <RelatedArticles currentSlug="/cheapest-plan-g-rates" />
      </article>

      <Footer />
    </div>
  );
};

export default CheapestPlanGRates;
