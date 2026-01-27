import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronLeft, Phone, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Link } from 'react-router-dom';

interface TrackEventParams {
  eventType: string;
  step?: string;
  answer?: string;
  outcome?: string;
  metadata?: Record<string, string | number | boolean>;
}

interface AppointmentWidgetWithOptInProps {
  // Quote data (no contact info - collected in widget)
  quotedPremium?: number;
  monthlySavings?: number;
  planType?: string;
  currentPayment?: number;
  age?: number;
  zipCode?: string;
  gender?: string;
  tobacco?: string;
  spouse?: string;
  quotedCarrier?: string;
  amBestRating?: string;
  savingsPercent?: number;
  
  // Timezone & location
  userTimezone: string;
  userState?: string;
  
  // Analytics
  visitorId?: string;
  sessionId?: string;
  onTrackEvent?: (params: TrackEventParams) => void;
  onComplete?: () => void;
}

interface SlotData {
  original: string;
  display: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Validation schema
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  email: z.string().email("Please enter a valid email address").max(255, "Email is too long"),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, "Phone must be 10 digits")
    .refine(val => !val.startsWith('0') && !val.startsWith('1'), "Please enter a valid US phone number"),
});

// Format phone number for display
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Generate next 4 available weekdays
function getNextAvailableWeekdays(count: number): Date[] {
  const weekdays: Date[] = [];
  const now = new Date();
  const easternNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const isBeforeCutoff = easternNow.getHours() < 16;
  
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  
  const dayOfWeek = current.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  if (!isBeforeCutoff || !isWeekday) {
    current.setDate(current.getDate() + 1);
  }
  
  while (weekdays.length < count) {
    const day = current.getDay();
    if (day >= 1 && day <= 5) {
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return weekdays;
}

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

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
    const date = new Date(easternIsoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

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

function isMorningSlot(isoString: string): boolean {
  const date = new Date(isoString);
  const easternTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = easternTime.getHours();
  return hour >= 9 && hour < 12;
}

function isAfternoonSlot(isoString: string): boolean {
  const date = new Date(isoString);
  const easternTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = easternTime.getHours();
  return hour >= 12 && hour < 17;
}

function generateIcsContent(appointmentDate: string, firstName: string, lastName: string): string {
  const startDate = new Date(appointmentDate);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const formatIcsDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };
  
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

export function AppointmentBookingWidgetWithOptIn({
  quotedPremium = 0,
  monthlySavings = 0,
  planType = 'N/A',
  currentPayment = 0,
  age,
  zipCode,
  gender,
  tobacco,
  spouse,
  quotedCarrier,
  amBestRating,
  savingsPercent,
  userTimezone,
  userState = '',
  visitorId,
  sessionId,
  onTrackEvent,
  onComplete
}: AppointmentWidgetWithOptInProps) {
  // Step 1 = Pick Day, Step 2 = Pick Time, Step 3 = Contact Form, Step 4 = Success
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
  
  // Contact form state
  const [contactForm, setContactForm] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);
  
  // Pre-validation state for faster booking
  const [preValidationResult, setPreValidationResult] = useState<{ valid: boolean; email?: any; phone?: any } | null>(null);
  const [isPreValidating, setIsPreValidating] = useState(false);
  const [preValidatedPhone, setPreValidatedPhone] = useState<string>('');
  
  // Preload state
  const [preloadedSlots, setPreloadedSlots] = useState<Map<string, SlotData[]>>(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  // Pre-validate phone when user finishes entering it
  const handlePhoneBlur = async () => {
    const phoneDigits = contactForm.phone.replace(/\D/g, '');
    
    // Only validate if phone is complete and hasn't been validated yet
    if (phoneDigits.length === 10 && phoneDigits !== preValidatedPhone) {
      setIsPreValidating(true);
      try {
        console.log('[Pre-validation] Validating phone:', phoneDigits);
        const startTime = Date.now();
        
        const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-contact', {
          body: {
            email: contactForm.email.trim() || 'placeholder@example.com', // Use placeholder if email not entered yet
            phone: phoneDigits,
          }
        });
        
        const duration = Date.now() - startTime;
        console.log(`[Pre-validation] Complete in ${duration}ms:`, validationData);
        
        if (!validationError && validationData) {
          setPreValidationResult(validationData);
          setPreValidatedPhone(phoneDigits);
          
          // Show phone error immediately if invalid
          if (!validationData.phone?.valid) {
            setValidationErrors(prev => ({
              ...prev,
              phone: "This phone number doesn't appear to be valid. Please double-check it."
            }));
          } else {
            // Clear phone error if valid
            setValidationErrors(prev => {
              const { phone, ...rest } = prev;
              return rest;
            });
          }
        }
      } catch (err) {
        console.error('[Pre-validation] Error:', err);
        // Fail silently - will validate on submit
      } finally {
        setIsPreValidating(false);
      }
    }
  };

  // Auto-scroll to success when booking completes
  useEffect(() => {
    if (bookingStep === 4 && confirmedTime) {
      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [bookingStep, confirmedTime]);

  const availableWeekdays = useMemo(() => getNextAvailableWeekdays(4), []);

  // Track widget view on mount
  useEffect(() => {
    onTrackEvent?.({ eventType: 'booking_widget_view' });
  }, [onTrackEvent]);

  // Preload first day's slots on mount
  useEffect(() => {
    const firstDay = availableWeekdays[0];
    if (!firstDay) return;
    
    const dateStr = formatDateString(firstDay);
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

  const fetchSlots = async (date: Date, dayLabel: string) => {
    const dateStr = formatDateString(date);
    
    const cached = preloadedSlots.get(dateStr);
    if (cached && cached.length > 0) {
      console.log('[Cache Hit] Using preloaded slots for', dateStr);
      setAvailableSlots(cached);
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

      const slotsWithDisplay: SlotData[] = data.slots.map((slot: string) => ({
        original: slot,
        display: convertToUserTimezone(slot, userTimezone)
      }));

      setAvailableSlots(slotsWithDisplay);
      setPreloadedSlots(prev => new Map(prev).set(dateStr, slotsWithDisplay));
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

  const handleDaySelect = (date: Date, dayLabel: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(date, dayLabel);
  };

  const handleSlotSelect = (slot: SlotData) => {
    setSelectedSlot(slot);
    onTrackEvent?.({ 
      eventType: 'booking_time_selected', 
      metadata: { time: slot.display, slotOriginal: slot.original }
    });
    // Move to contact form step
    setBookingStep(3);
  };

  const handleBack = () => {
    setError(null);
    if (bookingStep === 2) {
      setBookingStep(1);
      setSelectedDate(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
    } else if (bookingStep === 3) {
      setBookingStep(2);
    }
  };

  const confirmationRef = useRef<HTMLDivElement>(null);

  // Book the appointment with contact info
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedDate) return;

    // Validate contact form first
    setValidationErrors({});
    const validationResult = contactSchema.safeParse({
      firstName: contactForm.firstName.trim(),
      lastName: contactForm.lastName.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone,
    });

    if (!validationResult.success) {
      const errors: ValidationErrors = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ValidationErrors;
        errors[field] = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    // Server-side validation - use cached result if available for same phone
    const phoneDigits = contactForm.phone.replace(/\D/g, '');
    const hasCachedValidation = preValidatedPhone === phoneDigits && preValidationResult !== null;
    
    if (hasCachedValidation) {
      console.log('[Validation] Using cached pre-validation result');
      // Use cached result - only need to check if it was invalid
      if (!preValidationResult.valid) {
        const errors: ValidationErrors = {};
        if (!preValidationResult.phone?.valid) {
          errors.phone = "This phone number doesn't appear to be valid. Please double-check it.";
        }
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          return;
        }
      }
    } else {
      // No cached result - do full validation
      setIsValidating(true);
      try {
        const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-contact', {
          body: {
            email: contactForm.email.trim(),
            phone: phoneDigits,
          }
        });

        if (validationError) {
          console.error("Validation API error:", validationError);
          // Continue anyway - fail open
        } else if (validationData && !validationData.valid) {
          const errors: ValidationErrors = {};
          if (!validationData.email?.valid) {
            if (validationData.email?.disposable) {
              errors.email = "Please use a permanent email address (no temporary emails)";
            } else {
              errors.email = "We couldn't verify this email. Please check it and try again.";
            }
          }
          if (!validationData.phone?.valid) {
            errors.phone = "This phone number doesn't appear to be valid. Please double-check it.";
          }
          
          if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setIsValidating(false);
            return;
          }
        }
      } catch (err) {
        console.error("Validation error:", err);
        // Continue anyway - fail open
      }
      setIsValidating(false);
    }

    // Capture slot early to prevent race conditions
    const slotToBook = selectedSlot.original;

    setIsLoading(true);
    setError(null);
    
    onTrackEvent?.({ 
      eventType: 'booking_confirm_clicked', 
      metadata: { slotTime: slotToBook }
    });

    try {
      // Step 1: Create contact in GHL
      console.log('Creating contact in GHL...');
      const phoneDigits = contactForm.phone.replace(/\D/g, '');
      const { data: contactData, error: contactError } = await supabase.functions.invoke('ghl-calendar', {
        body: { 
          action: 'create-contact',
          firstName: contactForm.firstName.trim(),
          lastName: contactForm.lastName.trim(),
          email: contactForm.email.trim(),
          phone: phoneDigits,
        }
      });

      if (contactError || contactData?.error) {
        const errorMsg = contactData?.message || "Failed to create your profile. Please try again or call us at (201) 298-8393.";
        setError(errorMsg);
        setIsLoading(false);
        onTrackEvent?.({ 
          eventType: 'booking_error', 
          metadata: { error: 'contact_creation_failed', step: 'confirm' }
        });
        return;
      }

      const contactId = contactData.contactId;
      console.log('Contact created:', contactId);

      // Step 2: Book the appointment
      console.log('Booking appointment at:', slotToBook);
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('ghl-calendar', {
        body: {
          action: 'book-appointment',
          contactId,
          startTime: slotToBook,
          firstName: contactForm.firstName.trim(),
          lastName: contactForm.lastName.trim(),
          quotedRate: quotedPremium,
          monthlySavings,
          planType
        }
      });

      if (bookingError) throw bookingError;

      // Handle slot taken
      if (bookingData?.error === 'slot_taken') {
        setError(bookingData.message);
        if (selectedDate) {
          const dayLabel = formatDateLabel(selectedDate, 0).primary;
          await fetchSlots(selectedDate, dayLabel);
        }
        setBookingStep(2);
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

      // Step 3: Send webhook with all data (only on successful booking!)
      try {
        await supabase.functions.invoke('send-lead-webhook-suppappt1', {
          body: {
            firstName: contactForm.firstName.trim(),
            lastName: contactForm.lastName.trim(),
            email: contactForm.email.trim(),
            phone: phoneDigits,
            age,
            zipCode,
            gender,
            tobacco,
            spouse,
            plan: planType,
            currentPayment,
            quotedRate: quotedPremium,
            quotedCarrier,
            amBestRating,
            monthlySavings,
            savingsPercent,
            timezone: userTimezone,
            appointmentTime: slotToBook,
            appointmentId: bookingData?.id || null,
            visitorId,
            sessionId,
            page: 'suppappt1',
          }
        });
        console.log('Webhook sent successfully');
      } catch (webhookErr) {
        // Don't fail the booking if webhook fails
        console.error('Webhook error (non-blocking):', webhookErr);
      }

      setAgentName(bookingData?.assignedUser || null);
      setConfirmedTime(slotToBook);
      setBookingStep(4);
      
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

      {/* Rate Expiration Notice */}
      {bookingStep < 4 && !confirmedTime && monthlySavings > 0 && (
        <div className="text-center text-sm text-gray-500 mb-4 flex items-center justify-center gap-1 px-4">
          <span>⏱️</span>
          <span>This rate is based on today's pricing. Rates are reviewed weekly and can increase without notice.</span>
        </div>
      )}

      {/* Step Indicator - 3 steps (excludes success) */}
      {bookingStep < 4 && !confirmedTime && (
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
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
      {bookingStep < 4 && !confirmedTime && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Lock In Your ${monthlySavings.toFixed(2)} Savings</h2>
          <p className="text-gray-600 mt-1 text-sm">Medicare rates can change daily – this quote is only guaranteed once we confirm your policy</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !selectedSlot && bookingStep !== 1 && bookingStep !== 3 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Checking availability...</p>
        </div>
      )}

      {/* Step 1: Pick a Day */}
      {bookingStep === 1 && (
        <div className="space-y-3">
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

          {/* What Happens on Your Call */}
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

          {/* Call Now Alternative */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-gray-400 mb-3">— or —</p>
            <div className="bg-amber-50 border-amber-200 border rounded-xl p-4">
              <p className="font-semibold text-gray-800 flex items-center justify-center gap-1 mb-2">
                <span>🔥</span> Want to lock this in RIGHT NOW?
              </p>
              <a 
                href="tel:+12012988393" 
                className="inline-flex items-center gap-2 text-xl font-bold text-green-700 hover:text-green-800 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Us: (201) 298-8393
              </a>
              <p className="text-sm text-gray-600 mt-2">We'll quote you live in under 5 minutes</p>
            </div>
          </div>

          {/* Social Proof */}
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

      {/* Step 2: Pick a Time */}
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
        </div>
      )}

      {/* Step 3: Contact Form */}
      {bookingStep === 3 && selectedSlot && (
        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Pick a different time</span>
          </button>

          {/* Selected Time Summary */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Your appointment:</p>
            <p className="text-lg font-semibold text-gray-900">{getSelectedDateDisplay()}</p>
            <p className="text-2xl font-bold text-green-700">{selectedSlot.display}</p>
          </div>

          <h3 className="text-lg font-bold text-gray-900">Enter your information to confirm</h3>
          <p className="text-sm text-gray-600 mb-4">Your information is 100% secure and will never be sold.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={contactForm.firstName}
                  onChange={(e) => {
                    setContactForm(prev => ({ ...prev, firstName: e.target.value }));
                    if (validationErrors.firstName) setValidationErrors(prev => ({ ...prev, firstName: undefined }));
                  }}
                  placeholder="John"
                  className={`h-12 rounded-xl ${validationErrors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {validationErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={contactForm.lastName}
                  onChange={(e) => {
                    setContactForm(prev => ({ ...prev, lastName: e.target.value }));
                    if (validationErrors.lastName) setValidationErrors(prev => ({ ...prev, lastName: undefined }));
                  }}
                  placeholder="Smith"
                  className={`h-12 rounded-xl ${validationErrors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {validationErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => {
                  setContactForm(prev => ({ ...prev, email: e.target.value }));
                  if (validationErrors.email) setValidationErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="john@example.com"
                className={`h-12 rounded-xl ${validationErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                Phone Number
                {isPreValidating && (
                  <span className="text-xs text-muted-foreground">(checking...)</span>
                )}
                {!isPreValidating && preValidatedPhone === contactForm.phone.replace(/\D/g, '') && preValidationResult?.phone?.valid && (
                  <span className="text-xs text-green-600">✓</span>
                )}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setContactForm(prev => ({ ...prev, phone: formatted }));
                  if (validationErrors.phone) setValidationErrors(prev => ({ ...prev, phone: undefined }));
                }}
                onBlur={handlePhoneBlur}
                placeholder="(555) 123-4567"
                className={`h-12 rounded-xl ${validationErrors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                maxLength={14}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <Button
              onClick={handleConfirmBooking}
              className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-xl"
              disabled={isLoading || isValidating || !contactForm.firstName || !contactForm.lastName || !contactForm.email || !contactForm.phone}
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : isLoading ? (
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
          </div>

          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            By clicking "Book My Call," I consent to receive calls, text messages, and emails 
            from Health Helpers and its partners regarding my Medicare inquiry. I understand these 
            communications may be made using automated telephone dialing systems, artificial intelligence, 
            and/or prerecorded messages. Message frequency varies. Message and data rates may apply. 
            I can opt out at any time by texting STOP or calling directly. This consent is not required 
            to receive a quote. I agree to the{' '}
            <Link to="/terms-of-service" className="underline hover:text-gray-700">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="underline hover:text-gray-700">Privacy Policy</Link>.
          </p>
        </div>
      )}

      {/* Step 4: Success */}
      {bookingStep === 4 && confirmedTime && (
        <div ref={successRef} className="text-center scroll-mt-4">
          <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
          
          <p className="text-gray-600 mb-2">
            {agentName ? `${agentName} will call you on` : "We'll call you on"}
          </p>
          
          <p className="text-xl font-bold text-gray-900">{getSelectedDateDisplay()}</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {getEasternTimeDisplay(confirmedTime)} Eastern
          </p>
          {isTimezoneDifferent(userTimezone) && (
            <p className="text-gray-500 text-sm mt-1">
              ({convertToUserTimezone(confirmedTime, userTimezone)} your time)
            </p>
          )}

          <p className="text-sm text-gray-500 mt-3 flex items-center justify-center gap-1">
            <span>📱</span> We've sent a confirmation to your phone
          </p>

          <div className="space-y-3 mt-6">
            <Button
              onClick={() => downloadIcsFile(confirmedTime, contactForm.firstName, contactForm.lastName)}
              className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl"
            >
              <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
              Add to Calendar
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Don't miss your savings - rates can change daily
            </p>

            <Button
              onClick={downloadContactCard}
              variant="outline"
              className="w-full min-h-[60px] border-2 border-gray-200 text-lg font-semibold rounded-xl hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 mr-2 flex-shrink-0" />
              Save Our Contact
            </Button>
          </div>

          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-800">Save This Number!</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">(201) 298-8393</p>
            <p className="text-sm text-gray-600">Save as "Health Helpers" so you know it's us calling!</p>
          </div>

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
                Answer your questions – zero pressure
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                If you want to switch, we handle all the paperwork
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
