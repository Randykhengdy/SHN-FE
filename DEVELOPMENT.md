# 🚀 Development Guide - Electron + Vite

## 📋 Prerequisites

- Node.js 18+ 
- npm atau yarn
- Git

## 🛠️ Setup Development Environment

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Commands

#### 🎯 Quick Start (Recommended)
```bash
npm run dev:full
```
Ini akan menjalankan Vite dev server + Electron secara otomatis dengan environment yang sudah dikonfigurasi.

#### 🔄 Alternative Commands
```bash
# Development dengan hot reload
npm run dev:electron:reload

# Development biasa
npm run dev:electron

# Build dan jalankan production
npm run build:electron
```

## 🎮 Development Features

### ✨ Hot Reload
- Vite akan auto-reload ketika ada perubahan di React code
- Electron akan reload ketika ada perubahan di main process

### 🛠️ DevTools
- DevTools akan terbuka otomatis di development mode
- **Ctrl+Shift+I** - Toggle DevTools
- **Ctrl+R** - Reload page
- **Ctrl+Shift+R** - Hard reload (ignore cache)

### 📱 Environment Detection
- Development mode: `NODE_ENV=development`
- Production mode: `NODE_ENV=production`
- Auto-detect Vite dev server

## 🏗️ Project Structure

```
shn-react-main/
├── electron/           # Electron main process
│   ├── main.cjs       # Main window
│   └── preload.js     # Preload scripts
├── src/               # React source code
├── scripts/           # Development scripts
├── vite.config.js     # Vite configuration
└── package.json       # Dependencies & scripts
```

## 🔧 Troubleshooting

### Port 5173 sudah digunakan
```bash
# Kill process yang menggunakan port 5173
npx kill-port 5173

# Atau restart terminal
```

### Electron tidak bisa connect ke Vite
1. Pastikan Vite server sudah running di port 5173
2. Check console untuk error messages
3. Restart development server

### DevTools tidak terbuka
- Pastikan `ELECTRON_IS_DEV=true`
- Check browser console untuk error
- Restart Electron app

## 📚 Useful Commands

```bash
# Linting
npm run lint

# Build production
npm run build

# Preview production build
npm run preview

# Run Electron standalone
npm run electron
```

## 🎯 Development Workflow

1. **Start Development**: `npm run dev:full`
2. **Edit Code**: React components di `src/`
3. **Hot Reload**: Otomatis via Vite
4. **Test**: Electron app akan update otomatis
5. **Debug**: Gunakan DevTools yang sudah terbuka
6. **Build**: `npm run build` untuk production

## 🚨 Important Notes

- **Jangan commit** file `.env.development` ke git
- **Selalu gunakan** `npm run dev:full` untuk development
- **Check console** untuk error messages
- **Restart** development server jika ada masalah

---

Happy Coding! 🎉
