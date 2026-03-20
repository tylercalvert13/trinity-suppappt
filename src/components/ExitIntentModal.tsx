import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface ExitIntentModalProps {
  onBookClick: () => void;
  onTrackEvent?: (params: { eventType: string; metadata?: Record<string, string> }) => void;
}

export function ExitIntentModal({ onBookClick }: ExitIntentModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    const alreadyShown = sessionStorage.getItem('exit_intent_shown');
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let lastScrollTime = Date.now();

    // Desktop: Mouse leaves viewport top
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        triggerModal();
      }
    };

    // Mobile: Rapid upward scroll near top of page
    const handleScroll = () => {
      if (hasShown) return;
      
      const currentY = window.scrollY;
      const now = Date.now();
      const timeDiff = now - lastScrollTime;
      
      if (timeDiff > 0) {
        // Calculate scroll velocity (positive = scrolling up)
        scrollVelocity = (lastScrollY - currentY) / timeDiff * 100;
      }
      
      lastScrollY = currentY;
      lastScrollTime = now;
      
      // Rapid upward scroll near top = exit intent
      if (scrollVelocity > 15 && currentY < 200) {
        triggerModal();
      }
    };

    // Mobile: Back button press
    const handlePopState = (e: PopStateEvent) => {
      if (hasShown) return;
      
      // Prevent navigation
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      triggerModal();
    };

    // Push initial state for popstate to work
    window.history.pushState(null, '', window.location.href);

    const triggerModal = () => {
      setShowModal(true);
      setHasShown(true);
      sessionStorage.setItem('exit_intent_shown', 'true');
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasShown]);

  const handleBookClick = () => {
    setShowModal(false);
    onBookClick();
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] mx-auto rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 pt-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Wait! Don't miss your personalized savings.
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-center text-muted-foreground">
            Rates change daily. Lock in your savings now with a quick 2-minute call.
          </p>
          <Button
            onClick={handleBookClick}
            className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-xl"
          >
            Book My Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
