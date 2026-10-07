import LOCAL_NOTES from './notes-data.json'

const API_BASE = (import.meta.env.VITE_AI_API_URL || '').trim().replace(/\/+$/, '')
const STOP = new Set('это как что где когда почему зачем или для при по на от до из во со об но да мы вы он она они его её все тему темы простыми словами объясни вопрос русский язык'.split(' '))

const normalize = value => String(value || '').toLowerCase().replaceAll('ё', 'е')
const tokens = text => (normalize(text).match(/[а-яa-z0-9]{3,}/g) || [])
  .map(word => word.length > 6 ? word.slice(0, 6) : word)
  .filter(word => !STOP.has(word))

export function retrieveNotes(question, limit = 2) {
  const query = new Set(tokens(question))
  if (!query.size) return []
  return LOCAL_NOTES
    .map(note => {
      const words = tokens(`${note.title} ${note.title} ${note.title} ${note.text}`)
      const counts = new Map()
      for (const word of words) counts.set(word, (counts.get(word) || 0) + 1)
      let score = 0
      for (const word of query) {
        const count = counts.get(word) || 0
        if (count) score += 1 + Math.log(count)
      }
      return { note, score: score / Math.sqrt(words.length || 1) }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.note)
}

function localAnswer(question, hits) {
  if (question.startsWith('Задай студенту')) {
    const title = hits[0]?.title || LOCAL_NOTES[0]?.title || 'учебная тема'
    return `Объясните понятие «${title}» и приведите один собственный пример.`
  }
  if (question.startsWith('Тема «')) {
    return 'Автоматическая оценка свободного ответа доступна, когда подключена serverless AI-функция. Пока сравните свой ответ с конспектом и используйте тесты в разделе «Практика».'
  }
  if (hits.length) {
    return `Локальный поиск по конспектам (работает без сервера).\n\n${hits[0].text}\n\nЧтобы получать сгенерированные ответы и разбор свободных вопросов, подключите VITE_AI_API_URL к Cloudflare Worker.`
  }
  return 'По этому вопросу в локальных конспектах совпадений нет. Для общих вопросов подключите serverless AI-функцию через VITE_AI_API_URL.'
}

export function clientHealth() {
  return {
    ok: true,
    groq: Boolean(API_BASE),
    mode: API_BASE ? 'serverless' : 'local',
    topics: LOCAL_NOTES.length,
    voice: 'browser-ru-RU',
    tts: 'browser',
  }
}

export async function streamTutorChat({ question, history = [], signal, onEvent }) {
  const hits = retrieveNotes(question)

  if (!API_BASE) {
    const answer = localAnswer(question, hits)
    onEvent?.({ type: 'source', value: 'local' })
    onEvent?.({ type: 'text', value: answer })
    onEvent?.({ type: 'done', value: '' })
    return answer
  }

  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      history: history.slice(-8),
      context: hits.map(({ id, title, text }) => ({ id, title, text: text.slice(0, 7000) })),
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `AI proxy returned ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''
    for (const event of events) {
      const line = event.split('\n').find(row => row.startsWith('data:'))
      if (!line) continue
      try {
        const payload = JSON.parse(line.slice(5).trim())
        if (payload.type === 'text') full += payload.value || ''
        onEvent?.(payload)
      } catch {}
    }
  }
  return full
}
