// Each object is made of primitive parts. Each part has a "shards" property
// describing what it becomes when broken — pre-fractured pieces with offsets
// relative to the original part. This keeps physics cheap and predictable.

export type Vec3 = [number, number, number]

export type PartShape =
  | { kind: 'box'; size: Vec3 }
  | { kind: 'cylinder'; radius: number; height: number; segments?: number }
  | { kind: 'sphere'; radius: number }
  | { kind: 'torus'; radius: number; tube: number }

export interface Part {
  shape: PartShape
  position?: Vec3
  rotation?: Vec3
  color: string
  metalness?: number
  roughness?: number
}

export interface Shard {
  shape: PartShape
  position: Vec3 // offset from the original part's position
  rotation?: Vec3
  color: string
}

export interface ObjectPreset {
  id: string
  /** Human-readable, used by the AI matcher too. */
  names: string[] // ko + en aliases
  /** Material toughness; higher = more impulse needed to break. */
  toughness: number
  /** Initial spawn y offset so it sits on the ground. */
  groundOffset: number
  parts: Part[]
  /** Pre-fractured pieces. When broken, all parts are replaced by these. */
  shards: Shard[]
}

const ceramicWhite = '#f1ece2'
const ceramicShadow = '#d9d1bf'
const terracotta = '#c97a4a'
const glassBlue = '#88c8e6'
const glassGreen = '#a8d8b5'

export const OBJECT_PRESETS: ObjectPreset[] = [
  {
    id: 'mug',
    names: ['머그컵', '머그', '컵', 'mug', 'cup', '커피잔'],
    toughness: 1.2,
    groundOffset: 0.6,
    parts: [
      { shape: { kind: 'cylinder', radius: 0.4, height: 1.0, segments: 24 }, color: ceramicWhite },
      // handle
      { shape: { kind: 'torus', radius: 0.22, tube: 0.06 }, position: [0.45, 0, 0], rotation: [0, Math.PI / 2, 0], color: ceramicWhite },
    ],
    shards: shardsFromCylinder(0.4, 1.0, ceramicWhite, ceramicShadow, 8),
  },
  {
    id: 'plate',
    names: ['접시', 'plate', 'dish'],
    toughness: 0.9,
    groundOffset: 0.06,
    parts: [
      { shape: { kind: 'cylinder', radius: 0.8, height: 0.1, segments: 32 }, color: ceramicWhite },
    ],
    shards: shardsFromDisc(0.8, 0.1, ceramicWhite, ceramicShadow, 10),
  },
  {
    id: 'vase',
    names: ['꽃병', 'vase'],
    toughness: 1.6,
    groundOffset: 0.9,
    parts: [
      { shape: { kind: 'cylinder', radius: 0.35, height: 1.8, segments: 24 }, color: terracotta },
      { shape: { kind: 'sphere', radius: 0.45 }, position: [0, -0.7, 0], color: terracotta },
    ],
    shards: shardsFromCylinder(0.45, 1.8, terracotta, '#8a4a26', 12),
  },
  {
    id: 'bottle',
    names: ['유리병', '병', 'bottle', '와인병'],
    toughness: 1.1,
    groundOffset: 0.75,
    parts: [
      { shape: { kind: 'cylinder', radius: 0.28, height: 1.2, segments: 24 }, color: glassGreen },
      { shape: { kind: 'cylinder', radius: 0.12, height: 0.4, segments: 16 }, position: [0, 0.8, 0], color: glassGreen },
      { shape: { kind: 'sphere', radius: 0.06 }, position: [0, 1.05, 0], color: '#7a4a2a' },
    ],
    shards: shardsFromCylinder(0.28, 1.2, glassGreen, '#4f8060', 10),
  },
  {
    id: 'glass',
    names: ['유리잔', '컵잔', 'glass', '와인잔'],
    toughness: 0.7,
    groundOffset: 0.55,
    parts: [
      { shape: { kind: 'cylinder', radius: 0.3, height: 0.9, segments: 24 }, color: glassBlue },
    ],
    shards: shardsFromCylinder(0.3, 0.9, glassBlue, '#5fa0bf', 10),
  },
]

/** Fallback: try to find a preset whose names overlap with the query. */
export function matchObject(query: string): ObjectPreset {
  const q = query.trim().toLowerCase()
  if (!q) return OBJECT_PRESETS[0]
  for (const p of OBJECT_PRESETS) {
    if (p.names.some((n) => q.includes(n.toLowerCase()))) return p
  }
  return OBJECT_PRESETS[0]
}

// ---- shard generators ---------------------------------------------------

function shardsFromCylinder(r: number, h: number, c1: string, c2: string, count: number): Shard[] {
  const out: Shard[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const tilt = (Math.random() - 0.5) * 0.6
    const sx = 0.18 + Math.random() * 0.12
    const sy = (h / 3) * (0.6 + Math.random() * 0.8)
    const sz = 0.06 + Math.random() * 0.05
    out.push({
      shape: { kind: 'box', size: [sx, sy, sz] },
      position: [Math.cos(a) * r * 0.6, (Math.random() - 0.5) * h * 0.4, Math.sin(a) * r * 0.6],
      rotation: [tilt, a, tilt * 0.5],
      color: i % 2 === 0 ? c1 : c2,
    })
  }
  return out
}

function shardsFromDisc(r: number, h: number, c1: string, c2: string, count: number): Shard[] {
  const out: Shard[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2
    const rr = r * (0.35 + Math.random() * 0.55)
    out.push({
      shape: { kind: 'box', size: [0.18 + Math.random() * 0.18, h * 1.1, 0.18 + Math.random() * 0.18] },
      position: [Math.cos(a) * rr, 0, Math.sin(a) * rr],
      rotation: [0, a, 0],
      color: i % 2 === 0 ? c1 : c2,
    })
  }
  return out
}
