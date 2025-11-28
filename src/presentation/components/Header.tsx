import { useState, useEffect } from 'react';

/**
 * Header component with navigation
 * Features a fixed, transparent header with permanent visible menu
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-dark-border' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 lg:px-12 py-6 lg:py-8">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="#"
            className="text-xl lg:text-2xl font-light tracking-tight hover:opacity-70 transition-opacity"
          >
            Portfolio
          </a>

          {/* Navigation Links - Always visible, not a hamburger menu */}
          <div className="flex items-center gap-8 lg:gap-12">
            <a
              href="#work"
              className="text-sm lg:text-base font-light tracking-wide hover:text-dark-text-secondary transition-colors"
            >
              Work
            </a>
            <a
              href="#about"
              className="text-sm lg:text-base font-light tracking-wide hover:text-dark-text-secondary transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
