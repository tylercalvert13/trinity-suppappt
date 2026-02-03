import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WhyMedigapRatesIncrease = lazy(() => import("./pages/WhyMedigapRatesIncrease"));
const SwitchMedigapPlans = lazy(() => import("./pages/SwitchMedigapPlans"));
const PlanGvsFvsN = lazy(() => import("./pages/PlanGvsFvsN"));
const CheapestPlanGRates = lazy(() => import("./pages/CheapestPlanGRates"));
const MedicareSupplementLP = lazy(() => import("./pages/MedicareSupplementLP"));
const MedicareSupplementLP1 = lazy(() => import("./pages/MedicareSupplementLP1"));
const MedicareSupplementQuote = lazy(() => import("./pages/MedicareSupplementQuote"));
const MedicareSupplementAppointment = lazy(() => import("./pages/MedicareSupplementAppointment"));
const MedicareSupplementAppointment1 = lazy(() => import("./pages/MedicareSupplementAppointment1"));
const MedicareSupplementAppointmentRefund = lazy(() => import("./pages/MedicareSupplementAppointmentRefund"));
const Disqualified = lazy(() => import("./pages/Disqualified"));
const GreatRate = lazy(() => import("./pages/GreatRate"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnalyticsLogin = lazy(() => import("./pages/AnalyticsLogin"));
const ContactCard = lazy(() => import("./pages/ContactCard"));
const StandaloneBooking = lazy(() => import("./pages/StandaloneBooking"));
const SalesTracking = lazy(() => import("./pages/SalesTracking"));
const AgentLeaderboard = lazy(() => import("./pages/AgentLeaderboard"));

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/suppappt-refund" element={<MedicareSupplementAppointmentRefund />} />
            <Route path="/disqualified" element={<Disqualified />} />
            <Route path="/great-rate" element={<GreatRate />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics-login" element={<AnalyticsLogin />} />
            <Route path="/contactcard" element={<ContactCard />} />
            <Route path="/booking" element={<StandaloneBooking />} />
            <Route path="/salestracking" element={<SalesTracking />} />
            <Route path="/leaderboard" element={<AgentLeaderboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
