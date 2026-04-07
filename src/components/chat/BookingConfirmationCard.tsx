import { Check, Calendar, Phone, User } from 'lucide-react';

interface BookingConfirmationCardProps {
  dayLabel: string;
  timeDisplay: string;
  easternTimeDisplay?: string;
  showEasternTime?: boolean;
  agentName?: string | null;
  appointmentIso: string;
  firstName: string;
  lastName: string;
}

function generateIcsContent(appointmentDate: string, firstName: string, lastName: string): string {
  const startDate = new Date(appointmentDate);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  const formatIcsDate = (date: Date): string => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Trinity Health & Wealth//Medicare Consultation//EN
BEGIN:VEVENT
UID:${Date.now()}@trinityhealthandwealth.comm
DTSTAMP:${formatIcsDate(new Date())}
DTSTART:${formatIcsDate(startDate)}
DTEND:${formatIcsDate(endDate)}
SUMMARY:Trinity Health & Wealth Medicare Consultation
DESCRIPTION:Phone consultation about your Medicare Supplement quote. We will call you at your scheduled time.
LOCATION:Phone Call
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Trinity Health & Wealth calling in 15 minutes
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
  a.download = 'trinity-health-appointment.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadContactCard() {
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Trinity Health & Wealth Team
ORG:Trinity Health & Wealth
TEL;TYPE=WORK,VOICE:+14025819221
TEL;TYPE=WORK,VOICE:+14025819221
NOTE:Medicare Supplement Specialists - Save this contact to recognize our calls!
END:VCARD`;
  const blob = new Blob([vCard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Trinity-Health.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const BookingConfirmationCard = ({
  dayLabel,
  timeDisplay,
  easternTimeDisplay,
  showEasternTime = false,
  agentName,
  appointmentIso,
  firstName,
  lastName,
}: BookingConfirmationCardProps) => {
  return (
    <div className="ml-10 mb-3 max-w-[80%] animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white rounded-2xl rounded-bl-md shadow-sm overflow-hidden">
        {/* Success header */}
        <div className="bg-green-50 px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-800 text-[15px]">You're all set!</p>
            <p className="text-green-700 text-xs">Appointment confirmed</p>
          </div>
        </div>

        {/* Details */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <Calendar className="w-4 h-4 text-[#007AFF]" />
            <span className="font-medium">{dayLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <Phone className="w-4 h-4 text-[#007AFF]" />
            <div>
              <span className="font-semibold text-green-600 text-base">{timeDisplay}</span>
              {showEasternTime && easternTimeDisplay && (
                <span className="text-gray-400 text-xs ml-1">({easternTimeDisplay} ET)</span>
              )}
            </div>
          </div>
          {agentName && (
            <div className="flex items-center gap-2 text-gray-700 text-sm">
              <User className="w-4 h-4 text-[#007AFF]" />
              <span>{agentName}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-3 space-y-2">
          <button
            onClick={() => downloadIcsFile(appointmentIso, firstName, lastName)}
            className="w-full py-2.5 rounded-xl bg-[#007AFF] text-white text-sm font-medium hover:bg-[#0066d6] active:scale-[0.98] transition-all"
          >
            📅 Add to Calendar
          </button>
          <button
            onClick={downloadContactCard}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            👤 Save Our Contact
          </button>
        </div>

        {/* Save number warning */}
        <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-amber-800 text-xs text-center font-medium">
            📱 Save (201) 298-8393 so you recognize our call!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationCard;
