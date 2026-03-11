# Deployment Guide: LearnPulse AI 🚀

Your project is now 100% ready for deployment on GitHub. To get it running on a live URL, follow these standardized steps:

## Prerequisites
- A **GitHub** account (already done).
- A **Render** account (for Backend) - [render.com](https://render.com).
- A **Vercel** account (for Frontend) - [vercel.com](https://vercel.com).

---

## 1. Deploy the Backend (Render)
1. **New +**: Select **Web Service**.
2. **Connect**: Link your `-learnpulse-ai` GitHub repository.
3. **Configuration**:
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   - Click "Advanced" and add:
     - `DATABASE_URL`: (If you have a MySQL/PostgreSQL URL, paste it here. If not, it will default to a local SQLite file, but data will reset on every redeploy).
5. **Wait**: Render will build and deploy. Once finished, copy your **Backend URL** (e.g., `https://learnpulse-backend.onrender.com`).

---

## 2. Deploy the Frontend (Vercel)
1. **New Project**: Click "Add New" $\to$ "Project".
2. **Connect**: Link the same GitHub repository.
3. **Configuration**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite` (Vercel detects this automatically).
4. **Environment Variables**:
   - Add a new variable:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://your-backend-url.onrender.com` (Paste the URL from Step 1).
5. **Deploy**: Click "Deploy". Vercel will build your site and give you a live production link!

---

## Final Verification
1. Access your Vercel URL.
2. Try logging in or creating a student account.
3. Check the "Doubt Session" tab.
4. If everything loads, your full-stack AI system is live for the world to see! 🌍
