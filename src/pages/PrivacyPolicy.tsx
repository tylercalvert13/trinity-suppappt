import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
        
        <div className="prose prose-lg mx-auto space-y-8">
          <section>
            <p className="text-muted-foreground mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            
            <p className="text-lg leading-relaxed">
              Trinity Health & Wealth is committed to protecting your privacy and ensuring compliance with all applicable laws, 
              including the Telephone Consumer Protection Act (TCPA) and Centers for Medicare & Medicaid Services (CMS) regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <div className="space-y-4">
              <p>We may collect the following types of information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Information:</strong> Name, address, phone number, email address, date of birth, and Medicare ID number</li>
                <li><strong>Health Information:</strong> Current Medicare coverage, health conditions, prescription medications, and healthcare preferences</li>
                <li><strong>Technical Information:</strong> IP address, browser type, device information, and website usage data</li>
                <li><strong>Communication Records:</strong> Records of your interactions with our platform and any customer service communications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p>Your information is used solely for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitating your Medicare plan enrollment and comparison process</li>
              <li>Providing customer support and technical assistance</li>
              <li>Complying with Medicare enrollment requirements and CMS regulations</li>
              <li>Improving our digital platform and user experience</li>
              <li>Sending important updates about your Medicare enrollment status</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">TCPA Compliance - Communication Consent</h2>
            <div className="bg-muted p-6 rounded-lg">
              <p className="font-semibold mb-3">Important Notice About Communications:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>By providing your phone number, you consent to receive calls and text messages from Trinity Health & Wealth regarding your Medicare enrollment</li>
                <li>These communications may be made using an automatic telephone dialing system or prerecorded messages</li>
                <li>You may receive up to 8 text messages per month related to your enrollment process</li>
                <li>Message and data rates may apply</li>
                <li>You can opt out at any time by texting STOP to any message or calling us directly</li>
                <li>Your consent is not required as a condition of purchase</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
            <p>We share your information only as necessary for Medicare enrollment:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Medicare Plans:</strong> With insurance carriers to process your enrollment applications</li>
              <li><strong>CMS:</strong> As required by Medicare regulations and oversight requirements</li>
              <li><strong>Service Providers:</strong> With trusted vendors who assist in our platform operations, under strict confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
            </ul>
            <p className="mt-4 font-semibold">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">CMS Compliance and Medicare Regulations</h2>
            <div className="space-y-4">
              <p>As a Medicare enrollment platform, we adhere to all CMS requirements:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All enrollment information is transmitted securely to insurance carriers within required timeframes</li>
                <li>We maintain records of all enrollments for the period required by CMS</li>
                <li>Your enrollment information is protected according to Medicare privacy standards</li>
                <li>We provide required disclosures about plan benefits, costs, and enrollment periods</li>
                <li>All marketing activities comply with Medicare marketing guidelines</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p>We implement industry-standard security measures to protect your information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSL encryption for all data transmission</li>
              <li>Secure servers with limited access controls</li>
              <li>Regular security audits and updates</li>
              <li>Employee training on privacy and security protocols</li>
              <li>Secure disposal of physical and electronic records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and review your personal information</li>
              <li>Request corrections to inaccurate information</li>
              <li>Request deletion of your information (subject to legal retention requirements)</li>
              <li>Opt out of marketing communications</li>
              <li>File a complaint with CMS if you believe your privacy rights have been violated</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cookie Policy</h2>
            <p>Our website uses cookies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remember your preferences and enrollment progress</li>
              <li>Analyze website traffic and improve user experience</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
            <p className="mt-3">You can control cookie settings through your browser preferences.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or applicable laws. 
              We will notify you of material changes by posting the updated policy on our website with a new effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="bg-muted p-6 rounded-lg">
              <p className="mb-3">If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:</p>
              <div className="space-y-2">
                <p><strong>Phone:</strong> (201) 589-1901</p>
                <p><strong>Email:</strong> support@trinityhealthandwealth.comm</p>
                <p><strong>Address:</strong> [Your Business Address]</p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                For Medicare-related complaints, you may also contact CMS at 1-800-MEDICARE (1-800-633-4227).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Medicare-Specific Disclosures</h2>
            <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="font-semibold mb-3">Important Medicare Information:</p>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>We are not connected with or endorsed by the U.S. Government or the federal Medicare program</li>
                <li>We represent multiple insurance carriers and are compensated by them for enrollment services</li>
                <li>You are not required to provide personal information to receive plan information</li>
                <li>Enrollment in Medicare plans has specific periods and deadlines</li>
                <li>You have the right to cancel your enrollment within specified timeframes</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;