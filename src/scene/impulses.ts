import type { MutableRefObject } from 'react'
import * as THREE from 'three'

/**
 * A short-lived radial push centered at a world point. Spawned by clicks and
 * read by every Paper each frame. Tracked by a single ref so we don't pay for
 * a React re-render on every cursor stir.
 */
export interface Impulse {
  point: THREE.Vector3
  t: number
  duration: number
  strength: number
}

export type ImpulseField = MutableRefObject<Impulse[]>

export function tickImpulses(impulses: ImpulseField, dt: number) {
  const next: Impulse[] = []
  for (const i of impulses.current) {
    i.t += dt
    if (i.t < i.duration) next.push(i)
  }
  impulses.current = next
}

export function spawnImpulse(impulses: ImpulseField, point: THREE.Vector3, strength = 1) {
  impulses.current.push({ point: point.clone(), t: 0, duration: 1.4, strength })
}
