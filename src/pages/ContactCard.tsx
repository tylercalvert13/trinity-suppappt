import { useEffect, useState } from 'react';
import { Phone, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ContactCard = () => {
  const [downloaded, setDownloaded] = useState(false);

  const downloadContactCard = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:Health Helpers Team
ORG:Health Helpers
TEL;TYPE=WORK,VOICE:+12014269898
TEL;TYPE=WORK,VOICE:+12012988393
NOTE:Medicare Supplement Specialists - Save this contact so you recognize our calls!
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
    setDownloaded(true);
  };

  // Auto-download on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      downloadContactCard();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          {downloaded ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <Phone className="w-10 h-10 text-green-600" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">
          {downloaded ? 'Contact Downloaded!' : 'Downloading Contact...'}
        </h1>

        {/* Instructions */}
        <p className="text-muted-foreground">
          {downloaded 
            ? 'Check your downloads or notifications to add Health Helpers to your contacts.'
            : 'Please wait while we prepare your contact file...'}
        </p>

        {/* Manual download button */}
        <Button
          onClick={downloadContactCard}
          className="w-full min-h-[56px] bg-green-600 hover:bg-green-700 text-lg font-semibold rounded-xl"
        >
          <Download className="w-5 h-5 mr-2" />
          {downloaded ? 'Download Again' : 'Download Contact'}
        </Button>

        {/* Phone numbers display */}
        <div className="bg-card rounded-xl p-4 border border-border text-left space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Our Numbers:</p>
          <p className="text-lg font-semibold text-foreground">(201) 426-9898</p>
          <p className="text-lg font-semibold text-foreground">(201) 298-8393</p>
        </div>

        {/* Help text */}
        <p className="text-sm text-muted-foreground">
          Save our contact so you recognize our calls!
        </p>
      </div>
    </div>
  );
};

export default ContactCard;
