import { backgroundKind } from '../../shared/theme.js'
import { Section, Slider, Segmented, DropZone } from '../components/Controls.jsx'
import { Icon } from '../components/Icons.jsx'
import { paletteFromMedia } from '../palette.js'
import { useT } from '../i18n.jsx'

export default function Background({ config, setConfig, notify }) {
  const t = useT()
  const bg = config.background
  const set = (patch) => setConfig((c) => ({ ...c, background: { ...c.background, ...patch } }))
  const kind = backgroundKind(bg)
  const hasBg = kind !== 'none'
  const localFile = hasBg && (bg.type === 'image' || bg.type === 'video') ? bg.file : ''

  async function fromImage() {
    try {
      const colors = await paletteFromMedia(bg.file)
      setConfig((c) => ({ ...c, colors: { ...colors, accent: colors.accent || c.colors.accent }, advanced: {} }))
      notify(t('bg.fromImageDone'))
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="page">
      <Section>
        <div className="type-grid">
          {[
            { value: 'none', label: t('bg.none'), icon: <Icon.lock /> },
            { value: 'image', label: t('bg.image'), icon: <Icon.image /> },
            { value: 'video', label: t('bg.video'), icon: <Icon.play /> },
            { value: 'cover', label: t('bg.cover'), icon: <Icon.disc /> },
            { value: 'gradient', label: t('bg.gradient'), icon: <Icon.sparkles /> },
            { value: 'url', label: t('bg.url'), icon: <Icon.share /> },
          ].map((o) => (
            <button key={o.value} className={`type-card${bg.type === o.value ? ' active' : ''}`} onClick={() => set({ type: o.value })}>
              {o.icon}
              <span>{o.label}</span>
            </button>
          ))}
        </div>

        {(bg.type === 'image' || bg.type === 'video') && (
          <DropZone
            kind={bg.type}
            icon={<Icon.image />}
            fileName={localFile}
            hint={bg.type === 'video' ? t('bg.videoHint') : null}
            notify={notify}
            onPicked={(res) => set({ type: bg.type, file: res.file })}
          />
        )}
        {kind === 'image' && bg.type === 'image' && (
          <button className="btn btn-sm btn-soft" onClick={fromImage}>
            <Icon.palette width="15" height="15" />
            {t('bg.fromImage')}
          </button>
        )}
        {bg.type === 'cover' && <p className="hint">{t('bg.coverHint')}</p>}
        {bg.type === 'gradient' && <p className="hint">{t('bg.gradientHint')}</p>}

        {bg.type === 'url' && (
          <>
            <input
              className="text-input"
              value={bg.url}
              placeholder={t('bg.urlPlaceholder')}
              onChange={(e) => set({ url: e.target.value.trim() })}
              spellCheck={false}
            />
            <p className="hint">{t('bg.urlHint')}</p>
          </>
        )}
      </Section>

      <div className={hasBg ? 'page' : 'page is-disabled'}>
        <Section title={t('bg.effects')}>
          {kind !== 'gradient' && (
            <div className="field">
              <span className="field-label">{t('bg.position')}</span>
              <Segmented
                value={bg.position}
                onChange={(position) => set({ position })}
                options={[
                  { value: 'top', label: t('bg.posTop') },
                  { value: 'center', label: t('bg.posCenter') },
                  { value: 'bottom', label: t('bg.posBottom') },
                ]}
              />
            </div>
          )}
          <Slider label={t('bg.blur')} value={bg.blur} min={0} max={40} unit="px" onChange={(v) => set({ blur: v })} />
          <Slider label={t('bg.saturation')} value={bg.saturation} min={0} max={200} unit="%" onChange={(v) => set({ saturation: v })} />
          {kind !== 'gradient' && (
            <Slider label={t('bg.scale')} value={bg.scale} min={50} max={200} unit="%" onChange={(v) => set({ scale: v })} />
          )}
        </Section>

        <Section title={t('bg.readability')}>
          <Slider label={t('bg.dim')} value={bg.dim} min={0} max={90} unit="%" onChange={(v) => set({ dim: v })} />
          <Slider label={t('bg.panelOpacity')} value={config.panelOpacity} min={20} max={100} unit="%" onChange={(v) => setConfig((c) => ({ ...c, panelOpacity: v }))} />
          <Slider label={t('bg.panelBlur')} value={config.panelBlur} min={0} max={40} unit="px" onChange={(v) => setConfig((c) => ({ ...c, panelBlur: v }))} />
        </Section>
      </div>
    </div>
  )
}
