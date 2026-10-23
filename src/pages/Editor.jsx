import { useState } from 'react'
import { PRESETS, FONTS, SCHEME_KEYS, BASE_KEYS, deriveScheme, defaultConfig, randomPalette, backgroundKind } from '../../shared/theme.js'
import { Section, ColorField, Slider, Segmented, Swatches } from '../components/Controls.jsx'
import { Icon } from '../components/Icons.jsx'
import { paletteFromMedia } from '../palette.js'
import { useT } from '../i18n.jsx'

export default function Editor({ config, setConfig, notify }) {
  const t = useT()
  const [showAdvanced, setShowAdvanced] = useState(Object.keys(config.advanced).length > 0)
  const auto = deriveScheme(config.colors)

  const setColor = (k, v) => setConfig((c) => ({ ...c, colors: { ...c.colors, [k]: v } }))
  const setAdvanced = (k, v) =>
    setConfig((c) => {
      const advanced = { ...c.advanced }
      if (v == null) delete advanced[k]
      else advanced[k] = v
      return { ...c, advanced }
    })

  const bgImage = config.background.type === 'image' && backgroundKind(config.background) === 'image'

  const random = () => {
    setConfig((c) => ({ ...c, colors: randomPalette(), advanced: {} }))
    notify(t('editor.randomDone'))
  }

  async function fromBackground() {
    try {
      const colors = await paletteFromMedia(config.background.file)
      setConfig((c) => ({ ...c, colors: { ...colors, accent: colors.accent || c.colors.accent }, advanced: {} }))
      notify(t('bg.fromImageDone'))
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div className="page">
      <Section title={t('editor.name')}>
        <input className="text-input" value={config.name} maxLength={40} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))} />
      </Section>

      <Section title={t('editor.presets')}>
        <div className="preset-grid">
          {PRESETS.map((p) => {
            const active = JSON.stringify(p.colors) === JSON.stringify(config.colors)
            return (
              <button key={p.id} className={`preset-chip${active ? ' active' : ''}`} onClick={() => setConfig((c) => ({ ...c, colors: { ...p.colors }, advanced: {} }))}>
                <Swatches colors={p.colors} size="sm" />
                {t.pick(p.name)}
              </button>
            )
          })}
        </div>
        <div className="tool-row">
          <button className="btn btn-sm btn-soft" onClick={random}>
            <Icon.sparkles width="15" height="15" />
            {t('editor.random')}
          </button>
          {bgImage && (
            <button className="btn btn-sm btn-soft" onClick={fromBackground}>
              <Icon.image width="15" height="15" />
              {t('editor.fromBg')}
            </button>
          )}
        </div>
      </Section>

      <Section title={t('editor.colors')}>
        <div className="color-grid">
          {BASE_KEYS.map((k) => (
            <ColorField key={k} label={t(`color.${k}`)} value={config.colors[k]} onChange={(v) => setColor(k, v)} />
          ))}
        </div>
        <button className="disclosure" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((v) => !v)}>
          <span className="chev" />
          {t('editor.advanced')}
          {Object.keys(config.advanced).length > 0 && <span className="badge">{Object.keys(config.advanced).length}</span>}
        </button>
        {showAdvanced && (
          <>
            <p className="hint">{t('editor.advancedHint')}</p>
            <div className="color-grid compact">
              {SCHEME_KEYS.map((k) => (
                <ColorField
                  key={k}
                  label={k}
                  value={config.advanced[k]}
                  placeholder={auto[k]}
                  onChange={(v) => setAdvanced(k, v)}
                  onReset={() => setAdvanced(k, null)}
                  resetLabel={t('editor.reset')}
                />
              ))}
            </div>
          </>
        )}
      </Section>

      <Section title={t('editor.font')} hint={t('editor.fontHint')}>
        <div className="font-grid">
          {FONTS.map((f) => (
            <button
              key={f.id || 'default'}
              className={`font-chip${config.font === f.id ? ' active' : ''}`}
              style={{ fontFamily: f.id ? `'${f.id}', 'Segoe UI', sans-serif` : undefined }}
              onClick={() => setConfig((c) => ({ ...c, font: f.id }))}
            >
              <span className="font-sample">Aa</span>
              {t.pick(f.label)}
            </button>
          ))}
        </div>
      </Section>

      <Section title={t('editor.shape')}>
        <Slider label={t('editor.radius')} value={config.radius} min={0} max={32} unit="px" onChange={(v) => setConfig((c) => ({ ...c, radius: v }))} />
        <div className="field">
          <span className="field-label">{t('editor.buttons')}</span>
          <Segmented
            value={config.buttonRadius >= 100 ? 999 : config.buttonRadius <= 4 ? 4 : 10}
            onChange={(v) => setConfig((c) => ({ ...c, buttonRadius: v }))}
            options={[
              { value: 4, label: t('editor.btnSquare'), icon: <span className="shape-dot" style={{ borderRadius: 2 }} /> },
              { value: 10, label: t('editor.btnSoft'), icon: <span className="shape-dot" style={{ borderRadius: 5 }} /> },
              { value: 999, label: t('editor.btnPill'), icon: <span className="shape-dot" style={{ borderRadius: 99 }} /> },
            ]}
          />
        </div>
      </Section>
      <div className="row-end">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setConfig(defaultConfig()); notify(t('editor.resetDone')) }}
        >
          <Icon.undo width="15" height="15" />
          {t('editor.resetAll')}
        </button>
      </div>
    </div>
  )
}
