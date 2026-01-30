import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StickyBookingCTARefundProps {
  targetRef: React.RefObject<HTMLDivElement>;
  selectedTime?: string;
  dayLabel?: string;
}

export function StickyBookingCTARefund({ targetRef, selectedTime, dayLabel }: StickyBookingCTARefundProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!targetRef.current || !isMobile) {
      setIsVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Show sticky CTA when target is NOT visible (scrolled past)
        const isInView = entries[0]?.isIntersecting ?? true;
        setIsVisible(!isInView);
      },
      {
        threshold: 0,
        rootMargin: '-100px 0px 0px 0px', // Trigger slightly before fully out of view
      }
    );

    observer.observe(targetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [targetRef, isMobile]);

  const handleClick = () => {
    if (targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Add brief highlight effect
      targetRef.current.classList.add('ring-4', 'ring-green-400', 'ring-opacity-75');
      setTimeout(() => {
        targetRef.current?.classList.remove('ring-4', 'ring-green-400', 'ring-opacity-75');
      }, 2000);
    }
  };

  if (!isVisible || !isMobile) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      style={{ 
        animation: 'slideUp 0.3s ease-out forwards',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
      <Button
        onClick={handleClick}
        className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl shadow-lg"
      >
        {selectedTime && dayLabel ? (
          <div className="flex flex-col items-center">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              Claim My Money Back
            </span>
            <span className="text-sm font-normal opacity-90">
              {dayLabel} at {selectedTime}
            </span>
          </div>
        ) : (
          <>
            <Calendar className="w-5 h-5 mr-2" />
            Claim My Money Back
          </>
        )}
      </Button>
    </div>
  );
}
