import { useEffect, useState } from 'react'
import { isHex, cleanHex } from '../../shared/theme.js'
import { useT } from '../i18n.jsx'

export function Section({ title, hint, children, aside }) {
  return (
    <section className="section">
      {(title || hint || aside) && (
        <header className="section-head">
          <div>
            {title && <h3>{title}</h3>}
            {hint && <p className="hint">{hint}</p>}
          </div>
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}

export function ColorField({ label, value, onChange, placeholder, onReset, resetLabel }) {
  const [text, setText] = useState(value || '')
  useEffect(() => setText(value || ''), [value])
  const shown = value || placeholder || '000000'

  const commit = (v) => {
    setText(v)
    if (isHex(v)) onChange(cleanHex(v))
  }

  return (
    <label className={`color-field${value ? '' : ' is-auto'}`}>
      <span className="swatch" style={{ background: `#${shown}` }}>
        <input type="color" value={`#${shown.toLowerCase()}`} onChange={(e) => onChange(cleanHex(e.target.value))} />
      </span>
      <span className="color-meta">
        <span className="color-label">{label}</span>
        <input
          className="hex"
          value={text ? `#${text.replace('#', '')}` : ''}
          placeholder={placeholder ? `#${placeholder}` : ''}
          onChange={(e) => commit(e.target.value.replace('#', '').slice(0, 6))}
          spellCheck={false}
        />
      </span>
      {onReset && value && (
        <button type="button" className="link-btn" onClick={(e) => { e.preventDefault(); onReset() }}>
          {resetLabel}
        </button>
      )}
    </label>
  )
}

export function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <label className="slider">
      <span className="slider-top">
        <span>{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>
        <span className="toggle-label">{label}</span>
        {desc && <span className="hint">{desc}</span>}
      </span>
      <span className={`toggle${checked ? ' on' : ''}`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="knob" />
      </span>
    </label>
  )
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Swatches({ colors, size = 'md' }) {
  return (
    <span className={`swatches swatches-${size}`}>
      {['main', 'card', 'accent', 'text'].map((k) => (
        <span key={k} style={{ background: `#${colors[k]}` }} />
      ))}
    </span>
  )
}

// Dosya seçme alanı: tıklayınca pencere açılır, dosya sürüklenip bırakılabilir
export function DropZone({ kind, fileName, onPicked, notify, icon, hint }) {
  const [over, setOver] = useState(false)
  const t = useT()

  async function pick(file) {
    try {
      const res = await window.studio.pickMedia(kind, file)
      if (res) onPicked(res)
    } catch (e) {
      notify(e.message, 'error')
    }
  }

  return (
    <div
      className={`file-pick${over ? ' over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const file = e.dataTransfer.files[0]
        if (file) pick(file)
      }}
    >
      <span className="file-icon">{icon}</span>
      <span className="file-name">
        {fileName || t('drop.hint')}
        {hint && <small>{hint}</small>}
      </span>
      <button className="btn btn-sm" onClick={() => pick()}>
        {fileName ? t('drop.change') : t('drop.pick')}
      </button>
    </div>
  )
}
