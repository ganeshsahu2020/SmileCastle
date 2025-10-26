// src/components/brand/SmileCastleWordmark.jsx
// Mark + text lockup. Keeps everything inline (no external files).
import SmileCastleMark from './SmileCastleMark'

export default function SmileCastleWordmark({
  variant = 'color',          // 'color' | 'mono'
  theme = 'violet',           // used for color variant
  label = 'Smile Castle',     // text to show
  className = 'h-8',          // container height (driven by mark)
  textClass = 'text-base font-extrabold tracking-tight',
  markClass = 'h-8 w-8',
}) {
  const textColor = variant === 'mono' ? 'text-current' : 'text-slate-900'
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <SmileCastleMark variant={variant} theme={theme} className={markClass} />
      <span className={`${textClass} ${textColor}`}>{label}</span>
    </div>
  )
}
