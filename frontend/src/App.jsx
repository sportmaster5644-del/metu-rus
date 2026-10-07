import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Practice from './Practice'
import useNarrator from './useNarrator'
import { CommandPalette, FocusTimer, PersonalNote } from './LearningTools'
import LOCAL_NOTES from './notes-data.json'
import { clientHealth, streamTutorChat } from './aiClient'
const Avatar = lazy(() => import('./Avatar'))
const asset = path => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`
function TutorAvatar(props) { return <Suspense fallback={<div className="avatar-fallback">Загрузка 3D…</div>}><Avatar {...props} /></Suspense> }
import Streak, { useStreak } from './Streak'

const INFO = {
  uni: 'METU — Международный инженерно-технологический университет',
  course: 'Русский язык',
  teacher: 'Измаилов Акбар Парухович',
  sem: 'осенний 2026/2027',
  ctrl: 'экзамен',
  ini: 'ИА',
}

const MODULES = [
  ['Языковая политика и стили речи', 0, 4, 'СТИЛЬ'],
  ['Функционально-смысловые типы речи', 4, 7, 'ТИПЫ РЕЧИ'],
  ['Структурно-смысловой анализ научного текста', 7, 11, 'АНАЛИЗ'],
  ['Развёртывание и сжатие информации', 11, 15, 'ТЕКСТ'],
]

const SCALE = [
  ['A', '4,0', '95–100', 'Отлично'], ['A−', '3,67', '90–94', 'Отлично'], ['B+', '3,33', '85–89', 'Хорошо'],
  ['B', '3,0', '80–84', 'Хорошо'], ['B−', '2,67', '75–79', 'Хорошо'], ['C+', '2,33', '70–74', 'Удовлетворительно'],
  ['C', '2,0', '65–69', 'Удовлетворительно'], ['C−', '1,67', '60–64', 'Удовлетворительно'], ['D+', '1,33', '55–59', 'Удовлетворительно'],
  ['D', '1,0', '50–54', 'Удовлетворительно'], ['FX', '0,5', '25–49', 'Неудовлетворительно'], ['F', '0', '0–24', 'Неудовлетворительно'],
]

const TABS = [
  ['home', 'Главная', '⌂'],
  ['notes', 'Конспекты', '▤'],
  ['questions', 'Вопросы', '?'],
  ['practice', 'Практика', '✓'],
  ['plan', 'План', '☷'],
  ['exam', 'Экзамен', '◈'],
  ['stats', 'Аналитика', '◌'],
]

const QUICK_QUESTIONS = [
  'Чем приказ отличается от распоряжения?',
  'Что такое данное и новое?',
  'Какие бывают виды плана?',
  'Что такое КЗТ?',
]

const QUESTION_SEEDS = [
  { level: 'База', tag: 'Понятие', text: 'Что такое функциональный стиль речи и зачем он нужен?' },
  { level: 'База', tag: 'Разбор', text: 'Как определить тему и главную мысль научного текста?' },
  { level: 'Экзамен', tag: 'Сравнение', text: 'Сравните описание, повествование и рассуждение.' },
  { level: 'Экзамен', tag: 'Практика', text: 'Как правильно составить простой и сложный план текста?' },
  { level: 'Сложно', tag: 'Анализ', text: 'Как связаны данное, новое и смысловые центры текста?' },
  { level: 'Сложно', tag: 'Практика', text: 'Как сжать научный текст, сохранив основную информацию?' },
]

const FALLBACK_TOPICS = LOCAL_NOTES.map(({ id, title }) => ({ id, title }))

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const shapes = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5" /><path d="M9.5 21v-6h5v6" /></>,
    notes: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    question: <><circle cx="12" cy="12" r="9" /><path d="M9.9 9a2.3 2.3 0 1 1 3.8 1.8c-1 .8-1.7 1.2-1.7 2.6" /><path d="M12 17h.01" /></>,
    plan: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h5M8 16h8" /></>,
    exam: <><path d="m12 3 7 4v5c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V7z" /><path d="m9 12 2 2 4-4" /></>,
    stats: <><path d="M5 20V10M12 20V4M19 20v-7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.4" /><path d="m16 16 4.5 4.5" /></>,
    mic: <><rect x="8" y="3" width="8" height="12" rx="4" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" /></>,
    send: <><path d="m4 4 16 8-16 8 3-8z" /><path d="M7 12h13" /></>,
    spark: <><path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" /></>,
    copy: <><rect x="9" y="9" width="10" height="10" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  }
  return <svg {...common}>{shapes[name] || shapes.spark}</svg>
}

function Ring({ value, total, size = 112 }) {
  const id = `ring-${useId().replace(/:/g, '')}`
  const radius = 43
  const circumference = 2 * Math.PI * radius
  const safeTotal = Math.max(total, 1)
  const progress = Math.min(1, Math.max(0, value / safeTotal))
  return (
    <svg className="progress-ring" width={size} height={size} viewBox="0 0 112 112" role="img" aria-label={`Изучено ${value} из ${total} тем`}>
      <defs><linearGradient id={id} x1="0" x2="1"><stop offset="0" style={{ stopColor: 'var(--accent)' }} /><stop offset="1" style={{ stopColor: 'var(--accent-2)' }} /></linearGradient></defs>
      <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="9" />
      <circle cx="56" cy="56" r={radius} fill="none" stroke={`url(#${id})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} transform="rotate(-90 56 56)" />
      <text x="56" y="53" textAnchor="middle" className="ring-number">{value}/{total}</text>
      <text x="56" y="70" textAnchor="middle" className="ring-label">тем</text>
    </svg>
  )
}

function Doc({ text, onAsk }) {
  const lines = text.split('\n')
  const title = lines.shift() || 'Конспект'
  const headings = lines.filter(line=>line.startsWith('## '))
  const minutes = Math.max(1,Math.ceil(text.split(/\s+/).length/170))
  return (
    <article className="lesson-document">
      <div className="doc-kicker">Учебный материал</div>
      <h1>{title}</h1><div className="reading-meta">{minutes} мин чтения · {headings.length} разделов</div><details className="doc-toc"><summary>Содержание темы</summary><div>{headings.map((h,i)=><a href={`#section-${i}`} key={h}>{h.slice(3)}</a>)}</div></details>
      {lines.filter(line => line.trim()).map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>
        if (line.startsWith('## ')) return <h2 id={`section-${headings.indexOf(line)}`} key={i}>{line.slice(3)}</h2>
        if (line.startsWith('- ')) return <div className="doc-list" key={i}><span>•</span>{line.slice(2)}</div>
        if (/^\d+\. /.test(line)) return <div className="doc-list" key={i}><span>{line.match(/^\d+/)[0]}</span>{line.replace(/^\d+\. /, '')}</div>
        return <p key={i}>{line}</p>
      })}
      <button className="inline-ai" onClick={() => onAsk(title)}><Icon name="spark" size={15} /> Объяснить эту тему проще</button>
    </article>
  )
}

function EmptyState({ title, text, action }) {
  return <div className="empty-state"><div className="empty-icon"><Icon name="spark" size={22} /></div><h3>{title}</h3><p>{text}</p>{action}</div>
}

export default function App() {
  const narrator = useNarrator()
  const [tab, setTab] = useState('home')
  const [topics, setTopics] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)
  const [backendError, setBackendError] = useState('')
  const [health, setHealth] = useState(null)
  const [currentTopic, setCurrentTopic] = useState('')
  const [text, setText] = useState('')
  const [notesFilter, setNotesFilter] = useState('')
  const [done, setDone] = useState(() => { const value = readStorage('done', []); return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [] })
  const [status, setStatus] = useState('Готов')
  const [answer, setAnswer] = useState('')
  const [source, setSource] = useState('')
  const [listening, setListening] = useState(false)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState(() => readStorage('ui-theme-v11', 'dark'))
  const [accent, setAccent] = useState(() => readStorage('ui-accent-v11', 'indigo'))
  const [intro, setIntro] = useState(false)
  const [examMode, setExamMode] = useState(false)
  const [quizLoading, setQuizLoading] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [quality, setQuality] = useState(() => readStorage('3d-quality-v10', 'auto'))
  const [voice, setVoice] = useState(false)
  const speechActive = narrator.active
  const [voiceSpeed,setVoiceSpeed] = useState(1)
  const [voiceVolume,setVoiceVolume] = useState(.9)
  const [searchOpen,setSearchOpen] = useState(false)
  const [focusReader,setFocusReader] = useState(false)
  const [bookmarks,setBookmarks] = useState(()=>{const d=readStorage('note-bookmarks',[]);return Array.isArray(d)?d:[]})
  const [onlyBookmarks,setOnlyBookmarks] = useState(false)
  const [stats, setStats] = useState({ total: 0, notes: 0, web: 0, last: [], gaps: [] })
  const [history, setHistory] = useState(() => { const value = readStorage('question-history', []); return Array.isArray(value) ? value.filter(item => item && typeof item.question === 'string' && typeof item.answer === 'string').slice(-20) : [] })
  const [questionFilter, setQuestionFilter] = useState('Все')
  const [cheer, setCheer] = useState(0)

  const streak = useStreak()
  const analyser = narrator.analyser
  const controller = useRef(null)
  const recognition = useRef(null)
  const quiz = useRef(null)
  const streamedAnswer = useRef('')
  const questionInput = useRef(null)
  const topicRequest = useRef(0)
  const answerError = useRef(false)
  const assistantPanel = useRef(null)
  const requestId = useRef(0)
  const streamedSource = useRef('')

  const completed = topics.filter(topic => done.includes(topic.id)).length
  const totalTopics = topics.length || FALLBACK_TOPICS.length
  const nextTopic = topics.find(topic => !done.includes(topic.id)) || topics[0]
  const selectedTopic = topics.find(topic => topic.id === currentTopic) || nextTopic
  const filteredTopics = topics.filter(topic => (!onlyBookmarks || bookmarks.includes(topic.id)) && (LOCAL_NOTES.find(n=>n.id===topic.id)?.text||topic.title).toLowerCase().replaceAll('ё','е').includes(notesFilter.trim().toLowerCase().replaceAll('ё','е')))

  const questionBank = useMemo(() => {
    const generated = topics.slice(0, 15).flatMap((topic, index) => [
      { id: `${topic.id}-base`, level: 'База', tag: 'Тема', text: `Объясните простыми словами тему «${topic.title}».` },
      { id: `${topic.id}-exam`, level: 'Экзамен', tag: `Тема ${index + 1}`, text: `Как бы вы объяснили преподавателю тему «${topic.title}» за одну минуту?` },
    ])
    return [...QUESTION_SEEDS.map((q, i) => ({ ...q, id: `seed-${i}` })), ...generated]
  }, [topics])

  const visibleQuestions = questionBank.filter(item => questionFilter === 'Все' || item.level === questionFilter).slice(0, 18)

  const changeTab = (next) => {
    const update = () => setTab(next)
    try {
      if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.startViewTransition(update)
      else update()
    } catch { update() }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    document.documentElement.dataset.mode = theme
    document.documentElement.dataset.accent = accent
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark'
    try {
      localStorage.setItem('ui-theme-v11', JSON.stringify(theme))
      localStorage.setItem('ui-accent-v11', JSON.stringify(accent))
    } catch {}
  }, [theme, accent])

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    const key = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && !document.activeElement?.isContentEditable) {
        event.preventDefault()
        questionInput.current?.focus()
      }
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('keydown', key)
    }
  }, [])

  useEffect(() => {
    const localTopics = FALLBACK_TOPICS
    setTopics(localTopics)
    setCurrentTopic(localTopics[0]?.id || '')
    setText(LOCAL_NOTES[0]?.text || '')
    setHealth(clientHealth())
    setBackendError('')
    setTopicsLoading(false)
  }, [])



  useEffect(() => { try { localStorage.setItem('done', JSON.stringify(done)) } catch {} }, [done])
  useEffect(() => { try { localStorage.setItem('question-history', JSON.stringify(history.slice(-20))) } catch {} }, [history])
  useEffect(() => { try { localStorage.setItem('3d-quality-v10', JSON.stringify(quality)) } catch {} }, [quality])

  useEffect(() => {
    setStats({ total: history.length, notes: history.filter(h => ['notes', 'local'].includes(h.source)).length, web: history.filter(h => h.source === 'knowledge').length, last: history.map(h => h.question).slice(-10), gaps: history.filter(h => h.source === 'knowledge').map(h => h.question).slice(-10) })
  }, [history])


  useEffect(() => () => {
    controller.current?.abort()
    recognition.current?.stop?.()
  }, [])

  const act = () => {
    streak.bump()
    setCheer(value => value + 1)
  }

  useEffect(()=>{narrator.configure(voiceSpeed,voiceVolume)},[voiceSpeed,voiceVolume])
  useEffect(()=>{try{localStorage.setItem('note-bookmarks',JSON.stringify(bookmarks))}catch{}},[bookmarks])
  const clearAudioQueue = narrator.stop
  const initAudio = narrator.prime
  const toggleBookmark = id => setBookmarks(prev=>prev.includes(id)?prev.filter(v=>v!==id):[...prev,id])

  const openTopic = async (id) => {
    topicRequest.current++
    act()
    setCurrentTopic(id)
    const local = LOCAL_NOTES.find(item => item.id === id)
    setText(local?.text || '')
    changeTab('notes')
  }

  const toggleTopic = (id) => {
    const isDone = done.includes(id)
    act()
    setDone(current => isDone ? current.filter(value => value !== id) : [...current, id])
  }

  const streamChat = async (question, signal, id) => {
    streamedAnswer.current = ''
    answerError.current = false
    setAnswer('')
    setSource('')
    streamedSource.current = ''
    setStatus('Думает…')
    const final = await streamTutorChat({
      question,
      history: history.slice(-4).flatMap(item => [
        { role: 'user', content: item.question.slice(0, 2000) },
        { role: 'assistant', content: item.answer.slice(0, 4000) },
      ]),
      signal,
      onEvent: payload => {
        if (id !== requestId.current) return
        if (payload.type === 'text') {
          streamedAnswer.current += payload.value || ''
          setAnswer(value => value + (payload.value || ''))
          if (voice) narrator.feed(payload.value || '')
        } else if (payload.type === 'source') {
          streamedSource.current = payload.value || ''
          setSource(payload.value || '')
        } else if (payload.type === 'error') {
          answerError.current = true
          narrator.stop()
          setAnswer(current => `${current}\n\n${payload.value || 'Ошибка AI'}`)
        }
      },
    })
    if (id === requestId.current) {
      if (voice && !answerError.current) narrator.finish()
      setStatus('Готов')
    }
    return final || streamedAnswer.current
  }


  const ask = async (value) => {
    const clean = value.trim()
    if (!clean) return
    act()
    assistantPanel.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    controller.current?.abort()
    const abortController = new AbortController()
    controller.current = abortController
    const id = ++requestId.current
    clearAudioQueue()
    initAudio()
    try {
      const finalAnswer = await streamChat(clean, abortController.signal, id)
      if (id !== requestId.current || answerError.current) return ''
      setHistory(current => [...current, { question: clean, answer: finalAnswer, source: streamedSource.current || source, time: new Date().toISOString() }].slice(-20))
      return finalAnswer
    } catch (error) {
      if (error?.name === 'AbortError') return
      if (id === requestId.current) {
        setAnswer(online ? 'Не удалось получить ответ от AI-функции. Проверьте VITE_AI_API_URL и настройки Cloudflare Worker.' : 'Нет соединения. Попробуйте снова после восстановления интернета.')
        setStatus('Ошибка')
      }
    }
  }

  const startQuiz = async (topicOverride = null) => {
    if (quizLoading) return
    const topic = (topicOverride?.title ? topicOverride : null) || selectedTopic || FALLBACK_TOPICS[0]
    quiz.current = { topic: topic.title, question: '' }
    setExamMode(true)
    setQuizLoading(true)
    setQuery('')
    try {
      const question = await ask(`Задай студенту один короткий экзаменационный вопрос по теме «${topic.title}». Только вопрос, без ответа и без пояснений.`)
      if (quiz.current && question) quiz.current.question = question
      else { quiz.current = null; setExamMode(false) }
    } finally {
      setQuizLoading(false)
    }
  }

  const submitQuizAnswer = async (value) => {
    const clean = value.trim()
    const activeQuiz = quiz.current
    if (!clean || !activeQuiz?.question) return
    quiz.current = null
    setExamMode(false)
    setQuery('')
    await ask(`Тема «${activeQuiz.topic}». Вопрос преподавателя: ${activeQuiz.question}. Ответ студента: ${clean}. Оцени ответ по учебному материалу. Сначала кратко скажи, что верно. Затем, что упущено или ошибочно. В конце поставь оценку по шкале от 1 до 10 и одну конкретную рекомендацию.`)
  }

  const submitQuery = (value) => {
    const clean = value.trim()
    if (!clean) return
    if (examMode) submitQuizAnswer(clean)
    else ask(clean)
    setQuery('')
  }

  const start = () => {
    initAudio()
    try { sessionStorage.setItem('seen', '1') } catch {}
    setIntro(false)
  }

  const toggleMic = () => {
    if (listening) {
      recognition.current?.stop?.()
      return
    }
    initAudio()
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setAnswer('Голосовой ввод недоступен в этом браузере. Используйте Chrome или Edge на HTTPS/localhost.')
      return
    }
    const recognitionInstance = new Recognition()
    recognitionInstance.lang = 'ru-RU'
    recognitionInstance.interimResults = false
    recognitionInstance.continuous = false
    recognition.current = recognitionInstance
    recognitionInstance.onstart = () => { setListening(true); setStatus('Слушаю…') }
    recognitionInstance.onerror = () => { setListening(false); setStatus('Готов'); setAnswer('Микрофон недоступен. Разрешите доступ к микрофону в браузере.') }
    recognitionInstance.onend = () => { setListening(false); setStatus(current => current === 'Слушаю…' ? 'Готов' : current) }
    recognitionInstance.onresult = event => submitQuery(Array.from(event.results).map(item => item[0]?.transcript || '').join(' '))
    try { recognitionInstance.start() } catch { setListening(false); setStatus('Готов'); setAnswer('Не удалось запустить микрофон. Используйте текстовый ввод.') }
  }

  const exportProgress = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      course: INFO.course,
      completed,
      completedTopics: done,
      totalTopics,
      streak: streak.streak,
      history: history.slice(-10),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const file = new File([blob], 'metu-russian-progress.json', { type: 'application/json' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ title: 'Прогресс по русскому', files: [file] }); return } catch {}
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyAnswer = async () => {
    if (!answer) return
    try {
      await navigator.clipboard.writeText(answer)
      setStatus('Скопировано')
      window.setTimeout(() => setStatus('Готов'), 900)
    } catch {}
  }

  const askAboutCurrent = (subject) => {
    const title = subject || selectedTopic?.title || INFO.course
    submitQuery(`Объясни тему «${title}» простыми словами. Дай короткий пример и одну типичную ошибку студента.`)
  }

  const resetSession = () => {
    controller.current?.abort()
    requestId.current += 1
    clearAudioQueue()
    setAnswer('')
    setSource('')
    setStatus('Готов')
    setExamMode(false)
    setQuery('')
    quiz.current = null
  }

  const assistantEmotion = listening ? 'listening' : status === 'Думает…' ? 'thinking' : speechActive || status === 'Говорит…' ? 'speaking' : 'idle'
  const sourceLabel = source === 'local' ? 'Локальный конспект' : source === 'knowledge' ? 'Знания AI' : source === 'notes' ? 'Конспект' : source === 'web' ? 'Интернет' : source === 'none' ? 'Нет источника' : ''
  const progress = Math.round((completed / Math.max(totalTopics, 1)) * 100)

  return (
    <div className={`app-shell ${focusReader && tab==='notes' ? 'reader-focus' : ''}`}>
      <CommandPalette open={searchOpen} onClose={()=>setSearchOpen(false)} onTopic={openTopic} onTab={changeTab} />
      <AnimatePresence>
        {intro && (
          <motion.div className="welcome" role="dialog" aria-modal="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="welcome-grid" />
            <div className="welcome-copy">
              <div className="brand-line"><img className="brand-mark" src={asset('metu-logo.jpg')} alt="METU" /><span>{INFO.uni}</span></div>
              <div className="status-pill"><span className="status-dot" />{online ? 'Система онлайн' : 'Офлайн-режим'}</div>
              <h1>Русский язык.<br /><em>Без лишнего.</em></h1>
              <p>Современное учебное пространство с AI-преподавателем, интерактивными вопросами, голосом и 3D-персонажем.</p>
              <div className="welcome-actions">
                <button className="btn primary xl" onClick={start}><Icon name="arrow" size={18} /> Начать обучение</button>
                <span className="welcome-note">/ — вопрос · Ctrl K — поиск</span>
              </div>
            </div>
            <div className="welcome-avatar">
              <div className="welcome-avatar-glow" />
              <TutorAvatar analyser={analyser} cheer={cheer} quality={quality} emotion={assistantEmotion} />
              <div className="welcome-card"><span>Сегодняшний фокус</span><strong>{nextTopic?.title || 'Начните с первой темы'}</strong><small>{completed}/{totalTopics} тем пройдено</small></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="topbar">
        <div className="brand-block">
          <img className="brand-logo" src={asset('metu-logo.jpg')} alt="METU — Международный инженерно-технологический университет" />
          <div><strong>{INFO.course}</strong><span>{INFO.uni}</span></div>
        </div>
        <div className="topbar-meta"><button className="global-search" onClick={()=>setSearchOpen(true)}><Icon name="search" size={16}/><span>Поиск по курсу</span><kbd>Ctrl K</kbd></button>
          <div className="teacher-meta"><b>{INFO.teacher}</b><span>{INFO.sem} · {INFO.ctrl}</span></div>
          <div className={`connection ${online ? 'online' : ''}`}><span />{online ? 'Онлайн' : 'Офлайн'}</div>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-top">
            <div className="sidebar-label">Курс</div>
            <div className="course-mini">Русский язык</div>
          </div>
          <nav className="main-nav" aria-label="Основная навигация">
            {TABS.map(([id, label, fallbackIcon]) => (
              <button key={id} className={tab === id ? 'active' : ''} onClick={() => changeTab(id)} title={label}>
                <span className="nav-icon"><Icon name={id === 'home' ? 'home' : id === 'notes' ? 'notes' : id === 'questions' ? 'question' : id === 'plan' ? 'plan' : id === 'exam' ? 'exam' : 'stats'} size={17} /></span>
                <span>{label}</span>
                {id === 'questions' && <i aria-hidden="true">NEW</i>}
              </button>
            ))}
          </nav>
          <div className="sidebar-spacer" />
          <div className="sidebar-progress">
            <div className="sidebar-progress-top"><span>Подготовка</span><strong>{progress}%</strong></div>
            <div className="progress-bar"><i style={{ width: `${progress}%` }} /></div>
            <p>{completed} из {totalTopics} тем закрыто</p>
            <button className="text-button" onClick={() => changeTab('plan')}>Открыть план <Icon name="arrow" size={14} /></button>
          </div>
          <div className="sidebar-footer">
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Переключить тему">
              <span>{theme === 'dark' ? '☼' : '☾'}</span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </button>
            <div className="accent-row">
              {['indigo', 'titanium', 'emerald'].map(color => <button key={color} className={accent === color ? 'active' : ''} data-accent-dot={color} onClick={() => setAccent(color)} aria-label={`Акцент ${color}`} />)}
            </div>
          </div>
        </aside>

        <main className="content-area">
          <AnimatePresence mode="wait">
            <motion.div key={tab} className="page" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
              {backendError && <div className="notice-banner"><span>i</span><div><b>Локальный режим</b><p>{backendError}</p></div><button onClick={() => setBackendError('')}>×</button></div>}

              {tab === 'home' && (
                <>
                  <section className="hero-panel">
                    <div className="hero-copy">
                      <div className="eyebrow"><span className="tiny-orbit"/> ЛИЧНОЕ УЧЕБНОЕ ПРОСТРАНСТВО</div>
                      <h2>Больше понимания.<br /><span>Меньше зубрёжки.</span></h2>
                      <p>Соберите знания в систему: понятные конспекты, практика и живой диалог с AI-преподавателем.</p>
                      <div className="hero-actions">
                        <button className="btn primary" onClick={() => nextTopic && openTopic(nextTopic.id)}>{completed ? 'Продолжить обучение' : 'Начать с первой темы'} <Icon name="arrow" size={17} /></button>
                        <button className="btn secondary" onClick={() => changeTab('questions')}><Icon name="question" size={16} /> Тренировать вопросы</button>
                      </div>
                      <div className="hero-tags"><span>15 тем</span><span>Тесты + карточки</span><span>AI + голос</span><span>3D tutor</span></div>
                    </div>
                    <div className="hero-progress">
                      <div className="hero-progress-ring"><Ring value={completed} total={totalTopics} size={132} /></div>
                      <div><span>Следующий шаг</span><strong>{nextTopic?.title || 'Все темы пройдены'}</strong><button onClick={() => nextTopic && openTopic(nextTopic.id)}>Открыть тему <Icon name="arrow" size={14} /></button></div>
                    </div>
                  </section>

                  <div className="metrics-grid">
                    <div className="metric-card"><span>Пройдено</span><strong>{completed}</strong><small>из {totalTopics} тем</small><div className="metric-line"><i style={{ width: `${progress}%` }} /></div></div>
                    <div className="metric-card"><span>Серия</span><strong>{streak.streak}</strong><small>дней подряд</small><div className="metric-chip">{Math.min(streak.today, 3)}/3 сегодня</div></div>
                    <div className="metric-card"><span>Вопросы</span><strong>{history.length}</strong><small>сохранено локально</small><div className="metric-chip accent">AI tutor</div></div>
                    <div className="metric-card"><span>Статус AI</span><strong>{health?.groq ? 'AI' : 'LOCAL'}</strong><small>{health?.groq ? 'Serverless подключён' : 'Конспекты + практика'}</small><div className={`metric-chip ${health?.groq ? 'success' : ''}`}>{sourceLabel || 'готов к вопросу'}</div></div>
                  </div>

                  <div className="home-grid">
                    <section className="panel route-panel">
                      <div className="panel-head"><div><div className="eyebrow">Сегодня</div><h3>Ваш маршрут</h3></div><button className="icon-button" onClick={exportProgress} title="Экспорт прогресса"><Icon name="copy" size={16} /></button></div>
                      <div className="route-list">
                        <button onClick={() => nextTopic && openTopic(nextTopic.id)}><span className="route-index">01</span><div><b>Прочитать следующую тему</b><small>{nextTopic?.title || 'Все темы пройдены'}</small></div><Icon name="arrow" size={16} /></button>
                        <button onClick={() => startQuiz()}><span className="route-index">02</span><div><b>Ответить на вопрос</b><small>1 мини-вопрос по текущей теме</small></div><Icon name="arrow" size={16} /></button>
                        <button onClick={() => toggleMic()}><span className="route-index">03</span><div><b>Объяснить голосом</b><small>Потренировать устный ответ</small></div><Icon name="arrow" size={16} /></button>
                      </div>
                    </section>
                    <Streak s={streak} />
                  </div>

                  <FocusTimer />
                  <section className="panel module-overview">
                    <div className="panel-head"><div><div className="eyebrow">Курс</div><h3>Четыре модуля</h3></div><button className="text-button" onClick={() => changeTab('plan')}>Полный план <Icon name="arrow" size={14} /></button></div>
                    <div className="modules-grid">
                      {MODULES.map(([name, startIndex, endIndex, tag], index) => {
                        const items = topics.slice(startIndex, endIndex)
                        const moduleDone = items.filter(item => done.includes(item.id)).length
                        const moduleProgress = items.length ? Math.round((moduleDone / items.length) * 100) : 0
                        return <button className="module-card" key={name} onClick={() => items[0] && openTopic(items[0].id)}><span>{String(index + 1).padStart(2, '0')}</span><i>{tag}</i><h4>{name}</h4><div className="module-bottom"><small>{moduleDone}/{items.length || endIndex - startIndex}</small><div className="mini-progress"><em style={{ width: `${moduleProgress}%` }} /></div></div></button>
                      })}
                    </div>
                  </section>
                </>
              )}

              {tab === 'notes' && (
                <div className="notes-layout">
                  <aside className="notes-sidebar panel">
                    <div className="panel-head compact"><div><div className="eyebrow">Конспекты</div><h3>Темы курса</h3></div><span className="count-badge">{filteredTopics.length}</span></div>
                    <div className="search-box"><Icon name="search" size={16} /><input value={notesFilter} onChange={e => setNotesFilter(e.target.value)} placeholder="Поиск в конспектах…" aria-label="Поиск в конспектах" /></div>
                    <button className={`bookmark-filter ${onlyBookmarks?'active':''}`} onClick={()=>setOnlyBookmarks(v=>!v)}>☆ {onlyBookmarks?'Все темы':'Только избранное'} <span>{bookmarks.length}</span></button>
                    {topicsLoading ? <div className="skeleton-stack">{[1, 2, 3, 4, 5].map(item => <span key={item} />)}</div> : <div className="topic-list">{filteredTopics.map((topic, index) => <button key={topic.id} className={currentTopic === topic.id ? 'active' : ''} onClick={() => openTopic(topic.id)}><span className="topic-number">{String(index + 1).padStart(2, '0')}</span><span className="topic-name">{topic.title}</span>{bookmarks.includes(topic.id) && <span className="topic-bookmarked" aria-label="В избранном">★</span>}{done.includes(topic.id) && <Icon name="check" size={14} />}</button>)}</div>}
                    {!topicsLoading && !filteredTopics.length && <p className="muted">Ничего не найдено.</p>}
                  </aside>
                  <section className="panel document-panel">
                    <div className="document-toolbar"><div><div className="eyebrow">{selectedTopic?.title || 'Тема'}</div><span>{done.includes(currentTopic) ? '✓ Тема отмечена' : 'Не завершено'}</span></div><div className="document-toolbar-actions"><button className="btn tiny secondary" aria-pressed={bookmarks.includes(currentTopic)} onClick={()=>toggleBookmark(currentTopic)}>{bookmarks.includes(currentTopic)?'★ Сохранено':'☆ Сохранить'}</button><button className="btn tiny secondary" aria-pressed={focusReader} onClick={()=>setFocusReader(v=>!v)}>{focusReader?'Вернуть панели':'Режим чтения'}</button><button className="btn tiny secondary" onClick={()=>narrator.speak(text)}>Слушать тему</button><button className="btn tiny secondary" onClick={() => window.print()}>Печать / PDF</button><button className="btn tiny secondary" onClick={() => askAboutCurrent(selectedTopic?.title)}><Icon name="spark" size={14} /> Спросить AI</button><label className="check-toggle"><input type="checkbox" checked={done.includes(currentTopic)} onChange={() => currentTopic && toggleTopic(currentTopic)} /><span>Готово</span></label></div></div>
                    {text ? <><Doc text={text} onAsk={askAboutCurrent} /><PersonalNote topicId={currentTopic}/></> : <EmptyState title="Выберите тему" text="Слева появятся все материалы курса. Для каждого материала можно задать AI-вопрос прямо из документа." action={<button className="btn primary" onClick={() => nextTopic && openTopic(nextTopic.id)}>Открыть первую тему</button>} />}
                  </section>
                </div>
              )}

              {tab === 'questions' && (
                <>
                  <div className="page-head"><div><div className="eyebrow">Тренажёр</div><h2>Вопросы без зубрёжки</h2><p>Выбирайте уровень, отвечайте вслух или пишите — AI сразу объяснит, чего не хватает.</p></div><button className="btn primary" onClick={startQuiz}><Icon name="exam" size={17} /> Мини-экзамен</button></div>
                  <div className="question-toolbar"><div className="segmented">{['Все', 'База', 'Экзамен', 'Сложно'].map(item => <button key={item} className={questionFilter === item ? 'active' : ''} onClick={() => setQuestionFilter(item)}>{item}</button>)}</div><span>{visibleQuestions.length} вопросов</span></div>
                  <div className="questions-grid">{visibleQuestions.map((item, index) => <motion.article className="question-card" key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.015 }}><div className="question-card-top"><span className={`level ${item.level === 'База' ? 'base' : item.level === 'Экзамен' ? 'exam' : 'hard'}`}>{item.level}</span><span>{item.tag}</span></div><h3>{item.text}</h3><div className="question-actions"><button onClick={() => submitQuery(item.text)}>Спросить AI <Icon name="arrow" size={14} /></button><button onClick={() => { quiz.current = { topic: item.tag, question: item.text }; setExamMode(true); setQuery(''); assistantPanel.current?.scrollIntoView({ behavior: 'smooth' }); questionInput.current?.focus() }}>Ответить самому</button></div></motion.article>)}</div>
                </>
              )}

              {tab === 'practice' && <Practice topics={topics} onOpen={openTopic} />}

              {tab === 'plan' && (
                <>
                  <div className="page-head"><div><div className="eyebrow">План курса</div><h2>От первой темы к экзамену</h2><p>Маленькие блоки, понятный прогресс и понятная следующая точка.</p></div><div className="head-progress"><strong>{progress}%</strong><span>пройдено</span></div></div>
                  <div className="plan-stack">{MODULES.map(([name, startIndex, endIndex, tag], moduleIndex) => <section className="module-section panel" key={name}><div className="module-section-head"><div><span className="module-num">0{moduleIndex + 1}</span><div><div className="eyebrow">{tag}</div><h3>{name}</h3></div></div><span>{topics.slice(startIndex, endIndex).filter(topic => done.includes(topic.id)).length}/{Math.max(endIndex - startIndex, topics.slice(startIndex, endIndex).length)}</span></div><div className="plan-items">{topics.slice(startIndex, endIndex).map((topic, index) => <div className={`plan-item ${done.includes(topic.id) ? 'done' : ''}`} key={topic.id}><span className="week-badge">{String(startIndex + index + 1).padStart(2, '0')}</span><button onClick={() => openTopic(topic.id)}>{topic.title}</button><label><input type="checkbox" checked={done.includes(topic.id)} onChange={() => toggleTopic(topic.id)} /><span>{done.includes(topic.id) ? 'Готово' : 'В путь'}</span></label></div>)}</div></section>)}</div>
                </>
              )}

              {tab === 'exam' && (
                <>
                  <div className="exam-banner panel"><div><div className="eyebrow">FINAL MODE</div><h2>Экзаменатор рядом</h2><p>Получите случайный вопрос, ответьте голосом или текстом и получите разбор по 10-балльной шкале.</p><div className="hero-actions"><button className="btn primary" onClick={startQuiz}><Icon name="exam" size={17} /> Начать вопрос</button><button className="btn secondary" onClick={() => changeTab('questions')}>Выбрать вопрос</button></div></div><div className="exam-ring"><Ring value={completed} total={totalTopics} size={128} /></div></div>
                  {examMode && <section className="exam-question panel"><div className="eyebrow">Вопрос экзаменатора</div><h3>{quizLoading ? 'AI формулирует вопрос…' : quiz.current?.question || 'Ваш вопрос появится здесь.'}</h3><p>Ответьте 3–6 предложениями. После этого AI найдёт сильные места и ошибки.</p></section>}
                  <section className="panel"><div className="panel-head"><div><div className="eyebrow">Список тем</div><h3>Что могут спросить</h3></div><span className="count-badge">{topics.length}</span></div><div className="exam-topic-list">{topics.map((topic, index) => <button key={topic.id} onClick={() => { setCurrentTopic(topic.id); changeTab('exam'); startQuiz(topic) }}><span>{String(index + 1).padStart(2, '0')}</span><div><b>{topic.title}</b><small>{done.includes(topic.id) ? 'Тема пройдена' : 'Можно тренировать сейчас'}</small></div><Icon name="arrow" size={15} /></button>)}</div></section>
                  <section className="panel"><div className="panel-head"><div><div className="eyebrow">Оценивание</div><h3>Шкала результата</h3></div></div><div className="grade-table"><div className="grade-row head"><span>Буква</span><span>Баллы</span><span>%</span><span>Оценка</span></div>{SCALE.map(row => <div className="grade-row" key={row[0]}><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span></div>)}</div></section>
                </>
              )}

              {tab === 'stats' && (
                <>
                  <div className="page-head"><div><div className="eyebrow">Аналитика</div><h2>Понимаете ли вы материал?</h2><p>Здесь видно, сколько тем вы закрыли и какие вопросы вызывают больше всего сомнений.</p></div><button className="btn secondary" onClick={exportProgress}>Экспорт</button></div>
                  <div className="analytics-grid"><div className="panel analytics-main"><div className="analytics-score"><Ring value={completed} total={totalTopics} size={138} /><div><span>Общий прогресс</span><strong>{progress}%</strong><p>{progress >= 75 ? 'Выходите на финиш.' : progress >= 40 ? 'Хорошая база. Продолжайте.' : 'Главное — начать с малого.'}</p></div></div><div className="analytics-bars"><div><span>Темы</span><i><em style={{ width: `${progress}%` }} /></i><b>{completed}/{totalTopics}</b></div><div><span>Вопросы</span><i><em style={{ width: `${Math.min(100, history.length * 5)}%` }} /></i><b>{history.length}</b></div><div><span>Серия</span><i><em style={{ width: `${Math.min(100, streak.streak * 7)}%` }} /></i><b>{streak.streak} дн.</b></div></div></div>
                    <div className="panel analytics-side"><div className="eyebrow">Источники AI</div><div className="source-row"><span>Конспекты</span><strong>{stats.notes}</strong></div><div className="source-row"><span>Знания AI</span><strong>{stats.web}</strong></div><div className="source-row"><span>Всего вопросов</span><strong>{stats.total}</strong></div><button className="btn secondary full" onClick={exportProgress}>Экспорт прогресса</button></div></div>
                  <div className="analytics-columns"><section className="panel"><div className="panel-head"><div><div className="eyebrow">История</div><h3>Последние вопросы</h3></div></div>{history.length ? history.slice().reverse().slice(0, 8).map((item, index) => <div className="history-item" key={`${item.time}-${index}`}><span className="history-time">{new Date(item.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span><div><b>{item.question}</b><small>{item.source === 'notes' ? 'Конспект' : item.source === 'web' ? 'Интернет' : 'AI'}</small></div></div>) : <EmptyState title="История пока пустая" text="Задайте первый вопрос AI-преподавателю." />}</section><section className="panel"><div className="panel-head"><div><div className="eyebrow">Пробелы</div><h3>Что стоит повторить</h3></div></div>{stats.gaps.length ? stats.gaps.map((item, index) => <div className="gap-item" key={`${item}-${index}`}><span>{index + 1}</span><div>{item}</div><button onClick={() => submitQuery(`Объясни и проверь меня по вопросу: ${item}`)}><Icon name="arrow" size={14} /></button></div>) : <EmptyState title="Пока всё спокойно" text="Вопросы за пределами конспектов появятся здесь как кандидаты на повторение." />}</section></div>
                </>
              )}
              <footer className="course-footer"><img src={asset('metu-logo.jpg')} alt="METU"/><div><strong>Измаилов Акбар Парухович</strong><span>Русский язык · METU · 2026</span></div><button onClick={()=>setSearchOpen(true)}>Найти материал ↗</button></footer>
            </motion.div>
          </AnimatePresence>
        </main>

        <aside ref={assistantPanel} className="assistant-panel" id="assistant">
          <div className="assistant-head"><div><div className="eyebrow">AI TUTOR</div><h3>AI-преподаватель</h3></div><div className="assistant-tools"><select value={quality} onChange={e => setQuality(e.target.value)} aria-label="Качество 3D"><option value="auto">3D Auto</option><option value="low">3D Eco</option></select><button className="icon-button" onClick={resetSession} title="Очистить ответ"><span>×</span></button></div></div>
          <div className="assistant-stage"><TutorAvatar analyser={analyser} cheer={cheer} quality={quality} emotion={assistantEmotion} /><div className="stage-status"><span className={status !== 'Готов' ? 'live' : ''} />{status}<span>{sourceLabel}</span></div></div>
          {examMode && <div className="exam-mini"><span>ЭКЗАМЕНАТОР</span><p>{quizLoading ? 'Готовлю вопрос…' : quiz.current?.question || 'Ответьте в поле ниже.'}</p></div>}
          <div className="assistant-actions"><button className="btn tiny secondary" aria-pressed={voice} onClick={() => { setVoice(v => !v); narrator.stop() }}>{voice ? 'Озвучка включена' : 'Включить озвучку'}</button><button className="btn tiny secondary" onClick={() => { controller.current?.abort(); requestId.current += 1; clearAudioQueue(); setStatus('Готов') }}>Остановить</button></div>
          <div className="voice-settings"><div className="voice-status" role="status"><span className={speechActive?'speaking-indicator':''}/> {narrator.message}</div><div><select aria-label="Скорость озвучки" value={voiceSpeed} onChange={e=>setVoiceSpeed(Number(e.target.value))}><option value={.9}>Спокойно · 0.9×</option><option value={1}>Естественно · 1×</option><option value={1.1}>Быстрее · 1.1×</option></select><button onClick={()=>narrator.speak('Здравствуйте! Я помогу разобраться в русском языке. Выберите тему, и мы начнём с понятного примера.')}>Проверить голос</button></div></div>
          <label className="voice-volume">Громкость<input type="range" min="0" max="1" step="0.1" value={voiceVolume} onChange={e=>setVoiceVolume(Number(e.target.value))} aria-label="Громкость озвучки"/></label>
          <div className="assistant-quick">{QUICK_QUESTIONS.map(item => <button key={item} onClick={() => submitQuery(item)}>{item}</button>)}</div>
          <form className="composer" onSubmit={e => { e.preventDefault(); submitQuery(query) }}>
            <textarea ref={questionInput} rows="3" value={query} onChange={e => setQuery(e.target.value)} placeholder={examMode ? 'Ваш ответ на вопрос…' : 'Задайте вопрос о курсе или другую задачу…'} aria-label="Вопрос AI" />
            <div className="composer-bottom"><button type="button" className={`voice-btn ${listening ? 'active' : ''}`} onClick={toggleMic} title="Голосовой ввод"><Icon name="mic" size={18} /></button><span className="composer-hint">/ — вопрос</span><button className="send-btn" type="submit" disabled={!query.trim() || quizLoading}><Icon name="send" size={17} /></button></div>
          </form>
          <div className="answer-card" aria-live="polite">
            <div className="answer-head"><span>Ответ</span><div>{sourceLabel && <b>{sourceLabel}</b>}{answer && <button onClick={()=>narrator.speak(answer)} title="Озвучить ответ">▶</button>}{answer && <button onClick={copyAnswer} title="Скопировать"><Icon name="copy" size={14} /></button>}</div></div>
            {answer ? <div className="answer-text">{answer}</div> : <div className="answer-placeholder"><Icon name="spark" size={18} /><p>Задайте вопрос — здесь появится объяснение. Без AI-функции работает локальный поиск по конспектам. После подключения serverless AI можно обсуждать курс и общие вопросы.</p></div>}
          </div>
          <div className="assistant-footer"><span><i className={online ? 'ok' : ''} />{online ? 'Связь активна' : 'Офлайн'}</span><button onClick={() => startQuiz()}><Icon name="exam" size={14} /> Экзаменатор</button></div>
        </aside>
      </div>

      <nav className="mobile-nav" aria-label="Мобильная навигация">{TABS.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => changeTab(id)}><span aria-hidden="true">{label === 'Главная' ? '⌂' : label === 'Конспекты' ? '▤' : label === 'Вопросы' ? '?' : label === 'Практика' ? '✓' : label === 'План' ? '☷' : label === 'Экзамен' ? '◈' : '◌'}</span><small>{label}</small></button>)}</nav>
    </div>
  )
}
