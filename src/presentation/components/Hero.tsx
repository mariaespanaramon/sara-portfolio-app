/**
 * Hero section component
 */
export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 lg:px-12">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.pexels.com/photos/28843650/pexels-photo-28843650.jpeg"
          alt="Hero background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <h1 className="font-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none mb-6 lg:mb-8">
          Design State Of Mind
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl font-light max-w-3xl mx-auto leading-relaxed">
          A collection of selected works in photography, short film production, and branding
        </p>
      </div>
    </section>
  );
}
