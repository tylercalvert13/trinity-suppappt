import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <a href="/" className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" 
                alt="Health Helpers Logo" 
                className="h-10 w-auto"
              />
            </a>
            <p className="text-primary-foreground/80 mb-4 max-w-md">
              Your trusted partner for Medicare Supplement insurance. We help seniors find the 
              same coverage at a lower price by comparing rates from top-rated carriers.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>(201) 298-8393</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4" />
                <span>support@healthhelpers.co</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Licensed in All 50 States</span>
              </div>
            </div>
          </div>

          {/* Medicare Supplement Plans */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Medicare Supplement Plans</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#services" className="hover:text-accent transition-colors">Plan G</a></li>
              <li><a href="#services" className="hover:text-accent transition-colors">Plan F</a></li>
              <li><a href="#services" className="hover:text-accent transition-colors">Plan N</a></li>
              <li><a href="#contact" className="hover:text-accent transition-colors">Free Rate Comparison</a></li>
              <li><a href="#services" className="hover:text-accent transition-colors">Carrier Comparison</a></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="/#about" className="hover:text-accent transition-colors">About Us</a></li>
              <li><a href="/#services" className="hover:text-accent transition-colors">Plans</a></li>
              <li><a href="/#contact" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="hover:text-accent transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-primary-foreground/60">
              © 2025 Health Helpers. All rights reserved. Licensed insurance agency.
            </p>
            <p className="text-sm text-primary-foreground/60 mt-2 md:mt-0">
              Medicare Supplement insurance is underwritten by participating carriers. Limitations and exclusions may apply.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
