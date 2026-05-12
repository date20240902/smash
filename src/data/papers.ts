// Origami paper presets. Each preset is built from THREE.Shape outlines so we
// get crisp flat polygons that look like folded paper, with two-tone faces.
//
// Behaviour drives how a paper moves in space:
//   drift   - very slow horizontal + vertical bob, gentle yaw  (cloud, plane)
//   flutter - faster, more erratic with flapping wings         (butterfly, bird)
//   fall    - slowly descending with sway                      (leaf, petal)

import * as THREE from 'three'

export type Behaviour = 'drift' | 'flutter' | 'fall'

export interface PaperPart {
  /** Shape outline points in local 2D space. */
  shape: THREE.Shape
  /** Local offset after shape generation. */
  offset?: [number, number, number]
  /** Local rotation. */
  rotation?: [number, number, number]
  /** Face color. Two-sided material so back is a tinted version. */
  color: string
  /** Group tag: 'body' | 'wingL' | 'wingR' | 'static'. Used to drive flap. */
  group?: 'body' | 'wingL' | 'wingR' | 'static'
}

export interface PaperPreset {
  id: string
  names: string[]
  behaviour: Behaviour
  /** Overall mesh scale. */
  scale: number
  /** Flapping range in radians (for flutter). */
  flapRange?: number
  parts: PaperPart[]
}

// ---- shape helpers ------------------------------------------------------

function shape(points: [number, number][]): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1])
  s.lineTo(points[0][0], points[0][1])
  return s
}

function teardrop(width: number, length: number, tipBias = 0.7): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, length * tipBias)
  s.bezierCurveTo(width, length * 0.5, width, -length * 0.3, 0, -length * (1 - tipBias))
  s.bezierCurveTo(-width, -length * 0.3, -width, length * 0.5, 0, length * tipBias)
  return s
}

function petalShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0.5)
  s.bezierCurveTo(0.45, 0.45, 0.45, -0.1, 0, -0.45)
  s.bezierCurveTo(-0.45, -0.1, -0.45, 0.45, 0, 0.5)
  return s
}

function butterflyWingShape(): THREE.Shape {
  // A wing rooted at (0, 0), extending in +x.
  const s = new THREE.Shape()
  s.moveTo(0, -0.1)
  s.bezierCurveTo(0.3, 0.5, 0.9, 0.7, 1.1, 0.2)
  s.bezierCurveTo(1.1, -0.1, 0.9, -0.5, 0.5, -0.5)
  s.bezierCurveTo(0.2, -0.4, 0.1, -0.2, 0, -0.1)
  return s
}

function birdWingShape(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(1.0, 0.2)
  s.lineTo(1.1, -0.05)
  s.lineTo(0.6, -0.15)
  s.lineTo(0, 0)
  return s
}

function planeShape(): THREE.Shape {
  // A simple paper airplane silhouette, viewed from above, nose at +y.
  return shape([
    [0, 0.9],
    [0.6, -0.4],
    [0.15, -0.2],
    [0, -0.5],
    [-0.15, -0.2],
    [-0.6, -0.4],
  ])
}

function cloudShape(): THREE.Shape {
  // Scalloped pill — three circle bumps on top, flat-ish bottom.
  const s = new THREE.Shape()
  s.moveTo(-0.9, -0.15)
  s.bezierCurveTo(-1.0, 0.25, -0.5, 0.55, -0.25, 0.3)
  s.bezierCurveTo(-0.05, 0.6, 0.4, 0.6, 0.5, 0.25)
  s.bezierCurveTo(0.8, 0.55, 1.1, 0.2, 0.9, -0.1)
  s.bezierCurveTo(1.0, -0.3, 0.4, -0.4, 0.1, -0.25)
  s.bezierCurveTo(-0.2, -0.4, -0.7, -0.35, -0.9, -0.15)
  return s
}

// ---- presets ------------------------------------------------------------

const C = {
  paperCream: '#f5efe3',
  paperWarm: '#ead8c4',
  pink: '#f6c9c9',
  pinkDeep: '#e8a3a3',
  blue: '#bcd9e6',
  blueDeep: '#8eb4c8',
  green: '#cbe1be',
  greenDeep: '#9bbf8c',
  yellow: '#f3e1a4',
  yellowDeep: '#d8be71',
  lavender: '#d8cce8',
  lavenderDeep: '#a999c4',
  rust: '#d09472',
  amber: '#e8b274',
}

export const PAPER_PRESETS: PaperPreset[] = [
  {
    id: 'butterfly',
    names: ['나비', 'butterfly', '버터플라이'],
    behaviour: 'flutter',
    scale: 0.55,
    flapRange: 0.9,
    parts: [
      { shape: shape([[-0.05, 0.5], [0.05, 0.5], [0.05, -0.5], [-0.05, -0.5]]), color: '#4a3a2a', group: 'body' },
      { shape: butterflyWingShape(), color: C.lavender, group: 'wingL', offset: [0.05, 0, 0] },
      { shape: butterflyWingShape(), color: C.lavenderDeep, group: 'wingR', offset: [-0.05, 0, 0], rotation: [0, Math.PI, 0] },
    ],
  },
  {
    id: 'butterfly-pink',
    names: ['핑크나비', '분홍나비', 'pink butterfly'],
    behaviour: 'flutter',
    scale: 0.55,
    flapRange: 0.9,
    parts: [
      { shape: shape([[-0.05, 0.5], [0.05, 0.5], [0.05, -0.5], [-0.05, -0.5]]), color: '#4a3a2a', group: 'body' },
      { shape: butterflyWingShape(), color: C.pink, group: 'wingL', offset: [0.05, 0, 0] },
      { shape: butterflyWingShape(), color: C.pinkDeep, group: 'wingR', offset: [-0.05, 0, 0], rotation: [0, Math.PI, 0] },
    ],
  },
  {
    id: 'leaf',
    names: ['잎', '잎사귀', '나뭇잎', 'leaf'],
    behaviour: 'fall',
    scale: 0.9,
    parts: [
      { shape: teardrop(0.35, 0.9), color: C.green, group: 'static' },
    ],
  },
  {
    id: 'leaf-amber',
    names: ['단풍', '낙엽', 'maple', 'autumn leaf'],
    behaviour: 'fall',
    scale: 0.9,
    parts: [
      { shape: teardrop(0.35, 0.9), color: C.amber, group: 'static' },
    ],
  },
  {
    id: 'petal',
    names: ['꽃잎', 'petal', '벚꽃'],
    behaviour: 'fall',
    scale: 0.55,
    parts: [{ shape: petalShape(), color: C.pink, group: 'static' }],
  },
  {
    id: 'cloud',
    names: ['구름', 'cloud'],
    behaviour: 'drift',
    scale: 1.6,
    parts: [{ shape: cloudShape(), color: C.paperCream, group: 'static' }],
  },
  {
    id: 'plane',
    names: ['종이비행기', '비행기', 'paper airplane', 'plane'],
    behaviour: 'drift',
    scale: 0.7,
    parts: [{ shape: planeShape(), color: C.paperCream, group: 'static' }],
  },
  {
    id: 'bird',
    names: ['새', '학', '종이학', 'bird', 'crane'],
    behaviour: 'flutter',
    scale: 0.7,
    flapRange: 0.6,
    parts: [
      { shape: shape([[0, 0.3], [0.1, 0.1], [0.1, -0.3], [-0.1, -0.3], [-0.1, 0.1]]), color: C.paperCream, group: 'body' },
      { shape: birdWingShape(), color: C.paperCream, group: 'wingL', offset: [0.05, 0, 0] },
      { shape: birdWingShape(), color: C.paperWarm, group: 'wingR', offset: [-0.05, 0, 0], rotation: [0, Math.PI, 0] },
    ],
  },
  {
    id: 'star',
    names: ['별', 'star'],
    behaviour: 'drift',
    scale: 0.5,
    parts: [
      {
        shape: shape(
          Array.from({ length: 10 }, (_, i) => {
            const r = i % 2 === 0 ? 0.5 : 0.22
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2
            return [Math.cos(a) * r, Math.sin(a) * r] as [number, number]
          }),
        ),
        color: C.yellow,
        group: 'static',
      },
    ],
  },
]

export function matchPaper(query: string): PaperPreset | null {
  const q = query.trim().toLowerCase()
  if (!q) return null
  for (const p of PAPER_PRESETS) {
    if (p.names.some((n) => q.includes(n.toLowerCase()))) return p
  }
  return null
}
