// Spicetify CLI'ı indirir, kurar ve komutlarını çalıştırır.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn, execFile } from 'node:child_process'
import { THEME_NAME, SCHEME_NAME } from './themeBuilder.js'

const LOCAL = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
const ROAMING = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')

export const SPICETIFY_DIR = path.join(LOCAL, 'spicetify')
export const SPICETIFY_EXE = path.join(SPICETIFY_DIR, 'spicetify.exe')
export const USERDATA_DIR = path.join(ROAMING, 'spicetify')
export const THEMES_DIR = path.join(USERDATA_DIR, 'Themes')
export const SPOTIFY_DIR = path.join(ROAMING, 'Spotify')
export const SPOTIFY_EXE = path.join(SPOTIFY_DIR, 'Spotify.exe')

const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')

function exec(file, args) {
  return new Promise((resolve) => {
    execFile(file, args, { windowsHide: true, timeout: 20000 }, (err, stdout) => resolve(err ? '' : String(stdout).trim()))
  })
}

// Spicetify komutunu çalıştırır ve çıktıyı satır satır onLog'a iletir.
// Spicetify bazen "devam edilsin mi?" diye sorar; stdin'e evet yazarak bunları yanıtlıyoruz.
export function run(args, onLog = () => {}) {
  return new Promise((resolve, reject) => {
    onLog(`> spicetify ${args.join(' ')}`)
    const child = spawn(SPICETIFY_EXE, args, { windowsHide: true, cwd: SPICETIFY_DIR })
    let out = ''
    const handle = (buf) => {
      const text = stripAnsi(buf.toString())
      out += text
      // Spicetify yükleme animasyonunu \r ile aynı satıra yazıyor; her parça ayrı satır sayılır
      for (const line of text.split(/\r\n|\r|\n/)) if (line.trim()) onLog(line.trim())
    }
    child.stdout.on('data', handle)
    child.stderr.on('data', handle)
    child.on('error', reject)
    child.on('close', (code) => {
      const failed = code !== 0 || /\berror\b|\bfatal\b/i.test(out)
      resolve({ code, out, ok: !failed })
    })
    child.stdin.write('y\ny\ny\n')
    child.stdin.end()
  })
}

let spotifyVersionCache = { mtime: 0, version: '' }

export async function getSpotifyVersion() {
  if (!fs.existsSync(SPOTIFY_EXE)) return ''
  const mtime = fs.statSync(SPOTIFY_EXE).mtimeMs
  if (mtime !== spotifyVersionCache.mtime) {
    const v = await exec('powershell.exe', ['-NoProfile', '-Command', `(Get-Item '${SPOTIFY_EXE}').VersionInfo.ProductVersion`])
    spotifyVersionCache = { mtime, version: v }
  }
  return spotifyVersionCache.version
}

// Spicetify uygulandığında xpui.spa paketi açılır ve index.html'e spicetify betikleri eklenir
export function isApplied() {
  const index = path.join(SPOTIFY_DIR, 'Apps', 'xpui', 'index.html')
  try {
    return fs.readFileSync(index, 'utf8').includes('spicetify')
  } catch {
    return false
  }
}

export async function getStatus() {
  const installed = fs.existsSync(SPICETIFY_EXE)
  return {
    spotify: { found: fs.existsSync(SPOTIFY_EXE), version: await getSpotifyVersion() },
    spicetify: { installed, version: installed ? (await exec(SPICETIFY_EXE, ['-v'])).replace(/^v/, '') : '' },
    applied: isApplied(),
  }
}

export async function install(onLog = () => {}) {
  const arch = { x64: 'x64', arm64: 'arm64', ia32: 'x32' }[process.arch] || 'x64'
  onLog('Son Spicetify sürümü aranıyor…')
  const res = await fetch('https://api.github.com/repos/spicetify/cli/releases/latest', {
    headers: { 'User-Agent': 'spotify-studio' },
  })
  if (!res.ok) throw new Error(`GitHub yanıt vermedi (${res.status})`)
  const release = await res.json()
  const asset = release.assets.find((a) => a.name.endsWith(`windows-${arch}.zip`))
  if (!asset) throw new Error(`Bu sistem için Spicetify paketi bulunamadı (${arch})`)

  onLog(`${release.tag_name} indiriliyor…`)
  const zipRes = await fetch(asset.browser_download_url)
  if (!zipRes.ok) throw new Error(`İndirme başarısız (${zipRes.status})`)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spicetify-'))
  const zipPath = path.join(tmpDir, asset.name)
  fs.writeFileSync(zipPath, Buffer.from(await zipRes.arrayBuffer()))

  onLog('Dosyalar açılıyor…')
  fs.mkdirSync(SPICETIFY_DIR, { recursive: true })
  // -Command ile verilen ek argümanlar $args'a düşmez; yolları ortam değişkeniyle geçiriyoruz
  await new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-Command', 'Expand-Archive -LiteralPath $env:STUDIO_ZIP -DestinationPath $env:STUDIO_DEST -Force'],
      { windowsHide: true, env: { ...process.env, STUDIO_ZIP: zipPath, STUDIO_DEST: SPICETIFY_DIR } },
      (err) => (err ? reject(new Error('Arşiv açılamadı: ' + err.message)) : resolve()),
    )
  })
  fs.rmSync(tmpDir, { recursive: true, force: true })

  if (!fs.existsSync(SPICETIFY_EXE)) throw new Error('Kurulumdan sonra spicetify.exe bulunamadı')
  // İlk çalıştırma yapılandırma dosyasını oluşturur ve Spotify'ın yerini bulur
  await run(['config'], onLog)
  onLog(`Spicetify ${release.tag_name} kuruldu.`)
}

export async function configureTheme(onLog) {
  return run(
    [
      'config',
      'current_theme', THEME_NAME,
      'color_scheme', SCHEME_NAME,
      'inject_css', '1',
      'replace_colors', '1',
      'overwrite_assets', '1',
      'inject_theme_js', '1',
    ],
    onLog,
  )
}

// fresh: Spotify ilk kez ya da güncellendikten sonra modlanıyorsa yedek alınmalı
export async function apply({ fresh }, onLog) {
  let r = await run(fresh ? ['backup', 'apply'] : ['apply'], onLog)
  if (!r.ok && !fresh && /backup/i.test(r.out)) {
    onLog('Yedek gerekli, yedek alınarak tekrar deneniyor…')
    r = await run(['backup', 'apply'], onLog)
  }
  return r
}

// Spotify zaten modlanmışken yalnızca tema dosyalarını (CSS, JS, renkler, assets) yenileyip Spotify'ı yeniden başlatır
export async function quickApply(onLog) {
  const r = await run(['refresh'], onLog)
  if (!r.ok) return r
  return run(['restart'], onLog)
}

export async function restore(onLog) {
  return run(['restore'], onLog)
}
