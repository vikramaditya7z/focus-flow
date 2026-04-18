import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function ModeSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[85vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
        
        {/* Study Mode Card */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="glass-panel p-10 sm:p-12 rounded-3xl border border-slate-700/50 hover:bg-slate-800/60 hover:border-primary-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer group relative overflow-hidden flex flex-col items-center text-center shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="bg-slate-800/80 p-5 rounded-2xl mb-8 border border-slate-700 shadow-inner group-hover:border-primary-500/50 transition-colors">
            <BookOpen className="w-14 h-14 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Study Mode</h2>
          <p className="text-slate-400 mb-10 max-w-sm leading-relaxed text-lg">
            Track your study sessions, analyze productivity, and build focus.
          </p>
          <button className="mt-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-all duration-300 w-full sm:w-auto shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]">
            Start Studying
          </button>
        </div>

        {/* Test Mode Card */}
        <div 
          onClick={() => navigate('/test')}
          className="glass-panel p-10 sm:p-12 rounded-3xl border border-slate-700/50 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] cursor-pointer group relative overflow-hidden flex flex-col items-center text-center shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          <div className="bg-slate-800/80 p-5 rounded-2xl mb-8 border border-slate-700 shadow-inner group-hover:border-emerald-500/50 transition-colors">
            <HelpCircle className="w-14 h-14 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Test Mode</h2>
          <p className="text-slate-400 mb-10 max-w-sm leading-relaxed text-lg">
            Upload notes and test your knowledge with AI-generated questions.
          </p>
          <button className="mt-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all duration-300 w-full sm:w-auto shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]">
            Start Testing
          </button>
        </div>

      </div>
    </div>
  );
}
