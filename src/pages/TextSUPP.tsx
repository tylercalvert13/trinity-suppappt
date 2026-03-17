import { useEffect, useState } from "react";
import { useFunnelAnalytics } from "@/hooks/useFunnelAnalytics";
import { MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const SMS_URL = "sms:2012988393?body=SUPP";

const TextSUPP = () => {
  const [showFallback, setShowFallback] = useState(false);
  useFunnelAnalytics("form", "text-sms");

  useEffect(() => {
    // Attempt auto-redirect to SMS
    window.location.href = SMS_URL;

    // Show fallback after a short delay in case redirect didn't work
    const timer = setTimeout(() => setShowFallback(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full space-y-8">
        <img
          src="/lovable-uploads/4d760ca1-c0a7-4a63-82d3-e45df96bc6b9.png"
          alt="Health Helpers"
          className="h-12 mx-auto"
        />

        {!showFallback ? (
          <div className="space-y-4">
            <MessageSquare className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <p className="text-lg text-muted-foreground">Opening your messages…</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">
              Get Your Free Medicare Supplement Quote
            </h1>
            <p className="text-muted-foreground">
              Text <span className="font-bold text-primary">SUPP</span> to{" "}
              <span className="font-bold text-foreground">(201) 298-8393</span> and
              we'll find you a better rate in minutes.
            </p>

            <Button asChild size="lg" className="w-full text-lg py-6">
              <a href={SMS_URL}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Text SUPP Now
              </a>
            </Button>

            <p className="text-xs text-muted-foreground">
              Or call us directly:{" "}
              <a href="tel:2012988393" className="text-primary underline inline-flex items-center gap-1">
                <Phone className="w-3 h-3" /> (201) 298-8393
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextSUPP;
