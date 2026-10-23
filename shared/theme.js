// Hem Electron ana süreci hem de arayüz tarafından kullanılan tema mantığı.
// Bu dosyada Node veya tarayıcıya özel API kullanma.

// 2: şarkı sözlerinin varsayılanı tema renkleri oldu
export const CONFIG_VERSION = 2

// Spicetify'ın color.ini içinde tanıdığı tüm renk anahtarları
export const SCHEME_KEYS = [
  'text', 'subtext', 'main', 'main-elevated', 'highlight', 'highlight-elevated',
  'sidebar', 'player', 'card', 'shadow', 'selected-row', 'button', 'button-active',
  'button-disabled', 'tab-active', 'notification', 'notification-error', 'misc',
]

// Editörde basit modda gösterilen temel renkler
export const BASE_KEYS = ['main', 'sidebar', 'player', 'card', 'text', 'subtext', 'accent']

export const PRESETS = [
  { id: 'classic', name: { tr: 'Klasik', en: 'Classic' }, colors: { main: '121212', sidebar: '000000', player: '000000', card: '181818', text: 'FFFFFF', subtext: 'B3B3B3', accent: '1ED760' } },
  { id: 'midnight', name: { tr: 'Gece Yarısı', en: 'Midnight' }, colors: { main: '0F1226', sidebar: '0A0C1A', player: '0A0C1A', card: '171B36', text: 'EEF0FF', subtext: '9AA0C8', accent: '7C8CFF' } },
  { id: 'ocean', name: { tr: 'Okyanus', en: 'Ocean' }, colors: { main: '0B1E2D', sidebar: '07141F', player: '07141F', card: '10293D', text: 'E6F4FF', subtext: '8FB3CC', accent: '2EC4F1' } },
  { id: 'forest', name: { tr: 'Orman', en: 'Forest' }, colors: { main: '111A14', sidebar: '0B120D', player: '0B120D', card: '18241B', text: 'E8F2EA', subtext: '9DB3A2', accent: '7BD389' } },
  { id: 'sunset', name: { tr: 'Gün Batımı', en: 'Sunset' }, colors: { main: '1E1218', sidebar: '150C11', player: '150C11', card: '2A1820', text: 'FFF0E8', subtext: 'C9A69A', accent: 'FF7A45' } },
  { id: 'nord', name: { tr: 'Nord', en: 'Nord' }, colors: { main: '2E3440', sidebar: '272C36', player: '272C36', card: '3B4252', text: 'ECEFF4', subtext: 'A3ABBA', accent: '88C0D0' } },
  { id: 'sakura', name: { tr: 'Sakura', en: 'Sakura' }, colors: { main: 'FFF5F7', sidebar: 'FFE9EE', player: 'FFE9EE', card: 'FFFFFF', text: '3A2230', subtext: '8A6575', accent: 'E85D8A' } },
  { id: 'paper', name: { tr: 'Kâğıt', en: 'Paper' }, colors: { main: 'F4F1EA', sidebar: 'EAE5DA', player: 'EAE5DA', card: 'FFFFFF', text: '1F1D1A', subtext: '6B665D', accent: 'C2410C' } },
]

export const FONTS = [
  { id: '', label: { tr: 'Spotify varsayılanı', en: 'Spotify default' } },
  { id: 'Segoe UI', label: 'Segoe UI' },
  { id: 'Inter', label: 'Inter', google: true },
  { id: 'Poppins', label: 'Poppins', google: true },
  { id: 'Nunito', label: 'Nunito', google: true },
  { id: 'Space Grotesk', label: 'Space Grotesk', google: true },
  { id: 'JetBrains Mono', label: 'JetBrains Mono', google: true },
  { id: 'Playfair Display', label: 'Playfair Display', google: true },
  { id: 'Comic Neue', label: 'Comic Neue', google: true },
]

// Spotify'da gizlenebilen öğeler. Spotify'ın dili Türkçe ya da İngilizce olabileceği için
// aria-label seçicileri iki dilde de yazıldı; mümkün olan yerlerde data-testid kullanıldı.
export const HIDE_ITEMS = [
  { id: 'notifications', group: 'top', selectors: ['button[aria-label="Yenilikler"]', `button[aria-label="What's New"]`] },
  { id: 'friends', group: 'top', selectors: ['button[aria-label="Dinleme etkinliği"]', 'button[aria-label="Friend Activity"]'] },
  { id: 'browse', group: 'top', selectors: ['button[aria-label="Göz At"]', 'button[aria-label="Browse"]'] },
  { id: 'premium', group: 'top', selectors: ['button[aria-label*="Premium"]', 'a[href*="/premium"]'] },
  { id: 'lyricsButton', group: 'player', selectors: ['[data-testid="lyrics-button"]'] },
  { id: 'connect', group: 'player', selectors: ['button[aria-label="Bir cihaza bağlan"]', 'button[aria-label="Connect to a device"]'] },
  { id: 'miniplayer', group: 'player', selectors: ['[data-testid="pip-toggle-button"]'] },
  { id: 'fullscreen', group: 'player', selectors: ['[data-testid="fullscreen-mode-button"]'] },
  { id: 'npvLyrics', group: 'panel', selectors: ['[data-testid="lyrics-npv-section"]'] },
]

export function defaultConfig() {
  return {
    version: CONFIG_VERSION,
    name: 'Benim Temam',
    colors: { ...PRESETS[1].colors },
    advanced: {},
    font: '',
    radius: 8,
    buttonRadius: 999,
    panelOpacity: 85,
    panelBlur: 12,
    background: { type: 'none', file: '', url: '', blur: 6, dim: 35, position: 'center', saturation: 100, scale: 100 },
    logo: { mode: 'none', file: '', text: '', place: 'nav', size: 28 },
    hide: Object.fromEntries(HIDE_ITEMS.map((h) => [h.id, false])),
    layout: {
      gap: 8,
      floatingPlayer: false,
      scrollbar: 'default',
      hoverLift: false,
      textShadow: false,
      coverEffect: 'none',
      lyrics: 'theme',
      lyricsSize: 'md',
      lyricsAlign: 'left',
      // Sayfa başlıklarının rengi: tema vurgusundan ya da Spotify'ın sayfaya göre seçtiği renk
      headerColors: 'theme',
    },
    // Spotify içindeki efektlerin maliyeti; zayıf ekran kartlarında ya da pilde işe yarar
    performance: {
      reduceBlur: false,
      reduceMotion: false,
      pauseVideo: true,
      lightCover: false,
    },
    smart: {
      mode: 'static',
      dayStart: '07:00',
      nightStart: '19:00',
      nightColors: { ...PRESETS[0].colors },
      albumTint: true,
      albumStrength: 35,
    },
  }
}

// ---------- Renk yardımcıları ----------

export const isHex = (v) => typeof v === 'string' && /^#?[0-9a-fA-F]{6}$/.test(v)
export const cleanHex = (v) => v.replace('#', '').toUpperCase()

export function hexToRgb(hex) {
  const h = cleanHex(hex)
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

export function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return rgbToHex([f(0), f(8), f(4)].map((v) => v * 255))
}

export function rgbToHex(rgb) {
  return rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

// a'dan b'ye t oranında karıştırır (0 = a, 1 = b)
export function mix(a, b, t) {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex(x.map((c, i) => c + (y[i] - c) * t))
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const isDark = (hex) => luminance(hex) < 0.35

// 7 temel renkten Spicetify'ın istediği 18 renklik tam şemayı üretir
export function deriveScheme(colors, advanced = {}) {
  const dark = isDark(colors.main)
  const shift = (h, t) => mix(h, dark ? 'FFFFFF' : '000000', t)
  const scheme = {
    text: colors.text,
    subtext: colors.subtext,
    main: colors.main,
    'main-elevated': shift(colors.main, 0.06),
    highlight: shift(colors.main, 0.1),
    'highlight-elevated': shift(colors.main, 0.15),
    sidebar: colors.sidebar,
    player: colors.player,
    card: colors.card,
    shadow: '000000',
    'selected-row': colors.text,
    button: colors.accent,
    'button-active': mix(colors.accent, dark ? 'FFFFFF' : '000000', 0.15),
    'button-disabled': mix(colors.subtext, colors.main, 0.5),
    'tab-active': shift(colors.main, 0.12),
    notification: colors.accent,
    'notification-error': 'E22134',
    misc: colors.subtext,
  }
  for (const [k, v] of Object.entries(advanced)) {
    if (SCHEME_KEYS.includes(k) && isHex(v)) scheme[k] = cleanHex(v)
  }
  return scheme
}

// Albüm kapağından gelen renklerle şemayı boyar.
// Spotify içinde çalışan theme.js de aynı hesabı yapar (themeBuilder.js → RUNTIME).
export function albumScheme(base, accent, tint, smart) {
  const dark = isDark(base.main)
  const shift = (h, t) => mix(h, dark ? 'FFFFFF' : '000000', t)
  const s = { ...base, button: accent, 'button-active': shift(accent, 0.15), notification: accent }
  if (smart.albumTint) {
    const strength = smart.albumStrength / 100
    for (const k of ['main', 'sidebar', 'player', 'card']) s[k] = mix(base[k], tint, k === 'card' ? strength * 0.8 : strength)
    s['main-elevated'] = shift(s.main, 0.06)
    s.highlight = shift(s.main, 0.1)
    s['highlight-elevated'] = shift(s.main, 0.15)
    s['tab-active'] = shift(s.main, 0.12)
  }
  return s
}

// ---------- Doğrulama ----------
// Paylaşım kodlarından gelen veri dışarıdan gelir ve CSS/JS içine yazılır,
// bu yüzden her alan izin verilen değerlere göre süzülür.

const clamp = (n, lo, hi, d) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : d)
const isTime = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
const oneOf = (v, list, d) => (list.includes(v) ? v : d)
const bool = (v, d) => (typeof v === 'boolean' ? v : d)
const isFileName = (v) => typeof v === 'string' && /^[\w.-]+$/.test(v)

// Logo yazısı CSS'te content: "..." içine girer; harf, rakam ve birkaç işaret dışında her şey atılır
export const cleanLogoText = (v) => (typeof v === 'string' ? v.replace(/[^\p{L}\p{N} .,!?&+'-]/gu, '').slice(0, 24) : '')

function sanitizeColors(src, fallback) {
  const out = {}
  for (const k of BASE_KEYS) out[k] = src && isHex(src[k]) ? cleanHex(src[k]) : fallback[k]
  return out
}

export function sanitizeConfig(input) {
  const d = defaultConfig()
  const c = input && typeof input === 'object' ? input : {}
  const bg = c.background || {}
  const sm = c.smart || {}
  const advanced = {}
  for (const k of SCHEME_KEYS) if (c.advanced && isHex(c.advanced[k])) advanced[k] = cleanHex(c.advanced[k])
  const url = typeof bg.url === 'string' && /^https:\/\/[^\s"'()<>\\]+$/.test(bg.url) ? bg.url : ''
  const file = isFileName(bg.file) ? bg.file : ''
  const logo = c.logo || {}
  const layout = c.layout || {}
  const hide = {}
  for (const h of HIDE_ITEMS) hide[h.id] = bool(c.hide?.[h.id], false)

  return {
    version: CONFIG_VERSION,
    name: typeof c.name === 'string' ? c.name.slice(0, 40) : d.name,
    colors: sanitizeColors(c.colors, d.colors),
    advanced,
    font: FONTS.some((f) => f.id === c.font) ? c.font : '',
    radius: clamp(c.radius, 0, 32, d.radius),
    buttonRadius: clamp(c.buttonRadius, 0, 999, d.buttonRadius),
    panelOpacity: clamp(c.panelOpacity, 20, 100, d.panelOpacity),
    panelBlur: clamp(c.panelBlur, 0, 40, d.panelBlur),
    background: {
      type: oneOf(bg.type, BACKGROUND_TYPES, 'none'),
      file,
      url,
      blur: clamp(bg.blur, 0, 40, d.background.blur),
      dim: clamp(bg.dim, 0, 90, d.background.dim),
      position: oneOf(bg.position, ['center', 'top', 'bottom'], 'center'),
      saturation: clamp(bg.saturation, 0, 200, 100),
      scale: clamp(bg.scale, 50, 200, 100),
    },
    logo: {
      mode: oneOf(logo.mode, ['none', 'image', 'text'], 'none'),
      file: isFileName(logo.file) ? logo.file : '',
      text: cleanLogoText(logo.text),
      place: oneOf(logo.place, ['nav', 'home'], 'nav'),
      size: clamp(logo.size, 16, 48, d.logo.size),
    },
    hide,
    layout: {
      gap: clamp(layout.gap, 0, 24, d.layout.gap),
      floatingPlayer: bool(layout.floatingPlayer, false),
      scrollbar: oneOf(layout.scrollbar, ['default', 'thin', 'accent', 'hidden'], 'default'),
      hoverLift: bool(layout.hoverLift, false),
      textShadow: bool(layout.textShadow, false),
      coverEffect: oneOf(layout.coverEffect, ['none', 'grayscale', 'zoom'], 'none'),
      // Sürüm 1'de varsayılan 'spotify' idi; şarkıya özel renkler saydam zeminde temayla çatışıyordu
      lyrics: (c.version ?? 1) < 2 ? 'theme' : oneOf(layout.lyrics, ['spotify', 'theme', 'accent'], 'theme'),
      lyricsSize: oneOf(layout.lyricsSize, ['sm', 'md', 'lg'], 'md'),
      lyricsAlign: oneOf(layout.lyricsAlign, ['left', 'center'], 'left'),
      headerColors: oneOf(layout.headerColors, ['theme', 'spotify'], 'theme'),
    },
    performance: {
      reduceBlur: bool(c.performance?.reduceBlur, false),
      reduceMotion: bool(c.performance?.reduceMotion, false),
      pauseVideo: bool(c.performance?.pauseVideo, true),
      lightCover: bool(c.performance?.lightCover, false),
    },
    smart: {
      mode: ['static', 'schedule', 'album'].includes(sm.mode) ? sm.mode : 'static',
      dayStart: isTime(sm.dayStart) ? sm.dayStart : d.smart.dayStart,
      nightStart: isTime(sm.nightStart) ? sm.nightStart : d.smart.nightStart,
      nightColors: sanitizeColors(sm.nightColors, d.smart.nightColors),
      albumTint: bool(sm.albumTint, d.smart.albumTint),
      albumStrength: clamp(sm.albumStrength, 0, 80, d.smart.albumStrength),
    },
  }
}

// cover: çalan şarkının kapağı, gradient: tema renklerinden hareketli geçiş
export const BACKGROUND_TYPES = ['none', 'image', 'video', 'url', 'cover', 'gradient']

export const isVideoUrl = (u) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u)

// Arka planın türünü (resim/video) döndürür.
// Resim ve video aynı dosya alanını paylaşır; tür değişince eski dosya sayılmaz.
export function backgroundKind(bg) {
  const videoFile = /\.(mp4|webm)$/i.test(bg.file)
  if (bg.type === 'image' && bg.file && !videoFile) return 'image'
  if (bg.type === 'video' && bg.file && videoFile) return 'video'
  if (bg.type === 'url' && bg.url) return isVideoUrl(bg.url) ? 'video' : 'image'
  if (bg.type === 'cover' || bg.type === 'gradient') return bg.type
  return 'none'
}

// Ayarların başvurduğu yerel medya dosyaları (arka plan ve logo)
export function mediaFiles(cfg) {
  const out = []
  if ((cfg.background?.type === 'image' || cfg.background?.type === 'video') && cfg.background.file) out.push(cfg.background.file)
  if (cfg.logo?.mode === 'image' && cfg.logo.file) out.push(cfg.logo.file)
  return out
}

// ---------- Palet üretme ----------

// Uyumlu rastgele palet: koyu zemin, tamamlayıcıya yakın canlı vurgu. Ara sıra açık tema.
export function randomPalette(rand = Math.random) {
  const h = Math.floor(rand() * 360)
  const accentHue = (h + [0, 30, 150, 180, 210][Math.floor(rand() * 5)]) % 360
  if (rand() < 0.2) {
    return {
      main: hslToHex(h, 40, 96), sidebar: hslToHex(h, 35, 92), player: hslToHex(h, 35, 92), card: hslToHex(h, 30, 99),
      text: hslToHex(h, 35, 14), subtext: hslToHex(h, 15, 40), accent: hslToHex(accentHue, 70, 46),
    }
  }
  return {
    main: hslToHex(h, 28, 9), sidebar: hslToHex(h, 30, 6), player: hslToHex(h, 30, 6), card: hslToHex(h, 22, 14),
    text: hslToHex(h, 30, 95), subtext: hslToHex(h, 14, 68), accent: hslToHex(accentHue, 85, 62),
  }
}

// Bir resmin piksellerinden (RGBA dizisi) tema paleti çıkarır: zemin resmin ortalama tonundan
// koyulaştırılır, vurgu en canlı renkten alınır.
export function paletteFromPixels(data) {
  const sum = [0, 0, 0]
  let vivid = [255, 122, 69], best = -1
  for (let i = 0; i < data.length; i += 4) {
    const px = [data[i], data[i + 1], data[i + 2]]
    px.forEach((v, k) => (sum[k] += v))
    const max = Math.max(...px), min = Math.min(...px)
    const score = (max ? (max - min) / max : 0) * (max / 255)
    if (score > best) { best = score; vivid = px }
  }
  const n = data.length / 4 || 1
  const avg = rgbToHex(sum.map((v) => v / n))
  // Resimde canlı renk yoksa (siyah-beyaz ya da soluk) vurgu üretilmez; çağıran mevcut vurguyu korur
  let accent = best < 0.15 ? null : rgbToHex(vivid)
  if (accent && luminance(accent) < 0.18) accent = mix(accent, 'FFFFFF', 0.35)
  const main = mix(avg, '000000', 0.78)
  const text = accent ? mix('F7F7F7', accent, 0.06) : 'F7F7F7'
  return {
    main,
    sidebar: mix(main, '000000', 0.35),
    player: mix(main, '000000', 0.35),
    card: mix(main, 'FFFFFF', 0.07),
    text,
    subtext: mix(text, main, 0.38),
    accent,
  }
}
