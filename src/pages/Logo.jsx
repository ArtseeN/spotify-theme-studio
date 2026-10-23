import { Section, Slider, Segmented, DropZone } from '../components/Controls.jsx'
import { Icon } from '../components/Icons.jsx'
import { useT } from '../i18n.jsx'

export default function Logo({ config, setConfig, notify }) {
  const t = useT()
  const logo = config.logo
  const set = (patch) => setConfig((c) => ({ ...c, logo: { ...c.logo, ...patch } }))

  return (
    <div className="page">
      <Section>
        <Segmented
          value={logo.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { value: 'none', label: t('logo.none') },
            { value: 'image', label: t('logo.image'), icon: <Icon.image width="15" height="15" /> },
            { value: 'text', label: t('logo.text'), icon: <Icon.text width="15" height="15" /> },
          ]}
        />

        {logo.mode === 'image' && (
          <>
            <DropZone
              kind="logo"
              icon={<Icon.badge />}
              fileName={logo.file}
              hint={t('logo.formats')}
              notify={notify}
              onPicked={(res) => set({ file: res.file })}
            />
            <div className="field">
              <span className="field-label">{t('logo.place')}</span>
              <Segmented
                value={logo.place}
                onChange={(place) => set({ place })}
                options={[
                  { value: 'nav', label: t('logo.placeNav') },
                  { value: 'home', label: t('logo.placeHome') },
                ]}
              />
            </div>
          </>
        )}

        {logo.mode === 'text' && (
          <label className="field">
            <span className="field-label">{t('logo.textLabel')}</span>
            <input
              className="text-input"
              value={logo.text}
              maxLength={24}
              placeholder={t('logo.textPlaceholder')}
              onChange={(e) => set({ text: e.target.value })}
            />
            <span className="hint">{t('logo.textHint')}</span>
          </label>
        )}

        {logo.mode !== 'none' && (
          <Slider label={t('logo.size')} value={logo.size} min={16} max={48} unit="px" onChange={(size) => set({ size })} />
        )}
      </Section>

      <p className="note"><Icon.alert width="14" height="14" /> {t('logo.limit')}</p>
    </div>
  )
}
