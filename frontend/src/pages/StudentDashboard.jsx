import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, LogOut, PlayCircle, BookOpen, CheckCircle,
  BarChart2, Clock, Brain, ChevronRight, Zap, MessageSquare
} from 'lucide-react';
import { studentService, authService } from '../services/api';

// Available topics with metadata
const TOPICS = [
  { id: 'Arrays', label: 'Arrays', icon: '[ ]', desc: 'Indexing, traversal, searching & sorting', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { id: 'Recursion', label: 'Recursion', icon: '↩', desc: 'Base cases, call stacks, backtracking', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { id: 'Trees', label: 'Trees', icon: '🌲', desc: 'BST, traversal, depth/height problems', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { id: 'Linked Lists', label: 'Linked Lists', icon: '→', desc: 'Nodes, pointers, insertion & deletion', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { id: 'Sorting', label: 'Sorting', icon: '↕', desc: 'Bubble, merge, quick sort algorithms', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { id: 'Dynamic Programming', label: 'Dynamic Programming', icon: '⬛', desc: 'Memoization, tabulation, optimal substructure', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topics');

  // For toast
  const [actionToast, setActionToast] = useState(null);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u || u.role !== 'student') { navigate('/login'); return; }
    setUser(u);
    loadPerformance();
  }, [navigate]);

  const loadPerformance = async () => {
    try {
      const [perf, pls] = await Promise.all([
        studentService.getPerformance(),
        studentService.getActivePolls().catch(() => [])
      ]);
      setPerformance(perf);
      setPolls(pls);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, icon) => {
    setActionToast({ message, icon });
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleLogout = () => { authService.logout(); navigate('/'); };

  const submitVote = async (pollId, response) => {
    try {
      await studentService.submitPollVote(pollId, response);
      showToast('Vote submitted successfully!', <CheckCircle className="w-5 h-5 text-white" />);
      // Refresh to remove poll
      loadPerformance();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to submit vote");
    }
  };

  const startTest = (topic) => {
    navigate(`/student/test?topic=${encodeURIComponent(topic)}`);
  };

  // Summary stats from past performance
  const totalAttempts = performance.length;
  const correctCount = performance.filter(p => p.correct).length;
  const overallAccuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null;

  // Per-topic summary for small indicators
  const topicStats = {};
  performance.forEach(p => {
    if (!topicStats[p.topic]) topicStats[p.topic] = { total: 0, correct: 0 };
    topicStats[p.topic].total++;
    if (p.correct) topicStats[p.topic].correct++;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Activity className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern relative">

      {/* Toast Notification */}
      <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${actionToast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl py-3 px-5 flex items-center space-x-3 text-white">
          <div className="bg-indigo-500/20 p-1.5 rounded-lg">
            {actionToast?.icon}
          </div>
          <span className="font-semibold text-sm">{actionToast?.message}</span>
        </div>
      </div>

      {/* Navbar */}
      <nav className="glass-panel sticky top-0 z-50 px-8 py-4 flex justify-between items-center rounded-b-3xl mx-2 mt-1">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-md">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            LearnPulse <span className="text-indigo-600">AI</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-700 font-semibold text-sm">{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 md:p-10">

        {/* Welcome Banner */}
        <div className="mb-10 animate-fade-in-up">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">
                  Welcome back, {user?.username}! 👋
                </h1>
                <p className="text-indigo-100 text-base leading-relaxed max-w-lg">
                  Select a topic below to start your diagnostic test. After the exam, the AI will analyze
                  your answers and show your full learning analytics.
                </p>
              </div>

              {/* Quick stats — only if they've taken tests */}
              {totalAttempts > 0 && (
                <div className="flex space-x-4 mt-6 md:mt-0">
                  <div className="bg-white/20 rounded-2xl px-5 py-4 text-center">
                    <p className="text-2xl font-black">{totalAttempts}</p>
                    <p className="text-indigo-100 text-xs font-semibold mt-0.5">Attempts</p>
                  </div>
                  <div className="bg-white/20 rounded-2xl px-5 py-4 text-center">
                    <p className="text-2xl font-black">{overallAccuracy}%</p>
                    <p className="text-indigo-100 text-xs font-semibold mt-0.5">Accuracy</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How it works — only shown on first visit */}
        {totalAttempts === 0 && (
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">How it works</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { step: '1', icon: <BookOpen className="w-5 h-5" />, title: 'Pick a Topic', desc: 'Choose any topic below to take a focused diagnostic quiz' },
                { step: '2', icon: <Brain className="w-5 h-5" />, title: 'AI Analyzes', desc: 'Our ML engine studies your answers, timing, and retry patterns' },
                { step: '3', icon: <BarChart2 className="w-5 h-5" />, title: 'See Your Analytics', desc: 'Get a detailed drift report, risk level, and personalized AI insights' },
              ].map(s => (
                <div key={s.step} className="glass-card p-5">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md">{s.step}</div>
                    <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl border border-indigo-100">{s.icon}</div>
                  </div>
                  <p className="font-bold text-slate-900 mb-1">{s.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 mb-6 space-x-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => setActiveTab('topics')}
            className={`pb-4 font-bold text-sm tracking-wide transition-colors relative ${activeTab === 'topics' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Diagnostic Tests
            {activeTab === 'topics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
          </button>
          <button
            onClick={() => setActiveTab('doubt')}
            className={`pb-4 font-bold text-sm tracking-wide transition-colors relative flex items-center ${activeTab === 'doubt' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Doubt Session (Polls)
            {polls.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{polls.length}</span>}
            {activeTab === 'doubt' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
          </button>
        </div>

        {/* TAB TARGET: Topics */}
        {activeTab === 'topics' && (
          <div className="animate-fade-in-up md:col-span-12" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Select a Topic to Begin
              </h2>
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 px-3 py-1.5 rounded-full">
                8 questions per test
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TOPICS.map((topic, i) => {
                const stats = topicStats[topic.id];
                const accuracy = stats ? Math.round((stats.correct / stats.total) * 100) : null;

                return (
                  <button
                    key={topic.id}
                    onClick={() => startTest(topic.id)}
                    className="group glass-card p-6 text-left animate-fade-in-up card-hover border-transparent"
                    style={{ animationDelay: `${0.25 + i * 0.05}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:scale-110 transition-transform`}>
                          {topic.icon}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-lg tracking-tight">{topic.label}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">{topic.desc}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between">
                      {stats ? (
                        <>
                          <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${topic.bg} ${topic.border} ${topic.text}`}>
                            Last score: {accuracy}%
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{stats.total} attempt{stats.total !== 1 ? 's' : ''}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-400 italic">Not attempted yet</span>
                          <div className="flex items-center space-x-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">Start</span>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB TARGET: Doubt Session */}
        {activeTab === 'doubt' && (
          <div className="animate-fade-in-up mt-4" style={{ animationDelay: '0.2s' }}>
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Instructor Doubt Sessions</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Provide feedback on recent topics to help instructors structure their reviews.</p>
            </div>

            {polls.length === 0 ? (
              <div className="glass-card p-12 text-center border-dashed border-2">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">You're all caught up!</h3>
                <p className="text-sm text-slate-500">There are no active doubt polls waiting for your response.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {polls.map((poll) => (
                  <div key={poll.id} className="bg-white rounded-[20px] shadow-sm border border-slate-200 p-8 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-pink-500"></div>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 rounded-full border border-indigo-200 text-indigo-500 text-[10px] font-bold tracking-wider uppercase bg-indigo-50/50">{poll.topic}</span>
                        <span className="text-xs text-slate-400 font-semibold">{new Date(poll.timestamp).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-8">{poll.question}</h3>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-2">How would you respond?</p>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => submitVote(poll.id, 'Yes')} className="bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 font-bold py-2 rounded-xl text-sm transition-colors border border-emerald-200 hover:border-emerald-500">
                          Yes / Easy
                        </button>
                        <button onClick={() => submitVote(poll.id, 'Not Sure')} className="bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 font-bold py-2 rounded-xl text-sm transition-colors border border-amber-200 hover:border-amber-500">
                          Not Sure
                        </button>
                        <button onClick={() => submitVote(poll.id, 'No')} className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-700 font-bold py-2 rounded-xl text-sm transition-colors border border-rose-200 hover:border-rose-500">
                          No / Hard
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
        }

        {/* View Past Analytics — only if they have completed tests */}
        {
          totalAttempts > 0 && (
            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <div className="glass-card p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl shadow-sm">
                    <Zap className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-lg tracking-tight">View your latest analysis</p>
                    <p className="text-sm text-slate-500 font-medium">See your drift score and AI insights from your most recent test</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/student/analytics')}
                  className="btn-premium bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl"
                >
                  <span>View Analytics</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )
        }

      </main >
    </div >
  );
};

export default StudentDashboard;
