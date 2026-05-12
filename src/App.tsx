import { useState } from 'react'
import { Scene, type SpawnedItem } from './scene/Scene'
import { parsePrompt } from './ai/parse'
import { OBJECT_PRESETS } from './data/objects'
import { TOOL_PRESETS } from './data/tools'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [items, setItems] = useState<SpawnedItem[]>([
    { id: 1, preset: OBJECT_PRESETS[0], position: [0, 0, 0] },
  ])
  const [tool, setTool] = useState(TOOL_PRESETS[0])
  const [shatterCount, setShatterCount] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [nextId, setNextId] = useState(2)

  function submit() {
    if (!prompt.trim()) return
    const parsed = parsePrompt(prompt)
    if (!parsed.matchedObject && !parsed.matchedTool) {
      setToast(`"${prompt}"에서 아무것도 못 찾았어요. 예: "머그컵, 망치"`)
      setTimeout(() => setToast(null), 2500)
      return
    }
    if (parsed.matchedTool) setTool(parsed.tool)
    if (parsed.matchedObject) {
      // Place new item at a random-ish spot on the table.
      const x = (Math.random() - 0.5) * 4
      const z = (Math.random() - 0.5) * 2
      setItems((prev) => [...prev, { id: nextId, preset: parsed.object, position: [x, 0, z] }])
      setNextId((n) => n + 1)
    } else {
      // Tool-only change: keep current items.
    }
    setPrompt('')
  }

  function clearAll() {
    setItems([])
  }

  return (
    <div className="app">
      <div className="hud">
        <input
          placeholder='예: "머그컵, 망치" / "꽃병으로 야구방망이 휘두르기"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
        />
        <button onClick={submit}>소환</button>
        <button onClick={clearAll} style={{ background: 'rgba(255,255,255,0.08)', color: '#e7e9ee' }}>
          비우기
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="status">
        <span><b>도구:</b>{tool.label}</span>
        <span><b>부순 개수:</b>{shatterCount}</span>
        <span style={{ opacity: 0.6 }}>왼쪽클릭=내려치기 · 오른쪽드래그=시점 · 휠=줌</span>
      </div>

      <div className="canvas-wrap">
        <Scene items={items} tool={tool} onShatter={() => setShatterCount((c) => c + 1)} />
      </div>
    </div>
  )
}
