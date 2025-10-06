@echo off
echo =======================================
echo  STARTING BACKEND (Flask)
echo =======================================
cd backend
call venv\Scripts\activate.bat
start cmd /k "py app.py"

echo =======================================
echo  STARTING FRONTEND (React)
echo =======================================
cd ..\frontend
start cmd /k "npm start"

echo =======================================
echo  BOTH SERVERS STARTED!
echo  Flask:   http://127.0.0.1:5000
echo  React:   http://localhost:3000
echo =======================================
pause
