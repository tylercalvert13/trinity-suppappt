import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, X, Star, TrendingUp, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RelatedArticles from "@/components/RelatedArticles";

const PlanGvsFvsN = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Medicare Supplement Plan G vs F vs N: Which Saves You More? | Health Helpers";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Compare Medigap Plan G, Plan F, and Plan N side-by-side. See total costs, coverage differences, and which plan saves you the most money in 2025.");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "Medicare Supplement Plan G vs F vs N: Which Saves You More?",
          "description": "Compare Medigap Plan G, Plan F, and Plan N side-by-side. See total costs, coverage differences, and which plan saves you the most money.",
          "author": { "@type": "Organization", "name": "Health Helpers", "url": "https://healthhelpers.co" },
          "publisher": { "@type": "Organization", "name": "Health Helpers", "logo": { "@type": "ImageObject", "url": "https://healthhelpers.co/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" } },
          "datePublished": "2025-02-02",
          "dateModified": "2026-03-20",
          "mainEntityOfPage": "https://healthhelpers.co/plan-g-vs-f-vs-n"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://healthhelpers.co/" },
            { "@type": "ListItem", "position": 2, "name": "Medicare Supplement Plans", "item": "https://healthhelpers.co/" },
            { "@type": "ListItem", "position": 3, "name": "Plan G vs F vs N", "item": "https://healthhelpers.co/plan-g-vs-f-vs-n" }
          ]
        })}</script>
      </Helmet>
      <Header />
      
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">Plan Comparison</span>
            </div>
            <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              <span>Updated March 2026</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Plan G vs Plan F vs Plan N: Which Saves You More?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete comparison of the three most popular Medicare Supplement plans. 
            Find out which one makes the most sense for your situation.
          </p>
        </header>

        {/* First CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-12 text-center">
          <p className="text-lg mb-4">Want to see actual rates for these plans in your area?</p>
          <Button size="lg" className="text-lg px-8" onClick={() => navigate('/suppappt')}>
            Get Your Plan G Quote
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Side-by-Side Comparison</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Coverage</TableHead>
                    <TableHead className="text-center font-bold">Plan F</TableHead>
                    <TableHead className="text-center font-bold bg-primary/5">Plan G ⭐</TableHead>
                    <TableHead className="text-center font-bold">Plan N</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Part A Deductible ($1,632 in 2025)</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Part B Deductible ($257 in 2025)</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="h-5 w-5 text-red-400 mx-auto" /></TableCell>
                    <TableCell className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Part B Coinsurance (20%)</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center text-sm">Copays*</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Part B Excess Charges</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><X className="h-5 w-5 text-red-400 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Hospital Costs (Part A)</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Skilled Nursing Facility</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Foreign Travel Emergency</TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-4">
            *Plan N has up to $20 copay for office visits and up to $50 copay for ER visits (waived if admitted)
          </p>
        </section>

        {/* Total Cost Analysis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            Total Annual Cost Comparison
          </h2>
          <p className="text-muted-foreground mb-6">
            The real question isn't "which plan covers more?"—it's "which plan costs less overall?" 
            Here's how to think about it:
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan F</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-muted-foreground">$0 out-of-pocket</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Highest premium, but zero deductibles or copays. Only available if you had Medicare before 2020.
                </p>
                <p className="text-primary font-semibold mt-4">
                  Typical premium: $180-280/month
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary border-2">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  Plan G <Star className="h-4 w-4 text-amber-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold text-foreground">$257/year out-of-pocket</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Pay the Part B deductible once per year. Everything else is covered. Most popular plan since 2020.
                </p>
                <p className="text-primary font-semibold mt-4">
                  Typical premium: $120-200/month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan N</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-muted-foreground">$257+ out-of-pocket</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Part B deductible plus copays for office/ER visits. Lower premium, but more visits = more costs.
                </p>
                <p className="text-primary font-semibold mt-4">
                  Typical premium: $100-160/month
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why Plan G is Popular */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Why Plan G is the Most Popular Choice</h2>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Since January 2020, new Medicare beneficiaries can no longer enroll in Plan F. 
                This means the Plan F risk pool is getting older and smaller, leading to higher 
                premium increases over time.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Plan G</strong> offers nearly identical coverage (you just pay the $257 Part B 
                deductible yourself), but premiums are typically <strong>$40-80/month lower</strong> than Plan F. 
                Over a year, that's $480-960 in savings—far more than the $257 deductible.
              </p>
              <p className="font-semibold text-green-800">
                💡 Math: Even if you pay the $257 deductible, you still save $200-700/year with Plan G vs Plan F.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* When Plan N Makes Sense */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">When Plan N Makes Sense</h2>
          <p className="text-muted-foreground mb-4">
            Plan N can be a smart choice if you:
          </p>
          <ul className="space-y-3 text-muted-foreground mb-6">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Don't visit the doctor frequently (2-3 times/year or less)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Are in good health with no chronic conditions requiring regular care</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Want the lowest monthly premium possible</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Are comfortable with small copays at the point of service</span>
            </li>
          </ul>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-6">
              <p className="font-semibold text-amber-800">
                ⚠️ Important: Plan N doesn't cover Part B excess charges. While rare (only 1% of 
                doctors charge them), in states like NJ, PA, and NY where they're more common, 
                Plan G may be the safer choice.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Carrier Price Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Sample Monthly Rates by Carrier (Age 70, Non-Tobacco)</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Carrier</TableHead>
                    <TableHead className="text-center font-bold">Plan G</TableHead>
                    <TableHead className="text-center font-bold">Plan N</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Aflac</TableCell>
                    <TableCell className="text-center">$132</TableCell>
                    <TableCell className="text-center">$105</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Medico</TableCell>
                    <TableCell className="text-center">$138</TableCell>
                    <TableCell className="text-center">$112</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Aetna</TableCell>
                    <TableCell className="text-center">$156</TableCell>
                    <TableCell className="text-center">$124</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mutual of Omaha</TableCell>
                    <TableCell className="text-center">$189</TableCell>
                    <TableCell className="text-center">$152</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">AARP/UHC</TableCell>
                    <TableCell className="text-center">$205</TableCell>
                    <TableCell className="text-center">$168</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-sm text-muted-foreground mt-4">
            *Rates are illustrative and vary by state, zip code, gender, and tobacco use. Get a personalized quote for exact pricing.
          </p>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Get Your Personalized Quote
          </h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            See actual rates from top carriers in your area. Compare Plan G and Plan N 
            side-by-side with your specific details.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/suppappt')}
          >
            Get Your Plan G Quote
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm opacity-75 mt-4">
            Licensed agents • A-rated carriers • No pressure
          </p>
        </section>

        <RelatedArticles currentSlug="/plan-g-vs-f-vs-n" />
      </article>

      <Footer />
    </div>
  );
};

export default PlanGvsFvsN;
