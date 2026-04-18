import React, { useContext } from 'react';
import { StudyContext } from '../context/StudyContext';
import { Trash2, Calendar, Clock } from 'lucide-react';

export default function History() {
  const { sessions, deleteSession } = useContext(StudyContext);

  const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h1 className="text-3xl font-black text-white mb-8 tracking-tight">Session History</h1>
      
      {sortedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center glass-panel rounded-3xl border border-slate-700/50 shadow-sm">
          <Calendar className="w-16 h-16 text-slate-600 mb-6" />
          <h2 className="text-2xl font-bold text-slate-300 mb-2">No study sessions logged</h2>
          <p className="text-slate-500">Jump right into the Dashboard and hit start on your first sequence.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-700/50 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-700/50">
            {sortedSessions.map((session) => (
              <li key={session.id} className="p-5 md:p-6 hover:bg-slate-800/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between group gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-8">
                  <div className="flex items-center text-slate-300">
                    <Calendar className="w-5 h-5 mr-3 text-primary-400" />
                    <span className="font-medium text-white">
                      {new Date(session.startTime).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <Clock className="w-5 h-5 mr-3 text-primary-400" />
                     {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="font-bold text-primary-300 bg-primary-500/10 border border-primary-500/20 px-4 py-1.5 rounded-full text-sm flex items-center group-hover:bg-primary-500/20 transition-colors">
                    {formatDuration(session.duration)}
                  </div>
                </div>
                <button 
                  onClick={() => deleteSession(session.id)}
                  className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Delete Session"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
