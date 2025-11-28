@echo off
echo.
echo ========================================
echo   AI Learning System - Starting...
echo ========================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [ERROR] .env.local file not found!
    echo.
    echo Please create .env.local with your Firebase config.
    echo See .env.local.example for template.
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking .env.local... OK
echo.

REM Clear cache if it exists
if exist .next (
    echo [2/3] Clearing Next.js cache...
    rmdir /s /q .next
    echo       Cache cleared!
) else (
    echo [2/3] No cache to clear
)
echo.

echo [3/3] Starting development server...
echo.
echo ========================================
echo   Server will start at:
echo   http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
