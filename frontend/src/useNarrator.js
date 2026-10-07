import { useCallback, useEffect, useRef, useState } from 'react'

export default function useNarrator() {
  const analyser = useRef(null)
  const queue = useRef([])
  const generation = useRef(0)
  const pumping = useRef(false)
  const pending = useRef('')
  const currentUtterance = useRef(null)
  const speed = useRef(1)
  const gain = useRef(.9)
  const [active, setActive] = useState(false)
  const [message, setMessage] = useState('Голос браузера · русский')

  const stop = useCallback(() => {
    generation.current++
    queue.current = []
    pending.current = ''
    pumping.current = false
    currentUtterance.current = null
    window.speechSynthesis?.cancel()
    setActive(false)
  }, [])

  const prime = useCallback(() => {
    try {
      window.speechSynthesis?.getVoices()
      window.speechSynthesis?.resume()
    } catch {}
  }, [])

  const getVoice = () => {
    const voices = window.speechSynthesis?.getVoices?.() || []
    return voices.find(v => /^ru/i.test(v.lang) && /Svetlana|Irina|Ирина|Светлана|Elena|Елена|Dariya|Дарья|Anna|Анна|Milena|Милена/i.test(v.name))
      || voices.find(v => /^ru/i.test(v.lang))
      || null
  }

  const speakChunk = (text, token) => new Promise(resolve => {
    if (!window.speechSynthesis || token !== generation.current) return resolve()
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = getVoice()
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang || 'ru-RU'
    utterance.rate = speed.current
    utterance.volume = gain.current
    utterance.onstart = () => {
      setActive(true)
      setMessage(voice ? `Голос браузера · ${voice.name}` : 'Голос браузера · русский')
    }
    utterance.onend = resolve
    utterance.onerror = resolve
    currentUtterance.current = utterance
    window.speechSynthesis.speak(utterance)
  })

  const pump = async () => {
    if (pumping.current) return
    pumping.current = true
    const token = generation.current
    try {
      while (queue.current.length && token === generation.current) {
        const text = queue.current.shift()
        await speakChunk(text, token)
      }
    } finally {
      if (token === generation.current) {
        pumping.current = false
        currentUtterance.current = null
        setActive(false)
      }
    }
  }

  const append = value => {
    const clean = value.replace(/[#*`]/g, '').trim()
    if (!clean) return
    queue.current.push(clean)
    pump()
  }

  const feed = token => {
    pending.current += token
    while (pending.current.length > 50) {
      const cut = pending.current.search(/[.!?…]\s|\n\n/)
      if (cut < 0 && pending.current.length < 380) break
      const n = cut < 0 ? Math.max(50, pending.current.lastIndexOf(' ', 380)) : cut + 1
      const text = pending.current.slice(0, n).trim()
      pending.current = pending.current.slice(n).trimStart()
      if (text) append(text)
    }
  }

  const finish = () => {
    if (pending.current.trim()) append(pending.current.trim())
    pending.current = ''
  }

  const speak = text => {
    stop()
    prime()
    feed(text.slice(0, 6000))
    finish()
  }

  const configure = (newSpeed, newVolume) => {
    speed.current = newSpeed
    gain.current = newVolume
  }

  useEffect(() => () => stop(), [stop])
  return { analyser, active, message, stop, prime, feed, finish, speak, configure }
}
