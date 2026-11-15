@echo off
echo ============================================================
echo  MANASARA — Deploy fixed functions + run tests
echo ============================================================

echo.
echo [1/3] Deploying fixed track-order function...
cd /d E:\MANASARA
supabase functions deploy track-order --no-verify-jwt --yes
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Deploy failed. Check supabase login.
  pause
  exit /b 1
)

echo.
echo [2/3] Running edge function tests...
node scripts\test-edge-functions.js

echo.
echo [3/3] Starting dev server (Ctrl+C to stop)...
npm run dev
