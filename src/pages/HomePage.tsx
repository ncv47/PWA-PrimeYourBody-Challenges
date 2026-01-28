import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1CB0F6] via-[#55CDFC] to-[#A5D8FF] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl space-y-8">
        {/* Logo */}
        <div className="text-6xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-2xl">
          MPAKT
        </div>
        <p className="text-2xl md:text-3xl font-black text-white drop-shadow-lg tracking-tight">
          Prime Your Body
        </p>

        {/* Call to action */}
        <div className="space-y-4">
          <a
            href="/login"
            className="block w-full max-w-md mx-auto bg-white border-b-[6px] border-[#1CB0F6] rounded-3xl px-12 py-6 font-black uppercase tracking-[0.3em] text-xl text-[#1CB0F6] hover:bg-[#F0F8FF] hover:border-[#0D6EBD] transition-all shadow-2xl hover:scale-[1.02] active:translate-y-[2px] active:border-b-[4px]"
          >
            START JOUW JOURNEY
          </a>

          <div className="flex items-center gap-2 justify-center text-white/80">
            <span className="text-sm font-black uppercase tracking-widest">
              Volg ons op Instagram
            </span>
            <a
              href="https://www.instagram.com/prime_your_body_/"
              target="_blank"
              rel="noreferrer"
              className="text-xl hover:scale-110 transition-transform"
            >
              📱
            </a>
          </div>
        </div>

        {/* Teaser text */}
        <div className="text-white/70 font-bold text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
          <p className="mb-4">
            Dagelijkse challenges • Community motivatie • Coach‑guidance
          </p>
          <p className="text-sm md:text-base opacity-80">
            Klaar om je lichaam te transformeren?
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;