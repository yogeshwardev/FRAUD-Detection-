#!/usr/bin/env bash
# One-command launcher for the TrustLens platform (macOS / Linux / Git-Bash).
set -e
cd "$(dirname "$0")"

echo "=================================================="
echo "  TrustLens - Consumer Trust & Product Risk"
echo "  Probabilistic Machine Learning Platform"
echo "=================================================="

# ---------------------------- Backend ----------------------------
cd backend
if [ ! -d .venv ]; then
  echo "[setup] Creating Python virtual environment..."
  python -m venv .venv 2>/dev/null || python3 -m venv .venv
fi
# locate the venv python (Windows vs POSIX layout)
PY=".venv/bin/python"
[ -f "$PY" ] || PY=".venv/Scripts/python.exe"

echo "[setup] Installing backend dependencies..."
"$PY" -m pip install --upgrade pip >/dev/null
"$PY" -m pip install -r requirements.txt

echo "[setup] Generating data and training models (first run only)..."
"$PY" -m app.bootstrap

echo "[run] Starting API on http://127.0.0.1:8000 ..."
"$PY" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# ---------------------------- Frontend ---------------------------
cd frontend
if [ ! -d node_modules ]; then
  echo "[setup] Installing frontend dependencies..."
  npm install
fi
echo "[run] Starting web app on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  API docs : http://127.0.0.1:8000/docs"
echo "  Web app  : http://localhost:5173"
echo "  Press Ctrl+C to stop both servers."
echo ""

trap "echo; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
