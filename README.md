# JAL Virtual EFB (Electronic Flight Bag)

A modern, web-based Electronic Flight Bag for JAL Virtual with integrated GSX Ground Services control and Microsoft Flight Simulator integration.

## ✈️ Features

- **Modern Web Interface** - Beautiful, responsive design
- **GSX Ground Services Integration** - Control all GSX services from your EFB
- **MSFS Community Addon** - Seamless integration with Microsoft Flight Simulator
- **Real-time Data Sync** - Live aircraft state and service monitoring
- **Multi-language Support** - English, Thai, Chinese, Japanese, Korean
- **SimBrief Integration** - Flight plan and loadsheet management
- **Weather & METAR** - Real-time weather information
- **Flight Tools** - Wind calculator, OPT, ASR, and more

## 🚀 Quick Start

### 1. Start the EFB
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Install MSFS Community Addon
```bash
# Run the installation script:
install-community-addon.bat
```

### 3. Start Data Sync
```bash
# Run the data sync service:
start-data-sync.bat
```

### 4. Test Integration
1. **Start Microsoft Flight Simulator**
2. **Look for "JAL EFB GSX Control" in the toolbar**
3. **Open your EFB and click the GSX Control button**
4. **You should see real-time connection to MSFS!**

## 🎮 GSX Ground Services

Control all GSX services directly from your EFB:

- 🛬 **Deboarding** - Passenger deboarding
- 🍽️ **Catering** - Food and beverage service
- ⛽ **Refueling** - Aircraft refueling
- 🛫 **Boarding** - Passenger boarding
- ✈️ **Departure** - Pushback and departure
- 🔌 **GPU** - Ground Power Unit
- 💧 **Water** - Water service
- 🚻 **Lavatory** - Lavatory service

## 🔧 How It Works

### Community Folder Integration
```
MSFS Community Addon → Data Files → EFB API → EFB Web Interface
```

1. **Community Addon** - HTML panel inside MSFS
2. **Data Sync Service** - Writes aircraft/GSX data to files
3. **EFB API** - Reads data files and serves to web interface
4. **Real-time Updates** - Data syncs every 2 seconds

## 📁 Project Structure

```
JALv EFB/
├── src/app/                    # Next.js app directory
│   ├── components/            # React components
│   ├── api/efb-data/          # EFB data API endpoints
│   └── dashboard/              # Main dashboard
├── community-addon/           # MSFS community addon
│   ├── html_ui/               # HTML panels for MSFS
│   ├── efb-data-sync.js       # Data synchronization
│   └── manifest.json          # MSFS addon manifest
├── install-community-addon.bat # Installation script
└── start-data-sync.bat        # Data sync starter
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Microsoft Flight Simulator 2020
- GSX Ground Services (optional)

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Install community addon
install-community-addon.bat

# Start data sync
start-data-sync.bat
```

### API Endpoints
- `GET /api/efb-data/health.json` - Connection status
- `GET /api/efb-data/aircraft-state.json` - Aircraft state
- `GET /api/efb-data/gsx-states.json` - GSX service states
- `POST /api/efb-data/request` - Request GSX service

## 🎯 Usage

### In MSFS:
1. **Open GSX Control Panel** from toolbar
2. **Monitor real-time aircraft state**
3. **See EFB connection status**

### In EFB:
1. **Click GSX Control button**
2. **View real-time service states**
3. **Click any service to request it**
4. **Watch status updates in real-time**

## 🐛 Troubleshooting

### EFB Not Connecting to MSFS
- ✅ Check if data sync is running (`start-data-sync.bat`)
- ✅ Verify community addon is installed
- ✅ Restart MSFS after addon installation
- ✅ Check browser console for errors

### GSX Services Not Working
- ✅ Install GSX Ground Services
- ✅ Ensure aircraft is on ground
- ✅ Verify MSFS is running

### Community Addon Not Showing
- ✅ Run `install-community-addon.bat`
- ✅ Check addon is in correct community folder
- ✅ Restart MSFS after installation

## 📝 Notes

- **File-based communication** is more reliable than SimConnect
- **Works immediately** without complex setup
- **Real-time updates** every 2 seconds
- **No SimConnect required** - Uses simple file sync

## 🎉 Benefits

- ✅ **Simple Integration** - No complex SimConnect setup
- ✅ **Reliable Communication** - File-based sync
- ✅ **Real-time Updates** - Live data from MSFS
- ✅ **Beautiful UI** - Modern web interface
- ✅ **Professional Features** - All EFB tools included

---

**Happy Flying! ✈️**

*Built for JAL Virtual with ❤️*
