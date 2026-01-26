import React, { useState } from 'react';
import { Calendar, Phone, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppointmentBookingWidget } from '@/components/AppointmentBookingWidget';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schema
const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().trim().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, 'Please enter a valid 10-digit phone number'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const StandaloneBooking = () => {
  const [step, setStep] = useState<'form' | 'booking'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Format phone as user types
  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    setFieldErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      // Create contact in GHL
      console.log('Creating contact in GHL...');
      const { data, error: createError } = await supabase.functions.invoke('ghl-calendar', {
        body: {
          action: 'create-contact',
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone,
        }
      });

      if (createError) {
        console.error('Create contact error:', createError);
        throw new Error('Failed to create contact');
      }

      if (data?.error) {
        console.error('Create contact API error:', data);
        setError(data.message || 'Unable to proceed. Please try again or call us.');
        setIsLoading(false);
        return;
      }

      console.log('Contact created/found:', data);
      setContactId(data.contactId);
      setStep('booking');
    } catch (err) {
      console.error('Submit error:', err);
      setError('Something went wrong. Please try again or call us at (201) 298-8393.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-4">
        <div className="max-w-md mx-auto text-center">
          <img 
            src="/lovable-uploads/4d760ca1-c0a7-4a63-82d3-e45df96bc6b9.png" 
            alt="Health Helpers" 
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold">Schedule a Medicare Consultation</h1>
          <p className="text-blue-100 mt-2">Speak with a licensed agent about your Medicare options</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {step === 'form' ? (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Your Information</h2>
              <p className="text-gray-600 text-sm mt-1">Enter your details to schedule a free consultation</p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-base font-medium text-gray-700">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    placeholder="John"
                    className={`mt-1 h-14 text-lg ${fieldErrors.firstName ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-base font-medium text-gray-700">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    placeholder="Smith"
                    className={`mt-1 h-14 text-lg ${fieldErrors.lastName ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="john.smith@email.com"
                  className={`mt-1 h-14 text-lg ${fieldErrors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="text-base font-medium text-gray-700">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className={`mt-1 h-14 text-lg ${fieldErrors.phone ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {fieldErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[70px] bg-green-600 hover:bg-green-700 text-white text-xl font-semibold rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Please wait...
                  </>
                ) : (
                  <>
                    Continue to Schedule
                    <ArrowRight className="w-6 h-6 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Call alternative */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-500 text-sm mb-2">Prefer to call now?</p>
              <a 
                href="tel:+12012988393" 
                className="inline-flex items-center gap-2 text-lg font-bold text-green-700 hover:text-green-800"
              >
                <Phone className="w-5 h-5" />
                (201) 298-8393
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-6 grid grid-cols-1 gap-2 text-xs text-gray-500 text-center">
              <span>🛡️ Licensed Medicare Agents</span>
              <span>⚡ Compare 20+ top carriers</span>
              <span>✓ 100% free consultation</span>
            </div>
          </div>
        ) : (
          /* Booking Widget Step */
          <AppointmentBookingWidget
            firstName={formData.firstName}
            lastName={formData.lastName}
            phone={formData.phone.replace(/\D/g, '')}
            email={formData.email}
            userTimezone={userTimezone}
            isStandalone={true}
            contactId={contactId || undefined}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pb-8 px-4">
        <p>By scheduling, you agree to receive calls about Medicare options.</p>
      </div>
    </div>
  );
};

export default StandaloneBooking;
