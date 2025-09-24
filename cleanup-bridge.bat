@echo off
echo Cleaning up old SimConnect bridge files...
echo ==========================================
echo.

set "BRIDGE_PATH=%~dp0simconnect-bridge"

if exist "%BRIDGE_PATH%" (
    echo Removing old bridge directory...
    rmdir /s /q "%BRIDGE_PATH%"
    echo ✓ Old bridge files removed
) else (
    echo No old bridge files found
)

echo.
echo Cleanup complete!
echo.
echo The project now uses the community folder approach:
echo - community-addon/     - MSFS community addon
echo - install-community-addon.bat - Installation script
echo - start-data-sync.bat  - Data sync starter
echo.

pause
