import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Activity } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authService.login(username, password);
            if (data.user.role === 'student') {
                navigate('/student');
            } else if (data.user.role === 'instructor') {
                navigate('/instructor');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 animate-gradient font-sans">
            <div className="max-w-md w-full glassmorphism rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-10 rounded-full blur-2xl -translate-y-8 translate-x-8 animate-pulse-ring pointer-events-none"></div>
                
                <div className="text-center mb-8 relative z-10">
                    <div className="flex justify-center items-center mb-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl shadow-sm">
                            <Activity className="text-indigo-600 h-8 w-8 animate-float" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                    <p className="text-slate-500 mt-2 font-medium">Sign in to LearnPulse AI</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3.5 rounded-xl mb-6 text-sm text-center font-bold border border-red-100 shadow-sm animate-fade-in-up relative z-10">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
                        <input 
                            type="text" 
                            required
                            className="form-input w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-semibold shadow-sm bg-white hover:border-slate-300"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            required
                            className="form-input w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-semibold shadow-sm bg-white hover:border-slate-300"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-premium w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl shadow-[0_8px_20px_-6px_rgba(79,70,229,0.4)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-600 font-medium relative z-10">
                    Don't have an account? <Link to="/register" className="text-indigo-600 font-black hover:text-indigo-500 transition-colors ml-1">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
