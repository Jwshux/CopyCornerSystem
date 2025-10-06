@echo off
echo =======================================
echo  STARTING BACKEND (Flask)
echo =======================================
cd backend
call venv\Scripts\activate
start cmd /k "python app.py"
cd ..

echo =======================================
echo  STARTING FRONTEND (React)
echo =======================================
cd frontend
start cmd /k "npm start"

echo =======================================
echo  BOTH SERVERS STARTED!
echo  Flask:   http://127.0.0.1:5000
echo  React:   http://localhost:3000
echo =======================================
pause
