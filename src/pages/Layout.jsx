import { HIDE_ITEMS } from '../../shared/theme.js'
import { Section, Slider, Segmented, Toggle } from '../components/Controls.jsx'
import { useT } from '../i18n.jsx'

const GROUPS = ['top', 'player', 'panel']

export default function Layout({ config, setConfig }) {
  const t = useT()
  const l = config.layout
  const set = (patch) => setConfig((c) => ({ ...c, layout: { ...c.layout, ...patch } }))
  const setHide = (id, v) => setConfig((c) => ({ ...c, hide: { ...c.hide, [id]: v } }))

  return (
    <div className="page">
      <Section title={t('layout.layout')}>
        <Slider label={t('layout.gap')} value={l.gap} min={0} max={24} unit="px" onChange={(gap) => set({ gap })} />
        <Toggle label={t('layout.floating')} desc={t('layout.floatingDesc')} checked={l.floatingPlayer} onChange={(v) => set({ floatingPlayer: v })} />
        <div className="field">
          <span className="field-label">{t('layout.headerColors')}</span>
          <Segmented
            value={l.headerColors}
            onChange={(headerColors) => set({ headerColors })}
            options={[
              { value: 'theme', label: t('layout.headerTheme') },
              { value: 'spotify', label: t('layout.headerSpotify') },
            ]}
          />
          <span className="hint">{t('layout.headerHint')}</span>
        </div>
        <div className="field">
          <span className="field-label">{t('layout.scrollbar')}</span>
          <Segmented
            value={l.scrollbar}
            onChange={(scrollbar) => set({ scrollbar })}
            options={[
              { value: 'default', label: t('layout.sbDefault') },
              { value: 'thin', label: t('layout.sbThin') },
              { value: 'accent', label: t('layout.sbAccent') },
              { value: 'hidden', label: t('layout.sbHidden') },
            ]}
          />
        </div>
      </Section>

      <Section title={t('layout.effects')}>
        <Toggle label={t('layout.hoverLift')} checked={l.hoverLift} onChange={(v) => set({ hoverLift: v })} />
        <Toggle label={t('layout.textShadow')} desc={t('layout.textShadowDesc')} checked={l.textShadow} onChange={(v) => set({ textShadow: v })} />
        <div className="field">
          <span className="field-label">{t('layout.cover')}</span>
          <Segmented
            value={l.coverEffect}
            onChange={(coverEffect) => set({ coverEffect })}
            options={[
              { value: 'none', label: t('layout.coverNone') },
              { value: 'grayscale', label: t('layout.coverGray') },
              { value: 'zoom', label: t('layout.coverZoom') },
            ]}
          />
          {l.coverEffect === 'grayscale' && <span className="hint">{t('layout.coverGrayHint')}</span>}
        </div>
      </Section>

      <Section title={t('layout.lyricsTitle')} hint={t('layout.lyricsHint')}>
        <div className="field">
          <span className="field-label">{t('layout.lyrics')}</span>
          <Segmented
            value={l.lyrics}
            onChange={(lyrics) => set({ lyrics })}
            options={[
              { value: 'theme', label: t('layout.lyricsTheme') },
              { value: 'accent', label: t('layout.lyricsAccent') },
              { value: 'spotify', label: t('layout.lyricsSpotify') },
            ]}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <span className="field-label">{t('layout.lyricsSize')}</span>
            <Segmented
              value={l.lyricsSize}
              onChange={(lyricsSize) => set({ lyricsSize })}
              options={[
                { value: 'sm', label: t('layout.sizeSm') },
                { value: 'md', label: t('layout.sizeMd') },
                { value: 'lg', label: t('layout.sizeLg') },
              ]}
            />
          </div>
          <div className="field">
            <span className="field-label">{t('layout.lyricsAlign')}</span>
            <Segmented
              value={l.lyricsAlign}
              onChange={(lyricsAlign) => set({ lyricsAlign })}
              options={[
                { value: 'left', label: t('layout.alignLeft') },
                { value: 'center', label: t('layout.alignCenter') },
              ]}
            />
          </div>
        </div>
        <LyricsSample layout={l} colors={config.colors} />
      </Section>

      <Section title={t('layout.hide')} hint={t('layout.hideHint')}>
        <div className="hide-groups">
          {GROUPS.map((g) => (
            <div key={g} className="hide-group">
              <span className="field-label">{t(`hide.group.${g}`)}</span>
              {HIDE_ITEMS.filter((h) => h.group === g).map((h) => (
                <Toggle key={h.id} label={t(`hide.${h.id}`)} checked={config.hide[h.id]} onChange={(v) => setHide(h.id, v)} />
              ))}
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// Seçilen şarkı sözü stilinin küçük örneği; renkler önizlemedekiyle aynı tema değişkenlerinden gelir
function LyricsSample({ layout, colors }) {
  const vars = { '--ly-main': `#${colors.main}`, '--ly-text': `#${colors.text}`, '--ly-sub': `#${colors.subtext}`, '--ly-accent': `#${colors.accent}` }
  return (
    <div className={`lyrics-sample lyrics-${layout.lyrics} size-${layout.lyricsSize} align-${layout.lyricsAlign}`} style={vars}>
      <span className="passed">Şehrin ışıkları sönerken</span>
      <span className="active">Ben hâlâ seni dinliyorum</span>
      <span>Gece biter, şarkı kalır</span>
    </div>
  )
}
