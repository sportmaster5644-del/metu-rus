import { useState, useId } from 'react'
import { motion } from 'framer-motion'

const GOAL = 3
const DAY = 864e5
const ymd = (t) => new Date(t).toLocaleDateString('sv')

function normalize() {
  let raw = {}
  try { raw = JSON.parse(localStorage.getItem('streak') || '{}') || {} } catch {}
  const today = ymd(Date.now())
  const yesterday = ymd(Date.now() - DAY)
  const streak = raw.last === today || raw.last === yesterday ? raw.streak || 0 : 0
  return {
    streak,
    last: raw.last || '',
    today: raw.date === today ? raw.today || 0 : 0,
    date: today,
    yesterday,
    history: Array.isArray(raw.history) ? raw.history.slice(-90) : [],
  }
}

export function useStreak() {
  const [state, setState] = useState(normalize)
  const bump = () => {
    setState(previous => {
      const today = ymd(Date.now())
      const base = previous.date === today ? previous : normalize()
      const next = { ...base, today: base.today + 1 }
      if (next.today >= GOAL && base.last !== base.date) {
        next.streak = (base.last === base.yesterday ? base.streak : 0) + 1
        next.last = base.date
        next.history = [...new Set([...base.history, base.date])].slice(-90)
      }
      try { localStorage.setItem('streak', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { ...state, bump }
}

export default function Streak({ s }) {
  const id = `streak-${useId().replace(/:/g, '')}`
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, s.today / GOAL)
  const week = Array.from({ length: 7 }, (_, i) => ymd(Date.now() - (6 - i) * DAY))

  return (
    <section className="streak-card">
      <div className="streak-ring">
        <svg width="78" height="78" viewBox="0 0 72 72" aria-label={`Сегодня ${Math.min(s.today, GOAL)} из ${GOAL} действий`} role="img">
          <defs>
            <linearGradient id={id} x1="0" x2="1">
              <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
              <stop offset="1" style={{ stopColor: 'var(--accent-2)' }} />
            </linearGradient>
          </defs>
          <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="6" />
          <motion.circle cx="36" cy="36" r={radius} fill="none" stroke={`url(#${id})`} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: circumference * (1 - progress) }} transform="rotate(-90 36 36)" />
        </svg>
        <div className="streak-flame">{s.today >= GOAL ? '✓' : '↗'}</div>
      </div>
      <div className="streak-copy">
        <div className="eyebrow">Серия обучения</div>
        <div className="streak-value"><strong>{s.streak}</strong><span>дней подряд</span></div>
        <p>Сегодня <b>{Math.min(s.today, GOAL)}/{GOAL}</b> действий. Ещё один небольшой шаг — и серия сохранится.</p>
        <div className="week-dots">{week.map((day) => <span key={day} className={s.history.includes(day) ? 'active' : ''} title={day}>{s.history.includes(day) ? '✓' : '·'}</span>)}</div>
      </div>
    </section>
  )
}
