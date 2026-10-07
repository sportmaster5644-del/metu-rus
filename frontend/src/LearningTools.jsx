import { useEffect, useRef, useState } from 'react'
import notes from './notes-data.json'
const normal = value => value.toLowerCase().replaceAll('ё', 'е')
export function CommandPalette({ open, onClose, onTopic, onTab }) {
  const dialog = useRef(), input = useRef()
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (open) { if (!dialog.current.open) dialog.current.showModal(); setQuery(''); input.current?.focus() }
    else if (dialog.current.open) dialog.current.close()
  }, [open])
  const words = normal(query).trim().split(/\s+/).filter(Boolean)
  const results = notes.filter(n => words.every(w => normal(n.title + ' ' + n.text).includes(w))).slice(0,8)
  return <dialog ref={dialog} className="command-dialog" onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose() }} aria-label="Поиск по курсу">
    <div className="command-head"><input ref={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Тема, понятие, пример…" aria-label="Поиск по всему конспекту"/><button onClick={onClose} aria-label="Закрыть поиск">Esc</button></div>
    <div className="command-actions"><button onClick={()=>{onTab('practice');onClose()}}>Практика</button><button onClick={()=>{onTab('exam');onClose()}}>Экзаменатор</button><button onClick={()=>{onTab('plan');onClose()}}>План курса</button></div>
    <div className="command-results">{results.map(n=>{
      const clean=n.text.replace(/[#*]/g,'').split('\n').filter(Boolean).slice(1).join(' ')
      const at=words.length ? Math.max(0,normal(clean).indexOf(words[0])) : 0
      return <button key={n.id} onClick={()=>{onTopic(n.id);onClose()}}><span className="command-number">{n.id.slice(0,2)}</span><div><strong>{n.title}</strong><p>{clean.slice(Math.max(0,at-30),at+140)}…</p></div><span aria-hidden="true">↗</span></button>
    })}{!results.length && <p className="command-empty">Ничего не найдено. Попробуйте другое слово.</p>}</div>
    <div className="command-footer">Поиск по названиям и содержанию · работает офлайн</div>
  </dialog>
}

export function FocusTimer() {
  const [left,setLeft]=useState(25*60), [deadline,setDeadline]=useState(null)
  useEffect(()=>{
    if (!deadline) return
    const tick=()=>{const remain=Math.max(0,Math.ceil((deadline-Date.now())/1000));setLeft(remain);if(!remain)setDeadline(null)}
    tick(); const interval=setInterval(tick,500);return()=>clearInterval(interval)
  },[deadline])
  return <section className="focus-widget panel"><div><div className="eyebrow">Сессия без отвлечений</div><h3>Время для одной темы</h3><p>25 минут чтения и практики. Затем короткий перерыв.</p></div><div className="focus-clock" aria-label={`Осталось ${Math.floor(left/60)} минут ${left%60} секунд`}>{String(Math.floor(left/60)).padStart(2,'0')}<span>:</span>{String(left%60).padStart(2,'0')}</div><div className="focus-controls"><button className="btn primary" onClick={()=>{if(deadline){setLeft(Math.max(0,Math.ceil((deadline-Date.now())/1000)));setDeadline(null)}else{const seconds=left||25*60;setLeft(seconds);setDeadline(Date.now()+seconds*1000)}}}>{deadline?'Пауза':left===25*60?'Начать сессию':'Продолжить'}</button><button className="icon-button" onClick={()=>{setDeadline(null);setLeft(25*60)}} aria-label="Сбросить таймер">↺</button></div>{left===0&&<p role="status" className="focus-finished">Сессия завершена. Сделайте перерыв.</p>}</section>
}

export function PersonalNote({ topicId }) {
  const [value,setValue]=useState('')
  useEffect(()=>{try{setValue(localStorage.getItem('personal-note-'+topicId)||'')}catch{setValue('')}},[topicId])
  const change=value=>{setValue(value);try{localStorage.setItem('personal-note-'+topicId,value)}catch{}}
  return <section className="personal-note"><div className="panel-head"><div><div className="eyebrow">Ваши мысли</div><h3>Заметка к этой теме</h3></div><span>Сохраняется автоматически</span></div><textarea value={value} onChange={e=>change(e.target.value)} rows={4} maxLength={4000} placeholder="Ключевые понятия, свой пример, вопрос преподавателю…" aria-label="Личная заметка"/><small>Заметка хранится только в этом браузере.</small></section>
}
