import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';
const LOCATION_ID = 'ryRZOfU1dkYsUVlNyUmH';
const CALENDAR_ID = 'DK08ISU9KTqjWEhxBNbo';
const APPOINTMENT_DURATION_MINUTES = 30;

// Different API versions for different endpoints
const CALENDAR_API_VERSION = '2021-04-15';
const CONTACTS_API_VERSION = '2021-07-28';

interface FreeSlotsRequest {
  action: 'free-slots';
  date: string; // YYYY-MM-DD format
}

interface SearchContactRequest {
  action: 'search-contact';
  phone: string; // E.164 format
}

interface BookAppointmentRequest {
  action: 'book-appointment';
  contactId: string;
  startTime: string; // ISO 8601 with Eastern timezone
  firstName: string;
  lastName: string;
  quotedRate: number;
  monthlySavings: number;
  planType: string;
}

type RequestBody = FreeSlotsRequest | SearchContactRequest | BookAppointmentRequest;

// Convert date string to epoch milliseconds for start of day in Eastern timezone
function getEasternDayStartMs(dateStr: string): number {
  // Parse the date and set to midnight Eastern
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date at midnight Eastern (approximate - use offset)
  const date = new Date(`${dateStr}T00:00:00-05:00`);
  return date.getTime();
}

// Convert date string to epoch milliseconds for end of day in Eastern timezone
function getEasternDayEndMs(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(`${dateStr}T23:59:59-05:00`);
  return date.getTime();
}

// Add minutes to a time string (handles various ISO formats)
function addMinutes(isoTime: string, minutes: number): string {
  const date = new Date(isoTime);
  date.setMinutes(date.getMinutes() + minutes);
  
  // Detect the timezone offset format from the input
  let offset = '-05:00'; // Default to Eastern
  
  // Check for +HH:MM or -HH:MM at the end
  const offsetMatch = isoTime.match(/([+-]\d{2}:\d{2})$/);
  if (offsetMatch) {
    offset = offsetMatch[1];
  } else if (isoTime.endsWith('Z')) {
    // UTC format - keep Eastern offset for GHL
    offset = '-05:00';
  }
  // If no offset found (e.g., .000Z or plain), default to Eastern
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  const secs = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${mins}:${secs}${offset}`;
}

// Normalize phone number to E.164 format
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// Sleep helper for retry logic
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN');
    if (!GHL_API_TOKEN) {
      console.error('GHL_API_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'API token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    console.log('GHL Calendar request:', body.action);

    // ========== FREE SLOTS ==========
    if (body.action === 'free-slots') {
      const { date } = body as FreeSlotsRequest;
      console.log('Fetching free slots for date:', date);

      const startDateMs = getEasternDayStartMs(date);
      const endDateMs = getEasternDayEndMs(date);

      console.log('Date range (ms):', { startDateMs, endDateMs });

      const url = `${GHL_BASE_URL}/calendars/${CALENDAR_ID}/free-slots?startDate=${startDateMs}&endDate=${endDateMs}&timezone=America/New_York`;
      
      console.log('Calling GHL free-slots:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': CALENDAR_API_VERSION,
        },
      });

      const responseText = await response.text();
      console.log('GHL free-slots response status:', response.status);
      console.log('GHL free-slots response:', responseText);

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch slots', details: responseText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = JSON.parse(responseText);
      
      // Parse the response - GHL may return full ISO timestamps or time-only strings
      // The response has a dynamic date key
      let slots: string[] = [];
      for (const dateKey of Object.keys(data)) {
        if (dateKey === 'traceId') continue; // Skip metadata
        if (data[dateKey]?.slots && Array.isArray(data[dateKey].slots)) {
          slots = data[dateKey].slots.map((slot: string) => {
            // Check if slot already contains the full date or is time-only
            if (slot.startsWith('T')) {
              // Time-only format: combine with date key
              return `${dateKey}${slot}`;
            } else {
              // Already a full ISO timestamp: return as-is
              return slot;
            }
          });
          break;
        }
      }

      console.log('Processed slots:', slots);

      return new Response(
        JSON.stringify({ slots, date }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== SEARCH CONTACT ==========
    if (body.action === 'search-contact') {
      const { phone } = body as SearchContactRequest;
      const normalizedPhone = normalizePhone(phone);
      console.log('Searching for contact with phone:', normalizedPhone);

      const encodedPhone = encodeURIComponent(normalizedPhone);
      const url = `${GHL_BASE_URL}/contacts/search/duplicate?locationId=${LOCATION_ID}&number=${encodedPhone}`;

      console.log('Calling GHL contact search:', url);

      // First attempt
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': CONTACTS_API_VERSION,
        },
      });

      let responseText = await response.text();
      console.log('GHL contact search response status:', response.status);
      console.log('GHL contact search response:', responseText);

      let data = response.ok ? JSON.parse(responseText) : null;
      let contactId = data?.contact?.id;

      // If not found, wait 2 seconds and retry once (webhook may still be processing)
      if (!contactId) {
        console.log('Contact not found, waiting 2 seconds and retrying...');
        await sleep(2000);

        response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': CONTACTS_API_VERSION,
          },
        });

        responseText = await response.text();
        console.log('GHL contact search retry response:', responseText);

        data = response.ok ? JSON.parse(responseText) : null;
        contactId = data?.contact?.id;
      }

      if (!contactId) {
        return new Response(
          JSON.stringify({ 
            error: 'contact_not_found', 
            message: "We're still setting up your account. Please try again in a moment or call us at (201) 298-8393." 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Found contact ID:', contactId);

      return new Response(
        JSON.stringify({ contactId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ========== BOOK APPOINTMENT ==========
    if (body.action === 'book-appointment') {
      const { contactId, startTime, firstName, lastName, quotedRate, monthlySavings, planType } = body as BookAppointmentRequest;
      
      console.log('Booking appointment:', { contactId, startTime, firstName, lastName });

      const endTime = addMinutes(startTime, APPOINTMENT_DURATION_MINUTES);

      const appointmentBody = {
        calendarId: CALENDAR_ID,
        locationId: LOCATION_ID,
        contactId,
        startTime,
        endTime,
        title: `Medicare Supplement Consultation - ${firstName} ${lastName}`,
        appointmentStatus: 'confirmed',
        description: `Quote: $${quotedRate}/mo | Savings: $${monthlySavings}/mo | Plan: ${planType}`,
      };

      console.log('Creating appointment:', appointmentBody);

      const response = await fetch(`${GHL_BASE_URL}/calendars/events/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Version': CALENDAR_API_VERSION,
        },
        body: JSON.stringify(appointmentBody),
      });

      const responseText = await response.text();
      console.log('GHL book appointment response status:', response.status);
      console.log('GHL book appointment response:', responseText);

      // Handle slot taken (409 Conflict)
      if (response.status === 409) {
        return new Response(
          JSON.stringify({ 
            error: 'slot_taken', 
            message: "That time just got taken. Please pick another time." 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!response.ok) {
        return new Response(
          JSON.stringify({ 
            error: 'booking_failed', 
            message: "Something went wrong. Please try again or call us at (201) 298-8393.",
            details: responseText 
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = JSON.parse(responseText);
      console.log('Appointment created successfully:', data);

      // Extract assigned user name if available from GHL response
      const assignedUser = data.assignedUsers?.[0]?.name || data.calendarName || null;

      return new Response(
        JSON.stringify({ 
          success: true, 
          appointmentId: data.id || data.appointmentId,
          assignedUser 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('GHL Calendar error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
