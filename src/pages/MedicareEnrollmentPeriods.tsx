import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";

const MedicareEnrollmentPeriods = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Medicare Enrollment Periods 2024
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding when you can enroll in Medicare is crucial. Learn about all enrollment periods 
            and deadlines to avoid penalties and ensure you have coverage when you need it.
          </p>
        </div>

        {/* Quick Alert */}
        <Card className="mb-12 border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Important: Missing Deadlines Can Cost You</h3>
                <p className="text-muted-foreground">
                  Late enrollment in Medicare can result in permanent premium penalties. 
                  Understanding these enrollment periods can save you money and ensure continuous coverage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Enrollment Periods */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Key Enrollment Periods</h2>
          <div className="space-y-6">
            
            {/* Initial Enrollment Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  Initial Enrollment Period (IEP)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">When:</h3>
                    <p className="text-muted-foreground mb-4">
                      7-month period that includes the 3 months before your 65th birthday, 
                      your birthday month, and the 3 months after.
                    </p>
                    <h3 className="font-semibold mb-3">Who's Eligible:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• People turning 65</li>
                      <li>• Those becoming eligible due to disability (after 24 months)</li>
                      <li>• People with End-Stage Renal Disease (ESRD)</li>
                    </ul>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Pro Tip:</h3>
                    <p className="text-sm text-muted-foreground">
                      Enroll during the first 3 months of your IEP to ensure coverage starts 
                      the month you turn 65. Waiting until your birthday month or later 
                      may delay coverage.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Annual Open Enrollment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Annual Open Enrollment Period (AEP)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">When:</h3>
                    <p className="text-muted-foreground mb-4">
                      <strong>October 15 - December 7</strong> every year
                    </p>
                    <h3 className="font-semibold mb-3">What You Can Do:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Switch from Original Medicare to Medicare Advantage</li>
                      <li>• Switch from Medicare Advantage to Original Medicare</li>
                      <li>• Switch between Medicare Advantage plans</li>
                      <li>• Add, drop, or switch Medicare Part D plans</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Coverage Effective Date:
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      All changes made during AEP take effect January 1st of the following year.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medicare Advantage Open Enrollment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-6 w-6 text-primary" />
                  Medicare Advantage Open Enrollment Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">When:</h3>
                    <p className="text-muted-foreground mb-4">
                      <strong>January 1 - March 31</strong> every year
                    </p>
                    <h3 className="font-semibold mb-3">Who Can Use It:</h3>
                    <p className="text-sm text-muted-foreground">
                      Only people already enrolled in a Medicare Advantage plan
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">What You Can Do:</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Switch to a different Medicare Advantage plan</li>
                      <li>• Return to Original Medicare</li>
                      <li>• Add a standalone Part D plan (if returning to Original Medicare)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Special Enrollment Periods */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Special Enrollment Periods (SEP)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Certain life events may qualify you for a Special Enrollment Period, 
              allowing you to enroll or change plans outside the normal enrollment periods.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Qualifying Events:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span>Moving to a new area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span>Losing employer or union coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span>Changes in Medicare Advantage plan service area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span>Qualifying for Medicare Savings Programs</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Time Limits:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Usually 63 days from the qualifying event</li>
                  <li>• Some SEPs have different timeframes</li>
                  <li>• Documentation may be required</li>
                  <li>• Contact us to verify your eligibility</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Penalty Information */}
        <Card className="mb-12 border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              Late Enrollment Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Part B Penalty:</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  10% increase in premium for each 12-month period you were eligible 
                  but didn't enroll (unless you had creditable coverage).
                </p>
                <p className="text-xs text-muted-foreground font-semibold">
                  This penalty is permanent and continues for life.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Part D Penalty:</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  1% of the national base premium for each month you were eligible 
                  but didn't have creditable prescription drug coverage.
                </p>
                <p className="text-xs text-muted-foreground font-semibold">
                  Added to your monthly Part D premium for life.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-primary/5 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Don't Miss Your Enrollment Deadline</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our licensed Medicare specialists can help you understand your enrollment period and ensure 
            you enroll on time. Call today for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.href = 'tel:201-589-1901'}>Call (201) 589-1901</Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = 'tel:201-589-1901'}>Get Free Consultation</Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MedicareEnrollmentPeriods;