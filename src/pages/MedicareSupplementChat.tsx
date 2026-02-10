import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFunnelAnalytics } from '@/hooks/useFunnelAnalytics';
import { useCalendarWarmup } from '@/hooks/useCalendarWarmup';
import { useQuoteWarmup } from '@/hooks/useQuoteWarmup';
import { z } from 'zod';
import { getStateFromZip } from '@/lib/zipToState';
import { toast } from 'sonner';
import { ExitIntentModal } from '@/components/ExitIntentModal';
import { SocialProofPopup } from '@/components/SocialProofPopup';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatBubble from '@/components/chat/ChatBubble';
import ChatButtonGroup from '@/components/chat/ChatButtonGroup';
import ChatInput from '@/components/chat/ChatInput';
import ChatContactForm from '@/components/chat/ChatContactForm';
import TypingIndicator from '@/components/chat/TypingIndicator';
// QuoteResultCard removed — rate is now delivered as chat bubbles
import BookingConfirmationCard from '@/components/chat/BookingConfirmationCard';

declare global {
  interface Window {
    uetq?: any[];
    gtag?: (...args: any[]) => void;
    vbpx?: (...args: any[]) => void;
  }
}

const PHONE_NUMBER = "(201) 426-9898";
const PHONE_TEL = "tel:+12014269898";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Please enter a valid email").max(255),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, "Phone must be 10 digits")
    .refine(val => !val.startsWith('0') && !val.startsWith('1'), "Please enter a valid US phone number"),
});

interface FormData {
  plan: string;
  currentPayment: string;
  careOrCondition: string;
  recentTreatment: string;
  medicationUse: string;
  gender: string;
  tobacco: string;
  spouse: string;
  age: string;
  zipCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface QuoteResult {
  rate: number;
  carrier: string;
  amBestRating: string;
  monthlySavings: number;
  annualSavings: number;
  savingsPercent: number;
  cannotBeatRate?: boolean;
  error?: string;
}

interface SlotData {
  original: string;
  display: string;
}

type ChatStep =
  | 'start' | 'plan' | 'payment' | 'care' | 'treatment' | 'medications'
  | 'gender' | 'tobacco' | 'spouse' | 'age' | 'zip' | 'contact'
  | 'loading' | 'qualified' | 'pick-day' | 'pick-time' | 'booking' | 'booked';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  content: string;
  type: 'text' | 'buttons' | 'input' | 'contact' | 'card' | 'widget' | 'typing';
  options?: string[];
  inputType?: 'text' | 'number' | 'currency' | 'zip';
  inputPlaceholder?: string;
  selected?: string | null;
}

// --- Tracking helpers (same as /suppappt) ---
const getFacebookCookies = () => {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  return { fbc: cookies._fbc, fbp: cookies._fbp };
};

const getVisitorIdForTracking = (): string => {
  const storageKey = 'funnel_visitor_id';
  let visitorId = localStorage.getItem(storageKey);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
  }
  return visitorId;
};

const generateEventId = (): string => `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const trackFacebookSubmissionEvent = async (formData: FormData, quoteResult: QuoteResult | null) => {
  try {
    const { fbc, fbp } = getFacebookCookies();
    await supabase.functions.invoke('fb-conversion', {
      body: {
        event_name: 'submission',
        event_source_url: window.location.href,
        external_id: getVisitorIdForTracking(),
        fbc, fbp,
        event_id: generateEventId(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        zip_code: formData.zipCode,
        value: quoteResult?.monthlySavings || quoteResult?.rate || 0,
        currency: 'USD',
      }
    });
  } catch (error) {
    console.error('Error tracking Facebook submission event:', error);
  }
};

const normalizeEmailForBing = (email: string): string => {
  let normalized = email.trim().toLowerCase();
  normalized = normalized.replace(/\+[^@]*@/, '@');
  const [localPart, domain] = normalized.split('@');
  if (!domain) return normalized;
  return `${localPart.replace(/\./g, '')}@${domain}`;
};

const trackBingSubmissionEvent = (formData: FormData) => {
  try {
    if (!window.uetq) return;
    const phoneDigits = formData.phone.replace(/\D/g, '');
    window.uetq.push('set', { pid: { em: normalizeEmailForBing(formData.email), ph: `+1${phoneDigits}` } });
    window.uetq.push('event', 'submit_lead_form', {});
  } catch (error) {
    console.error('Error tracking Bing conversion:', error);
  }
};

const trackGoogleAdsConversion = () => {
  try {
    if (!window.gtag) return;
    window.gtag('event', 'conversion', { send_to: 'AW-17916268698/760DCPf-lO8bEJqhkt9C', value: 1.0, currency: 'USD' });
  } catch (error) {
    console.error('Error tracking Google Ads conversion:', error);
  }
};

const trackVibeCoLeadEvent = () => {
  try {
    if (!window.vbpx) return;
    window.vbpx('event', 'lead');
  } catch (error) {
    console.error('Error tracking Vibe.co lead event:', error);
  }
};

// Health screening lists
const CARE_LIST = [
  'Nursing home or assisted living',
  'Need daily help with personal care',
  'Hospice or home health care',
  'Dementia or Alzheimer\'s',
  'Use oxygen at home',
  'Wheelchair-bound or bedridden',
];

const TREATMENT_LIST = [
  'Cancer, heart attack, or stroke',
  'Congestive heart failure (CHF) or COPD',
  'Heart procedure: bypass, stent, or pacemaker',
  'Kidney dialysis or organ transplant',
  'ALS, Parkinson\'s, or MS',
];

const MEDICATIONS_LIST = [
  'Use insulin',
  'Take 3+ diabetes medications',
  'Daily prescription pain medicine (opioids)',
  'Biologic injections or infusions (e.g., Humira, Enbrel)',
];

// --- Booking helpers ---
function getNextAvailableWeekdays(count: number): Date[] {
  const weekdays: Date[] = [];
  const now = new Date();
  const easternNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const isBeforeCutoff = easternNow.getHours() < 16;
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  const dayOfWeek = current.getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  if (!isBeforeCutoff || !isWeekday) {
    current.setDate(current.getDate() + 1);
  }
  while (weekdays.length < count) {
    const day = current.getDay();
    if (day >= 1 && day <= 5) weekdays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return weekdays;
}

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayButtonLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (dateOnly.getTime() === today.getTime()) return `Today - ${monthDay}`;
  if (dateOnly.getTime() === tomorrow.getTime()) return `Tomorrow - ${monthDay}`;
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  return `${dayName} - ${monthDay}`;
}

function getDayLabelShort(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function convertToUserTimezone(easternIsoString: string, userTimezone: string): string {
  try {
    const date = new Date(easternIsoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: userTimezone, hour12: true });
  } catch {
    const date = new Date(easternIsoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}

function getEasternTimeDisplay(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', hour12: true });
  } catch {
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
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

const MedicareSupplementChat = () => {
  const navigate = useNavigate();
  const [chatStep, setChatStep] = useState<ChatStep>('start');
  const [messages, setMessages] = useState<Message[]>([]);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});
  const [showInput, setShowInput] = useState<{ type: 'text' | 'number' | 'currency' | 'zip'; placeholder: string } | null>(null);
  const [showButtons, setShowButtons] = useState<{ options: string[]; step: ChatStep } | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Booking state
  const [preloadedSlots, setPreloadedSlots] = useState<Map<string, SlotData[]>>(new Map());
  const [availableDays, setAvailableDays] = useState<Date[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayLabel, setSelectedDayLabel] = useState<string>('');
  const [daySlots, setDaySlots] = useState<SlotData[]>([]);
  const [bookedSlot, setBookedSlot] = useState<SlotData | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const userTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const showEasternTime = useMemo(() => isTimezoneDifferent(userTimezone), [userTimezone]);

  const [formData, setFormData] = useState<FormData>({
    plan: '', currentPayment: '', careOrCondition: '', recentTreatment: '',
    medicationUse: '', gender: '', tobacco: '', spouse: '', age: '', zipCode: '',
    firstName: '', lastName: '', email: '', phone: '',
  });

  const { visitorId, sessionId, trackStepChange, trackQualification, trackEvent } = useFunnelAnalytics('suppchat');
  useCalendarWarmup();
  useQuoteWarmup();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showButtons, showInput, showContactForm, showConfirmation]);

  // Urgency toast 10 seconds after qualification
  useEffect(() => {
    if (chatStep === 'pick-day' && !toastShown) {
      const timer = setTimeout(() => {
        toast("⏰ Your rate is reserved — pick a time to lock it in", { duration: 5000, position: 'top-center' });
        setToastShown(true);
        trackEvent({ eventType: 'conversion_trigger', metadata: { trigger: 'urgency_toast' } });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [chatStep, toastShown, trackEvent]);

  // TrustedForm script
  useEffect(() => {
    if (document.getElementById('trustedform-script')) return;
    const tf = document.createElement('script');
    tf.type = 'text/javascript';
    tf.async = true;
    tf.id = 'trustedform-script';
    tf.src = 'https://api.trustedform.com/trustedform.js?field=xxTrustedFormCertUrl&ping_field=xxTrustedFormPingUrl&use_tagged_consent=true&l=' +
      new Date().getTime() + Math.random();
    const s = document.getElementsByTagName('script')[0];
    s.parentNode?.insertBefore(tf, s);
    return () => { document.getElementById('trustedform-script')?.remove(); };
  }, []);

  // SEO meta tags
  useEffect(() => {
    document.title = "Medicare Supplement Chat | Health Helpers";
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');
    return () => {
      document.title = "Medicare Self-Enrollment Online | Health Helpers";
      robotsMeta?.setAttribute('content', 'index, follow');
    };
  }, []);

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }]);
  }, []);

  const botSay = useCallback(async (text: string, delay = 600) => {
    setShowInput(null);
    setShowButtons(null);
    setShowContactForm(false);
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
    addMessage({ sender: 'bot', content: text, type: 'text' });
  }, [addMessage]);

  // Start the conversation
  useEffect(() => {
    const startChat = async () => {
      await botSay("Hey there! 👋 I help seniors find lower rates on their Medicare Supplement plan.", 800);
      await botSay("Want to check if you can save?", 500);
      setShowButtons({ options: ["Let's Do It! 🎉"], step: 'start' });
    };
    startChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Booking: preload slots when qualified ---
  const preloadSlots = useCallback(async (): Promise<{ days: Date[]; slots: Map<string, SlotData[]> }> => {
    const candidateWeekdays = getNextAvailableWeekdays(10);
    const firstDay = candidateWeekdays[0];
    const lastDay = candidateWeekdays[candidateWeekdays.length - 1];
    if (!firstDay || !lastDay) return { days: [], slots: new Map() };

    const startDate = formatDateString(firstDay);
    const endDate = formatDateString(lastDay);

    try {
      console.log('[Chat Booking] Preloading slots', startDate, 'to', endDate);
      const { data, error } = await supabase.functions.invoke('ghl-calendar', {
        body: { action: 'free-slots-batch', startDate, endDate }
      });
      if (error) throw error;

      if (data?.slotsByDate) {
        const newCache = new Map<string, SlotData[]>();
        for (const [dateStr, slots] of Object.entries(data.slotsByDate)) {
          const slotsWithDisplay: SlotData[] = (slots as string[]).map((slot: string) => ({
            original: slot,
            display: convertToUserTimezone(slot, userTimezone)
          }));
          newCache.set(dateStr, slotsWithDisplay);
        }
        setPreloadedSlots(newCache);

        const daysWithSlots = candidateWeekdays.filter(date => {
          const dateStr = formatDateString(date);
          const slots = newCache.get(dateStr);
          return slots && slots.length > 0;
        }).slice(0, 3);

        setAvailableDays(daysWithSlots);
        console.log('[Chat Booking] Found', daysWithSlots.length, 'days with slots');
        return { days: daysWithSlots, slots: newCache };
      }
    } catch (err) {
      console.error('[Chat Booking] Preload error:', err);
    }
    return { days: [], slots: new Map() };
  }, [userTimezone]);

  // --- Present day selection after quote ---
  const presentDaySelection = useCallback(async (days?: Date[]) => {
    const daysToUse = days || availableDays;
    if (daysToUse.length === 0) {
      await botSay("I'm having trouble finding available times right now. Please call us at (201) 298-8393 to schedule.");
      return;
    }
    trackEvent({ eventType: 'booking_widget_view' });
    setChatStep('pick-day');
    const dayOptions = daysToUse.map(d => formatDayButtonLabel(d));
    setShowButtons({ options: dayOptions, step: 'pick-day' });
  }, [availableDays, botSay, trackEvent]);

  const handleButtonSelect = useCallback(async (option: string, step: ChatStep) => {
    setShowButtons(null);
    addMessage({ sender: 'user', content: option, type: 'text' });

    switch (step) {
      case 'start':
        trackStepChange('plan');
        setChatStep('plan');
        await botSay("Which Medicare Supplement plan do you have today?");
        setShowButtons({ options: ['Plan G', 'Plan N', 'Plan F'], step: 'plan' });
        break;

      case 'plan':
        setFormData(prev => ({ ...prev, plan: option }));
        trackStepChange('payment', option);
        setChatStep('payment');
        await botSay("Got it! How much do you pay each month for your plan?");
        setShowInput({ type: 'currency', placeholder: '0.00' });
        break;

      case 'care':
        setFormData(prev => ({ ...prev, careOrCondition: option === 'Yes' ? 'yes' : 'no' }));
        if (option === 'Yes') {
          trackQualification('disqualified', 'care_or_condition');
          saveSubmission('disqualified', 'care_or_condition');
          await botSay("I'm sorry — based on your answers, we can't find a lower rate for you right now. But don't worry, there may be other options.");
          setTimeout(() => navigate('/disqualified?reason=care'), 2000);
          return;
        }
        trackStepChange('treatment', 'no');
        setChatStep('treatment');
        await botSay("In the last 2 years, have you had any of these?");
        await botSay(TREATMENT_LIST.map(item => `• ${item}`).join('\n'), 400);
        setShowButtons({ options: ['Yes', 'No'], step: 'treatment' });
        break;

      case 'treatment':
        setFormData(prev => ({ ...prev, recentTreatment: option === 'Yes' ? 'yes' : 'no' }));
        if (option === 'Yes') {
          trackQualification('disqualified', 'recent_treatment');
          saveSubmission('disqualified', 'recent_treatment');
          await botSay("I'm sorry — based on your medical history, we can't find a lower rate right now.");
          setTimeout(() => navigate('/disqualified?reason=treatment'), 2000);
          return;
        }
        trackStepChange('medications', 'no');
        setChatStep('medications');
        await botSay("Almost done with health questions! Do any of these apply?");
        await botSay(MEDICATIONS_LIST.map(item => `• ${item}`).join('\n'), 400);
        setShowButtons({ options: ['Yes', 'No'], step: 'medications' });
        break;

      case 'medications':
        setFormData(prev => ({ ...prev, medicationUse: option === 'Yes' ? 'yes' : 'no' }));
        if (option === 'Yes') {
          trackQualification('disqualified', 'medication_use');
          saveSubmission('disqualified', 'medication_use');
          await botSay("I'm sorry — based on your medications, we can't find a lower rate right now.");
          setTimeout(() => navigate('/disqualified?reason=medications'), 2000);
          return;
        }
        trackStepChange('gender', 'no');
        setChatStep('gender');
        await botSay("Great, you passed the health check! ✅ Now a couple quick questions...");
        await botSay("What's your gender?", 400);
        setShowButtons({ options: ['Male', 'Female'], step: 'gender' });
        break;

      case 'gender':
        setFormData(prev => ({ ...prev, gender: option.toLowerCase() }));
        trackStepChange('tobacco', option.toLowerCase());
        setChatStep('tobacco');
        await botSay("Have you used any tobacco products in the last 12 months?");
        setShowButtons({ options: ['Yes', 'No'], step: 'tobacco' });
        break;

      case 'tobacco':
        setFormData(prev => ({ ...prev, tobacco: option === 'Yes' ? 'yes' : 'no' }));
        trackStepChange('spouse', option === 'Yes' ? 'yes' : 'no');
        setChatStep('spouse');
        await botSay("Do you have a spouse or domestic partner? (Some carriers offer household discounts!)");
        setShowButtons({ options: ['Yes', 'No'], step: 'spouse' });
        break;

      case 'spouse':
        setFormData(prev => ({ ...prev, spouse: option === 'Yes' ? 'yes' : 'no' }));
        trackStepChange('age', option === 'Yes' ? 'yes' : 'no');
        setChatStep('age');
        await botSay("What's your current age?");
        setShowInput({ type: 'number', placeholder: 'Your age' });
        break;

      // --- Booking steps ---
      case 'pick-day': {
        // Find matching day
        const matchedDay = availableDays.find(d => formatDayButtonLabel(d) === option);
        if (!matchedDay) return;
        setSelectedDay(matchedDay);
        const label = getDayLabelShort(matchedDay);
        setSelectedDayLabel(label);
        const dateStr = formatDateString(matchedDay);
        const cached = preloadedSlots.get(dateStr);
        trackEvent({ eventType: 'booking_day_selected', metadata: { day: dateStr, dayLabel: label, slotCount: cached?.length || 0 } });

        if (cached && cached.length > 0) {
          setDaySlots(cached);
          setChatStep('pick-time');
          await botSay(`Here are the available times for ${label}:`);
          const timeOptions = cached.map(s => s.display);
          setShowButtons({ options: timeOptions, step: 'pick-time' });
        } else {
          await botSay("No times available on that day. Try another:");
          setShowButtons({ options: availableDays.map(d => formatDayButtonLabel(d)), step: 'pick-day' });
        }
        break;
      }

      case 'pick-time': {
        // Find matching slot
        const matchedSlot = daySlots.find(s => s.display === option);
        if (!matchedSlot) return;
        trackEvent({ eventType: 'booking_time_selected', metadata: { time: option, slotOriginal: matchedSlot.original } });

        setChatStep('booking');
        setIsTyping(true);

        try {
          // Step 1: Look up contact
          const { data: contactData, error: contactError } = await supabase.functions.invoke('ghl-calendar', {
            body: { action: 'search-contact', phone: formData.phone }
          });
          if (contactError || contactData?.error) {
            setIsTyping(false);
            trackEvent({ eventType: 'booking_error', metadata: { error: 'contact_lookup_failed' } });
            await botSay("We're still setting up your account. Let me try again...");
            // Retry once after delay
            await new Promise(r => setTimeout(r, 2000));
            const { data: retryData, error: retryError } = await supabase.functions.invoke('ghl-calendar', {
              body: { action: 'search-contact', phone: formData.phone }
            });
            if (retryError || retryData?.error) {
              await botSay(`Something went wrong. Please call us at ${PHONE_NUMBER} to schedule.`);
              return;
            }
            // Continue with retry data
            await bookAppointment(retryData.contactId, matchedSlot);
            return;
          }

          await bookAppointment(contactData.contactId, matchedSlot);
        } catch (err) {
          console.error('Booking error:', err);
          setIsTyping(false);
          trackEvent({ eventType: 'booking_error', metadata: { error: 'exception' } });
          await botSay(`Something went wrong. Please call us at ${PHONE_NUMBER} to schedule.`);
        }
        break;
      }
    }
  }, [addMessage, botSay, navigate, trackStepChange, trackQualification, trackEvent, availableDays, preloadedSlots, daySlots, formData.phone]);

  const bookAppointment = useCallback(async (contactId: string, slot: SlotData) => {
    try {
      trackEvent({ eventType: 'booking_confirm_clicked', metadata: { slotTime: slot.original } });

      const { data: bookingData, error: bookingError } = await supabase.functions.invoke('ghl-calendar', {
        body: {
          action: 'book-appointment',
          contactId,
          startTime: slot.original,
          firstName: formData.firstName,
          lastName: formData.lastName,
          quotedRate: quoteResult?.rate || 0,
          monthlySavings: quoteResult?.monthlySavings || 0,
          planType: formData.plan,
        }
      });

      setIsTyping(false);

      if (bookingError) throw bookingError;

      // Slot taken
      if (bookingData?.error === 'slot_taken') {
        trackEvent({ eventType: 'booking_error', metadata: { error: 'slot_taken' } });
        await botSay("That time just got taken! Pick another:");
        setChatStep('pick-time');
        const timeOptions = daySlots.filter(s => s.original !== slot.original).map(s => s.display);
        if (timeOptions.length > 0) {
          setShowButtons({ options: timeOptions, step: 'pick-time' });
        } else {
          await botSay("No more times on this day. Try another day:");
          setChatStep('pick-day');
          setShowButtons({ options: availableDays.map(d => formatDayButtonLabel(d)), step: 'pick-day' });
        }
        return;
      }

      if (bookingData?.error) {
        trackEvent({ eventType: 'booking_error', metadata: { error: 'booking_failed', message: bookingData.message } });
        await botSay(`Something went wrong. Please call us at ${PHONE_NUMBER} to schedule.`);
        return;
      }

      // Success!
      setBookedSlot(slot);
      setAgentName(bookingData?.assignedUser || null);
      setChatStep('booked');

      trackEvent({
        eventType: 'booking_completed',
        metadata: { appointmentId: bookingData?.id || '', agentName: bookingData?.assignedUser || '' }
      });

      await botSay(`You're all set, ${formData.firstName}! 🎉 We'll call you ${selectedDayLabel} at ${slot.display}.`);
      setShowConfirmation(true);

    } catch (err) {
      console.error('Booking error:', err);
      setIsTyping(false);
      trackEvent({ eventType: 'booking_error', metadata: { error: 'exception' } });
      await botSay(`Something went wrong. Please call us at ${PHONE_NUMBER} to schedule.`);
    }
  }, [formData, quoteResult, daySlots, availableDays, selectedDayLabel, botSay, trackEvent]);

  const handleInputSend = useCallback(async (value: string) => {
    setShowInput(null);
    addMessage({ sender: 'user', content: chatStep === 'payment' ? `$${value}` : value, type: 'text' });

    switch (chatStep) {
      case 'payment': {
        const payment = parseFloat(value);
        if (isNaN(payment) || payment <= 0) {
          await botSay("Hmm, that doesn't look right. Please enter your monthly payment amount.");
          setShowInput({ type: 'currency', placeholder: '0.00' });
          return;
        }
        setFormData(prev => ({ ...prev, currentPayment: value }));
        trackStepChange('care', value);
        setChatStep('care');
        await botSay("Quick health check — do any of these apply to you?");
        await botSay(CARE_LIST.map(item => `• ${item}`).join('\n'), 400);
        setShowButtons({ options: ['Yes', 'No'], step: 'care' });
        break;
      }
      case 'age': {
        const age = parseInt(value);
        if (isNaN(age) || age < 65 || age > 120) {
          await botSay("Please enter a valid age (65 or older).");
          setShowInput({ type: 'number', placeholder: 'Your age' });
          return;
        }
        setFormData(prev => ({ ...prev, age: value }));
        trackStepChange('zip', value);
        setChatStep('zip');
        await botSay("And what's your ZIP code?");
        setShowInput({ type: 'zip', placeholder: '12345' });
        break;
      }
      case 'zip': {
        if (!/^\d{5}$/.test(value)) {
          await botSay("Please enter a valid 5-digit ZIP code.");
          setShowInput({ type: 'zip', placeholder: '12345' });
          return;
        }
        setFormData(prev => ({ ...prev, zipCode: value }));
        trackStepChange('contact', value);
        setChatStep('contact');
        await botSay("Almost done! 🎯 I just need your contact info to pull your personalized rate.");
        setShowContactForm(true);
        break;
      }
    }
  }, [addMessage, botSay, chatStep, trackStepChange]);

  const handleContactSubmit = useCallback(async (data: { firstName: string; lastName: string; email: string; phone: string }) => {
    setValidationErrors({});

    const result = contactSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => { errors[err.path[0] as string] = err.message; });
      setValidationErrors(errors);
      return;
    }

    setIsValidating(true);
    try {
      const { data: validationData, error: valError } = await supabase.functions.invoke('validate-contact', {
        body: { email: data.email, phone: data.phone.replace(/\D/g, '') }
      });
      if (!valError && validationData && !validationData.valid) {
        const errors: Record<string, string> = {};
        if (!validationData.email?.valid) {
          errors.email = validationData.email?.disposable
            ? 'Please use a permanent email (no temporary emails)'
            : "We couldn't verify this email. Please check it.";
        }
        if (!validationData.phone?.valid) {
          errors.phone = "This phone number doesn't appear valid. Please double-check.";
        }
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setIsValidating(false);
          return;
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
    }
    setIsValidating(false);

    const updatedForm = { ...formData, ...data };
    setFormData(updatedForm);
    setShowContactForm(false);

    addMessage({ sender: 'user', content: `${data.firstName} ${data.lastName}\n${data.email}\n${data.phone}`, type: 'text' });

    setChatStep('loading');
    setIsSubmitting(true);
    trackStepChange('loading');

    // --- Realistic loading messages ---
    const stateName = getStateFromZip(updatedForm.zipCode.substring(0, 3)) || 'your area';
    let quoteFinished = false;

    const loadingMessages = async () => {
      await botSay("Give me one sec, I'm pulling up your rates...", 800);
      if (quoteFinished) return;
      await botSay(`Checking carriers in ${stateName}...`, 2000);
      if (quoteFinished) return;
      await botSay(`Comparing ${updatedForm.plan} rates for you...`, 2000);
      if (quoteFinished) return;
      await botSay("Almost got it...", 2000);
      if (quoteFinished) return;
      setIsTyping(true);
    };

    try {
      const slotsPromise = preloadSlots();
      const loadingPromise = loadingMessages();

      const fetchQuote = async (isRetry = false): Promise<{ data: any; error: any }> => {
        const quotePromise = supabase.functions.invoke('get-medicare-quote', {
          body: {
            plan: updatedForm.plan,
            currentPayment: parseFloat(updatedForm.currentPayment),
            gender: updatedForm.gender,
            tobacco: updatedForm.tobacco,
            spouse: updatedForm.spouse,
            age: parseInt(updatedForm.age),
            zipCode: updatedForm.zipCode,
          }
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Quote request timed out')), 30000)
        );
        try {
          const result = await Promise.race([quotePromise, timeoutPromise]);
          if (!isRetry && result.error) {
            const status = result.error?.context?.status || result.error?.status;
            if ([500, 502, 503, 504].includes(status)) {
              trackEvent({ eventType: 'quote_retry', metadata: { status, attempt: 2 } });
              return fetchQuote(true);
            }
          }
          return result;
        } catch (err) {
          if (!isRetry) {
            trackEvent({ eventType: 'quote_retry', metadata: { error: String(err), attempt: 2 } });
            return fetchQuote(true);
          }
          throw err;
        }
      };

      const { data: quoteData, error: quoteError } = await fetchQuote();
      quoteFinished = true;

      const slotsResult = await slotsPromise;
      await loadingPromise;

      setIsTyping(false);

      if (quoteError) {
        trackEvent({ eventType: 'quote_error', step: 'contact', metadata: { errorMessage: quoteError?.message || 'Unknown' } });
        await botSay("Oops, I'm having trouble getting your rate. Let me try again...");
        setShowContactForm(true);
        setChatStep('contact');
        setIsSubmitting(false);
        return;
      }

      if (quoteData?.cannotBeatRate) {
        await saveSubmission('knockout', undefined, undefined, updatedForm);
        await botSay("It looks like you already have a great rate! We can't beat what you're paying right now. 👏");
        setTimeout(() => navigate('/great-rate'), 2000);
        setIsSubmitting(false);
        return;
      }

      if (quoteData?.error) {
        await botSay("Something went wrong pulling your rate. Please try again or call us directly.");
        setShowContactForm(true);
        setChatStep('contact');
        setIsSubmitting(false);
        return;
      }

      // Success!
      setQuoteResult(quoteData);
      await saveSubmission('success', undefined, quoteData, updatedForm);

      // Capture TrustedForm certificate
      const getTrustedFormCertUrl = async (): Promise<string | null> => {
        const selectors = ['#xxTrustedFormCertUrl_0', '#xxTrustedFormCertUrl', 'input[name="xxTrustedFormCertUrl"]'];
        for (let attempt = 0; attempt < 20; attempt++) {
          for (const selector of selectors) {
            const el = document.querySelector(selector) as HTMLInputElement | null;
            if (el?.value?.startsWith('https://cert.trustedform.com/')) return el.value;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
      };
      const trustedFormCertUrl = await getTrustedFormCertUrl();

      // Send lead to GHL
      await supabase.functions.invoke('send-lead-webhook-suppappt', {
        body: {
          ...updatedForm,
          currentPayment: parseFloat(updatedForm.currentPayment),
          age: parseInt(updatedForm.age),
          quotedRate: quoteData.rate,
          quotedCarrier: quoteData.carrier,
          amBestRating: quoteData.amBestRating,
          savingsPercent: quoteData.savingsPercent,
          visitorId, sessionId,
          page: 'suppchat',
          timezone: userTimezone,
          trustedFormCertUrl,
        }
      });

      // Conversions
      trackQualification('qualified');
      await trackFacebookSubmissionEvent(updatedForm, quoteData);
      trackBingSubmissionEvent(updatedForm);
      trackGoogleAdsConversion();
      trackVibeCoLeadEvent();

      setChatStep('qualified');

      // --- Chat-native rate reveal (no card) ---
      await botSay(`Great news, ${updatedForm.firstName}! I found you a lower rate.`, 400);
      await botSay(`Your new ${updatedForm.plan} rate: $${quoteData.rate.toFixed(2)}/mo`, 600);
      await botSay(`That's $${quoteData.monthlySavings.toFixed(2)} less per month — you'd save $${quoteData.annualSavings.toFixed(2)} a year! 💰`, 600);

      await botSay("Let's get you on a quick call to lock this in. Pick a day: 📞", 600);
      await presentDaySelection(slotsResult.days);

    } catch (err) {
      console.error('Error getting quote:', err);
      setIsTyping(false);
      await botSay("An error occurred. Please try again or call us directly.");
      setShowContactForm(true);
      setChatStep('contact');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addMessage, botSay, navigate, trackStepChange, trackQualification, trackEvent, visitorId, sessionId, preloadSlots, presentDaySelection, userTimezone]);

  const saveSubmission = async (
    submissionType: 'success' | 'disqualified' | 'knockout',
    disqualificationReason?: string,
    quoteData?: QuoteResult,
    form?: FormData
  ) => {
    const f = form || formData;
    try {
      await supabase.from('submissions').insert([{
        visitor_id: visitorId,
        session_id: sessionId,
        plan: f.plan,
        current_payment: f.currentPayment ? parseFloat(f.currentPayment) : null,
        care_or_condition: f.careOrCondition,
        recent_treatment: f.recentTreatment,
        medication_use: f.medicationUse,
        gender: f.gender,
        tobacco: f.tobacco,
        spouse: f.spouse,
        age: f.age ? parseInt(f.age) : null,
        zip_code: f.zipCode,
        first_name: f.firstName,
        last_name: f.lastName,
        email: f.email,
        phone: f.phone,
        submission_type: submissionType,
        disqualification_reason: disqualificationReason || null,
        quoted_rate: quoteData?.rate || null,
        quoted_carrier: quoteData?.carrier || null,
        am_best_rating: quoteData?.amBestRating || null,
        monthly_savings: quoteData?.monthlySavings || null,
        annual_savings: quoteData?.annualSavings || null,
        page: 'suppchat',
      }]);
    } catch (error) {
      console.error('Error saving submission:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e5ea] flex flex-col">
      {/* TrustedForm noscript fallback */}
      <noscript>
        <img src="https://api.trustedform.com/ns.gif" height="1" width="1" style={{ display: 'none' }} alt="" />
      </noscript>

      <ChatHeader />

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {/* Timestamp */}
        <p className="text-center text-xs text-gray-500 mb-4">
          Today {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </p>

        {messages.map((msg) => (
          <ChatBubble key={msg.id} sender={msg.sender}>
            {msg.content.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < msg.content.split('\n').length - 1 && <br />}
              </span>
            ))}
          </ChatBubble>
        ))}

        {/* Booking confirmation card */}
        {showConfirmation && bookedSlot && selectedDay && (
          <BookingConfirmationCard
            dayLabel={selectedDayLabel}
            timeDisplay={bookedSlot.display}
            easternTimeDisplay={showEasternTime ? getEasternTimeDisplay(bookedSlot.original) : undefined}
            showEasternTime={showEasternTime}
            agentName={agentName}
            appointmentIso={bookedSlot.original}
            firstName={formData.firstName}
            lastName={formData.lastName}
          />
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Button options */}
        {showButtons && (
          <ChatButtonGroup
            options={showButtons.options}
            onSelect={(option) => handleButtonSelect(option, showButtons.step)}
          />
        )}

        {/* Contact form */}
        {showContactForm && (
          <ChatContactForm
            onSubmit={handleContactSubmit}
            isSubmitting={isSubmitting}
            isValidating={isValidating}
            validationErrors={validationErrors}
          />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      {showInput && (
        <ChatInput
          type={showInput.type}
          placeholder={showInput.placeholder}
          onSend={handleInputSend}
        />
      )}

      {/* Exit Intent Modal */}
      {(chatStep === 'pick-day' || chatStep === 'pick-time') && quoteResult && (
        <ExitIntentModal monthlySavings={quoteResult.monthlySavings} onBookClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      )}

      {/* Social Proof Popup */}
      {(chatStep === 'pick-day' || chatStep === 'pick-time' || chatStep === 'qualified') && quoteResult && (
        <SocialProofPopup delayMs={8000} visibleMs={4000} />
      )}
    </div>
  );
};

export default MedicareSupplementChat;
