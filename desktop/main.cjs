// پوستهٔ ویندوزی مشکات: همان خروجی وب را در یک پنجرهٔ بومی اجرا می‌کند
const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#03100d',
    title: 'مشکات',
    icon: path.join(__dirname, 'web', 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  })
  // لینک‌های تطبیق با منبع در مرورگر پیش‌فرض باز شوند
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  win.loadFile(path.join(__dirname, 'web', 'index.html'))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())
