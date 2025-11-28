/**
 * Hero section component
 */
export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 lg:px-12">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight leading-none mb-6 lg:mb-8">
          Crafting Digital
          <br />
          <span className="text-dark-text-secondary">Experiences</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-dark-text-secondary font-light max-w-3xl mx-auto leading-relaxed">
          A collection of selected works in design, branding, and development
        </p>
      </div>
    </section>
  );
}
