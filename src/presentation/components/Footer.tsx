/**
 * TODO: replace each href with Sara's own profile URL. These point at the bare
 * sites so the links are not dead, but they do not lead anywhere useful yet.
 */
const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Vimeo', href: 'https://vimeo.com' },
  { label: 'Behance', href: 'https://behance.net' },
];

/**
 * Footer component
 */
export function Footer() {
  return (
    <footer className="border-t border-site-border py-12 lg:py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-site-text-muted font-light">
            Portfolio of Sara Ramon. All rights reserved.
          </p>
          <div className="flex gap-8">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-site-text-muted hover:text-site-text-secondary transition-colors font-light"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
