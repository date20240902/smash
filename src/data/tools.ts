export type ToolId = 'hammer' | 'saw' | 'drop' | 'bat'

export interface ToolPreset {
  id: ToolId
  names: string[]
  /** Multiplier on impact force. */
  power: number
  /** Visual color of the head/blade. */
  headColor: string
  handleColor: string
  /** Display label for HUD. */
  label: string
}

export const TOOL_PRESETS: ToolPreset[] = [
  {
    id: 'hammer',
    names: ['망치', 'hammer', '해머'],
    power: 1.0,
    headColor: '#8a8d96',
    handleColor: '#7a4a2a',
    label: '망치',
  },
  {
    id: 'bat',
    names: ['야구방망이', '방망이', '배트', 'bat'],
    power: 1.3,
    headColor: '#c8a878',
    handleColor: '#7a5a3a',
    label: '방망이',
  },
  {
    id: 'saw',
    names: ['톱', 'saw'],
    power: 0.6,
    headColor: '#d9d9d9',
    handleColor: '#4a2a1a',
    label: '톱',
  },
  {
    id: 'drop',
    names: ['낙하', '떨어뜨리기', '중력', 'drop', '낙하시키기'],
    power: 0.8,
    headColor: '#444',
    handleColor: '#222',
    label: '낙하',
  },
]

export function matchTool(query: string): ToolPreset {
  const q = query.trim().toLowerCase()
  if (!q) return TOOL_PRESETS[0]
  for (const t of TOOL_PRESETS) {
    if (t.names.some((n) => q.includes(n.toLowerCase()))) return t
  }
  return TOOL_PRESETS[0]
}
