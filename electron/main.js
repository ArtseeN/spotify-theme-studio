import { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage, protocol, net, Notification } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as spice from './spicetify.js'
import { buildTheme } from './themeBuilder.js'
import { defaultConfig, sanitizeConfig, mediaFiles } from '../shared/theme.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEV = process.argv.includes('--dev')
const START_HIDDEN = process.argv.includes('--hidden')

// Ayar klasörü uygulamanın adından bağımsız sabit; ad değişince kayıtlı ayarlar ve temalar kaybolmasın
app.setPath('userData', path.join(app.getPath('appData'), 'Spotify Studio'))
const DATA_DIR = app.getPath('userData')
const MEDIA_DIR = path.join(DATA_DIR, 'media')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')
const LIBRARY_FILE = path.join(DATA_DIR, 'themes.json')
const ICON = path.join(__dirname, '..', 'build', 'icon.png')

const DEFAULT_SETTINGS = {
  lang: 'tr',
  autoReapply: true,
  runInBackground: true,
  openAtLogin: false,
  // Performans
  hardwareAcceleration: true,
  freeMemoryInTray: false,
  reduceMotion: false,
  lastApply: null,
}

// Donanım hızlandırma yalnızca uygulama hazır olmadan kapatılabilir; değişiklik yeniden başlatınca geçerli olur
if (readJson(SETTINGS_FILE, {}).hardwareAcceleration === false) app.disableHardwareAcceleration()

let win = null
let tray = null
let busy = false
let quitting = false

// ---------- Kalıcı veriler ----------

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}
function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

const loadConfig = () => sanitizeConfig(readJson(CONFIG_FILE, defaultConfig()))
const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...readJson(SETTINGS_FILE, {}) })
function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch }
  writeJson(SETTINGS_FILE, next)
  app.setLoginItemSettings({ openAtLogin: next.openAtLogin, args: ['--hidden'] })
  return next
}

// ---------- Arayüze bildirim ----------

const send = (channel, payload) => win && !win.isDestroyed() && win.webContents.send(channel, payload)
const log = (line) => send('log', { line, at: Date.now() })

async function pushStatus() {
  const status = await spice.getStatus()
  send('status', { ...status, lastApply: loadSettings().lastApply, busy })
  return status
}

// Aynı anda yalnızca bir Spicetify işlemi çalışsın
async function exclusive(task) {
  if (busy) throw new Error('Başka bir işlem sürüyor, lütfen bekle.')
  busy = true
  await pushStatus()
  try {
    return await task()
  } finally {
    busy = false
    await pushStatus()
  }
}

// ---------- Tema uygulama ----------

async function applyTheme(config, { reason } = {}) {
  const cfg = sanitizeConfig(config)
  writeJson(CONFIG_FILE, cfg)
  if (!fs.existsSync(spice.SPICETIFY_EXE)) {
    log('Spicetify kurulu değil, önce kuruluyor…')
    await spice.install(log)
  }
  const version = await spice.getSpotifyVersion()
  const last = loadSettings().lastApply
  const fresh = !spice.isApplied() || !last || last.spotifyVersion !== version

  if (reason) log(reason)
  log('Tema dosyaları hazırlanıyor…')
  buildTheme(cfg, spice.THEMES_DIR, MEDIA_DIR)
  await spice.configureTheme(log)
  // Spotify zaten modlanmışsa yalnızca tema dosyalarını yenilemek yeterli; tam uygulamadan çok daha hızlı
  const r = fresh ? await spice.apply({ fresh }, log) : await spice.quickApply(log)
  if (!r.ok) throw new Error('Spicetify temayı uygulayamadı. Ayrıntılar kayıtlarda.')
  saveSettings({ lastApply: { spotifyVersion: version, at: Date.now(), config: cfg } })
  log('Tema uygulandı. Spotify yeniden başlatıldı.')
  return true
}

// Spotify güncellendiğinde modlar silinir; tekrar uygulamak gerekir
let lastAutoAttempt = ''
async function watchForUpdates() {
  const s = loadSettings()
  if (!s.autoReapply || !s.lastApply || busy || !fs.existsSync(spice.SPICETIFY_EXE)) return
  const version = await spice.getSpotifyVersion()
  if (!version) return
  const needs = version !== s.lastApply.spotifyVersion || !spice.isApplied()
  if (!needs || lastAutoAttempt === version) return
  lastAutoAttempt = version
  try {
    await exclusive(() => applyTheme(loadConfig(), { reason: `Spotify güncellemesi algılandı (${version}), tema yeniden uygulanıyor…` }))
    if (Notification.isSupported()) {
      new Notification({ title: 'Spotify Theme Studio', body: 'Spotify güncellendi, temanız yeniden uygulandı.', icon: ICON }).show()
    }
  } catch (e) {
    log('Otomatik uygulama başarısız: ' + e.message)
  }
}

// ---------- Paylaşım kodu ----------

const SHARE_PREFIX = 'SPS1.'

function exportCode(config) {
  const cfg = sanitizeConfig(config)
  // Yerel dosyalar koda sığmaz; yalnızca internet adresi olan arka planlar paylaşılır
  stripLocalMedia(cfg)
  const packed = zlib.deflateRawSync(Buffer.from(JSON.stringify(cfg)), { level: 9 })
  return SHARE_PREFIX + packed.toString('base64url')
}

function importCode(code) {
  const raw = String(code || '').trim()
  if (!raw.startsWith(SHARE_PREFIX)) throw new Error('Bu bir Spotify Theme Studio kodu değil.')
  let json
  try {
    json = JSON.parse(zlib.inflateRawSync(Buffer.from(raw.slice(SHARE_PREFIX.length), 'base64url')).toString('utf8'))
  } catch {
    throw new Error('Kod bozuk ya da eksik kopyalanmış.')
  }
  return stripLocalMedia(sanitizeConfig(json))
}

function stripLocalMedia(cfg) {
  if (cfg.background.type === 'image' || cfg.background.type === 'video') cfg.background = { ...cfg.background, type: 'none' }
  if (cfg.logo.mode === 'image') cfg.logo = { ...cfg.logo, mode: 'none' }
  cfg.background.file = ''
  cfg.logo.file = ''
  return cfg
}

// ---------- Medya ----------

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const VIDEO_EXT = ['mp4', 'webm']
const MEDIA_KINDS = {
  image: { exts: IMAGE_EXT, prefix: 'bg', label: 'Resim', max: 50 },
  video: { exts: VIDEO_EXT, prefix: 'bg', label: 'Video', max: 150 },
  logo: { exts: [...IMAGE_EXT, 'svg'], prefix: 'logo', label: 'Logo', max: 5 },
}

// from: sürükle-bırakla gelen dosya yolu; yoksa dosya seçme penceresi açılır
async function pickMedia(kind, from) {
  const k = MEDIA_KINDS[kind]
  if (!k) throw new Error('Bilinmeyen dosya türü.')
  if (!from) {
    const res = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: k.label, extensions: k.exts }] })
    if (res.canceled || !res.filePaths[0]) return null
    from = res.filePaths[0]
  }
  const ext = path.extname(from).slice(1).toLowerCase()
  if (!k.exts.includes(ext)) throw new Error(`Bu dosya türü desteklenmiyor. Desteklenenler: ${k.exts.join(', ')}`)
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) throw new Error('Dosya bulunamadı.')
  if (fs.statSync(from).size > k.max * 1024 * 1024) throw new Error(`Dosya çok büyük (en fazla ${k.max} MB).`)
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  const name = `${k.prefix}-${Date.now()}.${ext}`
  fs.copyFileSync(from, path.join(MEDIA_DIR, name))
  return { file: name, original: path.basename(from) }
}

// Ne ayarlarda ne kayıtlı temalarda ne de Spotify'a son uygulanan temada geçen dosyaları siler.
// Seçim sırasında değil açılışta çalışır; seçilen dosya o an henüz ayarlara yazılmamış olabilir.
function cleanupMedia() {
  if (!fs.existsSync(MEDIA_DIR)) return
  const applied = loadSettings().lastApply?.config
  const keep = new Set([
    ...mediaFiles(loadConfig()),
    ...loadLibrary().flatMap((t) => mediaFiles(t.config)),
    ...(applied ? mediaFiles(sanitizeConfig(applied)) : []),
  ])
  for (const f of fs.readdirSync(MEDIA_DIR)) if (!keep.has(f)) fs.rmSync(path.join(MEDIA_DIR, f), { force: true })
}

// ---------- Kayıtlı temalar ----------

function loadLibrary() {
  const list = readJson(LIBRARY_FILE, [])
  return Array.isArray(list) ? list.map((t) => ({ ...t, config: sanitizeConfig(t.config) })) : []
}

// Aynı adla kayıtlı tema varsa üzerine yazılır
function saveToLibrary(config) {
  const cfg = sanitizeConfig(config)
  const list = loadLibrary().filter((t) => t.name !== cfg.name)
  list.unshift({ id: Date.now().toString(36), name: cfg.name, savedAt: Date.now(), config: cfg })
  writeJson(LIBRARY_FILE, list.slice(0, 50))
  return loadLibrary()
}

function deleteFromLibrary(id) {
  writeJson(LIBRARY_FILE, loadLibrary().filter((t) => t.id !== id))
  return loadLibrary()
}

// ---------- Tema dosyası (.spstudio) ----------
// Paylaşım kodundan farkı: arka plan ve logo dosyalarını da içinde taşır.

const FILE_FORMAT = 'spotify-studio-theme'
const MAX_THEME_FILE = 200 * 1024 * 1024

async function exportFile(config) {
  const cfg = sanitizeConfig(config)
  const media = {}
  for (const f of mediaFiles(cfg)) {
    const p = path.join(MEDIA_DIR, f)
    if (fs.existsSync(p)) media[f] = fs.readFileSync(p).toString('base64')
  }
  const safe = cfg.name.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'tema'
  const res = await dialog.showSaveDialog(win, {
    defaultPath: `${safe}.spstudio`,
    filters: [{ name: 'Spotify Studio teması', extensions: ['spstudio'] }],
  })
  if (res.canceled || !res.filePath) return null
  fs.writeFileSync(res.filePath, JSON.stringify({ format: FILE_FORMAT, version: 1, config: cfg, media }))
  return res.filePath
}

async function importFile() {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Spotify Studio teması', extensions: ['spstudio'] }],
  })
  if (res.canceled || !res.filePaths[0]) return null
  const p = res.filePaths[0]
  if (fs.statSync(p).size > MAX_THEME_FILE) throw new Error('Tema dosyası çok büyük.')
  let data
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    throw new Error('Tema dosyası okunamadı.')
  }
  if (data?.format !== FILE_FORMAT) throw new Error('Bu bir Spotify Theme Studio tema dosyası değil.')
  const cfg = sanitizeConfig(data.config)
  const media = data.media && typeof data.media === 'object' ? data.media : {}
  fs.mkdirSync(MEDIA_DIR, { recursive: true })

  // Dosya adları dışarıdan geldiği için yeniden üretilir; uzantı izin verilenlerden olmalı
  const restore = (file, kind) => {
    const ext = path.extname(file).slice(1).toLowerCase()
    if (!file || typeof media[file] !== 'string' || !MEDIA_KINDS[kind].exts.includes(ext)) return ''
    const name = `${MEDIA_KINDS[kind].prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`
    fs.writeFileSync(path.join(MEDIA_DIR, name), Buffer.from(media[file], 'base64'))
    return name
  }
  if (cfg.background.type === 'image' || cfg.background.type === 'video') {
    cfg.background.file = restore(cfg.background.file, cfg.background.type)
    if (!cfg.background.file) cfg.background.type = 'none'
  }
  if (cfg.logo.mode === 'image') {
    cfg.logo.file = restore(cfg.logo.file, 'logo')
    if (!cfg.logo.file) cfg.logo.mode = 'none'
  }
  return cfg
}

// ---------- Pencere ve tepsi ----------

function createWindow() {
  win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1080,
    minHeight: 700,
    show: false,
    backgroundColor: '#0d0e12',
    icon: ICON,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0d0e12', symbolColor: '#c9cbd6', height: 40 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
    },
  })
  if (DEV) win.loadURL('http://127.0.0.1:5173')
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))

  win.once('ready-to-show', () => !START_HIDDEN && win.show())
  win.on('close', (e) => {
    const s = loadSettings()
    if (quitting || !s.runInBackground) return
    // Bellek tasarrufunda pencere gerçekten kapanır; tepsi simgesi onu yeniden oluşturur
    if (s.freeMemoryInTray) return
    e.preventDefault()
    win.hide()
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

function showWindow() {
  if (!win || win.isDestroyed()) createWindow()
  win.show()
  win.focus()
}

function createTray() {
  const img = nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 })
  tray = new Tray(img)
  tray.setToolTip('Spotify Theme Studio')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Aç', click: showWindow },
      {
        label: 'Temayı şimdi uygula',
        click: () => exclusive(() => applyTheme(loadConfig())).catch((e) => log(e.message)),
      },
      { type: 'separator' },
      { label: 'Çıkış', click: () => { quitting = true; app.quit() } },
    ]),
  )
  tray.on('click', showWindow)
}

// ---------- IPC ----------

function handle(channel, fn) {
  ipcMain.handle(channel, async (_e, ...args) => {
    try {
      return { ok: true, data: await fn(...args) }
    } catch (e) {
      log('Hata: ' + e.message)
      return { ok: false, error: e.message }
    }
  })
}

handle('status:get', pushStatus)
handle('config:get', loadConfig)
handle('config:save', (cfg) => { const c = sanitizeConfig(cfg); writeJson(CONFIG_FILE, c); return c })
handle('settings:get', loadSettings)
handle('settings:save', (patch) => saveSettings(patch))
handle('spicetify:install', () => exclusive(() => spice.install(log)))
handle('theme:apply', (cfg) => exclusive(() => applyTheme(cfg)))
handle('theme:restore', () =>
  exclusive(async () => {
    const r = await spice.restore(log)
    if (!r.ok) throw new Error('Geri alma başarısız. Ayrıntılar kayıtlarda.')
    saveSettings({ lastApply: null })
    log('Spotify orijinal haline döndü.')
  }),
)
handle('media:pick', pickMedia)
handle('library:list', loadLibrary)
handle('library:save', saveToLibrary)
handle('library:delete', deleteFromLibrary)
handle('file:export', exportFile)
handle('file:import', importFile)
handle('share:export', exportCode)
handle('share:import', importCode)
handle('open:themes', () => shell.openPath(spice.THEMES_DIR))
handle('app:relaunch', () => {
  quitting = true
  app.relaunch()
  app.exit(0)
})

// ---------- Başlangıç ----------

protocol.registerSchemesAsPrivileged([{ scheme: 'studio-media', privileges: { stream: true, supportFetchAPI: true, corsEnabled: true } }])

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)
  app.whenReady().then(() => {
    app.setAppUserModelId('com.spotifystudio.app')
    // Arayüzdeki önizleme seçilen arka plan dosyasını buradan okur
    protocol.handle('studio-media', async (req) => {
      const name = decodeURIComponent(new URL(req.url).pathname.replace(/^\/+/, ''))
      if (!/^[\w.-]+$/.test(name)) return new Response('bad request', { status: 400 })
      // Renk paleti için arayüz resmi canvas'ta okuyor; CORS başlığı olmazsa canvas kirlenir
      const res = await net.fetch(pathToFileURL(path.join(MEDIA_DIR, name)).toString())
      const headers = new Headers(res.headers)
      headers.set('Access-Control-Allow-Origin', '*')
      return new Response(res.body, { status: res.status, headers })
    })
    try {
      cleanupMedia()
    } catch (e) {
      console.error('Medya temizliği başarısız:', e)
    }
    createWindow()
    createTray()
    setTimeout(watchForUpdates, 15000)
    setInterval(watchForUpdates, 2 * 60 * 1000)
  })
  app.on('before-quit', () => { quitting = true })
  app.on('window-all-closed', () => {
    if (!loadSettings().runInBackground) app.quit()
  })
}
