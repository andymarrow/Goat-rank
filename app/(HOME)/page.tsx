import HeroCarousel from "./_components/HeroCarousel";
import GlobalLeaderboardsRow from "./_components/GlobalLeaderboardsRow";
import FaceOffsRow from "./_components/FaceOffsRow";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col gap-2 pb-24">
      {/* HERO SECTION */}
      <div className="pt-4 md:pt-8 px-4 md:px-0">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2 font-arcade uppercase">
            SETTLE THE <span className="text-primary italic">DEBATE.</span>
          </h1>
          <p className="text-foreground/60 font-medium max-w-lg mx-auto">
            Back your GOAT. Destroy the competition. Fund charity.
          </p>
        </div>
        
        <HeroCarousel />
      </div>

      {/* HORIZONTAL ROWS (Cinematic Style) */}
      <GlobalLeaderboardsRow />
      <FaceOffsRow />
      
    </div>
  );
}