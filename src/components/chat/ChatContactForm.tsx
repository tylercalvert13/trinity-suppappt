import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ChatContactFormProps {
  onSubmit: (data: { firstName: string; lastName: string; email: string; phone: string }) => void;
  isSubmitting?: boolean;
  isValidating?: boolean;
  validationErrors?: Record<string, string | undefined>;
}

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

const ChatContactForm = ({ onSubmit, isSubmitting = false, isValidating = false, validationErrors = {} }: ChatContactFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone });
  };

  const inputClass = (field: string) =>
    `w-full bg-white rounded-xl px-4 py-3 text-[15px] border focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] ${
      validationErrors[field] ? 'border-red-500' : 'border-gray-300'
    }`;

  return (
    <div className="ml-10 mb-3 animate-in slide-in-from-bottom-2 duration-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl rounded-bl-md shadow-sm p-4 space-y-3 max-w-[85%]"
        data-tf-element-role="offer"
      >
        <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl_0" />
        <input type="hidden" name="xxTrustedFormPingUrl" id="xxTrustedFormPingUrl_0" />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              className={inputClass('firstName')}
              required
            />
            {validationErrors.firstName && <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>}
          </div>
          <div>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              className={inputClass('lastName')}
              required
            />
            {validationErrors.lastName && <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>}
          </div>
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass('email')}
            required
          />
          {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
        </div>
        <div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
            placeholder="(555) 123-4567"
            className={inputClass('phone')}
            maxLength={14}
            required
          />
          {validationErrors.phone && <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>}
        </div>

        <p className="text-[10px] text-gray-500 leading-relaxed" data-tf-element-role="consent-language">
          By tapping "<span data-tf-element-role="submit-text">See My Rate</span>," I expressly consent to receive marketing calls, text messages, and emails from <span data-tf-element-role="consent-advertiser-name">Health Helpers Insurance Agency</span> and its licensed insurance agents regarding Medicare and related insurance products, including through the use of an automatic telephone dialing system, artificial or prerecorded voice messages, and AI technologies. Message and data rates may apply. Message frequency varies. Consent is not a condition of purchase. You may opt out at any time by replying STOP to text messages. By submitting this form, you agree to the{' '}
          <Link to="/terms-of-service" className="underline">Terms and Conditions</Link>
          {' '}and{' '}
          <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>

        <button
          type="submit"
          disabled={isSubmitting || isValidating || !firstName || !lastName || !email || !phone}
          className="w-full bg-[#007AFF] text-white rounded-full py-3 text-[15px] font-medium disabled:bg-gray-300 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          data-tf-element-role="submit"
        >
          {isValidating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
          ) : isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Getting your rate...</>
          ) : (
            <span data-tf-element-role="submit-text">See My Rate</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatContactForm;
