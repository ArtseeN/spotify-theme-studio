import { PRESETS } from '../../shared/theme.js'
import { Icon } from '../components/Icons.jsx'
import { useT } from '../i18n.jsx'

function StatusCard({ title, ok, value, detail, action }) {
  return (
    <div className={`status-card${ok ? ' ok' : ''}`}>
      <span className="status-icon">{ok ? <Icon.check /> : <Icon.alert />}</span>
      <div className="status-text">
        <span className="status-title">{title}</span>
        <b>{value}</b>
        {detail && <small>{detail}</small>}
      </div>
      {action}
    </div>
  )
}

export default function Home({ status, config, setConfig, onInstall, installing, goTo, preview }) {
  const t = useT()
  const s = status
  const lastApplied = s?.lastApply?.at ? new Date(s.lastApply.at).toLocaleString(t.lang === 'en' ? 'en-GB' : 'tr-TR') : ''
  const steps = [
    { label: t('home.step1'), done: !!s?.spicetify.installed },
    { label: t('home.step2'), done: true },
    { label: t('home.step3'), done: !!s?.applied },
  ]

  return (
    <div className="page page-home">
      <div className="hero">
        <div className="hero-text">
          <h1>{t('home.title')}</h1>
          <p>{t('home.subtitle')}</p>
          <ol className="steps">
            {steps.map((st, i) => (
              <li key={i} className={st.done ? 'done' : ''}>
                <span className="step-num">{st.done ? <Icon.check width="14" height="14" /> : i + 1}</span>
                {st.label}
              </li>
            ))}
          </ol>
        </div>
        <div className="hero-preview" onClick={() => goTo('editor')}>{preview}</div>
      </div>

      <div className="status-grid">
        <StatusCard
          title={t('home.spotify')}
          ok={s?.spotify.found}
          value={s ? (s.spotify.found ? `${t('home.found')} · ${s.spotify.version}` : t('home.notFound')) : '…'}
          detail={s && !s.spotify.found ? t('home.spotifyMissing') : null}
        />
        <StatusCard
          title={t('home.spicetify')}
          ok={s?.spicetify.installed}
          value={s ? (s.spicetify.installed ? `${t('home.installed')} · v${s.spicetify.version}` : t('home.notInstalled')) : '…'}
          action={
            s && !s.spicetify.installed && (
              <button className="btn btn-primary btn-sm" onClick={onInstall} disabled={installing || s.busy}>
                <Icon.download width="15" height="15" />
                {installing ? t('home.installing') : t('home.install')}
              </button>
            )
          }
        />
        <StatusCard
          title={t('home.theme')}
          ok={s?.applied}
          value={s ? (s.applied ? t('home.applied') : t('home.notApplied')) : '…'}
          detail={s?.applied && lastApplied}
        />
      </div>

      <section className="section">
        <header className="section-head">
          <div>
            <h3>{t('home.quick')}</h3>
            <p className="hint">{t('home.quickHint')}</p>
          </div>
        </header>
        <div className="preset-grid big">
          {PRESETS.map((p) => {
            const active = JSON.stringify(p.colors) === JSON.stringify(config.colors)
            return (
              <button
                key={p.id}
                className={`preset-card${active ? ' active' : ''}`}
                onClick={() => setConfig((c) => ({ ...c, colors: { ...p.colors }, advanced: {} }))}
                onDoubleClick={() => goTo('editor')}
                style={{ '--p-main': `#${p.colors.main}`, '--p-side': `#${p.colors.sidebar}`, '--p-card': `#${p.colors.card}`, '--p-accent': `#${p.colors.accent}`, '--p-text': `#${p.colors.text}`, '--p-sub': `#${p.colors.subtext}` }}
              >
                <span className="preset-mock">
                  <span className="pm-side" />
                  <span className="pm-body">
                    <span className="pm-line w60" />
                    <span className="pm-line w40 sub" />
                    <span className="pm-cards"><i /><i /><i /></span>
                  </span>
                  <span className="pm-play" />
                </span>
                <span className="preset-name">{t.pick(p.name)}{active && <Icon.check width="14" height="14" />}</span>
              </button>
            )
          })}
        </div>
      </section>

      <p className="note"><Icon.lock width="14" height="14" /> {t('home.note')}</p>
    </div>
  )
}
