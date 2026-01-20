import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import MedicareEnrollmentGuide from "./pages/MedicareEnrollmentGuide";
import HowToEnrollMedicareOnline from "./pages/HowToEnrollMedicareOnline";
import MedicareEnrollmentPeriods from "./pages/MedicareEnrollmentPeriods";
import EnrollMedicareYourself from "./pages/EnrollMedicareYourself";
import MedicareSupplementLP from "./pages/MedicareSupplementLP";
import MedicareSupplementLP1 from "./pages/MedicareSupplementLP1";
import Analytics from "./pages/Analytics";
import AnalyticsLogin from "./pages/AnalyticsLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics-login" element={<AnalyticsLogin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
