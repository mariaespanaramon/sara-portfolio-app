import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Header component with navigation
 * Features a fixed, fully transparent header
 */
export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // If already on home page, scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If on detail page, navigate to home
      navigate('/');
    }
  };

  return (
    <header
      // The blend mode has to sit on the fixed header itself, not on an inner
      // element. `position: fixed` combined with a z-index makes this header a
      // stacking context, so a blended child would only ever see the header's
      // own (transparent) contents as its backdrop and would stay plain white.
      // On the header, the backdrop is the page painted behind it.
      className="fixed top-0 left-0 right-0 z-50 bg-transparent text-white mix-blend-exclusion"
    >
      <nav className="container mx-auto px-6 lg:px-12 py-6 lg:py-8">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="#"
            onClick={handleLogoClick}
            className="text-3xl font-title font-black tracking-tight hover:opacity-60 transition-opacity leading-none"
          >
            sara ramon
          </a>

          {/* Navigation Links*/}
          <div className="flex items-center gap-8 lg:gap-12">
            <a
              href="#work"
              className="font-title font-bold text-[1.75rem] tracking-wide hover:opacity-60 transition-opacity leading-none"
            >
              work
            </a>
            <a
              href="#about"
              className="font-title font-bold text-[1.75rem] tracking-wide hover:opacity-60 transition-opacity leading-none"
            >
              about
            </a>
            <a
              href="#contact"
              className="font-title font-bold text-[1.75rem] tracking-wide hover:opacity-60 transition-opacity leading-none"
            >
              contact
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
