import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Phone, Mail, Menu } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuItemClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    
    // If not on home page, navigate to home first
    if (window.location.pathname !== '/') {
      window.location.href = '/' + href;
      return;
    }
    
    // Wait for sheet to close, then navigate
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const handleDesktopNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // If not on home page, navigate to home first
    if (window.location.pathname !== '/') {
      window.location.href = '/' + href;
      return;
    }
    
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/ca6f16cd-26c7-4533-8061-a6c96ccb0eeb.png" 
              alt="Health Helpers Logo" 
              className="h-12 w-auto"
            />
          </a>

          {/* Navigation - Centered (Desktop only) */}
          <nav className="hidden lg:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <a href="#services" onClick={(e) => handleDesktopNavClick(e, "#services")} className="text-foreground hover:text-primary transition-colors">
              Services
            </a>
            <a href="#about" onClick={(e) => handleDesktopNavClick(e, "#about")} className="text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#contact" onClick={(e) => handleDesktopNavClick(e, "#contact")} className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-6">
                <a href="#services" onClick={(e) => handleMenuItemClick(e, "#services")} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  Services
                </a>
                <a href="#about" onClick={(e) => handleMenuItemClick(e, "#about")} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  About
                </a>
                <a href="#contact" onClick={(e) => handleMenuItemClick(e, "#contact")} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  Contact
                </a>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-4 border-t">
                  <Phone className="h-4 w-4" />
                  <span>(908) 224-5410</span>
                </div>
                <Button variant="hero" className="w-full" onClick={() => {
                  setIsMenuOpen(false);
                  window.location.href = 'tel:201-589-1901';
                }}>
                  Call Now
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Contact Info */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>(908) 224-5410</span>
            </div>
            <Button variant="hero" size="sm" onClick={() => window.location.href = 'tel:201-589-1901'}>
              Call Now
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;