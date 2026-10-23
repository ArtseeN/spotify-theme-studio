import { useEffect, useRef, useState } from 'react'
import { Section, Toggle, Segmented } from '../components/Controls.jsx'
import { Icon } from '../components/Icons.jsx'
import { useT } from '../i18n.jsx'

// Spotify tarafındaki performans ayarlarının hazır kombinasyonları
const PERF_PRESETS = {
  quality: { reduceBlur: false, reduceMotion: false, pauseVideo: false, lightCover: false },
  balanced: { reduceBlur: false, reduceMotion: false, pauseVideo: true, lightCover: true },
  saver: { reduceBlur: true, reduceMotion: true, pauseVideo: true, lightCover: true },
}

export default function Settings({ settings, updateSettings, config, setConfig, logs, busy, onInstall, onRestore }) {
  const t = useT()
  // Uygulama açılırken okunan donanım hızlandırma değeri; farklıysa yeniden başlatma gerekir
  const [bootHardware] = useState(settings.hardwareAcceleration)
  const perf = config.performance
  const setPerf = (patch) => setConfig((c) => ({ ...c, performance: { ...c.performance, ...patch } }))
  const preset = Object.keys(PERF_PRESETS).find((k) => JSON.stringify(PERF_PRESETS[k]) === JSON.stringify(perf)) || ''
  const logRef = useRef(null)
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  return (
    <div className="page page-wide">
      <Section title={t('settings.language')}>
        <Segmented
          value={settings.lang}
          onChange={(lang) => updateSettings({ lang })}
          options={[{ value: 'tr', label: 'Türkçe' }, { value: 'en', label: 'English' }]}
        />
      </Section>

      <Section title={t('settings.behavior')}>
        <Toggle label={t('settings.autoReapply')} desc={t('settings.autoReapplyDesc')} checked={settings.autoReapply} onChange={(v) => updateSettings({ autoReapply: v })} />
        <Toggle label={t('settings.background')} desc={t('settings.backgroundDesc')} checked={settings.runInBackground} onChange={(v) => updateSettings({ runInBackground: v })} />
        <Toggle label={t('settings.login')} desc={t('settings.loginDesc')} checked={settings.openAtLogin} onChange={(v) => updateSettings({ openAtLogin: v })} />
      </Section>

      <Section title={t('perf.title')} hint={t('perf.hint')}>
        <div className="field">
          <span className="field-label">{t('perf.preset')}</span>
          <Segmented
            value={preset}
            onChange={(k) => setPerf(PERF_PRESETS[k])}
            options={[
              { value: 'quality', label: t('perf.presetQuality') },
              { value: 'balanced', label: t('perf.presetBalanced') },
              { value: 'saver', label: t('perf.presetSaver') },
            ]}
          />
        </div>

        <div className="hide-group">
          <span className="field-label">{t('perf.spotify')}</span>
          <span className="hint">{t('perf.spotifyHint')}</span>
          <Toggle label={t('perf.reduceBlur')} desc={t('perf.reduceBlurDesc')} checked={perf.reduceBlur} onChange={(v) => setPerf({ reduceBlur: v })} />
          <Toggle label={t('perf.reduceMotion')} desc={t('perf.reduceMotionDesc')} checked={perf.reduceMotion} onChange={(v) => setPerf({ reduceMotion: v })} />
          <Toggle label={t('perf.pauseVideo')} desc={t('perf.pauseVideoDesc')} checked={perf.pauseVideo} onChange={(v) => setPerf({ pauseVideo: v })} />
          <Toggle label={t('perf.lightCover')} desc={t('perf.lightCoverDesc')} checked={perf.lightCover} onChange={(v) => setPerf({ lightCover: v })} />
        </div>

        <div className="hide-group">
          <span className="field-label">{t('perf.app')}</span>
          <Toggle label={t('perf.freeMemory')} desc={t('perf.freeMemoryDesc')} checked={settings.freeMemoryInTray} onChange={(v) => updateSettings({ freeMemoryInTray: v })} />
          <Toggle label={t('perf.appMotion')} checked={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
          <Toggle label={t('perf.hardware')} desc={t('perf.hardwareDesc')} checked={settings.hardwareAcceleration} onChange={(v) => updateSettings({ hardwareAcceleration: v })} />
          {settings.hardwareAcceleration !== bootHardware && (
            <div className="restart-row">
              <span className="hint">{t('perf.restartNeeded')}</span>
              <button className="btn btn-sm" onClick={() => window.studio.relaunch()}>{t('perf.restart')}</button>
            </div>
          )}
        </div>
      </Section>

      <Section title={t('settings.tools')}>
        <div className="tool-row">
          <button className="btn" onClick={onInstall} disabled={busy}><Icon.download width="16" height="16" />{t('settings.reinstall')}</button>
          <button className="btn" onClick={() => window.studio.openThemes()}><Icon.folder width="16" height="16" />{t('settings.openThemes')}</button>
        </div>
        <div className="danger-row">
          <div>
            <b>{t('settings.restore')}</b>
            <small>{t('settings.restoreDesc')}</small>
          </div>
          <button className="btn btn-danger" onClick={onRestore} disabled={busy}><Icon.undo width="16" height="16" />{t('settings.restore')}</button>
        </div>
      </Section>

      <Section title={t('settings.logs')}>
        <pre className="log-view" ref={logRef}>
          {logs.length ? logs.map((l) => l.line).join('\n') : t('settings.noLogs')}
        </pre>
      </Section>
    </div>
  )
}
