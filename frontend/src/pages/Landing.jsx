import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Brain, Target, ShieldAlert, ArrowRight, Zap, BarChart2, CheckCircle, TrendingUp, Users } from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay, gradient }) => (
  <div
    className={`glass-panel p-8 rounded-3xl flex flex-col items-start transition-all hover:-translate-y-2 hover:shadow-2xl duration-500 animate-fade-in-up cursor-default`}
    style={{ animationDelay: delay }}
  >
    <div className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl text-white mb-6 shadow-lg`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900 tracking-tight">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const StatPill = ({ value, label, delay }) => (
  <div className="text-center animate-fade-in-up" style={{ animationDelay: delay }}>
    <p className="text-4xl md:text-5xl font-black gradient-text mb-1">{value}</p>
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);

const BehaviorChip = ({ label, color }) => (
  <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${color} flex items-center space-x-1`}>
    <div className={`w-1.5 h-1.5 rounded-full ${
      color.includes('emerald') ? 'bg-emerald-500' :
      color.includes('amber') ? 'bg-amber-500' : 'bg-red-500'
    }`}></div>
    <span>{label}</span>
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute top-0 -left-8 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob"></div>
      <div className="absolute top-0 -right-8 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-12 left-24 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: '4s' }}></div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="px-8 py-5 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-md bg-white/50 sticky top-0 z-50 border-b border-white/30">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">
              LearnPulse <span className="text-indigo-600">AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-semibold transition-colors text-sm">
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6">
          {/* Hero */}
          <div className="py-24 flex flex-col items-center text-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-600 font-bold tracking-wide text-xs mb-8">
                <Zap className="w-3.5 h-3.5 mr-2 text-amber-500" />
                Powered by ADWIN + Random Forest + Anomaly Detection
              </div>
            </div>

            <h1
              className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8 max-w-5xl animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              Detect when students stop{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-300% animate-gradient">
                learning.
              </span>
            </h1>

            <p
              className="text-xl text-slate-600 max-w-3xl mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              LearnPulse AI monitors student interactions in real-time, detects concept drift — when guessing
              replaces understanding — and alerts instructors before students fail.
            </p>

            <div
              className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 animate-fade-in-up"
              style={{ animationDelay: '0.3s' }}
            >
              <Link
                to="/register"
                className="group bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all flex items-center justify-center"
              >
                Deploy in Minutes
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center"
              >
                View Live Demo
              </Link>
            </div>

            {/* Behavior Classification Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <span className="text-sm text-slate-500 font-semibold">AI Detects:</span>
              <BehaviorChip label="✓ Normal Learner" color="text-emerald-700 bg-emerald-50 border-emerald-200" />
              <BehaviorChip label="⚡ Guessing Behavior" color="text-amber-700 bg-amber-50 border-amber-200" />
              <BehaviorChip label="⚠ Conceptual Struggler" color="text-red-700 bg-red-50 border-red-200" />
              <BehaviorChip label="🔁 Pattern Memorizer" color="text-purple-700 bg-purple-50 border-purple-200" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 py-16 border-t border-b border-slate-200/50 max-w-3xl mx-auto mb-24 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
            <StatPill value="4+" label="ML Algorithms" delay="0.5s" />
            <StatPill value="8+" label="Behavioral Features" delay="0.55s" />
            <StatPill value="3" label="Risk Levels" delay="0.6s" />
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-24">
            <FeatureCard
              icon={<Brain size={26} />}
              title="ADWIN Drift Detection"
              gradient="from-indigo-500 to-indigo-700"
              description="Adaptive sliding window algorithm statistically detects when student accuracy patterns change significantly — far earlier than grade-based systems."
              delay="0.5s"
            />
            <FeatureCard
              icon={<Target size={26} />}
              title="Behavior Classification"
              gradient="from-purple-500 to-purple-700"
              description="Random Forest classifier trained on behavioral features categorizes students as Normal, Guessing, Struggling, or Pattern Memorizer in real-time."
              delay="0.55s"
            />
            <FeatureCard
              icon={<BarChart2 size={26} />}
              title="Instructor Analytics"
              gradient="from-rose-500 to-rose-700"
              description="Topic error heatmaps, drift score timelines, per-student detail view, and alert feeds give instructors complete visibility into learning drift."
              delay="0.6s"
            />
          </div>

          {/* How It Works */}
          <div className="text-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.65s' }}>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">How Concept Drift Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">A student can appear to be doing fine on paper while their understanding is deteriorating.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-24">
            {/* Before Drift */}
            <div className="glass-panel rounded-3xl p-8 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center space-x-2 mb-6">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-emerald-700 text-sm uppercase tracking-wider">Healthy Learning</span>
              </div>
              <div className="space-y-3">
                {[
                  { q: 'Q1', correct: true, time: '42s', retries: 0 },
                  { q: 'Q2', correct: true, time: '38s', retries: 0 },
                  { q: 'Q3', correct: true, time: '45s', retries: 1 },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                    <span className="font-bold text-slate-600 text-sm">{row.q}</span>
                    <span className="text-sm text-slate-500">{row.time}</span>
                    <span className="text-xs text-slate-400">{row.retries} retries</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Correct ✓</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-sm mt-4">→ Drift Score: <span className="font-bold text-emerald-600">12%</span> — Normal</p>
            </div>

            {/* After Drift */}
            <div className="glass-panel rounded-3xl p-8 border border-red-100 animate-fade-in-up" style={{ animationDelay: '0.75s' }}>
              <div className="flex items-center space-x-2 mb-6">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <span className="font-bold text-red-700 text-sm uppercase tracking-wider">Drift Detected</span>
              </div>
              <div className="space-y-3">
                {[
                  { q: 'Q4', correct: false, time: '8s', retries: 2 },
                  { q: 'Q5', correct: false, time: '6s', retries: 3 },
                  { q: 'Q6', correct: false, time: '5s', retries: 2 },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3">
                    <span className="font-bold text-slate-600 text-sm">{row.q}</span>
                    <span className="text-sm text-red-500 font-semibold">{row.time} ⚡</span>
                    <span className="text-xs text-slate-500">{row.retries} retries</span>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">Wrong ✗</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-500 text-sm mt-4">→ Drift Score: <span className="font-bold text-red-600">78%</span> — High Risk 🚨</p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-16 mb-8">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              Stop guessing. Start detecting.
            </h2>
            <p className="text-slate-600 mb-8 animate-fade-in-up" style={{ animationDelay: '0.85s' }}>
              Help students before they fail, not after.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-200 transition-all animate-fade-in-up"
              style={{ animationDelay: '0.9s' }}
            >
              Get Started — It's Free <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-8 mt-8 text-center text-sm text-slate-400">
          <p className="font-semibold text-slate-600 mb-1">LearnPulse AI</p>
          <p>Concept Drift Detection System for Student Learning Behavior</p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
