import React from 'react';
import Logo from '../assets/logo.jpg';
import '../homepage.css'; // Import homepage-specific CSS

const HomePage: React.FC = () => {
  return (
    <div className="homepage-fullscreen flex flex-col justify-center items-center text-white text-center overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#000814] to-black opacity-95" />

      {/* Centered content */}
      <section className="relative flex flex-col items-center justify-center w-full h-full px-6 md:px-0 py-8 md:py-0 gap-6">
        <img
          src={Logo}
          alt="Prime Your Body Logo"
          className="w-36 sm:w-48 md:w-60 lg:w-64 xl:w-72 drop-shadow-[0_0_50px_#55CDFC] animate-pulse-slow"
        />

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="text-[#55CDFC]">PRIME</span> <span>YOUR BODY</span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-lg leading-relaxed">
          Voor toegang op de applicatie en weekelijkse challanges
          Volg en DM ons op instagram
        </p>

        <a
          href="https://www.instagram.com/prime_your_body_/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 sm:mt-6 bg-[#55CDFC] hover:bg-[#3cb3df] text-black font-extrabold
                     py-3 sm:py-4 px-8 sm:px-12 rounded-full text-sm sm:text-lg uppercase
                     tracking-widest transition-all duration-300 ease-out transform hover:scale-105
                     shadow-[0_0_35px_#55CDFC]"
        >
          Join Us on Instagram 🚀
        </a>
      </section>

      {/* Dual footer - Copyright + Your watermark */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 z-10">
        {/* Copyright (kept exactly as-is) */}
        <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest">
          © {new Date().getFullYear()} Prime Your Body
        </div>
        
        {/* Noah Chang Vandewalle Watermark */}
        <a
          href="https://github.com/ncv47"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-gray-500 hover:text-gray-300 font-mono uppercase tracking-widest flex items-center gap-1 group hover:scale-105 transition-all duration-200 z-20"
          style={{ lineHeight: 1 }}
        >
          <span>by NCV</span>
          <svg 
            width="10" 
            height="10" 
            viewBox="0 0 16 16" 
            className="fill-gray-400 group-hover:fill-gray-200 group-hover:translate-x-px transition-all"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
        </a>
      </div>
    </div>
  );
};

export default HomePage;
