import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteLoadingProgressProps {
  className?: string;
  planType?: string;
}

export function QuoteLoadingProgress({ className, planType = "Plan G" }: QuoteLoadingProgressProps) {
  const STEPS = [
    { label: 'Connecting to carriers...', duration: 1500 },
    { label: 'Scanning insurance companies...', duration: 2000 },
    { label: `Comparing ${planType} rates...`, duration: 2000 },
    { label: 'Calculating your savings...', duration: 2000 },
    { label: 'Finalizing your quote...', duration: 3000 },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  
  useEffect(() => {
    // Create timers for each step transition
    const timers = STEPS.map((_, i) => {
      if (i === 0) return null; // First step is immediate
      const delay = STEPS.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
      return setTimeout(() => setCurrentStep(i), delay);
    });
    
    // Show slow loading message after 15 seconds
    const slowTimer = setTimeout(() => setIsSlowLoading(true), 15000);
    
    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
      clearTimeout(slowTimer);
    };
  }, []);

  const progressValue = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className={cn("bg-white rounded-2xl shadow-xl p-8 md:p-12 border", className)}>
      {/* Header */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 text-center">
        Finding your best rate...
      </h2>
      <p className="text-muted-foreground text-center mb-6">
        This usually takes 5-10 seconds
      </p>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progressValue} className="h-3" />
      </div>
      
      {/* Step List */}
      <div className="space-y-4">
        {STEPS.map((step, i) => (
          <div 
            key={i} 
            className={cn(
              "flex items-center gap-3 transition-all duration-300",
              i <= currentStep ? "opacity-100" : "opacity-40"
            )}
          >
            {i < currentStep ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            ) : i === currentStep ? (
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={cn(
              "text-sm md:text-base",
              i < currentStep ? "text-green-700 font-medium" : 
              i === currentStep ? "text-foreground font-medium" : 
              "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Slow loading message - shows after 15 seconds */}
      {isSlowLoading && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              Taking longer than usual... please wait a moment.
            </p>
          </div>
        </div>
      )}
      
      {/* Reassurance text */}
      <p className="text-xs text-muted-foreground text-center mt-8">
        🔒 Your information is secure and never shared
      </p>
    </div>
  );
}
