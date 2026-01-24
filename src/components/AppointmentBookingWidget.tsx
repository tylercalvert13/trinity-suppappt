import React, { useState, useMemo } from 'react';
import { Check, ChevronLeft, Phone, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentWidgetProps {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  quotedPremium: number;
  monthlySavings: number;
  planType: string;
  userTimezone: string;
  onComplete?: () => void;
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
  quotedPremium,
  monthlySavings,
  planType,
  userTimezone,
  onComplete
}: AppointmentWidgetProps) {
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'morning' | 'afternoon' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedTime, setConfirmedTime] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);

  // Get next 4 available weekdays
  const availableWeekdays = useMemo(() => getNextAvailableWeekdays(4), []);

  // Filter slots by time range
  const filteredSlots = useMemo(() => {
    if (!selectedTimeRange) return availableSlots;
    return availableSlots.filter(slot => 
      selectedTimeRange === 'morning' ? isMorningSlot(slot.original) : isAfternoonSlot(slot.original)
    );
  }, [availableSlots, selectedTimeRange]);

  // Check if morning/afternoon have slots
  const hasMorningSlots = useMemo(() => 
    availableSlots.some(slot => isMorningSlot(slot.original)), [availableSlots]);
  const hasAfternoonSlots = useMemo(() => 
    availableSlots.some(slot => isAfternoonSlot(slot.original)), [availableSlots]);

  // Fetch available slots for a date
  const fetchSlots = async (date: Date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dateStr = formatDateString(date);
      console.log('Fetching slots for:', dateStr);

      const { data, error: fetchError } = await supabase.functions.invoke('ghl-calendar', {
        body: { action: 'free-slots', date: dateStr }
      });

      if (fetchError) throw fetchError;

      console.log('Received slots:', data);

      if (!data.slots || data.slots.length === 0) {
        setError('No times available on this day. Please pick another day.');
        setBookingStep(1);
        return;
      }

      // Convert slots to display format
      const slotsWithDisplay: SlotData[] = data.slots.map((slot: string) => ({
        original: slot,
        display: convertToUserTimezone(slot, userTimezone)
      }));

      setAvailableSlots(slotsWithDisplay);
      setBookingStep(2);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Connection issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle day selection
  const handleDaySelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeRange(null);
    setSelectedSlot(null);
    fetchSlots(date);
  };

  // Handle time range selection
  const handleTimeRangeSelect = (range: 'morning' | 'afternoon') => {
    setSelectedTimeRange(range);
    setSelectedSlot(null);
    setBookingStep(3);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: SlotData) => {
    setSelectedSlot(slot);
    setBookingStep(4);
  };

  // Handle back navigation
  const handleBack = () => {
    setError(null);
    if (bookingStep === 2) {
      setBookingStep(1);
      setSelectedDate(null);
      setAvailableSlots([]);
    } else if (bookingStep === 3) {
      setBookingStep(2);
      setSelectedTimeRange(null);
    } else if (bookingStep === 4) {
      setBookingStep(3);
      setSelectedSlot(null);
    }
  };

  // Book the appointment
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !selectedDate) return;

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Look up the contact
      console.log('Looking up contact for phone:', phone);
      const { data: contactData, error: contactError } = await supabase.functions.invoke('ghl-calendar', {
        body: { action: 'search-contact', phone }
      });

      if (contactError || contactData?.error) {
        const errorMsg = contactData?.message || "We're still setting up your account. Please try again in a moment or call us at (201) 298-8393.";
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log('Found contact:', contactData.contactId);

      // Step 2: Book the appointment
      console.log('Booking appointment at:', selectedSlot.original);
      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('ghl-calendar', {
        body: {
          action: 'book-appointment',
          contactId: contactData.contactId,
          startTime: selectedSlot.original,
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
        // Refresh slots and go back to step 3
        if (selectedDate) {
          await fetchSlots(selectedDate);
          setBookingStep(3);
        }
        setIsLoading(false);
        return;
      }

      if (bookingData?.error) {
        setError(bookingData.message || 'Something went wrong. Please try again or call us at (201) 298-8393.');
        setIsLoading(false);
        return;
      }

      console.log('Appointment booked:', bookingData);
      setAgentName(bookingData?.assignedUser || null);
      setConfirmedTime(selectedSlot.original);
      setBookingStep(5);
      onComplete?.();

    } catch (err) {
      console.error('Booking error:', err);
      setError('Something went wrong. Please try again or call us at (201) 298-8393.');
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
      {/* Quote Summary Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 text-center border border-green-100">
        <p className="text-gray-600 text-sm mb-1">Your New Rate</p>
                <p className="text-3xl font-bold text-green-700">${quotedPremium.toFixed(2)}/mo</p>
                <p className="text-green-600 font-semibold mt-1">
                  You Save ${monthlySavings.toFixed(2)}/mo
                </p>
      </div>

      {/* Step Indicator */}
      {bookingStep < 5 && (
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
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
      {bookingStep < 5 && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Your Call</h2>
          <p className="text-gray-600 mt-1">Pick a time to lock in this rate</p>
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
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">
            {bookingStep === 4 ? 'Booking your appointment...' : 'Checking availability...'}
          </p>
        </div>
      )}

      {/* Step 1: Pick a Day */}
      {bookingStep === 1 && !isLoading && (
        <div className="space-y-3">
          {availableWeekdays.map((date, index) => {
            const { primary, secondary } = formatDateLabel(date, index);
            return (
              <button
                key={date.toISOString()}
                onClick={() => handleDaySelect(date)}
                className="w-full min-h-[70px] p-4 bg-white border-2 border-gray-200 rounded-xl 
                         hover:border-green-600 hover:bg-green-50 transition-all
                         flex flex-col items-center justify-center"
              >
                <span className="text-xl font-semibold text-gray-900">{primary}</span>
                <span className="text-gray-500">{secondary}</span>
              </button>
            );
          })}

          {/* Alternative: Call now */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 mb-2">— or —</p>
            <p className="text-gray-600 mb-1">Prefer we call you now?</p>
            <a 
              href="tel:+12012988393" 
              className="inline-flex items-center gap-2 text-xl font-bold text-green-700 hover:text-green-800"
            >
              <Phone className="w-5 h-5" />
              (201) 298-8393
            </a>
          </div>
        </div>
      )}

      {/* Step 2: Morning or Afternoon */}
      {bookingStep === 2 && !isLoading && (
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

          {hasMorningSlots && (
            <button
              onClick={() => handleTimeRangeSelect('morning')}
              className="w-full min-h-[70px] p-4 bg-white border-2 border-gray-200 rounded-xl 
                       hover:border-green-600 hover:bg-green-50 transition-all
                       flex items-center justify-center"
            >
              <span className="text-xl font-semibold text-gray-900">Morning</span>
            </button>
          )}

          {hasAfternoonSlots && (
            <button
              onClick={() => handleTimeRangeSelect('afternoon')}
              className="w-full min-h-[70px] p-4 bg-white border-2 border-gray-200 rounded-xl 
                       hover:border-green-600 hover:bg-green-50 transition-all
                       flex items-center justify-center"
            >
              <span className="text-xl font-semibold text-gray-900">Afternoon</span>
            </button>
          )}

          {!hasMorningSlots && !hasAfternoonSlots && (
            <p className="text-center text-gray-600 py-4">
              No times available on this day. Please pick another day.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Pick a Time */}
      {bookingStep === 3 && !isLoading && (
        <div className="space-y-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Pick a different time range</span>
          </button>

          <p className="text-center text-gray-600 mb-4">
            {getSelectedDateDisplay()} • {selectedTimeRange === 'morning' ? 'Morning' : 'Afternoon'}
          </p>

          {filteredSlots.map((slot) => (
            <button
              key={slot.original}
              onClick={() => handleSlotSelect(slot)}
              className="w-full min-h-[70px] p-4 bg-white border-2 border-gray-200 rounded-xl 
                       hover:border-green-600 hover:bg-green-50 transition-all
                       flex items-center justify-center"
            >
              <span className="text-2xl font-semibold text-gray-900">{slot.display}</span>
            </button>
          ))}

          {filteredSlots.length === 0 && (
            <p className="text-center text-gray-600 py-4">
              No times available in this range. Please pick a different time range.
            </p>
          )}
        </div>
      )}

      {/* Step 4: Confirmation */}
      {bookingStep === 4 && !isLoading && selectedSlot && (
        <div className="space-y-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Pick a different time</span>
          </button>

          <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
            <p className="text-gray-600 mb-2">Your appointment</p>
            <p className="text-xl font-bold text-gray-900">{getSelectedDateDisplay()}</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{selectedSlot.display}</p>
          </div>

          <Button
            onClick={handleConfirmBooking}
            disabled={isLoading}
            className="w-full min-h-[60px] bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              'Confirm Appointment'
            )}
          </Button>
        </div>
      )}

      {/* Step 5: Success */}
      {bookingStep === 5 && confirmedTime && (
        <div className="text-center">
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
            {getEasternTimeDisplay(confirmedTime)} Eastern
          </p>
          {isTimezoneDifferent(userTimezone) && (
            <p className="text-gray-500 text-sm mt-1">
              ({convertToUserTimezone(confirmedTime, userTimezone)} your time)
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
