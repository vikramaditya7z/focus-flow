import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password combination.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch(err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Google sign-in authorization failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="glass-panel p-10 rounded-3xl border border-slate-700/50 shadow-2xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl font-extrabold text-white mb-2 text-center tracking-tight">Welcome Back</h1>
        <p className="text-slate-400 text-center mb-8">Access your personalized learning flows.</p>
        
        {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-medium" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-medium" />
          </div>
          
          <button disabled={loading} type="submit" 
            className="w-full flex items-center justify-center py-4 rounded-xl shadow-lg text-lg font-bold text-white bg-primary-600 hover:bg-primary-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />} Log In
          </button>
        </form>

        <div className="my-6 flex items-center w-full before:flex-1 before:border-t before:border-slate-700/50 after:flex-1 after:border-t after:border-slate-700/50">
           <span className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Or</span>
        </div>

        <button disabled={loading} onClick={handleGoogleLogin} 
          className="w-full flex items-center justify-center py-3 rounded-xl border border-slate-600 text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 transition-all font-semibold active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
           {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin text-slate-400" /> : <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
           Continue with Google
        </button>

        <p className="mt-8 text-center text-slate-400 font-medium">
          New to FocusFlow? <Link to="/signup" className="text-primary-400 hover:text-primary-300 ml-1 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
