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
      className="fixed top-0 left-0 right-0 z-50 bg-transparent"
    >
      <nav className="container mx-auto px-6 lg:px-12 py-6 lg:py-8">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="#"
            onClick={handleLogoClick}
            className="text-3xl lg:text-3xl font-heading tracking-tight hover:opacity-70 transition-opacity leading-none"
          >
            sara ramon
          </a>

          {/* Navigation Links*/}
          <div className="flex items-center gap-8 lg:gap-12">
            <a
              href="#work"
              className="text-xl lg:text-xl font-light tracking-wide hover:text-dark-text-secondary transition-colors leading-none"
            >
              work
            </a>
            <a
              href="#about"
              className="text-xl lg:text-xl font-light tracking-wide hover:text-dark-text-secondary transition-colors leading-none"
            >
              about
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
