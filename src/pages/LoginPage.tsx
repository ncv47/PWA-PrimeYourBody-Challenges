import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase.ts';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const now = new Date();
  const yearMonth = now.getFullYear() * 100 + (now.getMonth() + 1);
  const VALID_KEY = String((yearMonth * 12345) % 1000000).padStart(6, '0');

  const urlParams = new URLSearchParams(location.search);
  const secretKey = urlParams.get('key');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);

  useEffect(() => {
    if (secretKey !== VALID_KEY) {
      navigate('/', { replace: true });
    }
  }, [secretKey, VALID_KEY, navigate]);

  if (secretKey !== VALID_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-xl font-bold text-gray-500">Redirecting...</h1>
      </div>
    );
  }

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
        setIsRegister(false);
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

        <h2 className="text-2xl font-black text-[#4B4B4B] text-center mb-10">
          {isRegister ? 'Account maken' : 'Inloggen'}
        </h2>

        {showRegisterSuccess && (
          <div className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 mb-6 text-center">
            <div className="text-3xl mb-3">✅</div>

            <h3 className="font-black text-green-800 text-lg mb-2">
              Account aangemaakt!
            </h3>

            <p className="text-green-700 font-bold text-sm">
              Check je e-mail voor verificatie en log daarna in.
            </p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">

          <input
            type="email"
            placeholder="E-mailadres"
            className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl px-5 py-4 font-bold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Wachtwoord"
            className="w-full bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl px-5 py-4 font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm font-black text-center">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-3xl font-black uppercase text-white ${
              loading
                ? 'bg-gray-400'
                : 'bg-[#1CB0F6] hover:bg-[#0D6EBD]'
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
          className="w-full mt-8 py-3 border-2 border-[#1CB0F6] rounded-2xl font-black text-[#1CB0F6]"
        >
          {isRegister
            ? 'Ik heb al een account'
            : 'Nog geen account? Maak er een!'}
        </button>

      </div>

      <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        Secure & Privacy-focused
      </p>

    </div>
  );
};

export default LoginPage;