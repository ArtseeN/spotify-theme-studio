import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sanitizeConfig } from '../shared/theme.js'
import { LangContext, useT } from './i18n.jsx'
import { Icon, Logo } from './components/Icons.jsx'
import Preview from './components/Preview.jsx'
import Home from './pages/Home.jsx'
import Editor from './pages/Editor.jsx'
import Background from './pages/Background.jsx'
import LogoPage from './pages/Logo.jsx'
import Layout from './pages/Layout.jsx'
import Smart from './pages/Smart.jsx'
import Library from './pages/Library.jsx'
import Settings from './pages/Settings.jsx'

const NAV = [
  { id: 'home', icon: Icon.home },
  { group: 'design' },
  { id: 'editor', icon: Icon.palette },
  { id: 'background', icon: Icon.image },
  { id: 'logo', icon: Icon.badge },
  { id: 'layout', icon: Icon.layout },
  { id: 'smart', icon: Icon.sparkles },
  { group: 'collection' },
  { id: 'library', icon: Icon.library },
  { id: 'settings', icon: Icon.settings },
]
const NAV_ICONS = Object.fromEntries(NAV.filter((n) => n.id).map((n) => [n.id, n.icon]))
export const DISCORD_URL = 'https://discord.gg/ZKtPU5BHuN'
const WITH_PREVIEW = ['editor', 'background', 'logo', 'layout', 'smart', 'library']
// Sayfa başlığı ve alt başlığının çeviri anahtarı öneki
const TITLES = { editor: 'editor', background: 'bg', logo: 'logo', layout: 'layout', smart: 'smart', library: 'library', settings: 'settings' }
// Kaydırıcı sürüklemek gibi art arda gelen değişiklikler tek geri alma adımı sayılır
const HISTORY_GROUP_MS = 600
const HISTORY_LIMIT = 80

export default function App() {
  const [config, setConfigState] = useState(null)
  const [settings, setSettings] = useState(null)
  const [status, setStatus] = useState(null)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    window.studio.getConfig().then(setConfigState)
    window.studio.getSettings().then(setSettings)
    window.studio.getStatus().catch(() => {})
    const offLog = window.studio.onLog((entry) => setLogs((l) => [...l.slice(-400), entry]))
    const offStatus = window.studio.onStatus(setStatus)
    return () => { offLog(); offStatus() }
  }, [])

  if (!config || !settings) return <div className="boot"><Logo size={40} /></div>

  return (
    <LangContext.Provider value={settings.lang}>
      <Studio
        initialConfig={config}
        settings={settings}
        setSettings={setSettings}
        status={status}
        logs={logs}
      />
    </LangContext.Provider>
  )
}

function Studio({ initialConfig, settings, setSettings, status, logs }) {
  const t = useT()
  const [config, setConfigState] = useState(initialConfig)
  const [page, setPage] = useState('home')
  const [preview, setPreview] = useState(null)
  const [toast, setToast] = useState(null)
  const [action, setAction] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [, setHistoryVersion] = useState(0)
  const configRef = useRef(initialConfig)
  const history = useRef({ past: [], future: [], lastAt: 0 })
  const saveTimer = useRef(null)
  const toastTimer = useRef(null)

  const notify = useCallback((text, kind = 'ok') => {
    clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])

  const commit = useCallback((next) => {
    configRef.current = next
    setConfigState(next)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => window.studio.saveConfig(next).catch(() => {}), 400)
  }, [])

  // Her değişiklik geri alma geçmişine eklenir ve kısa bir gecikmeyle diske yazılır
  const setConfig = useCallback(
    (update) => {
      const prev = configRef.current
      const next = typeof update === 'function' ? update(prev) : update
      if (next === prev) return
      const h = history.current
      const now = Date.now()
      if (now - h.lastAt > HISTORY_GROUP_MS) {
        h.past.push(prev)
        if (h.past.length > HISTORY_LIMIT) h.past.shift()
      }
      h.lastAt = now
      h.future = []
      commit(next)
      setHistoryVersion((v) => v + 1)
    },
    [commit],
  )

  const undo = useCallback(() => {
    const h = history.current
    if (!h.past.length) return
    h.future.push(configRef.current)
    h.lastAt = 0
    commit(h.past.pop())
    setHistoryVersion((v) => v + 1)
  }, [commit])

  const redo = useCallback(() => {
    const h = history.current
    if (!h.future.length) return
    h.past.push(configRef.current)
    h.lastAt = 0
    commit(h.future.pop())
    setHistoryVersion((v) => v + 1)
  }, [commit])

  const updateSettings = async (patch) => {
    setSettings((s) => ({ ...s, ...patch }))
    try {
      setSettings(await window.studio.saveSettings(patch))
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const busy = !!action || !!status?.busy
  const applied = status?.lastApply?.config
  const dirty = useMemo(
    () => !applied || JSON.stringify(sanitizeConfig(config)) !== JSON.stringify(sanitizeConfig(applied)),
    [config, applied],
  )

  async function run(name, fn, success) {
    setAction(name)
    try {
      await fn()
      if (success) notify(success)
    } catch (e) {
      notify(e.message, 'error')
      setShowLogs(true)
    } finally {
      setAction('')
    }
  }

  const apply = () => run('apply', () => window.studio.applyTheme(configRef.current), t('apply.done'))
  const install = () => run('install', () => window.studio.installSpicetify(), t('home.installed.done'))
  const restore = () => {
    setConfirmRestore(false)
    run('restore', () => window.studio.restore(), t('settings.restored'))
  }

  // Klavye kısayolları. Yazı alanlarında Ctrl+Z tarayıcının kendi geri almasına bırakılır.
  const applyRef = useRef(apply)
  applyRef.current = busy || status?.spotify.found === false ? null : apply
  useEffect(() => {
    const onKey = (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      const key = e.key.toLowerCase()
      const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.target.type !== 'range' && e.target.type !== 'checkbox'
      if (key === 's') {
        e.preventDefault()
        applyRef.current?.()
      } else if (!typing && key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (!typing && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  const pages = {
    home: <Home status={status} config={config} setConfig={setConfig} onInstall={install} installing={action === 'install'} goTo={setPage} preview={<Preview config={config} />} />,
    editor: <Editor config={config} setConfig={setConfig} notify={notify} />,
    background: <Background config={config} setConfig={setConfig} notify={notify} />,
    logo: <LogoPage config={config} setConfig={setConfig} notify={notify} />,
    layout: <Layout config={config} setConfig={setConfig} />,
    smart: <Smart config={config} setConfig={setConfig} setPreview={setPreview} />,
    library: <Library config={config} setConfig={setConfig} notify={notify} />,
    settings: (
      <Settings
        settings={settings}
        updateSettings={updateSettings}
        config={config}
        setConfig={setConfig}
        logs={logs}
        busy={busy}
        onInstall={install}
        onRestore={() => setConfirmRestore(true)}
      />
    ),
  }

  const statusText = action === 'apply'
    ? t('apply.working')
    : !applied
      ? t('apply.never')
      : dirty
        ? t('apply.dirty')
        : t('apply.clean')
  const h = history.current
  const PageIcon = NAV_ICONS[page]

  return (
    <div className={`app${settings.reduceMotion ? ' reduce-motion' : ''}`}>
      <header className="titlebar">
        <Logo />
        <span className="app-name">Spotify Theme Studio</span>
      </header>

      <nav className="sidebar">
        {NAV.map(({ id, icon: I, group }) =>
          group ? (
            <span key={group} className="nav-group">{t(`nav.group.${group}`)}</span>
          ) : (
            <button key={id} className={`nav-item${page === id ? ' active' : ''}`} onClick={() => { setPage(id); setPreview(null) }}>
              <I />
              {t(`nav.${id}`)}
            </button>
          ),
        )}
        <a className="discord-link" href={DISCORD_URL} target="_blank" rel="noreferrer">
          <Icon.discord />
          <span>
            <b>{t('discord.title')}</b>
            <small>{t('discord.desc')}</small>
          </span>
        </a>
        <div className="sidebar-foot">
          <span className={`dot ${status?.applied ? 'ok' : 'off'}`} />
          {status?.applied ? t('home.applied') : t('home.notApplied')}
          {status?.spotify.version && <small>Spotify {status.spotify.version}</small>}
        </div>
      </nav>

      <main className={`content${WITH_PREVIEW.includes(page) ? ' with-preview' : ''}`}>
        <div className="content-scroll">
          <div className="page-enter" key={page}>
            {TITLES[page] && (
              <div className="page-title">
                <span className="page-icon"><PageIcon /></span>
                <div>
                  <h2>{t(`${TITLES[page]}.title`)}</h2>
                  {page !== 'settings' && <p>{t(`${TITLES[page]}.subtitle`)}</p>}
                </div>
              </div>
            )}
            {pages[page]}
          </div>
        </div>
        {WITH_PREVIEW.includes(page) && (
          <aside className="preview-col">
            <div className="preview-head">
              <span className="live-dot" />
              {t('preview.live')}
              {preview?.label && <span className="preview-variant">{preview.label}</span>}
            </div>
            <Preview config={config} scheme={preview?.scheme} />
          </aside>
        )}
      </main>

      <footer className="applybar">
        <div className="history-buttons">
          <button className="btn btn-ghost btn-sm icon-only" onClick={undo} disabled={!h.past.length} title={t('apply.undo')} aria-label={t('apply.undo')}>
            <Icon.undo width="16" height="16" />
          </button>
          <button className="btn btn-ghost btn-sm icon-only" onClick={redo} disabled={!h.future.length} title={t('apply.redo')} aria-label={t('apply.redo')}>
            <Icon.redo width="16" height="16" />
          </button>
        </div>
        <div className={`apply-status${dirty && applied ? ' dirty' : ''}`}>
          <span className={`dot ${action === 'apply' ? 'busy' : dirty ? 'warn' : 'ok'}`} />
          <span>
            <b>{statusText}</b>
            <small>{status?.applied ? t('apply.quickHint') : t('apply.hint')}</small>
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowLogs((v) => !v)}>
          <Icon.terminal width="15" height="15" />
          {t('apply.logs')}
        </button>
        <button className={`btn btn-primary btn-apply${dirty && !busy ? ' pulse' : ''}`} onClick={apply} disabled={busy || status?.spotify.found === false} title={t('apply.shortcut')}>
          {action === 'apply' ? <span className="spinner" /> : <Icon.play width="16" height="16" />}
          {action === 'apply' ? t('apply.working') : t('apply.button')}
          {action !== 'apply' && <kbd>Ctrl+S</kbd>}
        </button>
      </footer>

      {showLogs && (
        <div className="log-drawer">
          <div className="log-drawer-head">
            <b>{t('apply.logs')}</b>
            <button className="link-btn" onClick={() => setShowLogs(false)}>✕</button>
          </div>
          <LogTail logs={logs} empty={t('settings.noLogs')} />
        </div>
      )}

      {confirmRestore && (
        <div className="modal-backdrop" onClick={() => setConfirmRestore(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('settings.restore')}</h3>
            <p>{t('settings.restoreConfirm')}</p>
            <div className="row-end">
              <button className="btn btn-ghost" onClick={() => setConfirmRestore(false)}>{t.lang === 'en' ? 'Cancel' : 'Vazgeç'}</button>
              <button className="btn btn-danger" onClick={restore}><Icon.undo width="16" height="16" />{t('settings.restore')}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.kind}`}>{toast.kind === 'error' ? <Icon.alert /> : <Icon.check />}{toast.text}</div>}
    </div>
  )
}

function LogTail({ logs, empty }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])
  return <pre className="log-view" ref={ref}>{logs.length ? logs.map((l) => l.line).join('\n') : empty}</pre>
}
