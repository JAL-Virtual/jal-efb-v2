@echo off
echo JAL EFB Community Folder Installation
echo ====================================
echo.

set "COMMUNITY_PATH=%LOCALAPPDATA%\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community"
set "ADDON_NAME=jal-efb-gsx-control"
set "SOURCE_PATH=%~dp0community-addon"

echo Checking MSFS Community folder...
if not exist "%COMMUNITY_PATH%" (
    echo ERROR: MSFS Community folder not found!
    echo Expected location: %COMMUNITY_PATH%
    echo Please make sure Microsoft Flight Simulator is installed.
    pause
    exit /b 1
)

echo ✓ MSFS Community folder found: %COMMUNITY_PATH%
echo.

echo Installing JAL EFB GSX Control addon...
set "TARGET_PATH=%COMMUNITY_PATH%\%ADDON_NAME%"

if exist "%TARGET_PATH%" (
    echo Removing existing installation...
    rmdir /s /q "%TARGET_PATH%"
)

echo Copying addon files...
xcopy "%SOURCE_PATH%" "%TARGET_PATH%" /E /I /Y

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to copy addon files!
    pause
    exit /b 1
)

echo ✓ Addon installed successfully!
echo.

echo Installing dependencies...
cd /d "%TARGET_PATH%"
if exist "package.json" (
    echo Running npm install...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo WARNING: npm install failed. You may need to install Node.js.
        echo Please run 'npm install' manually in the addon directory.
    ) else (
        echo ✓ Dependencies installed successfully!
    )
) else (
    echo WARNING: package.json not found. Skipping dependency installation.
)

echo.
echo Installation Complete!
echo ======================
echo.
echo Next steps:
echo 1. Start Microsoft Flight Simulator
echo 2. Look for "JAL EFB GSX Control" in the toolbar
echo 3. Start the data sync service:
echo    cd "%TARGET_PATH%"
echo    npm start
echo 4. Open your EFB and test the GSX Control button
echo.
echo Addon location: %TARGET_PATH%
echo.

pause
