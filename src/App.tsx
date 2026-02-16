import { Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";

// Lazy load all pages with retry logic for resilience
const Index = lazyWithRetry(() => import("./pages/Index"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const WhyMedigapRatesIncrease = lazyWithRetry(() => import("./pages/WhyMedigapRatesIncrease"));
const SwitchMedigapPlans = lazyWithRetry(() => import("./pages/SwitchMedigapPlans"));
const PlanGvsFvsN = lazyWithRetry(() => import("./pages/PlanGvsFvsN"));
const CheapestPlanGRates = lazyWithRetry(() => import("./pages/CheapestPlanGRates"));
const MedicareSupplementLP = lazyWithRetry(() => import("./pages/MedicareSupplementLP"));
const MedicareSupplementLP1 = lazyWithRetry(() => import("./pages/MedicareSupplementLP1"));
const MedicareSupplementQuote = lazyWithRetry(() => import("./pages/MedicareSupplementQuote"));
const MedicareSupplementAppointment = lazyWithRetry(() => import("./pages/MedicareSupplementAppointment"));
const MedicareSupplementAppointment1 = lazyWithRetry(() => import("./pages/MedicareSupplementAppointment1"));
const MedicareSupplementAppointment2 = lazyWithRetry(() => import("./pages/MedicareSupplementAppointment2"));
const MedicareSupplementAppointmentRefund = lazyWithRetry(() => import("./pages/MedicareSupplementAppointmentRefund"));
const Disqualified = lazyWithRetry(() => import("./pages/Disqualified"));
const GreatRate = lazyWithRetry(() => import("./pages/GreatRate"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const AnalyticsLogin = lazyWithRetry(() => import("./pages/AnalyticsLogin"));
const ContactCard = lazyWithRetry(() => import("./pages/ContactCard"));
const StandaloneBooking = lazyWithRetry(() => import("./pages/StandaloneBooking"));
const SalesTracking = lazyWithRetry(() => import("./pages/SalesTracking"));
const AgentLeaderboard = lazyWithRetry(() => import("./pages/AgentLeaderboard"));
const MedicareSupplementChat = lazyWithRetry(() => import("./pages/MedicareSupplementChat"));

const queryClient = new QueryClient();

// Loading fallback with timeout message
const PageLoader = () => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      {showTimeoutMessage && (
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            Still loading? Try reloading the page.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AppErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/why-medigap-rates-increase" element={<WhyMedigapRatesIncrease />} />
              <Route path="/switch-medigap-plans" element={<SwitchMedigapPlans />} />
              <Route path="/plan-g-vs-f-vs-n" element={<PlanGvsFvsN />} />
              <Route path="/cheapest-plan-g-rates" element={<CheapestPlanGRates />} />
              <Route path="/supp" element={<MedicareSupplementLP />} />
              <Route path="/supp1" element={<MedicareSupplementLP1 />} />
              <Route path="/suppquote" element={<MedicareSupplementQuote />} />
              <Route path="/suppappt" element={<MedicareSupplementAppointment />} />
              <Route path="/suppappt1" element={<MedicareSupplementAppointment1 />} />
              <Route path="/suppappt2" element={<MedicareSupplementAppointment2 />} />
              <Route path="/suppappt-refund" element={<MedicareSupplementAppointmentRefund />} />
              <Route path="/disqualified" element={<Disqualified />} />
              <Route path="/great-rate" element={<GreatRate />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/analytics-login" element={<AnalyticsLogin />} />
              <Route path="/contactcard" element={<ContactCard />} />
              <Route path="/booking" element={<StandaloneBooking />} />
              <Route path="/salestracking" element={<SalesTracking />} />
              <Route path="/leaderboard" element={<AgentLeaderboard />} />
              <Route path="/suppchat" element={<MedicareSupplementChat />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
