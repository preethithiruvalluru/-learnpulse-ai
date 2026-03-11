import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import {
  CheckCircle, XCircle, AlertTriangle, Brain, Activity,
  BarChart2, ArrowLeft, PlayCircle, Award, TrendingDown, TrendingUp, Zap
} from 'lucide-react';
import { studentService, authService } from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

const RiskBadge = ({ level, large }) => {
  const styles = {
    'Normal':   { cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle className="mr-1.5" /> },
    'Warning':  { cls: 'text-amber-700 bg-amber-50 border-amber-200',   icon: <AlertTriangle className="mr-1.5" /> },
    'High Risk':{ cls: 'text-red-700 bg-red-50 border-red-200',          icon: <XCircle className="mr-1.5" /> },
    'Not Analyzed': { cls: 'text-slate-600 bg-slate-50 border-slate-200', icon: null },
  };
  const s = styles[level] || styles['Not Analyzed'];
  const sz = large ? 'text-sm px-4 py-2' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center font-bold rounded-xl border ${s.cls} ${sz}`}>
      {s.icon && React.cloneElement(s.icon, { className: `w-3.5 h-3.5 mr-1.5` })}
      {level}
    </span>
  );
};

const DriftGauge = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  const color = pct < 30 ? '#10b981' : pct < 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="14" />
        <circle
          cx="60" cy="60" r="50" fill="none"
          stroke={color} strokeWidth="14"
          strokeDasharray={`${pct * 3.14} 314`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900">{pct}%</span>
        <span className="text-xs text-slate-500 font-semibold">Drift Score</span>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const PostTestAnalytics = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [driftHistory, setDriftHistory] = useState([]);
  const [user, setUser] = useState(null);

  const { answers = [], topic = 'Test', mlReport } = location.state || {};

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u) { navigate('/login'); return; }
    setUser(u);
    // Load drift history for chart
    studentService.getDriftHistory().then(setDriftHistory).catch(() => {});
  }, [navigate]);

  // If navigated here directly without state, go back
  useEffect(() => {
    if (!location.state) navigate('/student');
  }, [location.state, navigate]);

  const totalQ = answers.length;
  const correctCount = answers.filter(a => a.correct).length;
  const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
  const avgTime = totalQ > 0 ? Math.round(answers.reduce((s, a) => s + a.time, 0) / totalQ) : 0;
  const totalRetries = answers.reduce((s, a) => s + a.retries, 0);

  // Radar from ML report
  const radarData = mlReport ? [
    { subject: 'Accuracy', A: Math.round((1 - (mlReport.recent_accuracy_drop || 0)) * 100) },
    { subject: 'Speed', A: Math.max(0, Math.round(100 - Math.abs((mlReport.time_change_factor || 0) * 100))) },
    { subject: 'Consistency', A: Math.round((mlReport.consistency_score || 0.5) * 100) },
    { subject: 'Focus', A: Math.round((1 - (mlReport.guess_probability || 0)) * 100) },
    { subject: 'Momentum', A: Math.round(Math.max(0, 50 + (mlReport.learning_velocity || 0) * 100)) },
  ] : null;

  const driftChartData = driftHistory.map((r, i) => ({
    name: `T${i + 1}`,
    drift: Math.round(r.drift_score * 100),
  }));

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern">
      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 px-8 py-4 flex justify-between items-center rounded-b-3xl mx-2 mt-1">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-md">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">LearnPulse <span className="text-indigo-600">AI</span></span>
        </div>
        <button onClick={() => navigate('/student')} className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 font-bold text-sm transition-colors bg-white/50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-10">

        {/* Page Title */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200">{topic}</span>
            <span className="text-slate-400 text-xs">Diagnostic Test</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Test Analytics</h1>
          <p className="text-slate-500 mt-1">AI analysis of your performance and learning behavior</p>
        </div>

        {/* ── Top: Score Summary + Drift Report ──────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">

          {/* Score card */}
          <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Test Score</h2>
            <div className="flex items-end space-x-2 mb-4">
              <span className={`text-5xl font-black ${accuracy >= 70 ? 'text-emerald-600' : accuracy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {accuracy}%
              </span>
              <span className="text-slate-400 font-bold text-lg mb-1">{correctCount}/{totalQ}</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Correct</span>
                <span className="font-bold text-emerald-600">{correctCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Wrong</span>
                <span className="font-bold text-rose-600">{totalQ - correctCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Avg. Time</span>
                <span className="font-bold text-slate-700">{avgTime}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Retries</span>
                <span className="font-bold text-slate-700">{totalRetries}</span>
              </div>
            </div>
          </div>

          {/* Drift Gauge */}
          <div className={`glass-card p-6 animate-fade-in-up flex flex-col items-center justify-center ${
            !mlReport ? 'border-slate-100' :
            mlReport.risk_level === 'High Risk' ? 'border-red-200 bg-red-50/30' :
            mlReport.risk_level === 'Warning' ? 'border-amber-200 bg-amber-50/30' :
            'border-emerald-200 bg-emerald-50/30'
          }`} style={{ animationDelay: '0.15s' }}>
            {mlReport ? (
              <>
                <DriftGauge score={mlReport.drift_score} />
                <div className="mt-4 text-center">
                  <RiskBadge level={mlReport.risk_level} large />
                  <p className="text-sm font-semibold text-slate-600 mt-2">{mlReport.behavior_classification}</p>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-700 mb-1">Need More Data</p>
                <p className="text-xs text-slate-400 leading-relaxed">Complete more tests to generate your drift analysis. Keep going!</p>
              </div>
            )}
          </div>

          {/* Behavior Metrics */}
          <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Behavioral Metrics</h2>
            {mlReport ? (
              <div className="space-y-3">
                {[
                  { label: 'Guess Probability', value: Math.round((mlReport.guess_probability || 0) * 100), icon: <Zap className="w-3.5 h-3.5" />, invert: true },
                  { label: 'Consistency', value: Math.round((mlReport.consistency_score || 0.5) * 100), icon: <Activity className="w-3.5 h-3.5" /> },
                  { label: 'Anomaly Score', value: Math.round((mlReport.anomaly_score || 0) * 100), icon: <AlertTriangle className="w-3.5 h-3.5" />, invert: true },
                ].map(m => {
                  const isHigh = m.invert ? m.value >= 50 : m.value >= 60;
                  const barColor = m.invert
                    ? m.value >= 60 ? 'bg-red-500' : m.value >= 30 ? 'bg-amber-500' : 'bg-emerald-500'
                    : m.value >= 60 ? 'bg-emerald-500' : m.value >= 30 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                          <span className="text-slate-400">{m.icon}</span>
                          <span>{m.label}</span>
                        </span>
                        <span className="text-xs font-black text-slate-800">{m.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${m.value}%`, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                      {(mlReport.learning_velocity || 0) >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                      <span>Learning Velocity</span>
                    </span>
                    <span className={`text-xs font-black ${(mlReport.learning_velocity || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {(mlReport.learning_velocity || 0) >= 0 ? '+' : ''}{((mlReport.learning_velocity || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {['Guess Probability', 'Consistency', 'Anomaly Score', 'Learning Velocity'].map(l => (
                  <div key={l} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── AI Insight ──────────────────────────────────────────────── */}
        {mlReport?.ai_insight && (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-7 text-white shadow-xl mb-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center mb-4">
              <div className="bg-white/10 rounded-xl p-2 mr-3">
                <Brain className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="font-black text-white">AI Learning Insight</p>
                <p className="text-xs text-slate-400">Based on your behavioral patterns</p>
              </div>
            </div>
            <p className="text-slate-100 leading-relaxed text-base">{mlReport.ai_insight}</p>
          </div>
        )}

        {/* ── Radar + Drift History ────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Behavior Radar */}
          <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="font-bold text-slate-900 mb-1 flex items-center">
              <Award className="w-4 h-4 mr-2 text-purple-500" /> Behavior Profile
            </h2>
            <p className="text-xs text-slate-400 mb-4">How you compare across behavioral dimensions</p>
            {radarData ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                    <Radar name="Profile" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.25}
                      dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm text-center">
                Take more tests to build your behavioral profile.
              </div>
            )}
          </div>

          {/* Drift History */}
          <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <h2 className="font-bold text-slate-900 mb-1 flex items-center">
              <BarChart2 className="w-4 h-4 mr-2 text-rose-500" /> Drift Score History
            </h2>
            <p className="text-xs text-slate-400 mb-4">Your drift score across past tests</p>
            {driftChartData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={driftChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0' }} formatter={(v) => [`${v}%`, 'Drift']} />
                    <Bar dataKey="drift" radius={[4, 4, 0, 0]}>
                      {driftChartData.map((e, i) => (
                        <Cell key={i} fill={e.drift >= 60 ? '#ef4444' : e.drift >= 30 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm text-center">
                History appears as you complete more tests.
              </div>
            )}
          </div>
        </div>

        {/* ── Question-by-question review ──────────────────────────────── */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h2 className="font-bold text-slate-900 mb-5">Question Review</h2>
          <div className="space-y-3">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border ${a.correct ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded-lg ${a.correct ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {a.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">Q{i + 1}: {a.question.length > 80 ? a.question.slice(0, 80) + '…' : a.question}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                    <span className="text-xs text-slate-400">{a.time}s</span>
                    {a.retries > 0 && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">{a.retries} retr{a.retries === 1 ? 'y' : 'ies'}</span>}
                  </div>
                </div>
                {!a.correct && (
                  <div className="mt-2 text-xs grid grid-cols-2 gap-2">
                    <div className="bg-red-100 text-red-700 rounded-lg px-3 py-2">
                      <span className="font-bold">Your ans: </span>{a.options[a.selectedOption]}
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 rounded-lg px-3 py-2">
                      <span className="font-bold">Correct: </span>{a.options[a.correctOption]}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Buttons ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <button
            onClick={() => navigate('/student')}
            className="flex-1 flex items-center justify-center space-x-2 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-4 px-6 rounded-2xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Choose Another Topic</span>
          </button>
          <button
            onClick={() => navigate(`/student/test?topic=${encodeURIComponent(topic)}`)}
            className="flex-1 flex items-center justify-center space-x-2 btn-premium bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Retake {topic} Test</span>
          </button>
        </div>

      </main>
    </div>
  );
};

export default PostTestAnalytics;
