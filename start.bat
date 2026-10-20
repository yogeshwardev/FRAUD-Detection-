@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ==================================================
echo   TrustLens - Consumer Trust ^& Product Risk
echo   Probabilistic Machine Learning Platform
echo ==================================================
echo.

REM ---------------------------- Backend ----------------------------
cd backend
if not exist ".venv\Scripts\python.exe" (
  echo [setup] Creating Python virtual environment...
  python -m venv .venv
)
set PY=.venv\Scripts\python.exe
echo [setup] Installing backend dependencies...
"%PY%" -m pip install --upgrade pip >nul
"%PY%" -m pip install -r requirements.txt
echo [setup] Generating data and training models (first run only)...
"%PY%" -m app.bootstrap
echo [run] Starting API on http://127.0.0.1:8000 ...
start "TrustLens API" cmd /k "%PY% -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
cd ..

REM ---------------------------- Frontend ---------------------------
cd frontend
if not exist "node_modules" (
  echo [setup] Installing frontend dependencies...
  call npm install
)
echo [run] Starting web app on http://localhost:5173 ...
start "TrustLens Web" cmd /k "npm run dev"
cd ..

echo.
echo  ------------------------------------------------
echo   API docs : http://127.0.0.1:8000/docs
echo   Web app  : http://localhost:5173
echo  ------------------------------------------------
echo   Two windows opened (API + Web). Close them to stop.
echo.
pause
