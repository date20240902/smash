import { useState } from 'react'
import { Scene, type SpawnedPaper } from './scene/Scene'
import { parsePrompt } from './ai/parse'
import { PAPER_PRESETS } from './data/papers'

const SUGGESTIONS = ['나비', '꽃잎', '잎사귀', '구름', '종이학', '종이비행기', '별']

function randomSpawn(): [number, number, number] {
  return [
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 2,
  ]
}

function makePaper(preset: typeof PAPER_PRESETS[number], id: number): SpawnedPaper {
  return { id, preset, spawn: randomSpawn(), seed: Math.random() * 1000 }
}

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [papers, setPapers] = useState<SpawnedPaper[]>(() => {
    // Start with a soft mix.
    const ids = ['butterfly', 'leaf', 'petal', 'cloud']
    return ids.map((id, i) => {
      const preset = PAPER_PRESETS.find((p) => p.id === id)!
      return makePaper(preset, i + 1)
    })
  })
  const [nextId, setNextId] = useState(100)
  const [toast, setToast] = useState<string | null>(null)

  function add(presetId: string) {
    const preset = PAPER_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setPapers((prev) => [...prev, makePaper(preset, nextId)])
    setNextId((n) => n + 1)
  }

  function submit() {
    const text = prompt.trim()
    if (!text) return
    const parsed = parsePrompt(text)
    if (!parsed.matched || !parsed.paper) {
      setToast(`"${text}"는 아직 못 만들어요. 예: 나비, 꽃잎, 구름…`)
      setTimeout(() => setToast(null), 2500)
      return
    }
    setPapers((prev) => [...prev, makePaper(parsed.paper!, nextId)])
    setNextId((n) => n + 1)
    setPrompt('')
  }

  function clear() {
    setPapers([])
  }

  return (
    <div className="app">
      <div className="hud">
        <input
          placeholder="무엇을 띄울까요? (예: 나비, 꽃잎, 종이학)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button onClick={submit}>띄우기</button>
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => add(PAPER_PRESETS.find((p) => p.names.includes(s))!.id)}>
            {s}
          </button>
        ))}
        <button className="chip ghost" onClick={clear}>비우기</button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="status">
        <span>마우스를 움직이면 종이가 흩날려요 · 떠 있는 종이 <b>{papers.length}</b></span>
      </div>

      <div className="canvas-wrap">
        <Scene papers={papers} />
      </div>
    </div>
  )
}
