const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let serverProcess = null;
const SERVER_PORT = 3000;
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const RELEASES_DIR = path.join(app.getPath('userData'), 'releases');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RELEASES_DIR)) fs.mkdirSync(RELEASES_DIR, { recursive: true });
}

function getAppVersion() {
  return app.getVersion();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: 'TikFlux',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    checkForUpdates();
  });

  mainWindow.on('close', (e) => {
    if (serverProcess) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'reload', accelerator: 'CmdOrCtrl+R' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => checkForUpdates()
        },
        {
          label: 'About TikFlux',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TikFlux',
              message: `TikFlux Desktop v${app.getVersion()}`,
              detail: 'TikTok LIVE Dashboard - Real-time streaming overlay and analytics tool.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, 'server', 'server.js');
    const appDataPath = path.join(app.getPath('userData'), 'app');
    
    // Copy resources on first run
    if (!fs.existsSync(path.join(appDataPath, 'goals.html'))) {
      copyResources(appDataPath);
    }

    serverProcess = require('child_process').fork(serverPath, [], {
      env: {
        ...process.env,
        PORT: SERVER_PORT,
        APP_DATA: appDataPath,
        USER_DATA: DATA_DIR,
        NODE_ENV: 'production'
      },
      silent: false
    });

    serverProcess.on('error', (err) => {
      console.error('Server error:', err);
    });

    serverProcess.on('exit', (code) => {
      console.log('Server exited with code:', code);
      serverProcess = null;
    });

    // Wait for server to start
    setTimeout(resolve, 2000);
  });
}

function copyResources(dest) {
  // In development, resources are next to the desktop folder
  // In production (packaged), resources are in process.resourcesPath
  const candidates = [
    path.join(__dirname, '..', 'tikoverlay.live'),
    path.join(process.resourcesPath, 'app'),
    path.join(process.resourcesPath),
  ];
  
  for (const resourcesPath of candidates) {
    if (fs.existsSync(path.join(resourcesPath, 'goals.html'))) {
      copyDirSync(resourcesPath, dest);
      console.log('Resources copied from:', resourcesPath, 'to:', dest);
      return;
    }
  }
  console.error('Could not find resources to copy');
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Auto Updater
function checkForUpdates() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = true;
  
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'http://localhost:3000/releases',
    channel: 'latest'
  });

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    console.log('Update check failed:', err.message);
  });
}

autoUpdater.on('checking-for-update', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  }
});

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'available', version: info.version });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version ${info.version} is available.`,
      detail: 'The update will be downloaded and installed automatically.',
      buttons: ['OK']
    });
  }
});

autoUpdater.on('update-not-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'not-available', version: info.version });
  }
});

autoUpdater.on('download-progress', (progress) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { 
      status: 'downloading', 
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'downloaded', version: info.version });
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  }
});

autoUpdater.on('error', (err) => {
  console.error('AutoUpdater error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status: 'error', message: err.message });
  }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => getAppVersion());

ipcMain.handle('check-updates', () => {
  return checkForUpdates();
});

ipcMain.handle('restart-and-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('get-user-data-path', () => DATA_DIR);

ipcMain.handle('save-user-data', (event, key, value) => {
  const filePath = path.join(DATA_DIR, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  return true;
});

ipcMain.handle('load-user-data', (event, key) => {
  const filePath = path.join(DATA_DIR, `${key}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return null;
});

// App lifecycle
app.whenReady().then(async () => {
  ensureDirs();
  await startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});
