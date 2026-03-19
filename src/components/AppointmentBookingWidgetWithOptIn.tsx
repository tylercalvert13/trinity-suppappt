import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronLeft, Phone, Calendar, Loader2, ClipboardList } from 'lucide-react';
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

interface PrefilledContact {
  firstName: string;
  phone: string;
}

interface AppointmentWidgetWithOptInProps {
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
  userTimezone: string;
  userState?: string;
  prefilledContact?: PrefilledContact;
  visitorId?: string;
  sessionId?: string;
  onTrackEvent?: (params: TrackEventParams) => void;
  onComplete?: () => void;
  onBookingCompleted?: (contactData: { firstName: string; lastName: string; email: string; phone: string }) => void;
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

// Generate next N available weekdays
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
  prefilledContact,
  visitorId,
  sessionId,
  onTrackEvent,
  onComplete,
  onBookingCompleted
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

  // Get next 10 candidate weekdays (we'll filter to show only 4 with availability)
  const candidateWeekdays = useMemo(() => getNextAvailableWeekdays(10), []);

  // Track widget view on mount
  useEffect(() => {
    onTrackEvent?.({ eventType: 'booking_widget_view' });
  }, [onTrackEvent]);

  // Batch preload ALL candidate days' slots on mount (single API call)
  useEffect(() => {
    // Skip if already preloaded
    if (preloadedSlots.size > 0) return;
    
    const firstDay = candidateWeekdays[0];
    const lastDay = candidateWeekdays[candidateWeekdays.length - 1];
    if (!firstDay || !lastDay) return;
    
    const startDate = formatDateString(firstDay);
    const endDate = formatDateString(lastDay);
    
    const preloadAllSlots = async () => {
      setIsPreloading(true);
      setPreloadError(null);
      
      try {
        console.log('[Batch Preload] Fetching slots for', startDate, 'to', endDate);
        const startTime = Date.now();
        
        const { data, error: fetchError } = await supabase.functions.invoke('ghl-calendar', {
          body: { action: 'free-slots-batch', startDate, endDate }
        });

        const duration = Date.now() - startTime;
        console.log(`[Batch Preload] All slots loaded in ${duration}ms`);

        if (fetchError) throw fetchError;

        if (data.slotsByDate && Object.keys(data.slotsByDate).length > 0) {
          const newCache = new Map<string, SlotData[]>();
          
          for (const [dateStr, slots] of Object.entries(data.slotsByDate)) {
            // Backend now returns [] for empty days, so we always cache
            const slotsWithDisplay: SlotData[] = (slots as string[]).map((slot: string) => ({
              original: slot,
              display: convertToUserTimezone(slot, userTimezone)
            }));
            newCache.set(dateStr, slotsWithDisplay);
          }
          
          setPreloadedSlots(newCache);
          console.log('[Batch Preload] Cached slots for', newCache.size, 'days');
          
          // Check if we have any days with slots
          const daysWithSlots = Array.from(newCache.entries()).filter(([_, slots]) => slots.length > 0);
          if (daysWithSlots.length === 0) {
            setPreloadError('No availability');
            onTrackEvent?.({ 
              eventType: 'booking_error', 
              metadata: { error: 'no_slots_in_range', startDate, endDate }
            });
          }
        } else {
          setPreloadError('No availability');
          onTrackEvent?.({ 
            eventType: 'booking_error', 
            metadata: { error: 'no_slots_in_range', startDate, endDate }
          });
        }
      } catch (err) {
        console.error('[Batch Preload] Error:', err);
        setPreloadError('Unable to load');
      } finally {
        setIsPreloading(false);
      }
    };

    preloadAllSlots();
  }, [candidateWeekdays, userTimezone, onTrackEvent]);
  
  // Filter to only show days with actual availability (max 3 for decision simplicity)
  const availableWeekdays = useMemo(() => {
    if (isPreloading) {
      // While loading, show first 3 candidates as placeholders
      return candidateWeekdays.slice(0, 3);
    }
    
    // Filter to days that have slots
    const daysWithSlots = candidateWeekdays.filter(date => {
      const dateStr = formatDateString(date);
      const slots = preloadedSlots.get(dateStr);
      // Only show if we have data AND slots > 0
      return slots && slots.length > 0;
    });
    
    // Return first 3 days with availability (reduced from 4 to minimize decision paralysis)
    return daysWithSlots.slice(0, 3);
  }, [candidateWeekdays, preloadedSlots, isPreloading]);

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

  const handleSlotSelect = async (slot: SlotData) => {
    setSelectedSlot(slot);
    onTrackEvent?.({ 
      eventType: 'booking_time_selected', 
      metadata: { time: slot.display, slotOriginal: slot.original }
    });
    
    // If prefilled contact, skip step 3 and book directly
    if (prefilledContact) {
      await bookWithPrefilledContact(slot);
    } else {
      // Move to contact form step
      setBookingStep(3);
    }
  };

  // Book directly using prefilled contact data (skips step 3)
  const bookWithPrefilledContact = async (slot: SlotData) => {
    if (!selectedDate && !slot) return;
    
    const slotToBook = slot.original;
    setIsLoading(true);
    setError(null);
    
    onTrackEvent?.({ 
      eventType: 'booking_confirm_clicked', 
      metadata: { slotTime: slotToBook, prefilled: true }
    });

    try {
      const phoneDigits = prefilledContact!.phone.replace(/\D/g, '');
      
      // Create contact in GHL (firstName + phone only)
      console.log('Creating contact with prefilled data...');
      const { data: contactData, error: contactError } = await supabase.functions.invoke('ghl-calendar', {
        body: { 
          action: 'create-contact',
          firstName: prefilledContact!.firstName,
          lastName: '',
          email: '',
          phone: phoneDigits,
        }
      });

      if (contactError || contactData?.error) {
        const errorMsg = contactData?.message || "Failed to create your profile. Please try again or call us at (201) 298-8393.";
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      const contactId = contactData.contactId;

      // Book the appointment
      console.log('Booking appointment at:', slotToBook);
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('ghl-calendar', {
        body: {
          action: 'book-appointment',
          contactId,
          startTime: slotToBook,
          firstName: prefilledContact!.firstName,
          lastName: '',
          quotedRate: quotedPremium,
          monthlySavings,
          planType
        }
      });

      if (bookingError) throw bookingError;

      if (bookingData?.error === 'slot_taken') {
        setError(bookingData.message);
        if (selectedDate) {
          const dayLabel = formatDateLabel(selectedDate, 0).primary;
          await fetchSlots(selectedDate, dayLabel);
        }
        setBookingStep(2);
        setIsLoading(false);
        return;
      }

      if (bookingData?.error) {
        setError(bookingData.message || 'Something went wrong. Please try again or call us at (201) 298-8393.');
        setIsLoading(false);
        return;
      }

      setAgentName(bookingData?.assignedUser || null);
      setConfirmedTime(slotToBook);
      setBookingStep(4);
      
      onTrackEvent?.({ 
        eventType: 'booking_completed', 
        metadata: { 
          appointmentId: bookingData?.id || '', 
          agentName: bookingData?.assignedUser || '',
          prefilled: true,
        }
      });
      
      onComplete?.();
      onBookingCompleted?.({
        firstName: prefilledContact!.firstName,
        lastName: '',
        email: '',
        phone: phoneDigits,
      });

    } catch (err) {
      console.error('Booking error:', err);
      setError('Something went wrong. Please try again or call us at (201) 298-8393.');
    } finally {
      setIsLoading(false);
    }
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
      onBookingCompleted?.({
        firstName: contactForm.firstName.trim(),
        lastName: contactForm.lastName.trim(),
        email: contactForm.email.trim(),
        phone: phoneDigits,
      });

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

      {/* Step Indicator with labels */}
      {bookingStep < 4 && !confirmedTime && (
        <div className="flex justify-center items-center gap-4 mb-6">
          {[
            { step: 1, label: 'Day' },
            { step: 2, label: 'Time' },
            { step: 3, label: 'Confirm' },
          ].map(({ step, label }, i) => (
            <div key={step} className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full transition-colors ${
                  bookingStep >= step ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
              <span className={`text-sm font-medium ${bookingStep >= step ? 'text-green-700' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < 2 && <span className="text-gray-300 ml-2">→</span>}
            </div>
          ))}
        </div>
      )}

      {/* Heading — trust-focused */}
      {bookingStep < 4 && !confirmedTime && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Your Free Call</h2>
          <p className="text-gray-600 mt-1 text-base">A licensed agent will review your ${monthlySavings.toFixed(2)}/mo savings — no obligation</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <p className="text-red-700 text-base">{error}</p>
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
          {/* Availability Indicator — no fake social proof */}
          <div className="text-center mb-4">
            <p className="text-base text-gray-600 flex items-center justify-center gap-2">
              <span>📅</span>
              <span>
                {isPreloading ? 'Checking available times...' : 'Pick a day — we\'ll call you then'}
              </span>
            </p>
          </div>

          {/* Loading state */}
          {isPreloading && availableWeekdays.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-3" />
              <p className="text-gray-600 text-base">Loading available times...</p>
            </div>
          )}

          {/* No availability fallback */}
          {!isPreloading && availableWeekdays.length === 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
              <p className="text-amber-800 font-medium mb-2">No online appointments available soon</p>
              <p className="text-gray-600 text-base mb-4">Our calendar is fully booked for the next two weeks.</p>
              <a 
                href="tel:+12012988393" 
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Now: (201) 298-8393
              </a>
              <p className="text-gray-500 text-sm mt-3">We can often fit you in same-day by phone</p>
            </div>
          )}

          {/* Day buttons — larger touch targets */}
          {availableWeekdays.map((date, index) => {
            const { primary, secondary } = formatDateLabel(date, index);
            const dateStr = formatDateString(date);
            const hasPreloadedData = preloadedSlots.has(dateStr);
            const preloadedData = preloadedSlots.get(dateStr);
            const slotCount = preloadedData?.length || 0;
            const isFirstDay = index === 0;
            
            // Determine availability badge text
            let availabilityBadge = 'Checking times...';
            let badgeColor = 'text-gray-400';
            let isDisabled = isPreloading || isLoading;
            
            if (isPreloading) {
              availabilityBadge = 'Checking times...';
              badgeColor = 'text-gray-400';
            } else if (hasPreloadedData && slotCount > 0) {
              availabilityBadge = `${slotCount} times available`;
              badgeColor = 'text-green-600';
              isDisabled = isLoading;
            }
            
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDaySelect(date, primary)}
                disabled={isDisabled}
                className={`w-full min-h-[90px] p-5 bg-white border-2 rounded-xl 
                         hover:border-green-600 hover:bg-green-50 transition-all
                         flex flex-col items-center justify-center relative
                         ${isFirstDay && !isPreloading ? 'border-green-500 animate-first-day-pulse' : 'border-gray-200'}
                         ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {/* Recommended badge for first day */}
                {isFirstDay && !isPreloading && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
                <span className="text-2xl font-semibold text-gray-900">{primary}</span>
                <span className="text-base text-gray-500">{secondary}</span>
                <span className={`text-sm mt-1 flex items-center gap-1 font-medium ${badgeColor}`}>
                  {isPreloading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {availabilityBadge}
                </span>
              </button>
            );
          })}

          {/* Call Now Alternative — softer tone */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-gray-400 mb-3">— or —</p>
            <div className="bg-gray-50 border-gray-200 border rounded-xl p-4">
              <p className="font-semibold text-gray-800 flex items-center justify-center gap-1 mb-2">
                <Phone className="w-4 h-4 text-green-600" /> Prefer to talk now?
              </p>
              <a 
                href="tel:+12012988393" 
                className="inline-flex items-center gap-2 text-xl font-bold text-green-700 hover:text-green-800 transition-colors"
              >
                (201) 298-8393
              </a>
              <p className="text-base text-gray-600 mt-2">We'll quote you live in under 5 minutes</p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-6 text-center text-base text-gray-600 flex items-center justify-center gap-2">
            <span className="text-green-600">✓</span>
            <span>{userState ? `135+ ${userState} seniors saved on Medicare this month` : '135+ seniors saved on Medicare this month'}</span>
          </div>

          {/* Trust Badges */}
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-500 text-center">
            <span>🛡️ Licensed Medicare Agents</span>
            <span>Compare 20+ top carriers in 10 minutes</span>
            <span>✓ 100% free — hang up anytime</span>
          </div>
        </div>
      )}

      {/* Step 2: Pick a Time — Morning / Afternoon grouping */}
      {bookingStep === 2 && (
        <div className="space-y-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4 text-base"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Pick a different day</span>
          </button>

          <p className="text-center text-gray-700 text-lg font-medium mb-4">
            {getSelectedDateDisplay()}
          </p>

          {(() => {
            const morning = availableSlots.filter(s => isMorningSlot(s.original));
            const afternoon = availableSlots.filter(s => isAfternoonSlot(s.original));
            const other = availableSlots.filter(s => !isMorningSlot(s.original) && !isAfternoonSlot(s.original));
            
            const renderSlotButton = (slot: SlotData) => {
              const isSelected = selectedSlot?.original === slot.original;
              return (
                <button
                  key={slot.original}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={isLoading}
                  className={`min-h-[80px] p-4 border-2 rounded-xl transition-all
                             flex items-center justify-center relative
                             ${isSelected 
                               ? 'bg-green-50 border-green-600' 
                               : 'bg-white border-gray-200 hover:border-green-600 hover:bg-green-50'}
                             ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSelected && <Check className="w-5 h-5 text-green-600 absolute left-3" />}
                  <span className={`text-2xl font-semibold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                    {slot.display}
                  </span>
                </button>
              );
            };

            return (
              <>
                {morning.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-gray-700 mb-2">☀️ Morning</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {morning.map(renderSlotButton)}
                    </div>
                  </div>
                )}
                {afternoon.length > 0 && (
                  <div className={morning.length > 0 ? 'pt-2' : ''}>
                    <h4 className="text-base font-semibold text-gray-700 mb-2">🌤️ Afternoon</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {afternoon.map(renderSlotButton)}
                    </div>
                  </div>
                )}
                {other.length > 0 && (
                  <div className={(morning.length > 0 || afternoon.length > 0) ? 'pt-2' : ''}>
                    <div className="grid grid-cols-2 gap-3">
                      {other.map(renderSlotButton)}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {availableSlots.length === 0 && (
            <p className="text-center text-gray-600 py-4 text-base">
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
            <p className="text-base text-gray-600 mb-1">Your appointment:</p>
            <p className="text-lg font-semibold text-gray-900">{getSelectedDateDisplay()}</p>
            <p className="text-2xl font-bold text-green-700">{selectedSlot.display}</p>
          </div>

          <h3 className="text-lg font-bold text-gray-900">Enter your information to confirm</h3>
          <p className="text-base text-gray-600 mb-4">Your information is 100% secure and will never be sold.</p>

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

      {/* Step 4: Success — show-up optimized */}
      {bookingStep === 4 && confirmedTime && (
        <div ref={successRef} className="text-center scroll-mt-4">
          <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center mx-auto mb-5">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
          
          <p className="text-lg text-gray-700 mb-1 font-medium">
            We call YOU — no need to dial anything.
          </p>
          <p className="text-gray-600">
            {agentName ? `${agentName} will call you on` : "Your agent will call you on"}
          </p>
          
          <p className="text-xl font-bold text-gray-900 mt-2">{getSelectedDateDisplay()}</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {convertToUserTimezone(confirmedTime, userTimezone)}
          </p>
          {isTimezoneDifferent(userTimezone) && (
            <p className="text-gray-500 text-sm mt-1">
              ({getEasternTimeDisplay(confirmedTime)} Eastern)
            </p>
          )}

          <p className="text-base text-gray-500 mt-3 flex items-center justify-center gap-1">
            <span>📱</span> We've sent a confirmation to your phone
          </p>

          {/* What to have ready checklist */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mt-6 text-left">
            <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              What to Have Ready for Your Call
            </p>
            <ul className="space-y-3 text-base text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                Your <strong>Medicare card</strong> (red, white & blue)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                Your current <strong>Medicare Supplement card</strong>
              </li>
            </ul>
            <p className="text-sm text-gray-500 mt-3">That's it! Your agent handles everything else.</p>
          </div>

          <div className="space-y-3 mt-6">
            <Button
              onClick={() => downloadIcsFile(confirmedTime, contactForm.firstName, contactForm.lastName)}
              className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-xl"
            >
              <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
              Add to Calendar
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Add a reminder so you don't miss your call
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

          {/* Save number — friendly phone icon */}
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-800">Save This Number</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">(201) 298-8393</p>
            <p className="text-base text-gray-600">Save as "Health Helpers" so you know it's us calling</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mt-6 text-left">
            <p className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-base">
              <span>📋</span> What to Expect on Your Call (15-20 min)
            </p>
            <ul className="space-y-2 text-base text-gray-700">
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
                Answer your questions — zero pressure
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
