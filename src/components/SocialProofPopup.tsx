import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

const SOCIAL_PROOF_DATA = [
  { name: 'Sarah', state: 'Florida' },
  { name: 'Robert', state: 'Texas' },
  { name: 'Mary', state: 'Ohio' },
  { name: 'James', state: 'Arizona' },
  { name: 'Linda', state: 'Pennsylvania' },
  { name: 'William', state: 'California' },
  { name: 'Patricia', state: 'Michigan' },
  { name: 'Richard', state: 'Georgia' },
];

interface SocialProofPopupProps {
  delayMs?: number;
  visibleMs?: number;
}

export function SocialProofPopup({ delayMs = 8000, visibleMs = 4000 }: SocialProofPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [person, setPerson] = useState(SOCIAL_PROOF_DATA[0]);

  useEffect(() => {
    // Pick a random person
    const randomIndex = Math.floor(Math.random() * SOCIAL_PROOF_DATA.length);
    setPerson(SOCIAL_PROOF_DATA[randomIndex]);

    // Show popup after delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    // Hide popup after visible duration
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, delayMs + visibleMs);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [delayMs, visibleMs]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in-left"
      style={{
        animation: 'slideInLeft 0.3s ease-out forwards',
      }}
    >
      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {person.name} from {person.state} just booked their call
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            a few moments ago
          </p>
        </div>
      </div>
    </div>
  );
}
