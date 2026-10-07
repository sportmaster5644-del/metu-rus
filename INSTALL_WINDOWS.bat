@echo off
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (set "PYTHON=python") else (set "PYTHON=py -3")
%PYTHON% --version
if errorlevel 1 goto no_python
%PYTHON% -m venv .venv
if errorlevel 1 goto failed
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 goto failed
if not exist backend\.env copy backend\.env.example backend\.env >nul
echo Installed. Open START_WINDOWS.bat to run the website.
pause
exit /b 0
:no_python
echo Install Python 3.10 or newer from python.org, then try again.
pause
exit /b 1
:failed
echo Installation failed. Check your connection and the error above.
pause
exit /b 1
