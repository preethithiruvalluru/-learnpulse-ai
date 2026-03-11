import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentService, mlService, authService } from '../services/api';
import { Brain, Clock, Activity, CheckCircle, ArrowRight, XCircle } from 'lucide-react';

const TestInterface = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topicParam = searchParams.get('topic');

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [topicName, setTopicName] = useState(topicParam || 'Mixed');
  const timerRef = useRef(null);

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (!u || u.role !== 'student') { navigate('/login'); return; }
    if (!topicParam) { navigate('/student'); return; }
    loadQuestions();
  }, [navigate, topicParam]);

  useEffect(() => {
    if (startTime && !testComplete) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, testComplete]);

  const loadQuestions = async () => {
    try {
      const data = await studentService.getQuestions(topicParam, 8);
      if (!data || data.length === 0) {
        alert(`No questions found for topic "${topicParam}". Returning to dashboard.`);
        navigate('/student');
        return;
      }
      setQuestions(data);
      setTopicName(topicParam);
      setStartTime(Date.now());
      setLoading(false);
    } catch (err) {
      console.error('Failed to load questions:', err);
      navigate('/student');
    }
  };

  const handleSelectOption = (index) => {
    if (submitting) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || submitting) return;
    setSubmitting(true);
    const timeTaken = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correct_option_index;

    try {
      await studentService.submitAttempt({
        question_id: currentQ.id,
        topic: currentQ.topic,
        correct: isCorrect,
        time_taken: timeTaken,
        retry_count: retryCount,
      });

      const updatedAnswers = [...answers, {
        topic: currentQ.topic,
        question: currentQ.content,
        correct: isCorrect,
        selectedOption,
        correctOption: currentQ.correct_option_index,
        options: currentQ.options,
        time: Math.round(timeTaken),
        retries: retryCount,
      }];
      setAnswers(updatedAnswers);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setStartTime(Date.now());
        setSelectedOption(null);
        setRetryCount(0);
        setElapsed(0);
      } else {
        // All questions answered — run ML analysis then navigate to analytics
        clearInterval(timerRef.current);
        setTestComplete(true);
        await runAnalysisAndRedirect(updatedAnswers);
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setRetryCount(prev => prev + 1);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const runAnalysisAndRedirect = async (finalAnswers) => {
    setAnalyzing(true);
    const user = authService.getCurrentUser();
    let report = null;
    try {
      report = await mlService.analyzeStudent(user.id);
    } catch (err) {
      // Not enough history yet — still navigate with test summary
      console.warn('ML analysis not ready yet:', err.response?.data?.detail);
    }

    // Pass test results + ML report to analytics page via navigation state
    navigate('/student/analytics', {
      state: {
        answers: finalAnswers,
        topic: topicName,
        mlReport: report,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Activity className="mx-auto h-10 w-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-600 font-medium">Loading <span className="font-bold text-indigo-600">{topicParam}</span> questions…</p>
        </div>
      </div>
    );
  }

  if (analyzing || testComplete) {
    const correctCount = answers.filter(a => a.correct).length;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="glass-card text-center max-w-sm mx-auto px-8 py-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Brain className="h-10 w-10 text-indigo-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            {correctCount}/{answers.length} Correct
          </h2>
          <p className="text-slate-600 mb-2 font-bold">Analyzing your behavior patterns…</p>
          <p className="text-sm text-slate-400 font-medium">Running ADWIN + Isolation Forest + Random Forest</p>
          <div className="mt-6 flex space-x-2 justify-center">
            {['ADWIN', 'RF Classifier', 'Anomaly'].map((m, i) => (
              <span key={m} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-black border border-indigo-100 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;
  const timeColor = elapsed > 60 ? 'text-red-500' : elapsed > 30 ? 'text-amber-500' : 'text-slate-500';

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Top header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">{topicName}</span>
              <span className="text-slate-400 text-xs">Diagnostic Test</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center">
              <Brain className="w-3 h-3 mr-1 text-indigo-400" />
              AI is tracking your solving patterns
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {retryCount > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                {retryCount} retr{retryCount === 1 ? 'y' : 'ies'}
              </span>
            )}
            <div className={`flex items-center space-x-1.5 font-mono text-sm font-bold ${timeColor}`}>
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(elapsed / 60).toString().padStart(2, '0')}:{(elapsed % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-slate-500 text-sm font-bold">{currentIndex + 1}<span className="font-normal text-slate-400">/{questions.length}</span></span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full mb-7 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="glass-card p-8 mb-5 animate-slide-in-right">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-4">Question {currentIndex + 1}</p>
          <h2 className="text-lg text-slate-800 font-semibold leading-relaxed mb-8">
            {currentQ.content}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(i)}
                className={`w-full p-4 rounded-2xl text-left transition-all font-medium text-slate-700 border-2 ${
                  selectedOption === i
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm shadow-indigo-100'
                    : 'border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black mr-3 flex-shrink-0 ${
                  selectedOption === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleRetry}
            className="flex-shrink-0 px-6 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 text-sm font-bold transition-all"
          >
            Clear & Retry
          </button>
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null || submitting}
            className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center btn-premium ${
              selectedOption !== null
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-100'
            }`}
          >
            {submitting
              ? 'Saving…'
              : currentIndex === questions.length - 1
                ? 'Submit & Analyze'
                : 'Next Question'}
            {!submitting && selectedOption !== null && <ArrowRight className="ml-2 h-4 w-4" />}
          </button>
        </div>

        {/* Question count mini-dots */}
        <div className="flex justify-center space-x-1.5 mt-5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i < currentIndex ? 'w-2 h-2 bg-indigo-400' :
                i === currentIndex ? 'w-4 h-2 bg-indigo-600' :
                'w-2 h-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default TestInterface;
