import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronLeft, Phone, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface TrackEventParams {
  eventType: string;
  step?: string;
  answer?: string;
  outcome?: string;
  metadata?: Record<string, string | number | boolean>;
}

interface AppointmentWidgetProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  quotedPremium?: number;
  monthlySavings?: number;
  planType?: string;
  userTimezone: string;
  userState?: string;
  onComplete?: () => void;
  isStandalone?: boolean;
  contactId?: string; // Pre-created contact ID for standalone mode
  onTrackEvent?: (params: TrackEventParams) => void; // Analytics callback
}

interface SlotData {
  original: string; // Original Eastern time from GHL
  display: string;  // Formatted for user's timezone
}

// Generate next 4 available weekdays, respecting 4 PM Eastern cutoff for "today"
function getNextAvailableWeekdays(count: number): Date[] {
  const weekdays: Date[] = [];
  const now = new Date();
  
  // Check if "today" is still available (before 4 PM Eastern)
  const easternNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const isBeforeCutoff = easternNow.getHours() < 16; // Before 4 PM
  
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  
  // If it's after 4 PM Eastern or weekend, start from next day
  const dayOfWeek = current.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  if (!isBeforeCutoff || !isWeekday) {
    current.setDate(current.getDate() + 1);
  }
  
  while (weekdays.length < count) {
    const day = current.getDay();
    if (day >= 1 && day <= 5) { // Monday = 1, Friday = 5
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return weekdays;
}

// Format date for display
function formatDateLabel(date: Date, index: number): { primary: string; secondary: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (dateOnly.getTime() === today.getTime()) {
    return { primary: 'Today', secondary: monthDay };
  }
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return { primary: 'Tomorrow', secondary: monthDay };
  }
  
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  return { primary: dayName, secondary: monthDay };
}

// Format date string (YYYY-MM-DD) from Date object
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert Eastern time slot to user's timezone for display
function convertToUserTimezone(easternIsoString: string, userTimezone: string): string {
  try {
    const date = new Date(easternIsoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: userTimezone,
      hour12: true
    });
  } catch (e) {
    // Fallback if timezone is invalid
    const date = new Date(easternIsoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

// Get Eastern time display with proper formatting
function getEasternTimeDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
      hour12: true
    });
  } catch {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

// Check if user's timezone is different from Eastern
function isTimezoneDifferent(userTimezone: string): boolean {
  try {
    const now = new Date();
    const easternTime = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const userTime = now.toLocaleString('en-US', { timeZone: userTimezone });
    return easternTime !== userTime;
  } catch {
    return false;
  }
}

// Check if a slot is in the morning (9 AM - 12 PM Eastern)
function isMorningSlot(isoString: string): boolean {
  const date = new Date(isoString);
  const easternTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = easternTime.getHours();
  return hour >= 9 && hour < 12;
}

// Check if a slot is in the afternoon (12 PM - 4 PM Eastern)
function isAfternoonSlot(isoString: string): boolean {
  const date = new Date(isoString);
  const easternTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = easternTime.getHours();
  return hour >= 12 && hour < 17; // Up to 5 PM (last slot at 4:30)
}

// Generate .ics calendar file content
function generateIcsContent(
  appointmentDate: string,
  firstName: string,
  lastName: string
): string {
  const startDate = new Date(appointmentDate);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // +30 minutes
  
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
  const alarmDate = new Date(startDate.getTime() - 15 * 60 * 1000); // 15 min before
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Health Helpers//Medicare Consultation//EN
BEGIN:VEVENT
UID:${Date.now()}@healthhelpers.com
DTSTAMP:${formatIcsDate(new Date())}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
SUMMARY:Health Helpers Medicare Consultation
DESCRIPTION:Phone consultation about your Medicare Supplement quote. We will call you at your scheduled time.
LOCATION:Phone Call
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Health Helpers calling in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

// Download .ics file
function downloadIcsFile(appointmentDate: string, firstName: string, lastName: string) {
  const icsContent = generateIcsContent(appointmentDate, firstName, lastName);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'health-helpers-appointment.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate vCard for contact save
function downloadContactCard() {
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Health Helpers Team
ORG:Health Helpers
TEL;TYPE=WORK,VOICE:+12012988393
TEL;TYPE=WORK,VOICE:+12014269898
NOTE:Medicare Supplement Specialists - Save this contact to recognize our calls!
END:VCARD`;

  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Health-Helpers.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function AppointmentBookingWidget({
  firstName,
  lastName,
  phone,
  email,
  quotedPremium = 0,
  monthlySavings = 0,
  planType = 'N/A',
  userTimezone,
  userState = '',
  onComplete,
  isStandalone = false,
  contactId: preCreatedContactId,
  onTrackEvent
}: AppointmentWidgetProps) {
  // Step 1 = Pick Day, Step 2 = Pick Time + Confirm, Step 3 = Success
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  
  // Refs for auto-scroll
  const successRef = useRef<HTMLDivElement>(null);
  
  // Preload state - track slots loaded in background before user clicks
  const [preloadedSlots, setPreloadedSlots] = useState<Map<string, SlotData[]>>(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  // Auto-scroll to success when booking completes
  useEffect(() => {
    if (bookingStep === 3 && confirmedTime) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [bookingStep, confirmedTime]);

  // Get next 4 available weekdays
  const availableWeekdays = useMemo(() => getNextAvailableWeekdays(4), []);

  // Track widget view on mount
  useEffect(() => {
    onTrackEvent?.({ eventType: 'booking_widget_view' });
  }, [onTrackEvent]);

  // Check if morning/afternoon have slots
  const hasMorningSlots = useMemo(() => 
    availableSlots.some(slot => isMorningSlot(slot.original)), [availableSlots]);
  const hasAfternoonSlots = useMemo(() => 
    availableSlots.some(slot => isAfternoonSlot(slot.original)), [availableSlots]);

  // Preload first day's slots on mount
  useEffect(() => {
    const firstDay = availableWeekdays[0];
    if (!firstDay) return;
    
    const dateStr = formatDateString(firstDay);
    
    // Skip if already preloaded
    if (preloadedSlots.has(dateStr)) return;
    
    const preloadSlots = async () => {
      setIsPreloading(true);
      setPreloadError(null);
      
      try {
        console.log('[Preload] Fetching slots for first day:', dateStr);
        const startTime = Date.now();
        
        const { data, error: fetchError } = await supabase.functions.invoke('ghl-calendar', {
          body: { action: 'free-slots', date: dateStr }
        });

        const duration = Date.now() - startTime;
        console.log(`[Preload] Slots loaded in ${duration}ms`);

        if (fetchError) throw fetchError;

        if (data.slots && data.slots.length > 0) {
          const slotsWithDisplay: SlotData[] = data.slots.map((slot: string) => ({
            original: slot,
            display: convertToUserTimezone(slot, userTimezone)
          }));
          
          setPreloadedSlots(prev => new Map(prev).set(dateStr, slotsWithDisplay));
          console.log('[Preload] Cached', slotsWithDisplay.length, 'slots for', dateStr);
        } else {
          setPreloadError('No availability');
        }
      } catch (err) {
        console.error('[Preload] Error:', err);
        setPreloadError('Unable to load');
      } finally {
        setIsPreloading(false);
      }
    };

    preloadSlots();
  }, [availableWeekdays, userTimezone, preloadedSlots]);

  // Fetch available slots for a date (uses cache if available)
  const fetchSlots = async (date: Date, dayLabel: string) => {
    const dateStr = formatDateString(date);
    
    // Check if we already have preloaded data
    const cached = preloadedSlots.get(dateStr);
    if (cached && cached.length > 0) {
      console.log('[Cache Hit] Using preloaded slots for', dateStr);
      setAvailableSlots(cached);
      // Go directly to Step 2 (Pick Time) - skipping old morning/afternoon step
      setBookingStep(2);
      onTrackEvent?.({ 
        eventType: 'booking_day_selected', 
        metadata: { day: dateStr, dayLabel, slotCount: cached.length, cached: true }
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching slots for:', dateStr);

      const { data, error: fetchError } = await supabase.functions.invoke('ghl-calendar', {
        body: { action: 'free-slots', date: dateStr }
      });

      if (fetchError) throw fetchError;

      console.log('Received slots:', data);

      if (!data.slots || data.slots.length === 0) {
        setError('No times available on this day. Please pick another day.');
        setBookingStep(1);
        onTrackEvent?.({ 
          eventType: 'booking_error', 
          metadata: { error: 'no_slots', step: 'day_select', day: dateStr }
        });
        return;
      }

      // Convert slots to display format
      const slotsWithDisplay: SlotData[] = data.slots.map((slot: string) => ({
        original: slot,
        display: convertToUserTimezone(slot, userTimezone)
      }));

      setAvailableSlots(slotsWithDisplay);
      
      // Also cache for future
      setPreloadedSlots(prev => new Map(prev).set(dateStr, slotsWithDisplay));
      
      // Go directly to Step 2 (Pick Time) - skipping old morning/afternoon step
      setBookingStep(2);
      onTrackEvent?.({ 
        eventType: 'booking_day_selected', 
        metadata: { day: dateStr, dayLabel, slotCount: slotsWithDisplay.length, cached: false }
      });
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Connection issue. Please try again.');
      onTrackEvent?.({ 
        eventType: 'booking_error', 
        metadata: { error: 'fetch_failed', step: 'day_select', day: dateStr }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle day selection
  const handleDaySelect = (date: Date, dayLabel: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(date, dayLabel);
  };

  // Handle slot selection - no longer navigates, just selects
  const handleSlotSelect = (slot: SlotData) => {
    setSelectedSlot(slot);
    onTrackEvent?.({ 
      eventType: 'booking_time_selected', 
      metadata: { time: slot.display, slotOriginal: slot.original }
    });
    // No navigation - inline confirmation will appear below
  };

  // Handle back navigation
  const handleBack = () => {
    setError(null);
    if (bookingStep === 2) {
      setBookingStep(1);
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  };

  // Ref for auto-scrolling to inline confirmation
  const confirmationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when a slot is selected
  useEffect(() => {
    if (selectedSlot && confirmationRef.current) {
      confirmationRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [selectedSlot]);

  // Book the appointment
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedDate) return;

    // Capture slot early to prevent race conditions if state changes during async operations
    const slotToBook = selectedSlot.original;

    setIsLoading(true);
    setError(null);
    
    onTrackEvent?.({ 
      eventType: 'booking_confirm_clicked', 
      metadata: { slotTime: slotToBook, contactLookupRequired: !preCreatedContactId }
    });

    try {
      let contactIdToUse = preCreatedContactId;

      // Step 1: Look up the contact (skip if we have a pre-created contactId from standalone mode)
      if (!contactIdToUse) {
        console.log('Looking up contact for phone:', phone);
        const { data: contactData, error: contactError } = await supabase.functions.invoke('ghl-calendar', {
          body: { action: 'search-contact', phone }
        });

        if (contactError || contactData?.error) {
          const errorMsg = contactData?.message || "We're still setting up your account. Please try again in a moment or call us at (201) 298-8393.";
          setError(errorMsg);
          setIsLoading(false);
          onTrackEvent?.({ 
            eventType: 'booking_error', 
            metadata: { error: 'contact_lookup_failed', step: 'confirm' }
          });
          return;
        }

        contactIdToUse = contactData.contactId;
      }

      console.log('Using contact:', contactIdToUse);

      // Step 2: Book the appointment
      console.log('Booking appointment at:', slotToBook);
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('ghl-calendar', {
        body: {
          action: 'book-appointment',
          contactId: contactIdToUse,
          startTime: slotToBook,
          firstName,
          lastName,
          quotedRate: quotedPremium,
          monthlySavings,
          planType
        }
      });

      if (bookingError) throw bookingError;

      // Handle slot taken
      if (bookingData?.error === 'slot_taken') {
        setError(bookingData.message);
        // Refresh slots and stay on step 2
        if (selectedDate) {
          const dayLabel = formatDateLabel(selectedDate, 0).primary;
          await fetchSlots(selectedDate, dayLabel);
        }
        setIsLoading(false);
        onTrackEvent?.({ 
          eventType: 'booking_error', 
          metadata: { error: 'slot_taken', step: 'confirm' }
        });
        return;
      }

      if (bookingData?.error) {
        setError(bookingData.message || 'Something went wrong. Please try again or call us at (201) 298-8393.');
        setIsLoading(false);
        onTrackEvent?.({ 
          eventType: 'booking_error', 
          metadata: { error: 'booking_failed', step: 'confirm', message: bookingData.message }
        });
        return;
      }

      console.log('Appointment booked:', bookingData);
      setAgentName(bookingData?.assignedUser || null);
      setConfirmedTime(slotToBook);
      setBookingStep(3); // Success is now step 3
      
      onTrackEvent?.({ 
        eventType: 'booking_completed', 
        metadata: { 
          appointmentId: bookingData?.id || '', 
          agentName: bookingData?.assignedUser || '' 
        }
      });
      
      onComplete?.();

    } catch (err) {
      console.error('Booking error:', err);
      setError('Something went wrong. Please try again or call us at (201) 298-8393.');
      onTrackEvent?.({ 
        eventType: 'booking_error', 
        metadata: { error: 'exception', step: 'confirm' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format selected date for display
  const getSelectedDateDisplay = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">

      {/* Rate Expiration Notice - only show for funnel mode with quote data */}
      {bookingStep < 3 && !confirmedTime && !isStandalone && monthlySavings > 0 && (
        <div className="text-center text-sm text-gray-500 mb-4 flex items-center justify-center gap-1 px-4">
          <span>⏱️</span>
          <span>This rate is based on today's pricing. Rates are reviewed weekly and can increase without notice.</span>
        </div>
      )}

      {/* Step Indicator - 2 steps (excludes success) */}
      {bookingStep < 3 && !confirmedTime && (
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2].map((step) => (
            <span
              key={step}
              className={`w-3 h-3 rounded-full transition-colors ${
                bookingStep >= step ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* Heading */}
      {bookingStep < 3 && !confirmedTime && (
        <div className="text-center mb-6">
          {isStandalone ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Schedule Your Consultation</h2>
              <p className="text-gray-600 mt-1 text-sm">Pick a convenient time for your free Medicare consultation</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Lock In Your ${monthlySavings.toFixed(2)} Savings</h2>
              <p className="text-gray-600 mt-1 text-sm">Medicare rates can change daily – this quote is only guaranteed once we confirm your policy</p>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State - only show full-screen loader when fetching slots after clicking (not preloading) */}
      {isLoading && !selectedSlot && bookingStep !== 1 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Checking availability...</p>
        </div>
      )}

      {/* Step 1: Pick a Day - Always show immediately (no blocking loader) */}
      {bookingStep === 1 && (
        <div className="space-y-3">
          {/* Availability Indicator */}
          <div className="text-center mb-4 flex items-center justify-center gap-2 text-gray-600">
            <span>📅</span>
            <span className="text-sm">Our agents have limited openings this week</span>
          </div>

          {availableWeekdays.map((date, index) => {
            const { primary, secondary } = formatDateLabel(date, index);
            const dateStr = formatDateString(date);
            const isFirstDay = index === 0;
            const hasPreloadedData = preloadedSlots.has(dateStr);
            const preloadedData = preloadedSlots.get(dateStr);
            const slotCount = preloadedData?.length || 0;
            
            // Determine availability badge text
            let availabilityBadge = 'Morning & Afternoon';
            let badgeColor = 'text-green-600';
            
            if (isFirstDay && isPreloading) {
              availabilityBadge = 'Loading times...';
              badgeColor = 'text-gray-400';
            } else if (isFirstDay && preloadError) {
              availabilityBadge = preloadError;
              badgeColor = 'text-amber-600';
            } else if (hasPreloadedData && slotCount > 0) {
              const hasMorning = preloadedData?.some(s => isMorningSlot(s.original));
              const hasAfternoon = preloadedData?.some(s => isAfternoonSlot(s.original));
              if (hasMorning && hasAfternoon) {
                availabilityBadge = `${slotCount} times available`;
              } else if (hasMorning) {
                availabilityBadge = 'Morning available';
              } else if (hasAfternoon) {
                availabilityBadge = 'Afternoon available';
              }
              badgeColor = 'text-green-600';
            }
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDaySelect(date, primary)}
                disabled={isLoading}
                className={`w-full min-h-[70px] p-4 bg-white border-2 border-gray-200 rounded-xl 
                         hover:border-green-600 hover:bg-green-50 transition-all
                         flex flex-col items-center justify-center
                         ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-xl font-semibold text-gray-900">{primary}</span>
                <span className="text-gray-500">{secondary}</span>
                <span className={`text-xs mt-1 flex items-center gap-1 ${badgeColor}`}>
                  {isFirstDay && isPreloading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {availabilityBadge}
                </span>
              </button>
            );
          })}

          {/* What Happens on Your Call - Collapsible */}
          <details className="mt-6 bg-gray-50 rounded-xl">
            <summary className="p-4 cursor-pointer text-gray-700 font-medium flex items-center gap-2">
              <span>📞</span> What Happens on Your Call? <span className="text-xs text-gray-500">(tap to expand)</span>
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-600 space-y-2">
              <p className="flex items-start gap-2"><span className="text-green-600">✓</span> Quick review of your current coverage (2 min)</p>
              <p className="flex items-start gap-2"><span className="text-green-600">✓</span> Compare your rate against 20+ carriers (5 min)</p>
              <p className="flex items-start gap-2"><span className="text-green-600">✓</span> Get your questions answered – no pressure</p>
              <p className="flex items-start gap-2"><span className="text-green-600">✓</span> If you want to switch, we handle all the paperwork</p>
              <p className="text-gray-500 mt-2 text-xs">Average call: 10-15 minutes</p>
            </div>
          </details>

          {/* Strengthened Call Now Alternative */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-gray-400 mb-3">— or —</p>
            <div className={`${isStandalone ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4`}>
              <p className="font-semibold text-gray-800 flex items-center justify-center gap-1 mb-2">
                {isStandalone ? (
                  <>📞 Prefer to call now?</>
                ) : (
                  <><span>🔥</span> Want to lock this in RIGHT NOW?</>
                )}
              </p>
              <a 
                href="tel:+12012988393" 
                className="inline-flex items-center gap-2 text-xl font-bold text-green-700 hover:text-green-800 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Us: (201) 298-8393
              </a>
              <p className="text-sm text-gray-600 mt-2">
                {isStandalone ? "We're available Mon-Fri, 9 AM - 5 PM Eastern" : "We'll quote you live in under 5 minutes"}
              </p>
            </div>
          </div>

          {/* Social Proof - only show state-specific message when we have state data */}
          <div className="mt-6 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
            <span className="text-green-600">✓</span>
            <span>{userState ? `135+ ${userState} seniors saved on Medicare this month` : '135+ seniors saved on Medicare this month'}</span>
          </div>

          {/* Trust Badges */}
          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500 text-center">
            <span>🛡️ Licensed Medicare Agents</span>
            <span>⚡ Compare 20+ top carriers in 10 minutes</span>
            <span>✓ 100% free – hang up anytime</span>
          </div>
        </div>
      )}

      {/* Step 2: Pick a Time + Inline Confirmation (merged step, skipping morning/afternoon) */}
      {bookingStep === 2 && (
        <div className="space-y-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Pick a different day</span>
          </button>

          <p className="text-center text-gray-600 mb-4">
            {getSelectedDateDisplay()}
          </p>

          {/* All time slots (no morning/afternoon filter) */}
          {availableSlots.map((slot) => {
            const isSelected = selectedSlot?.original === slot.original;
            return (
              <button
                key={slot.original}
                onClick={() => handleSlotSelect(slot)}
                disabled={isLoading}
                className={`w-full min-h-[70px] p-4 border-2 rounded-xl transition-all
                           flex items-center justify-center relative
                           ${isSelected 
                             ? 'bg-green-50 border-green-600' 
                             : 'bg-white border-gray-200 hover:border-green-600 hover:bg-green-50'}
                           ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSelected && (
                  <Check className="w-5 h-5 text-green-600 absolute left-4" />
                )}
                <span className={`text-2xl font-semibold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                  {slot.display}
                </span>
              </button>
            );
          })}

          {availableSlots.length === 0 && (
            <p className="text-center text-gray-600 py-4">
              No times available on this day. Please pick a different day.
            </p>
          )}

          {/* Inline Confirmation Panel - only shows when a time is selected */}
          {selectedSlot && (
            <div 
              ref={confirmationRef}
              className="mt-6 p-5 bg-gray-50 rounded-xl border-2 border-gray-200 animate-fade-in"
            >
              {/* Confirmation Summary */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-2">You selected:</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  {getSelectedDateDisplay()}
                </p>
                <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-2 mt-1">
                  <span>⏰</span>
                  {selectedSlot.display}
                </p>
              </div>

              {/* Book Button */}
              <Button
                onClick={handleConfirmBooking}
                disabled={isLoading}
                className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Book My Call
                  </>
                )}
              </Button>

              {/* Change hint */}
              <p className="text-center text-sm text-gray-500 mt-3">
                Tap a different time above to change
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Success */}
      {bookingStep === 3 && confirmedTime && (
        <div ref={successRef} className="text-center scroll-mt-4">
          {/* 1. Success Checkmark */}
          <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>

          {/* 2. You're All Set! */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
          
          {/* 3. Agent name + call message */}
          <p className="text-gray-600 mb-2">
            {agentName ? `${agentName} will call you on` : "We'll call you on"}
          </p>
          
          {/* 4. Date + Time with Timezone */}
          <p className="text-xl font-bold text-gray-900">{getSelectedDateDisplay()}</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {convertToUserTimezone(confirmedTime, userTimezone)}
          </p>
          {isTimezoneDifferent(userTimezone) && (
            <p className="text-gray-500 text-sm mt-1">
              ({getEasternTimeDisplay(confirmedTime)} Eastern)
            </p>
          )}

          {/* 5. Confirmation text */}
          <p className="text-sm text-gray-500 mt-3 flex items-center justify-center gap-1">
            <span>📱</span> We've sent a confirmation to your phone
          </p>

          {/* 6. Action Buttons (flipped order - Calendar first) */}
          <div className="space-y-3 mt-6">
      {/* PRIMARY: Add to Calendar */}
      <Button
        onClick={() => downloadIcsFile(confirmedTime, firstName, lastName)}
        className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl"
      >
        <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
        Add to Calendar
      </Button>
      <p className="text-xs text-gray-500 text-center">
        Don't miss your savings - rates can change daily
      </p>

            {/* SECONDARY: Save Contact */}
            <Button
              onClick={downloadContactCard}
              variant="outline"
              className="w-full min-h-[60px] border-2 border-gray-200 text-lg font-semibold rounded-xl hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 mr-2 flex-shrink-0" />
              Save Our Contact
            </Button>
          </div>

          {/* 7. Save Number Warning (keep as-is) */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Save This Number!</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">(201) 298-8393</p>
            <p className="text-sm text-gray-600">Save as "Health Helpers" so you know it's us calling!</p>
          </div>

          {/* 8. What to Expect Section */}
          <div className="bg-gray-50 rounded-xl p-4 mt-6 text-left">
            <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span> What to Expect on Your Call (15-20 min)
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Review your current coverage
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Compare Plan G rates from top carriers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                Answer any questions you have
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                No pressure - just information to help you decide
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
