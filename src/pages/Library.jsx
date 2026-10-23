import { useEffect, useState } from 'react'
import { Section, Swatches } from '../components/Controls.jsx'
import { Icon } from '../components/Icons.jsx'
import { useT } from '../i18n.jsx'

// Kayıtlı temalar, paylaşım kodu ve tema dosyası
export default function Library({ config, setConfig, notify }) {
  const t = useT()
  const [themes, setThemes] = useState([])
  const [confirmId, setConfirmId] = useState(null)
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [input, setInput] = useState('')
  const [decoded, setDecoded] = useState(null)

  useEffect(() => {
    window.studio.listThemes().then(setThemes).catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    window.studio.exportCode(config).then((c) => alive && setCode(c)).catch(() => {})
    return () => { alive = false }
  }, [config])

  const run = async (fn) => {
    try {
      return await fn()
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  const save = () => run(async () => { setThemes(await window.studio.saveTheme(config)); notify(t('library.savedToast')) })
  const remove = (id) => run(async () => { setThemes(await window.studio.deleteTheme(id)); setConfirmId(null) })
  const load = (cfg) => { setConfig(cfg); notify(t('library.loaded')) }

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const decode = () => run(async () => setDecoded(await window.studio.importCode(input)))
  const exportFile = () => run(async () => { if (await window.studio.exportFile(config)) notify(t('library.exported')) })
  const importFile = () => run(async () => { const cfg = await window.studio.importFile(); if (cfg) load(cfg) })
  const localMedia = config.background.type === 'image' || config.background.type === 'video' || config.logo.mode === 'image'
  const dateFmt = new Intl.DateTimeFormat(t.lang === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="page">
      <Section
        title={t('library.saved')}
        aside={
          <button className="btn btn-primary btn-sm" onClick={save}>
            <Icon.save width="15" height="15" />
            {t('library.saveCurrent')}
          </button>
        }
      >
        {themes.length === 0 && <p className="empty">{t('library.empty')}</p>}
        <div className="theme-list">
          {themes.map((th) => (
            <div key={th.id} className={`theme-row${th.name === config.name ? ' current' : ''}`}>
              <Swatches colors={th.config.colors} />
              <div className="theme-meta">
                <b>{th.name}</b>
                <small>{dateFmt.format(th.savedAt)}</small>
              </div>
              {confirmId === th.id ? (
                <>
                  <span className="confirm-text">{t('library.confirmDelete')}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmId(null)}>{t.lang === 'en' ? 'Cancel' : 'Vazgeç'}</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(th.id)}>{t('library.delete')}</button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm icon-only" aria-label={t('library.delete')} title={t('library.delete')} onClick={() => setConfirmId(th.id)}>
                    <Icon.trash width="15" height="15" />
                  </button>
                  <button className="btn btn-sm" onClick={() => load(th.config)}>{t('library.load')}</button>
                </>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('library.file')} hint={t('library.fileHint')}>
        <div className="tool-row">
          <button className="btn" onClick={exportFile}><Icon.download width="16" height="16" />{t('library.exportFile')}</button>
          <button className="btn" onClick={importFile}><Icon.upload width="16" height="16" />{t('library.importFile')}</button>
        </div>
      </Section>

      <Section title={t('share.export')}>
        <div className="code-box">
          <code>{code}</code>
          <button className="btn btn-primary btn-sm" onClick={copy} disabled={!code}>
            {copied ? <Icon.check width="15" height="15" /> : <Icon.copy width="15" height="15" />}
            {copied ? t('share.copied') : t('share.copy')}
          </button>
        </div>
        {localMedia && <p className="hint warn"><Icon.alert width="14" height="14" /> {t('share.mediaNote')}</p>}
      </Section>

      <Section title={t('share.import')}>
        <textarea
          className="text-input code-input"
          rows={3}
          value={input}
          placeholder={t('share.paste')}
          onChange={(e) => { setInput(e.target.value); setDecoded(null) }}
          spellCheck={false}
        />
        <div className="row-end">
          <button className="btn btn-sm" onClick={decode} disabled={!input.trim()}>{t('share.decode')}</button>
        </div>
        {decoded && (
          <div className="decoded">
            <Swatches colors={decoded.colors} />
            <div>
              <b>{decoded.name}</b>
              <small>{t(`smart.${decoded.smart.mode}`)}{decoded.background.type === 'url' ? ` · ${t('bg.url')}` : ''}</small>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { load(decoded); setDecoded(null); setInput('') }}>{t('share.use')}</button>
          </div>
        )}
      </Section>
    </div>
  )
}
