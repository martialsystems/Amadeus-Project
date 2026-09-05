@echo off
setlocal EnableExtensions DisableDelayedExpansion

cd /d "%~dp0"

rem CONDA_EXE belongs to Conda. Never replace it with the bare command conda.
set "AMADEUS_CONDA_EXE="

if defined CONDA_EXE if exist "%CONDA_EXE%" for %%I in ("%CONDA_EXE%") do if /I "%%~xI"==".exe" set "AMADEUS_CONDA_EXE=%%~fI"
if not defined AMADEUS_CONDA_EXE for /f "delims=" %%I in ('where conda.exe 2^>nul') do if not defined AMADEUS_CONDA_EXE set "AMADEUS_CONDA_EXE=%%I"

if not defined AMADEUS_CONDA_EXE if exist "%USERPROFILE%\anaconda3\Scripts\conda.exe" set "AMADEUS_CONDA_EXE=%USERPROFILE%\anaconda3\Scripts\conda.exe"
if not defined AMADEUS_CONDA_EXE if exist "%USERPROFILE%\miniconda3\Scripts\conda.exe" set "AMADEUS_CONDA_EXE=%USERPROFILE%\miniconda3\Scripts\conda.exe"
if not defined AMADEUS_CONDA_EXE if exist "%LOCALAPPDATA%\anaconda3\Scripts\conda.exe" set "AMADEUS_CONDA_EXE=%LOCALAPPDATA%\anaconda3\Scripts\conda.exe"
if not defined AMADEUS_CONDA_EXE if exist "%LOCALAPPDATA%\miniconda3\Scripts\conda.exe" set "AMADEUS_CONDA_EXE=%LOCALAPPDATA%\miniconda3\Scripts\conda.exe"
if not defined AMADEUS_CONDA_EXE if exist "C:\ProgramData\anaconda3\Scripts\conda.exe" set "AMADEUS_CONDA_EXE=C:\ProgramData\anaconda3\Scripts\conda.exe"
if not defined AMADEUS_CONDA_EXE if exist "C:\ProgramData\miniconda3\Scripts\conda.exe" set "AMADEUS_CONDA_EXE=C:\ProgramData\miniconda3\Scripts\conda.exe"

if not defined AMADEUS_CONDA_EXE (
    echo ERROR: Conda could not be found.
    echo Install Anaconda or Miniconda, then try again.
    pause
    exit /b 1
)

"%AMADEUS_CONDA_EXE%" run -n amadeus --no-capture-output python "%CD%\scripts\launcher.py"

set "EXIT_CODE=%errorlevel%"

if not "%EXIT_CODE%"=="0" (
    echo.
    echo Amadeus launcher exited with an error.
    echo Check .runtime\logs for service logs.
    pause
)

exit /b %EXIT_CODE%
