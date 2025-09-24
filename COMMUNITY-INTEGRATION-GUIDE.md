# JAL EFB Community Folder Integration Guide

## 🎯 Overview

This guide will help you set up the JAL EFB with Microsoft Flight Simulator integration using the community folder approach. This method is **much simpler and more reliable** than SimConnect.

## ✅ What You'll Get

- **Real-time MSFS detection** - EFB knows when simulator is running
- **Live aircraft state** - Ground status, parking, engines
- **GSX service control** - Request all GSX services from EFB
- **Beautiful MSFS panel** - GSX Control panel inside simulator
- **File-based sync** - No complex SimConnect setup needed

## 🚀 Quick Installation (3 Steps)

### Step 1: Install Community Addon
```bash
# Double-click this file:
install-community-addon.bat
```

### Step 2: Start Data Sync
```bash
# Double-click this file:
start-data-sync.bat
```

### Step 3: Test Integration
1. **Start Microsoft Flight Simulator**
2. **Look for "JAL EFB GSX Control" in toolbar**
3. **Open your EFB** at `http://localhost:3000`
4. **Click GSX Control button** - should show "MSFS Connected"!

## 📁 File Structure

```
JALv EFB/
├── community-addon/              # MSFS community addon
│   ├── manifest.json             # MSFS addon manifest
│   ├── html_ui/
│   │   ├── panels.json          # Panel configuration
│   │   └── Pages/JALEFB/
│   │       └── GSXControl.html  # GSX Control Panel
│   ├── efb-data-sync.js         # Data synchronization
│   └── package.json             # Dependencies
├── install-community-addon.bat   # Installation script
├── start-data-sync.bat          # Data sync starter
└── cleanup-bridge.bat           # Cleanup old files
```

## 🔧 How It Works

### Data Flow
```
MSFS Community Addon → Data Files → EFB API → EFB Web Interface
```

1. **Community Addon** - HTML panel inside MSFS
2. **Data Sync Service** - Writes aircraft/GSX data to files
3. **EFB API** - Reads data files and serves to web interface
4. **Real-time Updates** - Data syncs every 2 seconds

### Communication Method
- **No SimConnect** - Uses simple file-based communication
- **No network issues** - Files are local to your system
- **No PowerShell problems** - Just Node.js data sync
- **Works immediately** - No complex setup required

## 🎮 GSX Services

Control all GSX services from your EFB:

| Service | Description | Icon |
|---------|-------------|------|
| 🛬 **Deboarding** | Passenger deboarding | `mdi:airplane-landing` |
| 🍽️ **Catering** | Food and beverage service | `mdi:food` |
| ⛽ **Refueling** | Aircraft refueling | `mdi:gas-station` |
| 🛫 **Boarding** | Passenger boarding | `mdi:airplane-takeoff` |
| ✈️ **Departure** | Pushback and departure | `mdi:airplane` |
| 🔌 **GPU** | Ground Power Unit | `mdi:power-plug` |
| 💧 **Water** | Water service | `mdi:water` |
| 🚻 **Lavatory** | Lavatory service | `mdi:toilet` |

## 🛠️ Manual Installation

If the automatic scripts don't work, you can install manually:

### 1. Find Your MSFS Community Folder
```
C:\Users\[YourUsername]\AppData\Local\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community\
```

### 2. Copy Community Addon
```bash
# Copy this folder:
C:\Users\Bunny\Desktop\BUNNY PROJECTS\JAL Projects\JALv EFB\community-addon

# To this location:
C:\Users\[YourUsername]\AppData\Local\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community\jal-efb-gsx-control
```

### 3. Install Dependencies
```bash
cd "C:\Users\[YourUsername]\AppData\Local\Packages\Microsoft.FlightSimulator_8wekyb3d8bbwe\LocalCache\Packages\Community\jal-efb-gsx-control"
npm install
```

### 4. Start Data Sync
```bash
npm start
```

## 🔍 Testing

### Test Data Sync
```bash
# Check if data sync is running
curl http://localhost:3000/api/efb-data/health.json

# Check aircraft state
curl http://localhost:3000/api/efb-data/aircraft-state.json

# Check GSX states
curl http://localhost:3000/api/efb-data/gsx-states.json
```

### Test Service Request
```bash
curl -X POST http://localhost:3000/api/efb-data/request \
  -H "Content-Type: application/json" \
  -d '{"service": "catering", "action": "request"}'
```

## 🐛 Troubleshooting

### EFB Not Connecting to MSFS
- ✅ **Check data sync** - Run `start-data-sync.bat`
- ✅ **Verify addon** - Check community folder installation
- ✅ **Restart MSFS** - After addon installation
- ✅ **Check console** - Browser developer tools for errors

### Community Addon Not Showing
- ✅ **Run installer** - `install-community-addon.bat`
- ✅ **Check location** - Verify addon is in correct community folder
- ✅ **Restart MSFS** - After installation
- ✅ **Check manifest** - Verify `manifest.json` is valid

### GSX Services Not Working
- ✅ **Install GSX** - GSX Ground Services must be installed
- ✅ **Check ground** - Aircraft must be on ground
- ✅ **Verify MSFS** - Simulator must be running

### Data Sync Not Starting
- ✅ **Install Node.js** - Required for data sync
- ✅ **Check dependencies** - Run `npm install` in addon folder
- ✅ **Check ports** - Ensure port 3000 is available
- ✅ **Run as admin** - If permission issues

## 📝 Configuration

### Customize Data Sync Interval
Edit `community-addon/efb-data-sync.js`:
```javascript
// Change update interval (default: 2000ms)
setInterval(() => {
    // ... update code
}, 5000); // 5 seconds instead of 2
```

### Customize Panel Size
Edit `community-addon/html_ui/panels.json`:
```json
{
  "width": 1000,    // Panel width
  "height": 700,    // Panel height
  "resizable": true
}
```

## 🎯 Usage Tips

### In MSFS:
1. **Open GSX Control Panel** from toolbar
2. **Monitor real-time status** - EFB connection, ground status
3. **Watch service states** - Live GSX service availability

### In EFB:
1. **Click GSX Control button** - Opens GSX control modal
2. **View live data** - Aircraft state, service availability
3. **Request services** - Click any service to request it
4. **Monitor progress** - Watch status updates in real-time

## 🔄 Updates

To update the community addon:
1. **Stop data sync** (Ctrl+C)
2. **Replace addon folder** with new version
3. **Restart data sync** (`npm start`)
4. **Restart MSFS** to load new addon

## 🎉 Benefits

- ✅ **Simple Setup** - No complex SimConnect configuration
- ✅ **Reliable Communication** - File-based sync
- ✅ **Real-time Updates** - Live data from MSFS
- ✅ **Beautiful UI** - Professional panels in both MSFS and EFB
- ✅ **Works Immediately** - No network or PowerShell issues

## 📞 Support

If you encounter issues:
1. **Check troubleshooting** section above
2. **Verify installation** steps
3. **Check console logs** for errors
4. **Restart services** if needed

---

**Happy Flying! ✈️**

*This community folder integration provides seamless communication between your JAL EFB and MSFS without the complexity of SimConnect.*
