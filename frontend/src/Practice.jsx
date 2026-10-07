import { useState } from 'react'
import bank from './practice-data.json'

const read = () => { try { const data = JSON.parse(localStorage.getItem('practice-results') || '[]'); return Array.isArray(data) ? data.filter(item => item && typeof item.correct === 'boolean') : [] } catch { return [] } }
export default function Practice({ topics, onOpen }) {
  const [results, setResults] = useState(read)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [cards, setCards] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const item = bank[index]
  const title = topics.find(t => t.id === item.topic)?.title || `Тема ${index + 1}`
  const successes = results.filter(r => r.correct).length
  const check = () => {
    if (choice === null || revealed) return
    const next = [...results, { topic: item.topic, correct: choice === item.correct, date: new Date().toISOString() }].slice(-100)
    setResults(next)
    try { localStorage.setItem('practice-results', JSON.stringify(next)) } catch {}
    setRevealed(true)
  }
  const move = (n) => { setIndex((n + bank.length) % bank.length); setChoice(null); setRevealed(false); setShowBack(false) }
  return <>
    <div className="page-head"><div><div className="eyebrow">Активное повторение</div><h2>Знания в действии</h2><p>Проверяйте понимание и повторяйте понятия. Работает без AI-ключа.</p></div></div>
    <div className="question-toolbar"><div className="segmented"><button className={!cards ? 'active' : ''} onClick={() => setCards(false)}>Тест</button><button className={cards ? 'active' : ''} onClick={() => setCards(true)}>Карточки</button></div><span>{successes}/{results.length} верных ответов</span></div>
    <section className="panel practice-panel">
      <div className="practice-top"><span className="eyebrow">{index + 1} / {bank.length}</span><span>{title}</span></div>
      <h3>{item.question}</h3>
      {cards ? <><div className="flashcard">{showBack ? <><strong>{item.options[item.correct]}</strong><p>{item.explanation}</p><p className="muted">{item.example}</p></> : <p>Сформулируйте ответ своими словами, затем переверните карточку.</p>}</div><button className="btn primary" onClick={() => setShowBack(v => !v)}>{showBack ? 'Скрыть ответ' : 'Показать ответ'}</button></> : <>
        <div className="practice-options" role="group" aria-label="Варианты ответа">{item.options.map((option, n) => <button key={option} disabled={revealed} aria-pressed={choice === n} className={`${choice === n ? 'selected' : ''} ${revealed && n === item.correct ? 'correct' : ''} ${revealed && choice === n && n !== item.correct ? 'incorrect' : ''}`} onClick={() => setChoice(n)}><span>{String.fromCharCode(65 + n)}</span>{option}</button>)}</div>
        {!revealed && <button className="btn primary" disabled={choice === null} onClick={check}>Проверить ответ</button>}
        {revealed && <div className="practice-feedback" role="status"><strong>{choice === item.correct ? 'Верно' : 'Повторите этот момент'}</strong><p>{item.explanation}</p><p>{item.example}</p><button className="text-button" onClick={() => onOpen(item.topic)}>Открыть конспект →</button></div>}
      </>}
      <div className="practice-navigation"><button className="btn secondary" onClick={() => move(index - 1)}>← Назад</button><button className="btn secondary" onClick={() => move(index + 1)}>Следующая →</button></div>
    </section>
    <section className="panel practice-tip"><div className="eyebrow">Как запомнить надолго</div><p>Сначала вспомните ответ без подсказки. После ошибки прочитайте объяснение и вернитесь к вопросу завтра. Проверяйте себя на собственных примерах.</p></section>
  </>
}
