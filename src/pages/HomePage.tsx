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

      <footer className="absolute bottom-4 text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest">
        © {new Date().getFullYear()} Prime Your Body
      </footer>
    </div>
  );
};

export default HomePage;
