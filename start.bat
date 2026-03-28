@echo off
echo ==============================================
echo Starting PaperLens AI Services
echo ==============================================

echo [1/2] Starting Backend Server...
start "PaperLens Backend" cmd /k "call myenv\Scripts\activate.bat && cd backend && uvicorn app.main:app --reload"

echo [2/2] Starting Frontend Development Server...
start "PaperLens Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting up in separate windows.
echo You can close this window now.
echo ==============================================
