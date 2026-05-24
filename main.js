const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let win;
let tray;

function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 360,
    height: 520,
    x: screenW - 400,
    y: screenH - 560,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.setIgnoreMouseEvents(false);

  // Allow click-through on transparent areas
  // win.setIgnoreMouseEvents(true, { forward: true });

  // System tray for minimize/quit
  const iconPath = path.join(__dirname, 'renderer', 'assets', 'tray-icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }
  tray = new Tray(trayIcon.isEmpty() ? nativeImage.createEmpty() : trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => win.show() },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip('Claw Desktop Pet');
  tray.setContextMenu(contextMenu);

  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

// IPC handlers
ipcMain.handle('pet-move', (_, deltaX, deltaY) => {
  const [x, y] = win.getPosition();
  win.setPosition(x + deltaX, y + deltaY);
});

ipcMain.handle('pet-get-position', () => {
  return win.getPosition();
});

ipcMain.handle('pet-set-size', (_, w, h) => {
  win.setSize(w, h);
});

ipcMain.handle('pet-minimize', () => {
  win.minimize();
});

ipcMain.handle('pet-quit', () => {
  app.isQuitting = true;
  app.quit();
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
