import React, { useState } from 'react';
import { getSupabase } from '../lib/supabase.ts';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = getSupabase();

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setShowRegisterSuccess(true);
        setIsRegister(false); // switch terug naar login
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-[#1CB0F6] text-5xl md:text-6xl font-black italic tracking-tighter">
          Prime Your Body
        </h1>
        <p className="text-[#AFAFAF] font-black uppercase tracking-[0.2em] text-sm mt-2">
          Challenges
        </p>
      </div>

      <div className="w-full max-w-md duo-card bg-white p-8 md:p-10 shadow-xl">
        <h2 className="text-2xl md:text-2.5xl font-black text-[#4B4B4B] text-center mb-10">
          {isRegister ? 'Account maken' : 'Inloggen'}
        </h2>

        {/* Register succes melding */}
        {showRegisterSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 mb-6 text-center">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-black text-green-800 text-lg mb-2">
              Account aangemaakt!
            </h3>
            <p className="text-green-700 font-bold text-sm">
              Check je e‑mail voor de verificatie‑link. Log daarna in!
            </p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="E-mailadres"
              className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl px-5 py-4 text-base font-bold text-[#4B4B4B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Wachtwoord"
              className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl px-5 py-4 text-base font-bold text-[#4B4B4B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm font-black uppercase tracking-wider text-center">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.25em] text-sm text-white border-b-[5px] shadow-lg transition-all ${
              loading
                ? 'bg-gray-400 border-gray-500 cursor-not-allowed'
                : 'bg-[#1CB0F6] border-[#0D6EBD] hover:bg-[#0D6EBD] active:translate-y-[2px] active:border-b-[3px]'
            }`}
          >
            {loading ? 'Bezig...' : isRegister ? 'REGISTREER' : 'LOG IN'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setShowRegisterSuccess(false);
          }}
          className="w-full mt-8 py-3 px-6 bg-white border-2 border-[#1CB0F6] rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] text-[#1CB0F6] hover:bg-[#F0F8FF] hover:border-[#0D6EBD] transition-all"
        >
          {isRegister ? 'Ik heb al een account' : 'Nog geen account? Maak er een!'}
        </button>
      </div>

      <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        Secure & Privacy‑focused
      </p>
    </div>
  );
};

export default LoginPage;
