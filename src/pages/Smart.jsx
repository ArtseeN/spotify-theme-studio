import { useEffect, useState } from 'react'
import { PRESETS, BASE_KEYS, deriveScheme, albumScheme } from '../../shared/theme.js'
import { Section, ColorField, Slider, Segmented, Toggle, Swatches } from '../components/Controls.jsx'
import { Icon } from '../components/Icons.jsx'
import { useT } from '../i18n.jsx'

// Spicetify.colorExtractor'ın gerçek kapaklardan döndürdüğüne benzer örnek renkler
const DEMO_ALBUMS = [
  { id: 'fire', cover: 'linear-gradient(135deg,#f97316,#db2777)', accent: 'F2673A', tint: '5C1530' },
  { id: 'sea', cover: 'linear-gradient(135deg,#22d3ee,#6366f1)', accent: '3FC6EA', tint: '1B2466' },
  { id: 'lime', cover: 'linear-gradient(135deg,#a3e635,#059669)', accent: '8DDB3A', tint: '0E3D2A' },
  { id: 'gold', cover: 'linear-gradient(135deg,#facc15,#ef4444)', accent: 'F5B921', tint: '5A1A12' },
  { id: 'violet', cover: 'linear-gradient(135deg,#e879f9,#7c3aed)', accent: 'D66BF5', tint: '2E1260' },
]

export default function Smart({ config, setConfig, setPreview }) {
  const t = useT()
  const sm = config.smart
  const [view, setView] = useState('day')
  const [album, setAlbum] = useState(DEMO_ALBUMS[0].id)
  const set = (patch) => setConfig((c) => ({ ...c, smart: { ...c.smart, ...patch } }))

  useEffect(() => {
    const day = deriveScheme(config.colors, config.advanced)
    if (sm.mode === 'schedule') {
      setPreview(view === 'night' ? { scheme: deriveScheme(sm.nightColors), label: t('smart.previewNight') } : { scheme: day, label: t('smart.previewDay') })
    } else if (sm.mode === 'album') {
      const a = DEMO_ALBUMS.find((x) => x.id === album)
      setPreview({ scheme: albumScheme(day, a.accent, a.tint, sm), label: t('smart.album') })
    } else {
      setPreview(null)
    }
  }, [config, view, album, t.lang]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => setPreview(null), [setPreview])

  const modes = [
    { id: 'static', icon: <Icon.lock />, title: t('smart.static'), desc: t('smart.staticDesc') },
    { id: 'schedule', icon: <Icon.sun />, title: t('smart.schedule'), desc: t('smart.scheduleDesc') },
    { id: 'album', icon: <Icon.disc />, title: t('smart.album'), desc: t('smart.albumDesc') },
  ]

  return (
    <div className="page">
      <Section>
        <div className="mode-grid">
          {modes.map((m) => (
            <button key={m.id} className={`mode-card${sm.mode === m.id ? ' active' : ''}`} onClick={() => set({ mode: m.id })}>
              <span className="mode-icon">{m.icon}</span>
              <b>{m.title}</b>
              <small>{m.desc}</small>
            </button>
          ))}
        </div>
      </Section>

      {sm.mode === 'schedule' && (
        <>
          <Section
            title={t('smart.schedule')}
            aside={
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { value: 'day', label: t('smart.previewDay'), icon: <Icon.sun width="14" height="14" /> },
                  { value: 'night', label: t('smart.previewNight'), icon: <Icon.moon width="14" height="14" /> },
                ]}
              />
            }
          >
            <div className="time-row">
              <label className="field">
                <span className="field-label"><Icon.sun width="14" height="14" /> {t('smart.dayStart')}</span>
                <input type="time" className="text-input" value={sm.dayStart} onChange={(e) => e.target.value && set({ dayStart: e.target.value })} />
              </label>
              <label className="field">
                <span className="field-label"><Icon.moon width="14" height="14" /> {t('smart.nightStart')}</span>
                <input type="time" className="text-input" value={sm.nightStart} onChange={(e) => e.target.value && set({ nightStart: e.target.value })} />
              </label>
            </div>
            <p className="hint">{t('smart.dayPalette')}</p>
          </Section>

          <Section title={t('smart.nightPalette')}>
            <div className="preset-grid">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`preset-chip${JSON.stringify(p.colors) === JSON.stringify(sm.nightColors) ? ' active' : ''}`}
                  onClick={() => { set({ nightColors: { ...p.colors } }); setView('night') }}
                >
                  <Swatches colors={p.colors} size="sm" />
                  {t.pick(p.name)}
                </button>
              ))}
            </div>
            <div className="color-grid compact">
              {BASE_KEYS.map((k) => (
                <ColorField
                  key={k}
                  label={t(`color.${k}`)}
                  value={sm.nightColors[k]}
                  onChange={(v) => { set({ nightColors: { ...sm.nightColors, [k]: v } }); setView('night') }}
                />
              ))}
            </div>
          </Section>
        </>
      )}

      {sm.mode === 'album' && (
        <Section title={t('smart.album')}>
          <Toggle label={t('smart.tint')} desc={t('smart.tintDesc')} checked={sm.albumTint} onChange={(v) => set({ albumTint: v })} />
          <div className={sm.albumTint ? '' : 'is-disabled'}>
            <Slider label={t('smart.strength')} value={sm.albumStrength} min={0} max={80} unit="%" onChange={(v) => set({ albumStrength: v })} />
          </div>
          <div className="field">
            <span className="field-label">{t('smart.demo')}</span>
            <div className="album-row">
              {DEMO_ALBUMS.map((a) => (
                <button
                  key={a.id}
                  className={`album-demo${album === a.id ? ' active' : ''}`}
                  style={{ background: a.cover }}
                  onClick={() => setAlbum(a.id)}
                  aria-label={a.id}
                />
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
}
