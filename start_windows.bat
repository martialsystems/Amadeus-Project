@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "CONDA_EXE="

where conda >nul 2>nul
if %errorlevel%==0 set "CONDA_EXE=conda"

if not defined CONDA_EXE if exist "%USERPROFILE%\anaconda3\Scripts\conda.exe" set "CONDA_EXE=%USERPROFILE%\anaconda3\Scripts\conda.exe"
if not defined CONDA_EXE if exist "%USERPROFILE%\miniconda3\Scripts\conda.exe" set "CONDA_EXE=%USERPROFILE%\miniconda3\Scripts\conda.exe"
if not defined CONDA_EXE if exist "C:\ProgramData\anaconda3\Scripts\conda.exe" set "CONDA_EXE=C:\ProgramData\anaconda3\Scripts\conda.exe"

if not defined CONDA_EXE (
    echo ERROR: Conda could not be found.
    echo Install Anaconda or Miniconda, then try again.
    pause
    exit /b 1
)

"%CONDA_EXE%" run -n amadeus --no-capture-output python "%CD%\scripts\launcher.py"

set "EXIT_CODE=%errorlevel%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo Amadeus launcher exited with an error.
    echo Check .runtime\logs for service logs.
    pause
)

exit /b %EXIT_CODE%
