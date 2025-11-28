/**
 * Header component with navigation
 * Features a fixed, fully transparent header
 */
export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-transparent"
    >
      <nav className="container mx-auto px-6 lg:px-12 py-6 lg:py-8">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-heading text-xl lg:text-2xl font-light tracking-tight hover:opacity-70 transition-opacity"
          >
            sara ramon
          </a>

          {/* Navigation Links*/}
          <div className="flex items-center gap-8 lg:gap-12">
            <a
              href="#work"
              className="text-sm lg:text-base font-light tracking-wide hover:text-dark-text-secondary transition-colors"
            >
              work
            </a>
            <a
              href="#about"
              className="text-sm lg:text-base font-light tracking-wide hover:text-dark-text-secondary transition-colors"
            >
              about
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
