import { useMemo } from 'react'
import { deriveScheme, backgroundKind, hexToRgb, isDark, FONTS } from '../../shared/theme.js'
import { Icon } from './Icons.jsx'
import { useT } from '../i18n.jsx'

const COVERS = [
  'linear-gradient(135deg,#f97316,#db2777)',
  'linear-gradient(135deg,#22d3ee,#6366f1)',
  'linear-gradient(135deg,#a3e635,#059669)',
  'linear-gradient(135deg,#facc15,#ef4444)',
  'linear-gradient(135deg,#e879f9,#7c3aed)',
  'linear-gradient(135deg,#94a3b8,#1e293b)',
]

const TRACKS = [
  ['Gece Sürüşü', 'Neon Kıyı', '3:42'],
  ['Mavi Saat', 'Lumen', '4:05'],
  ['Kuzey Işığı', 'Aurora Bay', '2:58'],
  ['Son Tren', 'Kent Akustik', '3:21'],
]

export const mediaSrc = (file) => (file ? `studio-media://media/${encodeURIComponent(file)}` : '')

function backgroundSrc(bg) {
  return bg.type === 'url' ? bg.url : mediaSrc(bg.file)
}

function LogoMark({ logo, place }) {
  if (logo.mode === 'image' && logo.file && logo.place === place) {
    return <img className={`pv-logo pv-logo-${place}`} src={mediaSrc(logo.file)} alt="" style={{ '--pv-logo': `${Math.round(logo.size * 0.6)}px` }} />
  }
  if (logo.mode === 'text' && logo.text && place === 'nav') {
    return <span className="pv-logo-text" style={{ fontSize: `${Math.round(logo.size * 0.4)}px` }}>{logo.text}</span>
  }
  return null
}

// Spotify arayüzünün küçük bir taklidi; Spotify'a uygulanacak CSS değişkenleriyle boyanır
export default function Preview({ config, scheme: schemeOverride, label }) {
  const t = useT()
  const en = t.lang === 'en'
  const scheme = useMemo(
    () => schemeOverride || deriveScheme(config.colors, config.advanced),
    [schemeOverride, config.colors, config.advanced],
  )
  const kind = backgroundKind(config.background)
  const generated = kind === 'cover' || kind === 'gradient'
  const src = kind !== 'none' && !generated ? backgroundSrc(config.background) : ''
  const hasBg = generated || !!src
  const { layout, hide, logo, background: bg } = config
  const font = FONTS.find((f) => f.id === config.font)
  const homeLogo = logo.mode === 'image' && logo.file && logo.place === 'home'

  const vars = {}
  for (const [k, v] of Object.entries(scheme)) {
    vars[`--s-${k}`] = `#${v}`
    vars[`--s-rgb-${k}`] = hexToRgb(v).join(',')
  }
  Object.assign(vars, {
    '--gap': `${Math.round(layout.gap * 0.75)}px`,
    '--pv-radius': `${Math.round(config.radius * 0.75)}px`,
    '--pv-btn-radius': `${config.buttonRadius}px`,
    '--pv-alpha': hasBg ? config.panelOpacity / 100 : 1,
    '--pv-panel-blur': `${hasBg ? config.panelBlur * 0.6 : 0}px`,
    '--pv-bg-blur': `${bg.blur * 0.6}px`,
    '--pv-bg-dim': bg.dim / 100,
    '--pv-bg-pos': bg.position,
    '--pv-bg-sat': bg.saturation / 100,
    '--pv-bg-scale': bg.scale / 100,
    fontFamily: font?.id ? `'${font.id}', 'Segoe UI', sans-serif` : undefined,
  })
  const classes = [
    'pv',
    hasBg && 'pv-has-bg',
    layout.floatingPlayer && 'pv-floating',
    layout.textShadow && 'pv-shadow',
    layout.coverEffect === 'grayscale' && 'pv-gray',
    !isDark(scheme.main) && 'pv-light',
  ].filter(Boolean).join(' ')

  return (
    <div className="pv-wrap">
      {label && <span className="pv-label">{label}</span>}
      <div className={classes} style={vars}>
        {hasBg && (
          <div className="pv-bg">
            {kind === 'cover' && <div className="pv-bg-art" style={{ background: COVERS[0] }} />}
            {kind === 'gradient' && <div className="pv-bg-gradient" />}
            {kind === 'video' && <video src={src} autoPlay muted loop playsInline />}
            {kind === 'image' && <img src={src} alt="" />}
            <div className="pv-dim" />
          </div>
        )}

        <div className="pv-top">
          <span className="pv-arrows"><i /><i /></span>
          <LogoMark logo={logo} place="nav" />
          <span className="pv-center">
            <span className={`pv-home${homeLogo ? ' has-logo' : ''}`}>
              {homeLogo ? <LogoMark logo={logo} place="home" /> : <Icon.home width="12" height="12" />}
            </span>
            <span className="pv-search">{en ? 'What do you want to play?' : 'Ne çalmak istiyorsun?'}</span>
          </span>
          <span className="pv-top-right">
            {!hide.notifications && <Icon.bell width="12" height="12" />}
            {!hide.friends && <Icon.users width="12" height="12" />}
            <span className="pv-avatar" />
          </span>
        </div>

        <div className="pv-body">
          <aside className="pv-lib pv-panel">
            <div className="pv-lib-title">{en ? 'Your Library' : 'Kitaplığın'}</div>
            <div className="pv-chips"><span className="active">{en ? 'Playlists' : 'Çalma listeleri'}</span><span>{en ? 'Artists' : 'Sanatçılar'}</span></div>
            {COVERS.slice(0, 5).map((c, i) => (
              <div key={i} className={`pv-lib-item${i === 0 ? ' selected' : ''}`}>
                <span className="pv-cover pv-cover-img" style={{ background: c }} />
                <span className="pv-lines"><b>{TRACKS[i % 4][0]}</b><small>{en ? 'Playlist' : 'Çalma listesi'}</small></span>
              </div>
            ))}
          </aside>

          <main className="pv-main pv-panel">
            <div className="pv-hero">
              <span className="pv-hero-cover pv-cover-img" style={{ background: COVERS[0] }} />
              <div>
                <small>{en ? 'Playlist' : 'Çalma listesi'}</small>
                <h4>{config.name || 'Gece Sürüşü'}</h4>
                <small>Spotify Theme Studio · 24 {en ? 'songs' : 'şarkı'}</small>
              </div>
            </div>
            <div className="pv-actions">
              <span className="pv-play"><Icon.play width="14" height="14" /></span>
              <span className="pv-ghost-btn">{en ? 'Follow' : 'Takip et'}</span>
            </div>
            <div className="pv-tracks">
              {TRACKS.map(([name, artist, len], i) => (
                <div key={i} className={`pv-track${i === 1 ? ' hover' : ''}${i === 0 ? ' playing' : ''}`}>
                  <span className="pv-num">{i + 1}</span>
                  <span className="pv-cover sm pv-cover-img" style={{ background: COVERS[i + 1] }} />
                  <span className="pv-lines"><b>{name}</b><small>{artist}</small></span>
                  <span className="pv-len">{len}</span>
                </div>
              ))}
            </div>
            <div className="pv-cards">
              {COVERS.slice(1, 5).map((c, i) => (
                <div key={i} className="pv-card">
                  <span className="pv-cover lg pv-cover-img" style={{ background: c }} />
                  <b>{TRACKS[(i + 1) % 4][1]}</b>
                  <small>{en ? 'Artist' : 'Sanatçı'}</small>
                </div>
              ))}
            </div>
          </main>

          <aside className="pv-np pv-panel">
            <span className="pv-cover np pv-cover-img" style={{ background: COVERS[0] }} />
            <b>Gece Sürüşü</b>
            <small>Neon Kıyı</small>
            {!hide.npvLyrics && (
              <span className="pv-lyrics-card">
                <b>{en ? 'Lyrics preview' : 'Şarkı sözleri'}</b>
                <span>{en ? 'City lights fade…' : 'Şehir ışıkları söner…'}</span>
              </span>
            )}
          </aside>
        </div>

        <div className="pv-player">
          <div className="pv-now">
            <span className="pv-cover sm pv-cover-img" style={{ background: COVERS[0] }} />
            <span className="pv-lines"><b>Gece Sürüşü</b><small>Neon Kıyı</small></span>
          </div>
          <div className="pv-controls">
            <div className="pv-buttons"><i /><span className="pv-pp"><Icon.play width="10" height="10" /></span><i /></div>
            <div className="pv-progress"><span /></div>
          </div>
          <div className="pv-volume">
            {!hide.lyricsButton && <i />}
            {!hide.connect && <i />}
            <span />
            {!hide.miniplayer && <i />}
            {!hide.fullscreen && <i />}
          </div>
        </div>
      </div>
    </div>
  )
}
