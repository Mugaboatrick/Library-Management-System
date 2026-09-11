@echo off
REM ============================================================
REM Hope Haven Library - Database Setup Helper
REM Requires mysql client in PATH (or edit MYSQL below)
REM ============================================================

set MYSQL=mysql
set DBUSER=root
set /p DBPASS=Enter MySQL root password (empty for none): 

echo.
echo [1/2] Creating schema and tables...
%MYSQL% -u %DBUSER% -p%DBPASS% < "%~dp0database\schema.sql"
if errorlevel 1 (
  echo ERROR creating schema. Check credentials.
  pause
  exit /b 1
)

echo [2/2] Loading seed data (demo users, books)...
%MYSQL% -u %DBUSER% -p%DBPASS% < "%~dp0database\seed.sql"
if errorlevel 1 (
  echo ERROR loading seed data.
  pause
  exit /b 1
)

echo.
echo Done! Now update backend\.env with your DB password.
echo Then run:  cd backend ^&^& npm install ^&^& npm start
echo            cd frontend ^&^& npm install ^&^& npm start
echo.
pause
