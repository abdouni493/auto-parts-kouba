@echo off
cd /d "C:\Users\Administrator\Desktop\autoParts"
start cmd /k "npm run start"
timeout /t 8 >nul
start http://localhost:8080/
