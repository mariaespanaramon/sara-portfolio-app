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

      {/*
        Content. Deliberately without a z-index: any value other than `auto` on a
        positioned element opens a new stacking context, and the blended title
        below would then only see this container as its backdrop instead of the
        background image, rendering as plain white. Paint order still puts this
        above the image because both are positioned siblings and this one comes
        later in the tree.
      */}
      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="font-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none mb-6 lg:mb-8 text-white mix-blend-exclusion">
          Design State Of Mind
        </h1>
        <p className="font-title text-lg sm:text-xl lg:text-2xl font-bold max-w-3xl mx-auto leading-relaxed text-white">
          A collection of selected works in photography, short film production, and branding
        </p>
      </div>
    </section>
  );
}
