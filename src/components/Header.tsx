import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Phone, Mail, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="relative flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/4d760ca1-c0a7-4a63-82d3-e45df96bc6b9.png" 
              alt="Health Helpers Logo" 
              className="h-12 w-auto"
            />
          </div>

          {/* Navigation - Centered */}
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <a href="#services" className="text-foreground hover:text-primary transition-colors">
              Services
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-6">
                <a href="#services" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  Services
                </a>
                <a href="#about" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  About
                </a>
                <a href="#contact" className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  Contact
                </a>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground pt-4 border-t">
                  <Phone className="h-4 w-4" />
                  <span>(908) 224-5410</span>
                </div>
                <Button variant="hero" className="w-full">
                  Start Online Enrollment
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Contact Info */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>(908) 224-5410</span>
            </div>
            <Button variant="hero" size="sm">
              Start Online Enrollment
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;