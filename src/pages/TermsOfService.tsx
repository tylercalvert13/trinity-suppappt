import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <div className="prose prose-lg mx-auto space-y-8">
          <section>
            <h2 className="text-3xl font-semibold mb-6 text-center">Trinity Health & Wealth Insurance Agency LLC</h2>
            
            <h3 className="text-2xl font-semibold mb-4">Appointment Reminder & Confirmation Texts</h3>
            
            <div className="space-y-6 text-lg leading-relaxed">
              <p>
                You can cancel the SMS service at any time. Simply text "STOP" to the shortcode. Upon sending "STOP," 
                we will confirm your unsubscribe status via SMS. Following this confirmation, you will no longer receive 
                SMS messages from us. To rejoin, sign up as you did initially, and we will resume sending SMS messages to you.
              </p>
              
              <p>
                If you experience issues with the messaging program, reply with the keyword HELP for more assistance, 
                or reach out directly to <a href="mailto:support@trinityhealthandwealth.com" className="text-primary hover:underline">support@trinityhealthandwealth.com</a>.
              </p>
              
              <p>
                Carriers are not liable for delayed or undelivered messages.
              </p>
              
              <p>
                As always, message and data rates may apply for messages sent to you from us and to us from you. 
                You will receive appointment reminder and confirmation texts. For questions about your text plan or 
                data plan, contact your wireless provider.
              </p>
              
              <p>
                For privacy-related inquiries, please refer to our privacy policy: <a href="/privacy-policy" className="text-primary hover:underline">https://trinityhealthandwealth.com/privacy-policy</a>.
              </p>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;