@echo off
echo Starting JAL EFB Data Sync Service
echo ==================================
echo.

set "ADDON_PATH=%LOCALAPPDATA%\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community\jal-efb-gsx-control"

echo Checking addon installation...
if not exist "%ADDON_PATH%" (
    echo ERROR: JAL EFB GSX Control addon not found!
    echo Please run install-community-addon.bat first.
    pause
    exit /b 1
)

echo ✓ Addon found: %ADDON_PATH%
echo.

echo Starting data sync service...
cd /d "%ADDON_PATH%"

if exist "efb-data-sync.js" (
    echo Running data sync...
    node efb-data-sync.js
) else (
    echo ERROR: efb-data-sync.js not found!
    echo Please check the addon installation.
    pause
    exit /b 1
)

pause
