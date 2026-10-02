import Image from "next/image";

//components
import SearchBar from "../shared/SearchBar";

const Hero = () => {
  return (
    <div className="relative w-full min-h-[420px] sm:min-h-[460px] md:h-[560px] lg:h-[620px] flex items-center justify-center">
      <Image
        src="/images/hero.webp"
        fill
        className="object-cover w-full h-full"
        alt="hero image"
        priority
      />

      {/* Enhanced dark gradient overlay for optimal text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/75"></div>

      {/* Text and Search Bar */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center px-4 py-10 sm:py-14 w-full">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold font-title leading-tight tracking-tight max-w-3xl">
          Plan your wedding hassle-free with us!
        </h1>

        <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-zinc-100/90 font-body max-w-xl">
          Search, add to the checklist, and plan your wedding!
        </p>

        <div className="mt-6 sm:mt-8 w-full max-w-lg px-2">
          <SearchBar size="large" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
