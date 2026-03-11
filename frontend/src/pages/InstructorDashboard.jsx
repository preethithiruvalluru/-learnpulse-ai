import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Activity, LogOut, Users, ShieldAlert, Brain, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, BarChart2,
  Clock, Award, Zap, ChevronRight, Mail, Target, ArrowRight,
  MessageSquare
} from 'lucide-react';
import { instructorService, authService, mlService } from '../services/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

const RiskBadge = ({ level, large }) => {
  const styles = {
    'High Risk': 'text-red-700 bg-red-50 border-red-200',
    'Warning': 'text-amber-700 bg-amber-50 border-amber-200',
    'Normal': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'Not Analyzed': 'text-slate-500 bg-slate-50 border-slate-200',
  };
  const icons = {
    'High Risk': <XCircle className="w-3.5 h-3.5 mr-1.5" />,
    'Warning': <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />,
    'Normal': <CheckCircle className="w-3.5 h-3.5 mr-1.5" />,
  };
  const sz = large ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center rounded-xl font-bold border shadow-sm ${styles[level] || styles['Not Analyzed']} ${sz}`}>
      {icons[level]}
      {level}
    </span>
  );
};

const DriftBar = ({ score }) => {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 60 ? 'bg-gradient-to-r from-red-500 to-rose-500' :
    pct >= 30 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
      'bg-gradient-to-r from-emerald-400 to-emerald-500';
  return (
    <div className="flex items-center space-x-3 w-full">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
        <div className={`h-full ${color} rounded-full drift-bar-fill`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-black text-slate-700 w-8">{pct}%</span>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, sub }) => {
  const colorMap = {
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200 text-indigo-50',
    red: 'from-red-500 to-rose-600 shadow-red-200 text-red-50',
    amber: 'from-amber-400 to-amber-500 shadow-amber-200 text-amber-50',
    emerald: 'from-emerald-400 to-emerald-500 shadow-emerald-200 text-emerald-50',
  };
  return (
    <div className="glass-card p-6 flex flex-col relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${colorMap[color]} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
      <div className="flex items-center space-x-4 mb-4 relative z-10">
        <div className={`bg-gradient-to-br ${colorMap[color]} p-3 rounded-2xl text-white shadow-lg transform group-hover:-rotate-6 transition-transform`}>
          {icon}
        </div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
      <div className="relative z-10 flex items-end justify-between">
        <p className="text-4xl font-black text-slate-800 tracking-tight">{value}</p>
        {sub && <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{sub}</span>}
      </div>
    </div>
  );
};

// ── Main UI ────────────────────────────────────────────────────────────────────

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [classOverview, setClassOverview] = useState([]);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [heatmap, setHeatmap] = useState(null);

  const [polls, setPolls] = useState([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [newPollTopic, setNewPollTopic] = useState('');
  const [newPollQuestion, setNewPollQuestion] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [studentReports, setStudentReports] = useState([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // For toaster mock actions
  const [actionToast, setActionToast] = useState(null);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u || u.role !== 'instructor') { navigate('/login'); return; }
    setUser(u);
    loadAll();
  }, [navigate]);

  const loadAll = useCallback(async () => {
    try {
      const [overview, reps, alrts, hm, pls] = await Promise.all([
        mlService.getClassOverview().catch(() => []),
        instructorService.getDriftReports(),
        instructorService.getAlerts().catch(() => []),
        instructorService.getTopicHeatmap().catch(() => null),
        instructorService.getPolls().catch(() => []),
      ]);
      setClassOverview(overview);
      setReports(reps);
      setAlerts(alrts);
      setHeatmap(hm);
      setPolls(pls);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const showToast = (message, icon) => {
    setActionToast({ message, icon });
    setTimeout(() => setActionToast(null), 3000);
  };

  const handleAction = (actionType) => {
    if (actionType === 'intervention') {
      showToast(`Warning Email dispatched to ${studentDetail?.student?.username}`, <Mail className="w-5 h-5 text-white" />);
    } else if (actionType === 'practice') {
      showToast(`Targeted Practice Set assigned to ${studentDetail?.student?.username}`, <Target className="w-5 h-5 text-white" />);
    }
  };

  const createPoll = async (e) => {
    e.preventDefault();
    if (!newPollTopic || !newPollQuestion) return;
    try {
      await instructorService.createPoll({ topic: newPollTopic, question: newPollQuestion });
      setNewPollTopic('');
      setNewPollQuestion('');
      setShowPollForm(false);
      showToast('Poll created successfully!', <MessageSquare className="w-5 h-5 text-white" />);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const closePoll = async (pollId) => {
    try {
      await instructorService.closePoll(pollId);
      showToast('Poll closed successfully!', <CheckCircle className="w-5 h-5 text-white" />);
      loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const selectStudent = async (studentId) => {
    setSelectedStudent(studentId === selectedStudent ? null : studentId);
    if (studentId !== selectedStudent) {
      try {
        const [detail, reps] = await Promise.all([
          instructorService.getStudentDetail(studentId),
          instructorService.getStudentDriftReports(studentId),
        ]);
        setStudentDetail(detail);
        setStudentReports(reps);
      } catch (e) {
        console.error(e);
      }
    } else {
      setStudentDetail(null);
      setStudentReports([]);
    }
  };

  const triggerMLAnalysis = async (studentId, e) => {
    e.stopPropagation();
    setLoadingAnalysis(true);
    try {
      await mlService.analyzeStudent(studentId);
      await loadAll();
      if (selectedStudent === studentId) {
        const [detail, reps] = await Promise.all([
          instructorService.getStudentDetail(studentId),
          instructorService.getStudentDriftReports(studentId),
        ]);
        setStudentDetail(detail);
        setStudentReports(reps);
      }
      showToast(`ML Analysis complete for student!`, <Brain className="w-5 h-5 text-white" />);
    } catch (err) {
      alert(err.response?.data?.detail || 'Not enough data to analyze.');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Chart data
  const globalDriftChart = reports.slice(-20).reverse().map(r => ({
    name: `#${r.student_id}`,
    drift: Math.round(r.drift_score * 100),
  }));

  const studentDriftChart = studentReports.map((r, i) => ({
    name: `T${i + 1}`,
    drift: Math.round(r.drift_score * 100),
    accuracy_drop: Math.round(r.recent_accuracy_drop * 100),
  }));

  const latestDrift = studentDetail?.latest_report;
  const radarData = latestDrift ? [
    { subject: 'Focus (No Guesses)', A: Math.round((1 - (latestDrift.guess_probability || 0)) * 100) },
    { subject: 'Consistency', A: Math.round((latestDrift.consistency_score || 0.5) * 100) },
    { subject: 'Momentum', A: Math.round(Math.max(0, 50 + (latestDrift.learning_velocity || 0) * 100)) },
    { subject: 'Speed Adaptability', A: Math.max(0, Math.round(100 - Math.abs((latestDrift.time_change_factor || 0) * 100))) },
    { subject: 'Accuracy Retention', A: Math.round((1 - (latestDrift.recent_accuracy_drop || 0)) * 100) },
  ] : null;

  const highRiskCount = classOverview.filter(s => s.risk_level === 'High Risk').length;
  const warningCount = classOverview.filter(s => s.risk_level === 'Warning').length;
  const totalStudents = classOverview.length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Toast Notification */}
      <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${actionToast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl py-3 px-5 flex items-center space-x-3 text-white">
          <div className="bg-indigo-500/20 p-1.5 rounded-lg">
            {actionToast?.icon}
          </div>
          <span className="font-semibold text-sm">{actionToast?.message}</span>
        </div>
      </div>

      <div className="flex h-screen overflow-hidden">

        {/* PREMIUM SIDEBAR */}
        <div className="sidebar-dark w-72 flex-shrink-0 flex flex-col text-slate-300 py-8 px-5 border-r border-slate-800 shadow-2xl relative z-20">
          <div className="flex items-center space-x-3 mb-12 px-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 ring-1 ring-white/10">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-black text-xl tracking-tight text-white">LearnPulse<span className="text-indigo-400"> AI</span></p>
              <p className="text-[10px] text-indigo-200/60 uppercase tracking-widest font-bold mt-1">Instructor Portal</p>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-4">Views</p>
          <nav className="flex-1 space-y-2">
            {[
              { id: 'overview', label: 'Command Center', icon: Activity },
              { id: 'polls', label: 'Drift Polls', icon: MessageSquare },
              { id: 'alerts', label: 'Interventions', icon: AlertTriangle, badge: alerts.length },
              { id: 'heatmap', label: 'Topic Heatmap', icon: BarChart2 }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === item.id
                    ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white'
                    : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-200' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${activeTab === item.id ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'}`}>{item.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-800">
            <div className="bg-slate-800/40 rounded-2xl p-4 flex items-center justify-between border border-slate-700/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black text-lg border-2 border-slate-800 shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{user.username}</p>
                  <p className="text-xs text-slate-400">Administrator</p>
                </div>
              </div>
              <button onClick={() => { authService.logout(); navigate('/'); }} className="p-2 hover:bg-slate-700/50 rounded-xl text-slate-400 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT DASHBOARD */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">

          {/* Header Bar */}
          <div className="sticky top-0 z-10 glass-panel px-10 py-5 flex justify-between items-center border-b border-indigo-100 shadow-sm rounded-b-3xl mx-2 mt-1">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'overview' ? 'Command Center' : activeTab === 'polls' ? 'Drift Polls' : activeTab === 'alerts' ? 'Active Interventions' : 'Global Topic Heatmap'}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {activeTab === 'polls' ? 'Create polls to assess student understanding and detect concept drift.' : 'Real-time student behavior monitoring & analytics'}
              </p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} className="btn-premium bg-white border-2 border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 px-6 py-2.5 rounded-2xl text-sm shadow-sm group font-bold">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin text-indigo-600' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span>Refresh Data</span>
            </button>
          </div>

          <div className="p-10 max-w-7xl mx-auto">

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <StatCard label="Total Students" value={totalStudents} icon={<Users className="h-6 w-6" />} color="indigo" />
              <StatCard label="Needs Intervention" value={highRiskCount} icon={<XCircle className="h-6 w-6" />} color="red" sub={`${Math.round((highRiskCount / totalStudents) * 100 || 0)}% of class`} />
              <StatCard label="Warning Flags" value={warningCount} icon={<AlertTriangle className="h-6 w-6" />} color="amber" sub="Watch closely" />
              <StatCard label="ML Analyses Run" value={reports.length} icon={<Brain className="h-6 w-6" />} color="emerald" sub="Total scans" />
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ── Left Column: Student Master List ── */}
                <div className="lg:col-span-5 glass-card overflow-hidden flex flex-col h-[700px] shadow-xl">
                  <div className="px-6 py-5 border-b border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg flex items-center tracking-tight">
                        <Users className="w-5 h-5 mr-2 text-indigo-500" /> Student Cohort
                      </h2>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Select a student to view deep behavioral analytics</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {classOverview.map(s => (
                      <div
                        key={s.student_id}
                        onClick={() => selectStudent(s.student_id)}
                        className={`rounded-2xl p-4 cursor-pointer list-item-hover ${selectedStudent === s.student_id ? 'list-item-active' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm ${selectedStudent === s.student_id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {s.student_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{s.student_name}</p>
                              <p className="text-xs text-slate-500 font-medium">{s.attempt_count} exams taken</p>
                            </div>
                          </div>
                          <RiskBadge level={s.risk_level} />
                        </div>

                        {s.drift_score != null ? (
                          <div className="mt-2 pl-1">
                            <DriftBar score={s.drift_score} />
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-400 pl-1 font-medium bg-slate-50 rounded-lg p-2 text-center animate-pulse">
                            Awaiting initial ML scan...
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-slate-100/50">
                          <button
                            onClick={(e) => triggerMLAnalysis(s.student_id, e)}
                            disabled={loadingAnalysis}
                            className="w-full btn-premium py-2 bg-indigo-50/50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs rounded-xl shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)] hover:shadow-indigo-200 transition-all font-bold"
                          >
                            <Brain className="w-3.5 h-3.5 mr-2" />
                            {loadingAnalysis ? 'Running ADWIN Analysis...' : 'Force ML Scan'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right Column: Selected Detail ── */}
                <div className="lg:col-span-7 h-[700px] overflow-y-auto custom-scrollbar pr-2">
                  {selectedStudent && studentDetail ? (
                    <div className="space-y-6 animate-fade-in-up">

                      {/* Identity & Actions Container */}
                      <div className="glass-card p-8">
                        {/* Top: Info & Score */}
                        <div className="flex items-start justify-between mb-8">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg font-black text-2xl">
                              {studentDetail.student?.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{studentDetail.student?.username}</h3>
                              <p className="text-sm font-semibold text-slate-500">{studentDetail.student?.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <RiskBadge level={studentDetail.latest_report?.risk_level || 'Not Analyzed'} large />
                            {studentDetail.latest_report && (
                              <p className="text-xl font-black mt-2 text-slate-800">{Math.round(studentDetail.latest_report.drift_score * 100)}% Drift</p>
                            )}
                          </div>
                        </div>

                        {/* Mid: Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-colors hover:border-indigo-200">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Exams</p>
                            <p className="text-2xl font-black text-slate-900 flex items-center">
                              {studentDetail.total_attempts}
                            </p>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-colors hover:border-indigo-200">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Accuracy</p>
                            <p className="text-2xl font-black text-slate-900 flex items-center">
                              {Math.round((studentDetail.overall_accuracy || 0) * 100)}%
                            </p>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-colors hover:border-indigo-200">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Time Iter</p>
                            <p className="text-2xl font-black text-slate-900 flex items-center">
                              {studentDetail.avg_time}s <Clock className="w-4 h-4 ml-2 text-slate-300" />
                            </p>
                          </div>
                        </div>

                        {/* Instructor Actions Panel */}
                        <div className="glass-card bg-gradient-to-r from-slate-900 to-indigo-900 p-5 shadow-xl relative overflow-hidden group border-0 mt-6">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-700"></div>
                          <h4 className="text-white font-black text-sm mb-4 flex items-center relative z-10 uppercase tracking-widest opacity-90">
                            <Zap className="w-4 h-4 mr-2 text-amber-400" /> Instructor Actions
                          </h4>
                          <div className="flex space-x-3 relative z-10">
                            <button onClick={() => handleAction('intervention')} className="btn-premium flex-1 bg-rose-500 hover:bg-rose-400 text-white rounded-xl py-3 shadow-lg shadow-rose-500/20">
                              <Mail className="w-4 h-4 mr-2" />
                              Send Intervention Email
                            </button>
                            <button onClick={() => handleAction('practice')} className="btn-premium flex-1 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl py-3 shadow-lg shadow-indigo-500/20">
                              <Target className="w-4 h-4 mr-2" />
                              Assign Remedial Practice
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Deep Analytics Row */}
                      {studentDetail.latest_report && (
                        <div className="grid grid-cols-2 gap-6">
                          {/* Behavior Profile Radar */}
                          <div className="glass-card p-6">
                            <h3 className="font-black text-slate-900 mb-1 flex items-center text-lg">
                              <Award className="w-5 h-5 mr-2 text-purple-500" /> Behavior Profile Map
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mb-6">Multi-dimensional learning signature</p>
                            <div className="h-56">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} />
                                  <Radar name="Student" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* AI Insight Box */}
                          <div className="glass-card p-6 bg-gradient-to-br from-indigo-50 to-white">
                            <h3 className="font-black text-slate-900 mb-1 flex items-center text-lg">
                              <Brain className="w-5 h-5 mr-2 text-indigo-500" /> Generative Assessment
                            </h3>
                            <p className="text-xs text-slate-500 font-semibold mb-6">AI Interpretation of Radar Profile</p>

                            <div className="bg-white border-l-4 border-indigo-500 p-5 rounded-r-2xl shadow-sm h-[200px] overflow-y-auto custom-scrollbar">
                              <p className="text-sm font-semibold text-indigo-950 leading-relaxed">
                                {studentDetail.latest_report.ai_insight || "Analyzing..."}
                              </p>
                              <div className="mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Classification</span>
                                <span className="inline-block bg-indigo-100 text-indigo-800 font-black px-3 py-1.5 rounded-lg text-sm">
                                  {studentDetail.latest_report.behavior_classification}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Drift Timeline Chart */}
                      {studentDriftChart.length > 0 && (
                        <div className="glass-card p-6">
                          <h3 className="font-black text-slate-900 mb-2 flex items-center text-lg">
                            <Activity className="w-5 h-5 mr-2 text-rose-500" /> Longitudinal Drift Tracking
                          </h3>
                          <div className="h-64 mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={studentDriftChart}>
                                <defs>
                                  <linearGradient id="driftGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} formatter={(v, n) => [`${v}%`, n === 'drift' ? 'Concept Drift' : 'Accuracy Drop']} />
                                <Area type="monotone" dataKey="drift" stroke="#f43f5e" strokeWidth={3} fill="url(#driftGrad2)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
                                <Line type="monotone" dataKey="accuracy_drop" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" dot={false} activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex space-x-6 mt-4 justify-center text-xs font-bold text-slate-500">
                            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-500 mr-2 shadow-sm"></div> Concept Drift</div>
                            <div className="flex items-center"><div className="w-4 h-1 bg-amber-500 mr-2 border-dashed border-t-2 border-amber-500"></div> Accuracy Decline</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Global placeholder state */
                    <div className="h-[700px] flex items-center justify-center p-6">
                      <div className="text-center max-w-sm">
                        <div className="w-24 h-24 bg-indigo-50 rounded-3xl mx-auto mb-6 flex items-center justify-center rotate-3 shadow-inner">
                          <Users className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Select a Student</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Choose a student from the cohort list on the left to analyze their multi-dimensional behavioral profile and initiate targeted interventions.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* POLLS TAB */}
            {activeTab === 'polls' && (
              <div className="space-y-6">
                <div>
                  <button
                    onClick={() => setShowPollForm(!showPollForm)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center shadow-lg shadow-indigo-600/20 transition-all">
                    <span className="mr-2 text-xl font-light leading-none">{showPollForm ? '-' : '+'}</span> {showPollForm ? 'Cancel Creation' : 'Create New Poll'}
                  </button>
                </div>

                {showPollForm && (
                  <div className="glass-card p-6 border-l-4 border-indigo-500 animate-fade-in-up">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Launch Drift Poll</h3>
                    <form onSubmit={createPoll} className="space-y-4 max-w-2xl">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topic Tag</label>
                        <input type="text" value={newPollTopic} onChange={e => setNewPollTopic(e.target.value)} placeholder="e.g. Recursion, Sorting, Searching..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Question</label>
                        <input type="text" value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)} placeholder="e.g. Do you understand recursion?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" required />
                      </div>
                      <div className="pt-2">
                        <button type="submit" className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-lg shadow-sm hover:bg-indigo-700">Broadcast Poll to Class</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">

                  {polls.length === 0 && !showPollForm && (
                    <div className="col-span-1 md:col-span-2 text-center py-20 text-slate-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-semibold text-lg">No polls created yet.</p>
                    </div>
                  )}

                  {polls.map(poll => (
                    <div key={poll.id} className={`${poll.status === 'Active' ? 'bg-white rounded-[20px] border border-slate-200 group' : 'rounded-[20px] p-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'} shadow-sm relative overflow-hidden flex flex-col justify-between`}>
                      {poll.status === 'Active' && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-pink-500"></div>}

                      <div className={`${poll.status === 'Active' ? 'p-8 flex flex-col h-[100%]' : 'bg-white rounded-[18px] p-8 h-full flex flex-col object-cover'}`}>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-5">{poll.question}</h3>
                          <div className="flex items-center space-x-3 mb-10">
                            <span className="px-4 py-1.5 rounded-full border border-indigo-200 text-indigo-500 text-[11px] font-bold tracking-wider uppercase bg-indigo-50/50">{poll.topic}</span>
                            {poll.status === 'Active' ? (
                              <span className="px-4 py-1.5 rounded-full text-emerald-600 text-[11px] font-bold tracking-wider uppercase bg-emerald-100/60">Active</span>
                            ) : (
                              <span className="px-4 py-1.5 rounded-full text-rose-500 text-[11px] font-bold tracking-wider uppercase bg-rose-100/60">Closed</span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                            <div>
                              <p className="text-4xl font-black text-indigo-500 mb-2">{poll.responses}</p>
                              <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">Responses</p>
                            </div>
                            <div>
                              <p className="text-4xl font-black text-indigo-500 mb-2">0%</p>
                              <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">Response Rate</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className={`${poll.status === 'Active' ? 'bg-amber-100/50 border-amber-400' : 'bg-emerald-100/50 border-emerald-400'} border-l-[3px] rounded-r-xl p-5 mb-8`}>
                            <p className="font-bold text-slate-900 text-sm mb-1">Drift Analysis</p>
                            <p className="text-sm text-slate-600 font-medium">{poll.drift_analysis}</p>
                          </div>

                          <div className="flex items-center space-x-3">
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm">View Results</button>
                            {poll.status === 'Active' && (
                              <button onClick={() => closePoll(poll.id)} className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2.5 px-6 rounded-lg text-sm border border-slate-200 transition-colors">Close Poll</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* ALERTS TAB */}
            {activeTab === 'alerts' && (
              <div className="space-y-4">
                {alerts.length === 0 && (
                  <div className="glass-card p-16 text-center max-w-lg mx-auto mt-20">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-2">No Active Interventions Needed</h2>
                    <p className="text-slate-500 text-sm">All students are learning normally. No significant concept drift or destructive patterns detected by LearnPulse ADWIN models.</p>
                  </div>
                )}
                {alerts.map(a => (
                  <div key={`${a.student_id}-${a.timestamp}`} className="glass-card p-6 flex items-start space-x-6 hover:shadow-lg transition-all border-l-4 border-l-rose-500">
                    <div className="flex-shrink-0 mt-1 bg-rose-100 p-3 rounded-2xl">
                      <AlertTriangle className="h-6 w-6 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-black text-slate-900">{a.student_name}</h3>
                          <RiskBadge level={a.risk_level} />
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">
                          Score: {Math.round(a.drift_score * 100)}%
                        </span>
                      </div>
                      <p className="font-bold text-slate-700 text-sm mb-2">{a.behavior_classification}</p>
                      <p className="text-sm text-slate-600 leading-relaxed bg-rose-50 rounded-xl p-4 border border-rose-100">{a.ai_insight}</p>
                    </div>
                    <div>
                      <button onClick={() => { setActiveTab('overview'); selectStudent(a.student_id); }} className="btn-premium px-5 py-2.5 bg-slate-900 text-white text-sm rounded-xl font-bold shadow-lg shadow-slate-900/20 whitespace-nowrap">
                        Review Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HEATMAP TAB */}
            {activeTab === 'heatmap' && heatmap && (
              <div className="glass-card overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <h2 className="font-black text-slate-900 flex items-center text-lg">
                    <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" /> Global Topic Difficulty Heatmap
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Darker colors indicate higher error rates (more difficult topic for the student).</p>
                </div>
                <div className="overflow-x-auto p-2 border-b border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="p-4 font-black text-slate-400 uppercase tracking-widest text-xs border-b border-slate-100/50">Student</th>
                        {heatmap.topics.map(t => (
                          <th key={t} className="p-4 font-black text-slate-400 tracking-wider text-xs border-b border-slate-100/50 min-w-[120px]">{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {heatmap.data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 border-b border-slate-50/50 flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">{row.student_name.charAt(0).toUpperCase()}</div>
                            <span>{row.student_name}</span>
                          </td>
                          {heatmap.topics.map(t => {
                            const err = row[t];
                            if (err === undefined || err === null) return <td key={t} className="p-4 border-b border-slate-50/50"><span className="text-xs text-slate-300 font-semibold px-2 py-1 bg-slate-50 rounded-md">-</span></td>;
                            const level = err > 0.6 ? 'bg-rose-500 text-white border-rose-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' :
                              err > 0.3 ? 'bg-amber-400 text-amber-950 border-amber-500' :
                                'bg-emerald-400 text-emerald-950 border-emerald-500';
                            return (
                              <td key={t} className="p-2 border-b border-slate-50/50">
                                <div className={`px-3 py-2 rounded-lg text-xs font-black text-center border transition-transform hover:scale-105 ${level}`}>
                                  {Math.round(err * 100)}%
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 flex items-center space-x-6 text-xs font-bold text-slate-500 justify-end">
                  <span>Error Rate:</span>
                  <div className="flex items-center"><div className="w-4 h-4 rounded bg-emerald-400 mr-2 shadow-sm"></div> 0-30%</div>
                  <div className="flex items-center"><div className="w-4 h-4 rounded bg-amber-400 mr-2 shadow-sm"></div> 30-60%</div>
                  <div className="flex items-center"><div className="w-4 h-4 rounded bg-rose-500 mr-2 shadow-sm"></div> 60-100%</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
