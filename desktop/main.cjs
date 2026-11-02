// پوستهٔ ویندوزی مشکات: همان خروجی وب را در یک پنجرهٔ بومی اجرا می‌کند
const { app, BrowserWindow, shell, protocol, net } = require('electron')
const path = require('path')
const { pathToFileURL } = require('url')

// پروتکل app:// تا صفحه بتواند فایل‌های کتاب را با fetch بخواند (file:// اجازه نمی‌دهد)
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }])
const web = path.join(__dirname, 'web')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#03100d',
    title: 'مشکات',
    icon: path.join(web, 'icons', 'icon-512.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  })
  // لینک‌های تطبیق با منبع در مرورگر پیش‌فرض باز شوند
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  win.loadURL('app://mishkat/index.html')
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const file = path.normalize(path.join(web, decodeURIComponent(new URL(req.url).pathname)))
    if (!file.startsWith(web)) return new Response('', { status: 403 })
    return net.fetch(pathToFileURL(file).toString())
  })
  createWindow()
})
app.on('window-all-closed', () => app.quit())
