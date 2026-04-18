import React, { useState, useEffect, useContext } from 'react';
import { StudyContext } from '../context/StudyContext';
import { Play, Square, Clock, Activity, Target, Zap, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateStudyInsights } from '../services/gemini';

export default function Dashboard() {
  const { sessions, addSession } = useContext(StudyContext);
  
  const [isTracking, setIsTracking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchInsights = async () => {
      if (sessions.length === 0) {
        if (isMounted) setAiInsights(null);
        return;
      }
      if (isMounted) setIsLoadingInsights(true);
      const res = await generateStudyInsights(sessions);
      if (isMounted) {
        setAiInsights(res);
        setIsLoadingInsights(false);
      }
    };
    fetchInsights();
    return () => { isMounted = false; };
  }, [sessions]);

  useEffect(() => {
    let interval;
    if (isTracking && sessionStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, sessionStartTime]);

  const toggleTimer = () => {
    if (!isTracking) {
      setIsTracking(true);
      setSessionStartTime(Date.now());
    } else {
      setIsTracking(false);
      const endTime = Date.now();
      const duration = Math.floor((endTime - sessionStartTime) / 1000);
      
      if (duration > 0) {
        addSession({
          id: crypto.randomUUID(),
          startTime: sessionStartTime,
          endTime,
          duration
        });
      }
      setElapsedSeconds(0);
      setSessionStartTime(null);
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds === 0) return "0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const today = new Date().setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todaySessions = sessions.filter(s => new Date(s.startTime).setHours(0,0,0,0) === today);
  const yesterdaySessions = sessions.filter(s => new Date(s.startTime).setHours(0,0,0,0) === yesterday);

  const todayStudyTime = todaySessions.reduce((acc, curr) => acc + curr.duration, 0);
  const yesterdayStudyTime = yesterdaySessions.reduce((acc, curr) => acc + curr.duration, 0);
  const avgDuration = todaySessions.length > 0 ? todayStudyTime / todaySessions.length : 0;

  const chartData = Array.from({length: 7}).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dayStart = d.getTime();
    const daySessions = sessions.filter(s => new Date(s.startTime).setHours(0,0,0,0) === dayStart);
    const mins = Math.floor(daySessions.reduce((acc, curr) => acc + curr.duration, 0) / 60);
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: mins
    };
  });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Welcome to FocusFlow.</h1>
        <p className="text-slate-400 text-lg">Let's lock in and get highly productive today.</p>
      </div>

      <div className="relative glass-panel rounded-3xl p-10 flex flex-col items-center justify-center overflow-hidden border border-slate-700/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
           <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-1.5 rounded-full mb-6 border border-slate-700 backdrop-blur-md shadow-sm">
             <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-slate-500'}`}></div>
             <span className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
                {isTracking ? "Session Active" : "Ready to Start"}
             </span>
           </div>

           <div className="text-8xl md:text-9xl font-black text-white tracking-tighter mb-10 drop-shadow-2xl">
             {formatTime(elapsedSeconds)}
           </div>

           <button
             onClick={toggleTimer}
             className={`group relative flex items-center px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 overflow-hidden ${
               isTracking 
                 ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_40px_-5px_rgba(244,63,94,0.4)] border border-rose-400/50' 
                 : 'bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_40px_-5px_rgba(99,102,241,0.4)] border border-primary-500/50'
             }`}
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl"></div>
             <span className="relative z-10 flex items-center">
               {isTracking ? (
                 <><Square className="w-6 h-6 mr-3 fill-current" /> End Session</>
               ) : (
                 <><Play className="w-6 h-6 mr-3 fill-current" /> Start Session</>
               )}
             </span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Focus Time" value={formatDisplayTime(todayStudyTime)} icon={<Clock className="text-primary-400 w-6 h-6" />} />
        <StatCard title="Sessions Completed" value={todaySessions.length} icon={<Target className="text-emerald-400 w-6 h-6" />} />
        <StatCard title="Deep Work Avg." value={formatDisplayTime(avgDuration)} icon={<Zap className="text-amber-400 w-6 h-6" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl border border-slate-700/50 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Focus History</h3>
            <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Last 7 Days</span>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 text-center px-4 py-12">
                <Activity className="w-12 h-12 text-slate-600 mb-4" />
                <p className="font-medium text-lg text-slate-300">Awaiting runtime data</p>
                <p className="text-sm mt-1">Initialize a session above to print trajectory tracking.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top:10, right:10, left:-20, bottom:0}}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
                  <Tooltip 
                    cursor={{fill: '#1e293b'}} 
                    contentStyle={{backgroundColor: '#0f172a', borderRadius: '1rem', border: '1px solid #334155', color: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)'}} 
                    itemStyle={{color: '#818cf8', fontWeight: 'bold'}}
                  />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#6366f1' : '#334155'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 flex flex-col relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-xl font-bold text-white mb-6 flex items-center tracking-tight">
            <Activity className="w-5 h-5 mr-2 text-primary-400" />
            Core Analytics
          </h3>
          <div className="flex-1 space-y-4 z-10 relative">
            <InsightItem 
              title="Daily Trajectory" 
              desc={
                todayStudyTime > yesterdayStudyTime 
                  ? `Outperforming yesterday by ${yesterdayStudyTime > 0 ? Math.round(((todayStudyTime - yesterdayStudyTime) / yesterdayStudyTime) * 100) : 100}%. Excellent momentum.` 
                  : (yesterdayStudyTime === 0 && todayStudyTime === 0) 
                  ? "Initialize your first sequence." 
                  : `Volume down by ${todayStudyTime > 0 ? Math.round(((yesterdayStudyTime - todayStudyTime) / yesterdayStudyTime) * 100) : 100}% vs yesterday.`
              }
              trend={todayStudyTime > yesterdayStudyTime ? 'up' : (yesterdayStudyTime === 0 && todayStudyTime === 0) ? 'neutral' : 'down'}
            />
            {todaySessions.length > 0 && (
              <InsightItem 
                title="Pattern Recognition" 
                desc={`Averaging ${Math.floor(avgDuration / 60)} minutes per block across ${todaySessions.length} sessions.`} 
                trend="neutral"
              />
            )}
          </div>
        </div>
      </div>

      {/* NEW FULL WIDTH AI SECTION */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-700/50 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <h3 className="text-2xl font-bold text-white mb-8 flex items-center tracking-tight">
          <Zap className="w-7 h-7 mr-3 text-primary-400" />
          AI Study Insights & Recommendations
        </h3>
        
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-slate-400 text-lg font-medium">Start studying to unlock AI insights.</p>
          </div>
        ) : isLoadingInsights || !aiInsights ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <p className="text-slate-400 font-medium tracking-wide">Analyzing session data...</p>
          </div>
        ) : aiInsights.error ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-rose-400 text-lg font-medium">{aiInsights.error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* A. Study Analysis */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-slate-200 border-b border-slate-700/50 pb-3">Study Analysis</h4>
              <ul className="space-y-4">
                <InsightListItem label="Total sessions" value={aiInsights.analysis?.totalSessions} />
                <InsightListItem label="Average duration" value={aiInsights.analysis?.averageDuration} />
                <InsightListItem label="Most frequent study time" value={aiInsights.analysis?.frequentTime} />
                <InsightListItem label="Consistency" value={aiInsights.analysis?.consistency} highlight />
              </ul>
            </div>
            
            {/* B. Recommendations */}
            <div className="space-y-6">
              <h4 className="text-lg font-bold text-emerald-400 border-b border-emerald-900/30 pb-3">Recommendations</h4>
              <ul className="space-y-4">
                {aiInsights.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-slate-300">
                    <span className="flex-shrink-0 w-1.5 h-1.5 mt-2.5 rounded-full bg-emerald-500 mr-3 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function InsightListItem({ label, value, highlight }) {
  return (
    <li className="flex justify-between items-center text-sm md:text-base border-b border-slate-800/50 pb-3 last:border-0 last:pb-0">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold text-right ${highlight ? 'text-primary-300 bg-primary-500/10 border border-primary-500/20 px-3 py-1 rounded-full text-xs uppercase tracking-wider' : 'text-slate-200'}`}>
        {value || "-"}
      </span>
    </li>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors duration-300 relative overflow-hidden group">
      <div className="absolute -right-5 -bottom-5 opacity-5 transform group-hover:scale-150 transition-transform duration-500 ease-out z-0">
        <Activity className="w-32 h-32" />
      </div>
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 shadow-inner group-hover:border-slate-600 transition-colors">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-white tracking-tighter mb-1">{value}</p>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
}

function InsightItem({ title, desc, trend }) {
  const trendColors = {
    up: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    down: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    neutral: "text-primary-400 bg-primary-500/10 border-primary-500/20"
  };

  return (
    <div className={`group p-4 rounded-xl border flex flex-col justify-center transition-all ${trendColors[trend] || trendColors.neutral}`}>
      <p className="font-bold flex items-center mb-1.5 opacity-90">
        {title}
      </p>
      <p className={`text-sm font-medium leading-relaxed opacity-100 ${trend === 'up' ? 'text-emerald-100' : trend === 'down' ? 'text-rose-100' : 'text-primary-100'}`}>
        {desc}
      </p>
    </div>
  );
}
