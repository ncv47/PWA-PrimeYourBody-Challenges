
import React, { useState } from 'react';
import { supabase } from '../lib/supabase.ts';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = isRegister 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="text-center mb-10">
        <h1 className="text-[#1CB0F6] text-6xl font-black italic tracking-tighter">MPAKT</h1>
        <p className="text-[#AFAFAF] font-black uppercase tracking-[0.2em] text-xs mt-2">Challenges</p>
      </div>

      <div className="w-full max-w-sm duo-card p-8 bg-white">
        <h2 className="text-2xl font-black text-[#4B4B4B] text-center mb-8">
          {isRegister ? 'Account maken' : 'Inloggen'}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            className="w-full p-4 bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl focus:outline-none focus:border-[#1CB0F6] font-bold"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Wachtwoord"
            className="w-full p-4 bg-[#F7F7F7] border-2 border-[#E5E5E5] rounded-2xl focus:outline-none focus:border-[#1CB0F6] font-bold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-xs font-black text-center uppercase tracking-widest">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 duo-btn-primary mt-4"
          >
            {loading ? 'Bezig...' : (isRegister ? 'Registreren' : 'Log in')}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-6 py-2 text-[#1CB0F6] font-black uppercase tracking-widest text-[10px] hover:underline"
        >
          {isRegister ? 'Ik heb al een account' : 'Nog geen account? Maak er een!'}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
