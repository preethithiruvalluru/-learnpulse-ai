import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export const studentService = {
  getPerformance: async () => {
    const res = await api.get('/student/performance');
    return res.data;
  },
  submitAttempt: async (attemptData) => {
    const res = await api.post('/student/submit-attempt', attemptData);
    return res.data;
  },
  getQuestions: async (topic = null, limit = 5) => {
    let url = `/student/questions?limit=${limit}`;
    if (topic) url += `&topic=${encodeURIComponent(topic)}`;
    const res = await api.get(url);
    return res.data;
  },
  getAnalytics: async () => {
    const res = await api.get('/student/analytics');
    return res.data;
  },
  getDriftHistory: async () => {
    const res = await api.get('/student/drift-history');
    return res.data;
  },
  getActivePolls: async () => {
    const res = await api.get('/student/polls');
    return res.data;
  },
  submitPollVote: async (pollId, response) => {
    const res = await api.post(`/student/polls/${pollId}/vote`, { response });
    return res.data;
  }
};

export const instructorService = {
  getStudents: async () => {
    const res = await api.get('/instructor/students');
    return res.data;
  },
  getDriftReports: async () => {
    const res = await api.get('/instructor/drift-reports');
    return res.data;
  },
  getStudentDriftReports: async (studentId) => {
    const res = await api.get(`/instructor/drift-report/${studentId}`);
    return res.data;
  },
  getAlerts: async () => {
    const res = await api.get('/instructor/alerts');
    return res.data;
  },
  getStudentDetail: async (studentId) => {
    const res = await api.get(`/instructor/student-detail/${studentId}`);
    return res.data;
  },
  getTopicHeatmap: async () => {
    const res = await api.get('/instructor/topic-heatmap');
    return res.data;
  },
  createPoll: async (pollData) => {
    const res = await api.post('/instructor/polls', pollData);
    return res.data;
  },
  getPolls: async () => {
    const res = await api.get('/instructor/polls');
    return res.data;
  },
  closePoll: async (pollId) => {
    const res = await api.put(`/instructor/polls/${pollId}/close`);
    return res.data;
  }
};

export const mlService = {
  analyzeStudent: async (studentId) => {
    const res = await api.post(`/ml/analyze-student/${studentId}`);
    return res.data;
  },
  getDriftScore: async (studentId) => {
    const res = await api.get(`/ml/drift-score/${studentId}`);
    return res.data;
  },
  getClassOverview: async () => {
    const res = await api.get('/ml/class-overview');
    return res.data;
  }
};
