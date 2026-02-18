import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Loader2, Circle, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const TESTIMONIALS = [
  { name: 'Patricia', state: 'FL', savings: 127, stars: 5 },
  { name: 'Robert', state: 'TX', savings: 89, stars: 5 },
  { name: 'Mary', state: 'OH', savings: 156, stars: 5 },
  { name: 'James', state: 'AZ', savings: 112, stars: 5 },
  { name: 'Linda', state: 'PA', savings: 94, stars: 5 },
];

const DID_YOU_KNOW_FACTS = [
  "Your Plan G benefits are identical no matter which company you choose — the only difference is price.",
  "The average senior saves $1,200/year by switching to a lower-cost carrier.",
  "Insurance companies can charge different rates for the exact same coverage.",
  "You can switch carriers anytime without losing any benefits.",
  "Most people who compare rates find a lower price within 60 seconds.",
];

interface QuoteLoadingProgressProps {
  className?: string;
  planType?: string;
  firstName?: string;
}

export function QuoteLoadingProgress({ className, planType = "Plan G", firstName }: QuoteLoadingProgressProps) {
  const STEPS = [
    { label: 'Connecting to carriers...', duration: 1500 },
    { label: 'Scanning insurance companies...', duration: 2000 },
    { label: `Comparing ${planType} rates...`, duration: 2000 },
    { label: 'Calculating your savings...', duration: 2000 },
    { label: 'Finalizing your quote...', duration: 3000 },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [isSlowLoading, setIsSlowLoading] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  
  useEffect(() => {
    const timers = STEPS.map((_, i) => {
      if (i === 0) return null;
      const delay = STEPS.slice(0, i).reduce((sum, s) => sum + s.duration, 0);
      return setTimeout(() => setCurrentStep(i), delay);
    });
    
    const slowTimer = setTimeout(() => setIsSlowLoading(true), 15000);
    
    return () => {
      timers.forEach(timer => timer && clearTimeout(timer));
      clearTimeout(slowTimer);
    };
  }, []);

  // Rotate testimonials every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTestimonialIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rotate facts every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex(prev => (prev + 1) % DID_YOU_KNOW_FACTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const progressValue = ((currentStep + 1) / STEPS.length) * 100;
  const currentTestimonial = TESTIMONIALS[testimonialIndex];
  const currentFact = DID_YOU_KNOW_FACTS[factIndex];

  return (
    <div className={cn("bg-white rounded-2xl shadow-xl p-8 md:p-12 border", className)}>
      {/* Header */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 text-center">
        {firstName ? `Finding your best rate, ${firstName}...` : 'Finding your best rate...'}
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

      {/* Did You Know? Fact */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-1">💡 Did you know?</p>
        <p className="text-sm text-blue-700 transition-opacity duration-500">
          {currentFact}
        </p>
      </div>

      {/* Rotating Testimonial */}
      <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: currentTestimonial.stars }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-sm text-green-800 font-medium transition-opacity duration-500">
          "{currentTestimonial.name} from {currentTestimonial.state} saved ${currentTestimonial.savings}/mo on the same coverage"
        </p>
      </div>
      
      {/* Slow loading message */}
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
