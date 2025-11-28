/**
 * Footer component
 */
export function Footer() {
  return (
    <footer className="border-t border-dark-border py-12 lg:py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-dark-text-muted font-light">
            Portfolio of Sara Ramon. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dark-text-muted hover:text-dark-text-secondary transition-colors font-light"
            >
              Youtube
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dark-text-muted hover:text-dark-text-secondary transition-colors font-light"
            >
              Instagram
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-dark-text-muted hover:text-dark-text-secondary transition-colors font-light"
            >
              Linkedin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
