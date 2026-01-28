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
const MedicareEnrollmentGuide = lazy(() => import("./pages/MedicareEnrollmentGuide"));
const HowToEnrollMedicareOnline = lazy(() => import("./pages/HowToEnrollMedicareOnline"));
const MedicareEnrollmentPeriods = lazy(() => import("./pages/MedicareEnrollmentPeriods"));
const EnrollMedicareYourself = lazy(() => import("./pages/EnrollMedicareYourself"));
const MedicareSupplementLP = lazy(() => import("./pages/MedicareSupplementLP"));
const MedicareSupplementLP1 = lazy(() => import("./pages/MedicareSupplementLP1"));
const MedicareSupplementQuote = lazy(() => import("./pages/MedicareSupplementQuote"));
const MedicareSupplementAppointment = lazy(() => import("./pages/MedicareSupplementAppointment"));
const MedicareSupplementAppointment1 = lazy(() => import("./pages/MedicareSupplementAppointment1"));
const Disqualified = lazy(() => import("./pages/Disqualified"));
const GreatRate = lazy(() => import("./pages/GreatRate"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AnalyticsLogin = lazy(() => import("./pages/AnalyticsLogin"));
const ContactCard = lazy(() => import("./pages/ContactCard"));
const StandaloneBooking = lazy(() => import("./pages/StandaloneBooking"));

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
            <Route path="/medicare-enrollment-guide" element={<MedicareEnrollmentGuide />} />
            <Route path="/how-to-enroll-in-medicare-online" element={<HowToEnrollMedicareOnline />} />
            <Route path="/medicare-enrollment-periods" element={<MedicareEnrollmentPeriods />} />
            <Route path="/enroll-medicare-yourself" element={<EnrollMedicareYourself />} />
            <Route path="/supp" element={<MedicareSupplementLP />} />
            <Route path="/supp1" element={<MedicareSupplementLP1 />} />
            <Route path="/suppquote" element={<MedicareSupplementQuote />} />
            <Route path="/suppappt" element={<MedicareSupplementAppointment />} />
            <Route path="/suppappt1" element={<MedicareSupplementAppointment1 />} />
            <Route path="/disqualified" element={<Disqualified />} />
            <Route path="/great-rate" element={<GreatRate />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics-login" element={<AnalyticsLogin />} />
            <Route path="/contactcard" element={<ContactCard />} />
            <Route path="/booking" element={<StandaloneBooking />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
