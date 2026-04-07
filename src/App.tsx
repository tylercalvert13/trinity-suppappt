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

// Lazy load pages
const TrinityAppointment = lazyWithRetry(() => import("./pages/TrinityAppointment"));
const Disqualified = lazyWithRetry(() => import("./pages/Disqualified"));
const GreatRate = lazyWithRetry(() => import("./pages/GreatRate"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback with timeout message
const PageLoader = () => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 10000);

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
              <Route path="/" element={<TrinityAppointment />} />
              <Route path="/trinity" element={<TrinityAppointment />} />
              <Route path="/disqualified" element={<Disqualified />} />
              <Route path="/great-rate" element={<GreatRate />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AppErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
