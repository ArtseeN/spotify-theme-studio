// Kullanıcının ayarlarından Spicetify tema klasörünü (color.ini, user.css, theme.js, assets/) üretir.
import fs from 'node:fs'
import path from 'node:path'
import { deriveScheme, backgroundKind, isDark, FONTS, HIDE_ITEMS } from '../shared/theme.js'

export const THEME_NAME = 'SpotifyStudio'
export const SCHEME_NAME = 'Studio'

function colorIni(scheme) {
  const lines = Object.entries(scheme).map(([k, v]) => `${k.padEnd(20)} = ${v}`)
  return `; Spotify Studio tarafından oluşturuldu. Elle düzenleme, uygulama üzerine yazar.\n[${SCHEME_NAME}]\n${lines.join('\n')}\n`
}

// Spotify 1.3.x sınıf adları rastgele üretiliyor; bu yüzden sabit id, data-testid ve
// Spicetify'ın eşlediği birkaç sınıf adı kullanılıyor. Sağ panelin dış kabuğu ve oynatıcı
// çubuğunun sabit bir adı yok, içerdikleri elemandan bulunuyor.
const PANELS = [
  '#Desktop_LeftSidebar_Id',
  '#main-view',
  '.Root__top-container > div:has(#Desktop_PanelContainer_Id) > div',
].join(', ')
const PANEL_INNER = [
  '#Desktop_LeftSidebar_Id > nav > div',
  '#Desktop_LeftSidebar_Id .YourLibraryX',
  '#Desktop_PanelContainer_Id',
  '#Desktop_PanelContainer_Id > div',
].join(', ')
const PLAYER = '.Root__top-container > div:has(> [data-testid="now-playing-bar"])'
const NAV_SLOT = '.main-globalNav-historyButtonsWrapper::after'
const HOME_BUTTON = '#global-nav-bar button[aria-label="Ana sayfa"], #global-nav-bar button[aria-label="Home"]'
// Panellerin kendisi ve alt elemanları. Spotify'ın renk setleri (encore-bright-accent-set gibi;
// yeşil Çal butonu bunlardan biri) --background-base'i kendi rengine ayarlıyor, onlara dokunulmuyor.
const COLOR_SET = '[class*="-set"]'
const PANEL_TREES = ['#Desktop_LeftSidebar_Id', '#main-view', '#Desktop_PanelContainer_Id']
  .flatMap((s) => [s, `${s} *:not(${COLOR_SET}, ${COLOR_SET} *)`])
  .join(', ')
// Spotify sayfa başlıklarının arkasındaki renk bantları satır içi background-color taşıyor. Sayfaya göre
// bant main'in, section'ın ya da section içindeki bir katmanın doğrudan çocuğu oluyor (profil sayfası).
// Başlığın kendi bandı (entity-header) ayrı tutuluyor: ona maske verilirse alttaki bantla dikiş oluşuyor.
const BANDS = [
  '#main-view main > div > div[style*="background-color"]',
  '#main-view main > section > div[style*="background-color"]',
  '#main-view main > section > div:not([data-testid="entity-header"]) > div[style*="background-color"]',
].join(',\n')
const HEADER_BAND = '#main-view [data-testid="entity-header"] > div[style*="background-color"]'
// Kapaktan renk çıkarılmayan sayfalarda (Beğenilen Şarkılar gibi sabit renkliler) Spotify başlık bandının
// üstüne alta doğru koyulaşan bir karartma, buton çubuğunun arkasına da satır içi renkli opak bir kutu koyuyor.
// Dinamik renkli sayfalarda (çalma listeleri) bunların yerine saydamlaşan gradyanlar var.
const HEADER_SHADE = `${HEADER_BAND} + div`
const ACTION_BAR_BAND = [
  '#main-view div[style*="background-color"]:has(+ [data-testid="action-bar"])',
  '#main-view div[style*="background-color"]:has(+ * [data-testid="action-bar"])',
].join(',\n')
// Kullanıcı çalma listeleri, albüm ve sanatçı sayfalarında bantlar satır içi --background-base'ten üretilen
// gradyanla boyanıyor (başlık ve altındaki oynatma butonları bandı). Başlık yazısı ve Spotify'ın renk
// setleri de aynı değişkeni taşıdığı için hariç tutuluyor.
const GRADIENT_BANDS = '#main-view section[data-testid$="-page"] [style*="--background-base:"]:not(.main-entityHeader-headerText *, [class*="-set"])'
// Tam ekran ve genişletilmiş "Şu Anda Çalan" (sinema modu) #main-view dışında ayrı bir kapsayıcı
const CINEMA = '.Root__top-container > div:has([style*="--cinema-mode-bg-color"])'
const CINEMA_VARS = '[style*="--cinema-mode-bg-color"]'
// Sanatçı sayfasında başlık resmi içeriğin arkasında sabit duruyor; içerik buzlu cam olmazsa resim sızıyor
const ARTIST_CONTENT = '#main-view section[data-testid="artist-page"] > div > div:not(.main-entityHeader-container)'
const RIGHT_OPEN = '[data-right-sidebar-open-duringenter], [data-right-sidebar-open-postenter], [data-right-sidebar-open-preexit]'

const COVER_IMAGES = '[data-encore-id="card"] img, [data-encore-id="listRow"] img, [data-testid="tracklist-row"] img'

function fontCss(cfg) {
  const font = FONTS.find((f) => f.id === cfg.font)
  if (!font?.id) return ''
  const stack = `'${font.id}', 'Segoe UI', sans-serif`
  return `
:root, .encore-dark-theme, .encore-light-theme {
  --encore-body-font-stack: ${stack} !important;
  --encore-title-font-stack: ${stack} !important;
  --encore-variable-font-stack: ${stack} !important;
}
body, button, input, textarea, .encore-text { font-family: ${stack} !important; }`
}

function shapeCss() {
  return `
/* Köşe yuvarlaklığı */
${PANELS}, ${PANEL_INNER},
[data-encore-id="card"], [data-encore-id="card"] img, [data-encore-id="card"] div:has(> img),
[data-encore-id="listRow"] img, [data-testid="now-playing-bar"] img {
  border-radius: var(--studio-radius) !important;
}
[data-encore-id="buttonPrimary"], [data-encore-id="buttonPrimary"] > span,
[data-encore-id="buttonSecondary"], [data-testid="control-button-playpause"] {
  border-radius: var(--studio-btn-radius) !important;
}

/* Renk değişimlerinde yumuşak geçiş (akıllı geçiş için) */
${PANELS}, ${PLAYER} {
  transition: background-color .8s ease;
}`
}

function hideCss(cfg) {
  const selectors = HIDE_ITEMS.filter((h) => cfg.hide[h.id]).flatMap((h) => h.selectors)
  return selectors.length ? `\n/* Gizlenen öğeler */\n${selectors.join(',\n')} { display: none !important; }` : ''
}

function layoutCss(cfg) {
  const l = cfg.layout
  const out = []
  if (l.gap !== 8) {
    out.push(`.Root__top-container { --panel-gap: ${l.gap}px !important; gap: ${l.gap}px !important; }`)
  }
  if (l.floatingPlayer) {
    out.push(`/* Yüzen oynatıcı */
${PLAYER} {
  margin: 0 max(var(--panel-gap), 8px) max(var(--panel-gap), 8px) !important;
  border-radius: var(--studio-radius) !important;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35);
}`)
  }
  if (l.scrollbar === 'thin') {
    out.push(`.os-scrollbar-vertical { width: 8px !important; } .os-scrollbar-horizontal { height: 8px !important; }`)
  } else if (l.scrollbar === 'accent') {
    out.push(`.os-scrollbar-handle { background: rgba(var(--spice-rgb-button), .55) !important; }
.os-scrollbar-handle:hover, .os-scrollbar-handle:active { background: rgba(var(--spice-rgb-button), .9) !important; }`)
  } else if (l.scrollbar === 'hidden') {
    out.push(`.os-scrollbar { display: none !important; }`)
  }
  const motion = !cfg.performance.reduceMotion
  if (l.hoverLift && motion) {
    out.push(`[data-encore-id="card"] { transition: transform .2s ease, box-shadow .2s ease !important; }
[data-encore-id="card"]:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(0, 0, 0, .35); }`)
  }
  if (l.textShadow) {
    out.push(`#main-view, #Desktop_LeftSidebar_Id, #Desktop_PanelContainer_Id, [data-testid="now-playing-bar"], #global-nav-bar {
  text-shadow: 0 1px 3px rgba(0, 0, 0, .55);
}`)
  }
  if (l.coverEffect === 'grayscale') {
    out.push(`${COVER_IMAGES} { filter: grayscale(1); transition: filter .3s ease; }
[data-encore-id="card"]:hover img, [data-encore-id="listRow"]:hover img, [data-testid="tracklist-row"]:hover img { filter: none; }`)
  } else if (l.coverEffect === 'zoom' && motion) {
    out.push(`[data-encore-id="card"] div:has(> img) { overflow: hidden; }
[data-encore-id="card"] img { transition: transform .35s ease; }
[data-encore-id="card"]:hover img { transform: scale(1.07); }`)
  }
  return out.length ? '\n' + out.join('\n') : ''
}

// Şarkı sözleri Spotify'da renklerini satır içi --lyrics-color-* değişkenlerinden alıyor;
// !important stil sayfası kuralı satır içi değeri geçersiz kılar. Satırlar [dir="auto"] ile işaretli.
const LYRICS = '[style*="--lyrics-color"]'
const LYRIC_SIZES = { sm: 36, lg: 60 }

// Spotify başlık bantlarını her sayfada kapaktan seçtiği renkle boyuyor (satır içi background-color ya da
// --background-base). "Tema" modunda hepsi tema vurgusunun zemine karışmış tonuna sabitlenir; böylece
// sayfadan sayfaya kendi kendine değişmez. Albüm kapağı modunda vurgu değiştikçe bantlar da onu izler.
function headerColorsCss(cfg) {
  if (cfg.layout.headerColors !== 'theme') return ''
  return `
/* Başlık renkleri: tema */
:root { --studio-band: color-mix(in srgb, var(--spice-button) 32%, var(--spice-main)); }
${BANDS},
${HEADER_BAND},
${ACTION_BAR_BAND} { background-color: var(--studio-band) !important; }
${GRADIENT_BANDS},
#main-view .main-topBar-background {
  --background-base: var(--studio-band) !important;
  --background-base-min-contrast: var(--studio-band) !important;
  --background-base-70: color-mix(in srgb, var(--studio-band) 70%, transparent) !important;
  --background-base-20: color-mix(in srgb, var(--studio-band) 20%, transparent) !important;
}
/* Aynı satır içi stil yazı renklerini de kapağa göre seçiyor (ör. mavimsi alt yazı) */
#main-view section[data-testid$="-page"] [style*="--text-subdued"]:not([class*="-set"]) {
  --text-base: var(--spice-text) !important;
  --text-subdued: var(--spice-subtext) !important;
  --essential-base: var(--spice-text) !important;
  --essential-subdued: var(--spice-subtext) !important;
  --decorative-subdued: var(--spice-subtext) !important;
}`
}

// Çalan şarkının yanındaki ekolayzır Spotify'da yeşil bir GIF; rengi resme gömülü olduğu için boyanamıyor.
// Resim gizlenip yerine vurgu renginde boyanmış, maskesi hareketli bir SVG olan aynı boyutta bir kutu çiziliyor.
function equalizerSvg(animated) {
  const bars = [
    [0.5, '10;3;12;6;10', '1.1s'],
    [4.2, '5;12;4;10;5', '0.9s'],
    [7.9, '12;6;9;3;12', '1.3s'],
    [11.5, '7;11;4;12;7', '1s'],
  ]
  const rects = bars.map(([x, values, dur]) => {
    const h = values.split(';')[0]
    const anim = animated
      ? `<animate attributeName='height' values='${values}' dur='${dur}' repeatCount='indefinite'/>` +
        `<animate attributeName='y' values='${values.split(';').map((v) => 14 - v).join(';')}' dur='${dur}' repeatCount='indefinite'/>`
      : ''
    return `<rect x='${x}' y='${14 - h}' width='2.2' height='${h}' rx='1'>${anim}</rect>`
  })
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'>${rects.join('')}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function equalizerCss(cfg) {
  const mask = equalizerSvg(!cfg.performance.reduceMotion)
  return `
/* Ekolayzır: vurgu renginde */
img[src*="equaliser-animated"] {
  object-position: -9999px 0;
  background-color: var(--spice-button);
  -webkit-mask: ${mask} center / contain no-repeat;
  mask: ${mask} center / contain no-repeat;
}`
}

function lyricsCss(cfg) {
  const { lyrics, lyricsSize, lyricsAlign } = cfg.layout
  const out = []
  if (lyrics !== 'spotify') {
    const accent = lyrics === 'accent'
    out.push(`/* Şarkı sözleri: ${accent ? 'vurgu rengi' : 'tema renkleri'} */
${LYRICS} {
  --lyrics-color-active: ${accent ? 'var(--spice-button)' : 'var(--spice-text)'} !important;
  --lyrics-color-passed: rgba(var(--spice-rgb-text), .7) !important;
  --lyrics-color-inactive: rgba(var(--spice-rgb-subtext), .5) !important;
  --lyrics-color-messaging: var(--spice-subtext) !important;
  --lyrics-color-background: var(--spice-main) !important;
}
[data-testid="lyrics-npv-section"]${LYRICS} { --lyrics-color-background: rgba(var(--spice-rgb-button), .14) !important; }
${CINEMA_VARS} { --cinema-mode-bg-color-from: var(--spice-main) !important; --cinema-mode-bg-color-to: var(--spice-main) !important; }`)
  }
  if (LYRIC_SIZES[lyricsSize]) {
    out.push(`#main-view ${LYRICS} [dir="auto"] { font-size: ${LYRIC_SIZES[lyricsSize]}px !important; line-height: 1.25 !important; }`)
  }
  if (lyricsAlign === 'center') {
    out.push(`#main-view ${LYRICS} [dir="auto"] { text-align: center !important; }`)
  }
  return out.length ? '\n' + out.join('\n') : ''
}

const DISCORD_CSS = `
/* Discord butonu (theme.js ekliyor) */
#studio-discord {
  /* Spotify'ın üst 60 pikseli pencere sürükleme alanı; muaf tutulmazsa tıklama pencereye gider */
  app-region: no-drag; -webkit-app-region: no-drag;
  align-self: center; margin-inline-end: 4px;
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 32px; height: 32px; border-radius: 50%;
  color: var(--spice-subtext); text-decoration: none;
  transition: color .2s ease, transform .2s ease, background-color .2s ease;
}
#studio-discord:hover { color: #fff; background-color: #5865f2; transform: scale(1.06); }
#studio-discord svg { width: 18px; height: 18px; fill: currentColor; }`

function logoCss(cfg, logoAsset) {
  const { mode, place, size, text } = cfg.logo
  if (mode === 'image' && logoAsset && place === 'home') {
    return `
/* Logo: Ana sayfa butonu */
${HOME_BUTTON} {
  background-image: url('${logoAsset}') !important;
  background-position: center !important;
  background-size: ${Math.round(size * 0.85)}px !important;
  background-repeat: no-repeat !important;
}
${HOME_BUTTON.split(', ').map((s) => s + ' svg').join(', ')} { opacity: 0; }`
  }
  if (mode === 'image' && logoAsset) {
    return `
/* Logo: üst çubuk */
${NAV_SLOT} {
  content: '';
  flex: none;
  width: ${size}px;
  height: ${size}px;
  background: url('${logoAsset}') center / contain no-repeat;
}`
  }
  if (mode === 'text' && text) {
    return `
/* Logo: yazı */
${NAV_SLOT} {
  content: "${text}";
  flex: none;
  font-size: ${Math.round(size * 0.62)}px;
  font-weight: 800;
  letter-spacing: -.02em;
  white-space: nowrap;
  background: linear-gradient(90deg, var(--spice-button), var(--spice-text));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}`
  }
  return ''
}

function backgroundCss() {
  return `
/* Arka plan */
html, body, #main, .Root, .Root__top-container, .Root__globalNav {
  background: transparent !important;
}
/* Arka plan eksi z-index ile her şeyin altına iner. #main'e z-index verilirse body'ye eklenen modallar
   (Ayrıntıları düzenle gibi, çoğunun z-index'i yok ya da 0) sayfanın altında kalıyor. */
#studio-bg { position: fixed; inset: calc(var(--studio-bg-blur) * -2); z-index: -1; pointer-events: none; }
/* Resim boyutu: konuma göre üstten, ortadan ya da alttan büyür/küçülür; küçülünce kenarlar tema rengiyle dolar */
#studio-bg { background-color: var(--spice-main); }
#studio-bg > img, #studio-bg > video {
  width: 100%; height: 100%; object-fit: cover; object-position: var(--studio-bg-position);
  transform: scale(var(--studio-bg-scale)); transform-origin: var(--studio-bg-position);
  filter: blur(var(--studio-bg-blur)) saturate(var(--studio-bg-saturation));
}
#studio-bg-dim { position: absolute; inset: 0; background: rgba(0, 0, 0, var(--studio-bg-dim)); }
#studio-bg > img { transition: opacity .6s ease; }
#studio-bg.studio-gradient {
  background: linear-gradient(125deg, var(--spice-button), var(--spice-main) 35%, var(--spice-card) 60%, rgba(var(--spice-rgb-button), .55));
  background-size: 300% 300%;
  animation: studio-gradient 24s ease-in-out infinite;
  filter: blur(var(--studio-bg-blur)) saturate(var(--studio-bg-saturation));
}
@keyframes studio-gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

/* Saydam panellerde sınırlar kaybolmasın */
${PANELS}, ${PLAYER} { outline: 1px solid rgba(var(--spice-rgb-text), .07); outline-offset: -1px; }

/* Spotify panellerin ve içlerindeki katmanların çoğunu --background-base ile boyuyor.
   Dış kabuklar aşağıda yarı saydam boyanıyor; içerideki her şey saydam kalıyor. */
${PANEL_TREES} { --background-base: transparent !important; }
${PANELS} { background-color: rgba(var(--spice-rgb-main), var(--studio-panel-alpha)) !important; }
${PLAYER} { background-color: rgba(var(--spice-rgb-player), var(--studio-panel-alpha)) !important; }

/* Buzlu cam panelin kendisine verilirse panel bir "backdrop root" olur ve içindeki yapışkan başlıkların
   bulanıklığı çalışmaz: kaydırınca satırlar başlıkların altından okunur. Bu yüzden bulanıklık panelin
   arkasındaki bir sözde-elemanda; isolation onu panelin zemini ile içeriği arasında tutar. */
${PANELS}, ${PLAYER}, ${CINEMA} > div, ${ARTIST_CONTENT} { isolation: isolate; }
${PLAYER} { position: relative; }
${PANELS}, ${PLAYER}, ${CINEMA} > div, ${ARTIST_CONTENT} { --studio-glass-under: var(--studio-panel-blur); }
${ARTIST_CONTENT} { --studio-glass-under: calc(var(--studio-glass-blur) * 1.5); }
:is(${PANELS}, ${PLAYER}, ${CINEMA} > div, ${ARTIST_CONTENT})::before {
  content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  border-radius: inherit;
  backdrop-filter: blur(var(--studio-glass-under));
}
${PANEL_INNER}, #main-view .main-view-container, #Desktop_PanelContainer_Id::before {
  background: transparent !important;
}
[style*="--lyrics-color"] { --lyrics-color-background: transparent !important; }
/* Sağ paneldeki kartlar (Sanatçı hakkında, Katkıda bulunanlar, Turnede, Sıradaki) tek bir değişkenle
   opak gri boyanıyor; kart rengine ve panel opaklığına bağlanır */
#Desktop_PanelContainer_Id, #Desktop_PanelContainer_Id *, ${CINEMA} * {
  --section-background-base: rgba(var(--spice-rgb-card), var(--studio-panel-alpha)) !important;
}

/* Sayfa başlıklarının arkasında Spotify'ın içeriğe göre boyadığı renk bantları
   (ana sayfa, çalma listesi/albüm/sanatçı başlığı ve altındaki geçiş bandı) */
${BANDS},
${HEADER_BAND},
${GRADIENT_BANDS} {
  opacity: var(--studio-panel-alpha);
}
/* Bantlar normalde düz renge doğru eriyor; zemin saydam olunca alt kenarları sert bir kutu gibi kalıyor */
${BANDS} {
  -webkit-mask-image: linear-gradient(#000, transparent);
  mask-image: linear-gradient(#000, transparent);
}
/* Sabit renkli sayfalar (Beğenilen Şarkılar): başlıktaki karartma kalkar, buton çubuğunun arkasındaki opak kutu
   dinamik renkli sayfalardaki gibi bandın %70'inden saydama erir; böylece çalma listeleriyle aynı görünür */
${HEADER_SHADE} { background: none !important; }
${ACTION_BAR_BAND} {
  background-image: none !important;
  opacity: var(--studio-panel-alpha);
  -webkit-mask-image: linear-gradient(rgba(0, 0, 0, .7), transparent);
  mask-image: linear-gradient(rgba(0, 0, 0, .7), transparent);
}
/* Kaydırınca yapışan üst çubuk (Oynat butonu + başlık) ve şarkı listesinin sütun başlığı (# Başlık Albüm …).
   İkisi de panel opaklığını izler; altından geçen satırlar buzlu camla bulanıklaşır ve iki parça tek bir
   cam gibi görünür. Spotify'ın kendi koyu gradyanı ve gölgesi kaldırılır. */
#main-view .main-topBar-background,
#main-view main > div > div > div[style*="opacity"],
#main-view [role="grid"] > [role="presentation"]:has([role="columnheader"]) {
  background-color: rgba(var(--spice-rgb-main), var(--studio-panel-alpha)) !important;
  background-image: none !important;
  backdrop-filter: blur(calc(var(--studio-glass-blur) * 1.25)) saturate(1.2);
  box-shadow: none !important;
}
#main-view .main-topBar-background::after { opacity: 0 !important; }
/* Spotify üst çubuğun üstüne %60 siyah bir karartma koyuyor */
#main-view .main-topBar-overlay { background: transparent !important; }
#main-view [role="grid"] > [role="presentation"]:has([role="columnheader"]) {
  border-bottom: 1px solid rgba(var(--spice-rgb-text), .1) !important;
}
${ARTIST_CONTENT} {
  background-color: rgba(var(--spice-rgb-main), max(var(--studio-panel-alpha), .6)) !important;
}
/* Sinema modu (tam ekran / genişletilmiş Şu Anda Çalan) kendi zeminini ve siyah çerçevesini çiziyor */
${CINEMA}, ${CINEMA} *:not(${COLOR_SET}, ${COLOR_SET} *) { --background-base: transparent !important; }
${CINEMA_VARS} { --cinema-mode-bg-color-from: transparent !important; --cinema-mode-bg-color-to: transparent !important; }
${CINEMA}, ${CINEMA} > div { outline-color: transparent !important; }
${CINEMA} > div {
  background-color: rgba(var(--spice-rgb-main), var(--studio-panel-alpha)) !important;
}
/* Saydam sinema görünümünün altında kalan paneller hayalet gibi seçiliyor. Kitaplık ve ana panel hep
   altında kalıyor; sağ panel ise Spotify onu yanında açık tutmuyorsa (data-right-sidebar-open-*) altında. */
.Root__top-container:has(${CINEMA_VARS}) > :is(#Desktop_LeftSidebar_Id, #main-view) { visibility: hidden; }
.Root__top-container:has(${CINEMA_VARS}):not(${RIGHT_OPEN}, :is(${RIGHT_OPEN}) *) > div:has(#Desktop_PanelContainer_Id) { visibility: hidden; }
/* Yatay rafların kenarlarındaki kaydırma gölgeleri saydam zeminde şerit gibi görünüyor */
#main-view [style*="--scrollAnimationRangeStart"]::before,
#main-view [style*="--scrollAnimationRangeStart"]::after { background-image: none !important; }`
}

// Spotify başlık bantlarını koyu renk + siyah gradyanla boyuyor ve üzerine beyaz yazı varsayıyor.
// Açık temada yazı koyu olduğu için bantlar pastel tona çekiliyor.
// Yalnızca temanın kendi animasyonları kapatılır; Spotify'ın kendi geçişleri bazı olaylara bağlı olduğu için ellenmez
const REDUCE_MOTION_CSS = `
/* Performans: animasyonlar kapalı */
#studio-bg.studio-gradient { animation: none !important; }
#studio-bg > img, #studio-discord, ${PANELS}, ${PLAYER} { transition: none !important; }`

function lightThemeCss() {
  return `
/* Açık tema: koyu başlık bantları */
${BANDS},
${HEADER_BAND},
${ACTION_BAR_BAND},
${GRADIENT_BANDS} {
  opacity: .28 !important;
  background-image: none !important;
}
#main-view [data-testid="entity-header"] > div:not([style*="background-color"]) { background-image: none !important; }
${BANDS} {
  -webkit-mask-image: linear-gradient(#000, transparent);
  mask-image: linear-gradient(#000, transparent);
}`
}

function userCss(cfg, { hasBg, logoAsset, light }) {
  const font = FONTS.find((f) => f.id === cfg.font)
  const parts = ['/* Spotify Studio tarafından oluşturuldu. Elle düzenleme, uygulama üzerine yazar. */']
  if (font?.google) {
    const fam = font.id.replace(/ /g, '+')
    parts.push(`@import url('https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;600;700;800&display=swap');`)
  }
  const bg = cfg.background
  const perf = cfg.performance
  parts.push(`
:root {
  --studio-radius: ${cfg.radius}px;
  --studio-btn-radius: ${cfg.buttonRadius}px;
  --studio-panel-alpha: ${hasBg ? cfg.panelOpacity / 100 : 1};
  --studio-panel-blur: ${hasBg && !perf.reduceBlur ? cfg.panelBlur : 0}px;
  --studio-bg-blur: ${perf.reduceBlur ? 0 : bg.blur}px;
  --studio-glass-blur: ${perf.reduceBlur ? 0 : 16}px;
  --studio-bg-dim: ${bg.dim / 100};
  --studio-bg-position: ${bg.position};
  --studio-bg-saturation: ${bg.saturation / 100};
  --studio-bg-scale: ${bg.scale / 100};
}`)
  parts.push(fontCss(cfg), shapeCss(), hideCss(cfg), layoutCss(cfg), lyricsCss(cfg), headerColorsCss(cfg), equalizerCss(cfg), logoCss(cfg, logoAsset), DISCORD_CSS)
  if (hasBg) parts.push(backgroundCss())
  if (perf.reduceMotion) parts.push(REDUCE_MOTION_CSS)
  if (light) parts.push(lightThemeCss())
  return parts.filter(Boolean).join('\n') + '\n'
}

// Spotify içinde çalışır. Spicetify bunu xpui/extensions/theme.js olarak enjekte eder.
const RUNTIME = String.raw`
(function studio() {
  const CFG = __CONFIG__;
  const root = document.documentElement;

  const hexToRgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbToHex = (c) => c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((c, i) => c + (y[i] - c) * t)); };
  const lum = (h) => { const [r, g, b] = hexToRgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };

  function setScheme(scheme) {
    for (const [k, v] of Object.entries(scheme)) {
      root.style.setProperty('--spice-' + k, '#' + v);
      root.style.setProperty('--spice-rgb-' + k, hexToRgb(v).join(','));
    }
  }

  // ---- Çalan şarkı ----
  // Sayfa yenilenince şarkı duraklatılmışsa Spicetify.Player.data boş kalıyor; PlayerAPI her zaman dolu
  const currentItem = () => Spicetify.Platform?.PlayerAPI?.getState?.()?.item || Spicetify.Player?.data?.item;
  const toUrl = (raw) => (raw || '').replace('spotify:image:', 'https://i.scdn.co/image/');

  function coverUrl(item, large) {
    const imgs = item?.images || [];
    if (large) {
      const big = imgs.find((i) => i.label === 'xlarge') || imgs.find((i) => i.label === 'large');
      return toUrl(item?.metadata?.image_xlarge_url || big?.url || item?.metadata?.image_url || imgs[0]?.url);
    }
    return toUrl(item?.metadata?.image_url || imgs[0]?.url);
  }

  // Şarkı değişince ve açılışta cb(item) çağrılır. Açılışta çalan şarkı bilgisi birkaç saniye
  // gecikebildiği için başarısız olan (false dönen) dinleyiciler bir süre yeniden denenir.
  const trackListeners = [];
  function onTrack(cb) {
    trackListeners.push(cb);
    if (trackListeners.length > 1) return;
    (function wait() {
      if (!window.Spicetify?.Player?.addEventListener || !Spicetify.Platform?.PlayerAPI) return setTimeout(wait, 300);
      Spicetify.Player.addEventListener('songchange', (e) => {
        const item = e?.data?.item || currentItem();
        trackListeners.forEach((f) => f(item));
      });
      let tries = 0;
      (async function first() {
        const item = currentItem();
        const results = item ? await Promise.all(trackListeners.map((f) => f(item))) : [false];
        if (results.some((ok) => !ok) && ++tries < 15) setTimeout(first, 2000);
      })();
    })();
  }

  // ---- Arka plan ----
  function mountBackground() {
    const bg = CFG.background;
    if (!bg || bg.kind === 'none') return;
    // Spotify arayüzü gelmeden resim eklenirse açılışta ekranda yalnızca resim kalıyor
    if (!document.querySelector('.Root__top-container')) return setTimeout(mountBackground, 100);
    document.getElementById('studio-bg')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'studio-bg';

    if (bg.kind === 'gradient') {
      wrap.className = 'studio-gradient';
    } else {
      const el = document.createElement(bg.kind === 'video' ? 'video' : 'img');
      if (bg.kind === 'cover') {
        // Kapak yüklenince eski kapak solarak yenisine geçer
        el.style.opacity = '0';
        onTrack(async (item) => {
          const url = coverUrl(item, !CFG.perf.lightCover);
          if (!url) return false;
          if (el.dataset.url === url) return true;
          const next = new Image();
          next.src = url;
          try { await next.decode(); } catch { return false; }
          const swap = () => { el.src = url; el.dataset.url = url; el.style.opacity = '1'; };
          if (el.dataset.url && !CFG.perf.reduceMotion) { el.style.opacity = '0'; setTimeout(swap, 400); } else swap();
          return true;
        });
      } else {
        el.src = bg.src;
      }
      if (bg.kind === 'video') {
        Object.assign(el, { autoplay: true, muted: true, loop: true, playsInline: true });
        const play = () => el.play().catch(() => {});
        document.addEventListener('visibilitychange', () => (document.hidden ? el.pause() : play()));
        // Performans: Spotify penceresi odakta değilken video durur
        if (CFG.perf.pauseVideo) {
          window.addEventListener('blur', () => el.pause());
          window.addEventListener('focus', play);
        }
      }
      wrap.append(el);
    }
    const dim = document.createElement('div');
    dim.id = 'studio-bg-dim';
    wrap.append(dim);
    document.body.prepend(wrap);
  }

  // ---- Discord butonu ----
  // Üst çubukta zilin soluna, Spotify'ın kendi butonları gibi sade bir simge. Spotify üst çubuğu
  // yeniden çizerse buton kaybolabileceği için DOM izlenip gerekirse yeniden eklenir.
  const DISCORD_URL = 'https://discord.gg/ZKtPU5BHuN';
  const DISCORD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';

  function mountDiscord() {
    const tr = (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('tr');
    const label = tr ? 'Discord sunucumuza katıl' : 'Join our Discord';
    let queued = false;
    const ensure = () => {
      queued = false;
      if (document.getElementById('studio-discord')) return;
      const host = document.querySelector('.main-globalNav-contentRight');
      if (!host) return;
      const a = document.createElement('a');
      a.id = 'studio-discord';
      a.href = DISCORD_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = label;
      a.setAttribute('aria-label', label);
      a.innerHTML = DISCORD_ICON;
      host.prepend(a);
    };
    ensure();
    new MutationObserver(() => {
      if (!queued) { queued = true; requestAnimationFrame(ensure); }
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ---- Saate göre ----
  function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  function isNight() {
    const now = new Date();
    const n = now.getHours() * 60 + now.getMinutes();
    const day = minutes(CFG.smart.dayStart), night = minutes(CFG.smart.nightStart);
    return day < night ? (n < day || n >= night) : (n >= night && n < day);
  }
  function startSchedule() {
    let last = null;
    const tick = () => {
      const night = isNight();
      if (night !== last) { setScheme(night ? CFG.schemes.night : CFG.schemes.day); last = night; }
    };
    tick();
    setInterval(tick, 30000);
  }

  // ---- Albüm kapağına göre ----
  // Spotify 1.3.x'te Spicetify.colorExtractor null döndürüyor; Spotify'ın kendi renk servisi
  // (GraphQL fetchExtractedColors) kullanılıyor, olmazsa kapak küçültülüp renkler hesaplanıyor.
  const cache = new Map();

  async function fromGraphQL(url) {
    const def = Spicetify.GraphQL?.Definitions?.fetchExtractedColors;
    // Spicetify.GraphQL.Request her açılışta bağlanmıyor; Spotify'ın kendi yükleyicisi yedek
    const request = Spicetify.GraphQL?.Request || Spicetify.Platform?.GraphQLLoader;
    if (!def || typeof request !== 'function') return null;
    const res = await request(def, { imageUris: [url] });
    const c = res?.data?.extractedColors?.[0];
    if (!c || c.colorLight?.isFallback) return null;
    return { accent: c.colorLight.hex.slice(1), tint: c.colorDark.hex.slice(1) };
  }

  async function fromCanvas(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    const size = 24;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const d = ctx.getImageData(0, 0, size, size).data;
    let best = [128, 128, 128], bestScore = -1;
    const sum = [0, 0, 0];
    for (let i = 0; i < d.length; i += 4) {
      const px = [d[i], d[i + 1], d[i + 2]];
      px.forEach((v, k) => (sum[k] += v));
      const max = Math.max(...px), min = Math.min(...px);
      const score = (max ? (max - min) / max : 0) * (max / 255);
      if (score > bestScore) { bestScore = score; best = px; }
    }
    const n = d.length / 4;
    return { accent: rgbToHex(best), tint: rgbToHex(sum.map((v) => (v / n) * 0.45)) };
  }

  async function extract(url) {
    if (cache.has(url)) return cache.get(url);
    let colors = null;
    try { colors = await fromGraphQL(url); } catch {}
    if (!colors) { try { colors = await fromCanvas(url); } catch {} }
    if (colors) cache.set(url, colors);
    return colors;
  }

  function startAlbum() {
    const base = CFG.schemes.day;
    const strength = CFG.smart.albumStrength / 100;
    const dark = CFG.dark;
    const shift = (h, t) => mix(h, dark ? 'ffffff' : '000000', t);

    onTrack(async (item) => {
      const url = coverUrl(item);
      if (!url) return false;
      const colors = await extract(url);
      if (!colors) return false;
      let accent = colors.accent;
      // Koyu temada çok koyu, açık temada çok açık vurgu rengi okunmaz
      if (dark && lum(accent) < 0.35) accent = mix(accent, 'ffffff', 0.35);
      if (!dark && lum(accent) > 0.7) accent = mix(accent, '000000', 0.35);
      const s = { ...base, button: accent, 'button-active': shift(accent, 0.15), notification: accent };
      if (CFG.smart.albumTint) {
        for (const k of ['main', 'sidebar', 'player', 'card']) s[k] = mix(base[k], colors.tint, k === 'card' ? strength * 0.8 : strength);
        s['main-elevated'] = shift(s.main, 0.06);
        s.highlight = shift(s.main, 0.1);
        s['highlight-elevated'] = shift(s.main, 0.15);
        s['tab-active'] = shift(s.main, 0.12);
      }
      setScheme(s);
      return true;
    });
  }

  mountBackground();
  mountDiscord();
  if (CFG.smart.mode === 'schedule') startSchedule();
  else if (CFG.smart.mode === 'album') startAlbum();
})();
`

// Spicetify, tema klasöründeki assets/ içeriğini Spotify'ın xpui klasörünün köküne kopyalar.
// Dosya adına sürüm eklenerek Spotify'ın eski dosyayı önbellekten göstermesi önlenir.
function copyAsset(dir, mediaDir, file, baseName) {
  const from = path.join(mediaDir, file)
  if (!file || !fs.existsSync(from)) return ''
  const name = baseName + path.extname(file).toLowerCase()
  fs.copyFileSync(from, path.join(dir, 'assets', name))
  return `${name}?v=${Date.now()}`
}

// cfg: temizlenmiş ayarlar, mediaDir: kullanıcının seçtiği dosyaların bulunduğu klasör
export function buildTheme(cfg, themesDir, mediaDir) {
  const dir = path.join(themesDir, THEME_NAME)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true })

  const kind = backgroundKind(cfg.background)
  let src = ''
  if (cfg.background.type === 'url') src = cfg.background.url
  else if (kind === 'image' || kind === 'video') src = copyAsset(dir, mediaDir, cfg.background.file, 'studio-bg')
  // Kapak ve renk geçişi dosya gerektirmez; kaynakları Spotify içinde belirlenir
  const hasBg = kind === 'cover' || kind === 'gradient' || (kind !== 'none' && !!src)

  const logoAsset = cfg.logo.mode === 'image' ? copyAsset(dir, mediaDir, cfg.logo.file, 'studio-logo') : ''

  const day = deriveScheme(cfg.colors, cfg.advanced)
  const night = deriveScheme(cfg.smart.nightColors)
  const runtimeConfig = {
    schemes: { day, night },
    dark: isDark(day.main),
    perf: cfg.performance,
    smart: cfg.smart,
    background: { kind: hasBg ? kind : 'none', src },
  }

  fs.writeFileSync(path.join(dir, 'color.ini'), colorIni(day))
  fs.writeFileSync(path.join(dir, 'user.css'), userCss(cfg, { hasBg, logoAsset, light: !runtimeConfig.dark }))
  fs.writeFileSync(path.join(dir, 'theme.js'), RUNTIME.replace('__CONFIG__', JSON.stringify(runtimeConfig)))
  return dir
}
