import React, { useContext } from 'react';
import { TestContext } from '../context/TestContext';
import { Trash2, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

export default function TestHistory() {
  const { tests, deleteTest } = useContext(TestContext);

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <BookOpen className="w-16 h-16 text-slate-600 mb-6" />
        <h2 className="text-2xl font-bold text-slate-300 mb-2">No tests yet</h2>
        <p className="text-slate-500">Go to Test Mode and complete a session to see history.</p>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-5xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Test History</h1>
        <p className="text-slate-400 text-lg">Review your past performance and AI-generated insights.</p>
      </div>

      <div className="space-y-6">
        {tests.map(test => {
          const dateStr = new Date(test.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const percentage = Math.round((test.score / test.total) * 100);
          const isGood = percentage >= 70;

          return (
            <div key={test.id} className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-xl group relative overflow-hidden transition-all hover:border-slate-600/80">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500/50 via-primary-500/50 to-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center">
                    Session Log
                    <span className={`ml-3 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${isGood ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {test.score}/{test.total} Score ({percentage}%)
                    </span>
                  </h3>
                  <p className="text-slate-400 mt-1 text-sm font-medium">{dateStr}</p>
                </div>
                
                <button 
                  onClick={() => deleteTest(test.id)}
                  className="p-2.5 bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all border border-slate-700 hover:border-rose-500/30"
                  title="Delete record"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {test.summary && test.summary.length > 0 && (
                <div className="mb-6 bg-slate-900/50 rounded-2xl p-5 border border-slate-700/50">
                  <p className="text-sm font-bold text-primary-400 flex items-center mb-3">
                    <BookOpen className="w-4 h-4 mr-2" /> Quick Core Topic Reference
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
                    {test.summary.slice(0, 4).map((pt, i) => (
                      <li key={i} className="flex">
                        <span className="text-primary-500 mr-2 mt-0.5">•</span>
                        <span className="line-clamp-2">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {test.feedback && !test.feedback.error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {test.feedback.weakAreas?.length > 0 && (
                    <div className="rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5">
                      <p className="text-sm font-bold text-rose-400 flex items-center mb-3">
                        <TrendingDown className="w-4 h-4 mr-2" /> Weak Areas
                      </p>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-sm">
                        {test.feedback.weakAreas.map((area, i) => <li key={i}>{area}</li>)}
                      </ul>
                    </div>
                  )}
                  {test.feedback.strongAreas?.length > 0 && (
                    <div className="rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-sm font-bold text-emerald-400 flex items-center mb-3">
                        <TrendingUp className="w-4 h-4 mr-2" /> Strong Areas
                      </p>
                      <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-sm">
                        {test.feedback.strongAreas.map((area, i) => <li key={i}>{area}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
