# MEDiscan - Setup and Deployment Guide

Complete guide for setting up MEDiscan locally and deploying to Render.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Variables](#environment-variables)
4. [Running the Application](#running-the-application)
5. [Deployment to Render](#deployment-to-render)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (v8.x or higher) - Comes with Node.js
- **Python** (v3.10 or higher) - [Download](https://www.python.org/downloads/)
- **pip** (Python package manager) - Comes with Python
- **Git** - [Download](https://git-scm.com/)
- **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

### Check Installed Versions

```bash
node -v    # Should show v18.x or higher
npm -v     # Should show v8.x or higher
python --version  # Should show 3.10 or higher
pip --version     # Should be installed
git --version     # Should be installed
```

### Required Accounts

1. **Firebase Account** - [Sign up](https://firebase.google.com/)
   - Create a new Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Generate service account JSON
   
2. **OpenAI Account** - [Sign up](https://platform.openai.com/)
   - Get API key from dashboard

3. **Render Account** (for deployment) - [Sign up](https://render.com/)
   - Connect your GitHub account

---

## 💻 Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repo-url>
cd mediscan

# Or if you already have the code
cd path/to/mediscan
```

### Step 2: Install Node.js Dependencies

```bash
# Install all npm packages
npm install

# This will install all dependencies from package.json including:
# - React, Express, TypeScript
# - Firebase SDK, OpenAI SDK
# - UI components (Radix UI, Tailwind CSS)
# - And all other required packages
```

### Step 3: Install Python Dependencies

```bash
# Navigate to ML model directory
cd ml_model

# Install Python packages
pip install -r requirements.txt

# This will install:
# - scikit-learn (for ML models)
# - xgboost (gradient boosting)
# - flask (Python API server)
# - flask-cors (CORS support)
# - pandas, numpy (data processing)
# - joblib (model serialization)

# Go back to root directory
cd ..
```

**Note for Windows users:**
```bash
# If you encounter issues, use:
python -m pip install -r ml_model/requirements.txt
```

### Step 4: VS Code Setup (Recommended)

Install these VS Code extensions for better development experience:

1. **ESLint** - JavaScript/TypeScript linting
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind class autocomplete
4. **Python** - Python language support
5. **GitLens** - Enhanced Git integration

```bash
# Open project in VS Code
code .
```

---

## 🔐 Environment Variables

### Step 1: Create Environment File

Create a `.env` file in the root directory (same level as `package.json`):

```bash
# Create .env file
touch .env
```

### Step 2: Add Required Variables

Add the following to your `.env` file:

```bash
# Firebase Configuration (Frontend - must start with VITE_)
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_API_KEY=your-firebase-api-key

# Firebase Admin SDK (Backend)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# OpenAI API
OPENAI_API_KEY=sk-proj-...your-openai-api-key

# Session Secret (Generate a random string)
SESSION_SECRET=your-random-secret-string-here
```

### Step 3: Get Firebase Credentials

#### Firebase Web Config (Frontend):
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (⚙️ icon)
4. Scroll to "Your apps" section
5. Click on your web app or create one
6. Copy the config values:
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
   - `apiKey` → `VITE_FIREBASE_API_KEY`

#### Firebase Admin SDK (Backend):
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Copy the **entire JSON content** (minified) to `FIREBASE_SERVICE_ACCOUNT_JSON`

**Example format:**
```bash
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"medchain-xxxxx","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
```

### Step 4: Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. Add to `.env` as `OPENAI_API_KEY`

### Step 5: Generate Session Secret

```bash
# Generate a random string (use any of these methods)

# Method 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Method 2: Using OpenSSL
openssl rand -hex 32

# Method 3: Use any random string generator
```

---

## 🚀 Running the Application

### Start the Development Server

```bash
# From the root directory, run:
npm run dev
```

This command will:
1. ✅ Start the Express backend server (port 5000)
2. ✅ Start the Vite frontend dev server
3. ✅ Launch the Python Flask ML API (port 5001)
4. ✅ Open the application in your browser

### Access the Application

- **Frontend:** `http://localhost:5000`
- **Backend API:** `http://localhost:5000/api/*`
- **Python ML API:** `http://localhost:5001`

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm start

# Type checking
npm run check
```

---

## 🌐 Deployment to Render

### Overview

MEDiscan requires deploying **two separate services** on Render:

1. **Main Web Service** (Node.js + React)
2. **Background Worker** (Python ML API)

### Prerequisites

1. Push your code to GitHub
2. Sign up for [Render](https://render.com/)
3. Connect your GitHub account to Render

---

### Part 1: Deploy Main Web Service (Node.js)

#### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Click **"Connect"** on your repo

#### Step 2: Configure Service

**Basic Settings:**
- **Name:** `mediscan` (or your preferred name)
- **Region:** Choose closest to your users (e.g., Oregon, Frankfurt)
- **Branch:** `main` (or your default branch)
- **Root Directory:** Leave blank (use root)
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:** 
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```

**Instance Type:**
- **Free** (for testing) or **Starter** ($7/month recommended for production)

#### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add each of these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Production mode |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | `your-app-id` | From Firebase Console |
| `VITE_FIREBASE_API_KEY` | `your-api-key` | From Firebase Console |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `{"type":"service_account"...}` | Full JSON from Firebase |
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `SESSION_SECRET` | `your-random-string` | Generated secret |
| `PYTHON_ML_API_URL` | `https://your-ml-worker.onrender.com` | Add after creating worker |

**Important Notes:**
- For `FIREBASE_SERVICE_ACCOUNT_JSON`, paste the **entire minified JSON** (no line breaks)
- The `PYTHON_ML_API_URL` will be added after you deploy the Python service (Step 2)

#### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for the build to complete (5-10 minutes)
3. Your app will be live at `https://mediscan.onrender.com`

---

### Part 2: Deploy Python ML API (Background Worker)

#### Step 1: Create Background Worker

1. Go to Render Dashboard
2. Click **"New +"** → **"Background Worker"**
3. Connect the **same GitHub repository**

#### Step 2: Configure Worker

**Basic Settings:**
- **Name:** `mediscan-ml-api`
- **Region:** **Same as your web service** (important!)
- **Branch:** `main`
- **Root Directory:** `ml_model`

**Build & Deploy:**
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  python predict_api.py
  ```

**Runtime:**
- **Python 3** (select from dropdown)

**Instance Type:**
- **Free** or **Starter**

#### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.10` |
| `PORT` | `5001` |

#### Step 4: Deploy

1. Click **"Create Background Worker"**
2. Wait for deployment to complete
3. Copy the service URL (e.g., `https://mediscan-ml-api.onrender.com`)

#### Step 5: Update Main Web Service

1. Go back to your main web service settings
2. Add/Update environment variable:
   - **Key:** `PYTHON_ML_API_URL`
   - **Value:** `https://mediscan-ml-api.onrender.com`
3. Click **"Save Changes"** (this will trigger a redeploy)

---

### Part 3: Update Backend Code for Production

Update `server/routes.ts` to use the environment variable for ML API:

```typescript
// In server/routes.ts, find the ML API URL and update to:
const ML_API_URL = process.env.PYTHON_ML_API_URL || 'http://localhost:5001';
```

Commit and push this change to trigger auto-deployment.

---

### Post-Deployment Checklist

✅ **Main Web Service:**
- [ ] Service is deployed and healthy
- [ ] Can access homepage
- [ ] Firebase Authentication works
- [ ] Environment variables are set

✅ **ML API Worker:**
- [ ] Worker is running
- [ ] Health check endpoint responds
- [ ] Models are loaded successfully

✅ **Integration:**
- [ ] Main service can communicate with ML API
- [ ] Lab upload and analysis works
- [ ] AI chat responds correctly

✅ **Testing:**
- [ ] Sign up new account
- [ ] Upload lab result
- [ ] View analysis results
- [ ] Chat with AI assistant
- [ ] Check emergency hospital search

---

## 🔧 Troubleshooting

### Common Issues

#### Node.js Build Fails

**Problem:** Build command fails with dependency errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Python Dependencies Fail

**Problem:** Python packages won't install

**Solution:**
```bash
# Upgrade pip
pip install --upgrade pip

# Install with verbose output
pip install -r ml_model/requirements.txt --verbose
```

#### Firebase Connection Error

**Problem:** "Firebase metadata error" or "Invalid project_id"

**Solution:**
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is valid JSON
- Check that `project_id` matches your Firebase project
- Ensure no line breaks in the JSON string (minify it)

#### OpenAI API Errors

**Problem:** "Invalid API key" or rate limit errors

**Solution:**
- Verify API key starts with `sk-proj-`
- Check API key is active in OpenAI dashboard
- Ensure you have credits available

#### Port Already in Use

**Problem:** "Port 5000 already in use"

**Solution:**
```bash
# Find and kill process on port 5000 (Mac/Linux)
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

#### Render Deployment Fails

**Problem:** Build or start command fails on Render

**Solution:**
- Check the **Logs** tab in Render dashboard
- Verify all environment variables are set correctly
- Ensure `package.json` scripts are correct
- Check Node.js version compatibility

#### ML API Not Responding

**Problem:** Lab analysis fails or times out

**Solution:**
- Check ML worker is running in Render dashboard
- Verify `PYTHON_ML_API_URL` is correct in main service
- Check ML worker logs for errors
- Ensure both services are in the same region

---

## 📚 Additional Resources

### Documentation

- **Firebase:** https://firebase.google.com/docs
- **OpenAI API:** https://platform.openai.com/docs
- **Render:** https://render.com/docs
- **Express.js:** https://expressjs.com/
- **React:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/

### Support

- **GitHub Issues:** Report bugs in your repository
- **Render Community:** https://community.render.com/
- **Stack Overflow:** Tag your questions appropriately

---

## 🎉 Success!

You should now have:

✅ MEDiscan running locally on your machine
✅ Deployed to Render with both Node.js and Python services
✅ Firebase authentication working
✅ OpenAI-powered analysis functioning
✅ ML models making predictions

**Your app is live at:** `https://your-service-name.onrender.com`

---

## 📝 Notes

### Free Tier Limitations (Render)

- Services sleep after 15 minutes of inactivity
- 750 hours/month free usage per service
- Cold starts take 30-60 seconds
- Consider upgrading to Starter plan ($7/month) for:
  - Always-on service
  - No cold starts
  - Better performance

### Production Recommendations

1. **Enable Auto-Deploy** in Render for automatic deployments on git push
2. **Add Custom Domain** in Render dashboard
3. **Enable HTTPS** (automatic with Render)
4. **Set up monitoring** with Render's built-in logging
5. **Configure Firebase Security Rules** for production
6. **Add rate limiting** to API endpoints
7. **Enable database backups** in Firebase Console

---

**Happy Deploying! 🚀**
