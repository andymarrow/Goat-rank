import HeroCarousel from "./_components/HeroCarousel";
import ArenaFeed from "./_components/ArenaFeed"; // <-- Add this import

export default function HomePage() {
  return (
    <div className="w-full flex flex-col gap-6 md:gap-12 pb-24">
      {/* HERO SECTION */}
      <div className="pt-4 md:pt-8">
        <div className="text-center mb-6 px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2 font-arcade">
            SETTLE THE <span className="text-primary italic">DEBATE.</span>
          </h1>
          <p className="text-foreground/60 font-medium max-w-lg mx-auto">
            Back your GOAT. Destroy the competition. Fund charity.
          </p>
        </div>
        
        <HeroCarousel />
      </div>

      {/* ARENA FEED SECTION */}
      <ArenaFeed />
      
    </div>
  );
}