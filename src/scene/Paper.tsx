import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PaperPreset, PaperPart } from '../data/papers'
import type { ImpulseField } from './impulses'

interface Props {
  preset: PaperPreset
  /** Starting position and seed for the noise drift. */
  spawn: [number, number, number]
  seed: number
  impulses: ImpulseField
}

/**
 * A single floating paper. Movement is composed of:
 *   - a slow noise-like drift (sum of sines per axis) using the seed
 *   - behaviour-specific motion (fall = downward bias; flutter = jitter)
 *   - cursor stir impulses (radial push that decays)
 *
 * Wings flap on flutter behaviour using THREE groups around their root offset.
 */
export function Paper({ preset, spawn, seed, impulses }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const wingLRef = useRef<THREE.Group>(null)
  const wingRRef = useRef<THREE.Group>(null)

  // Per-instance state held in refs (no rerenders).
  const stateRef = useRef({
    pos: new THREE.Vector3(...spawn),
    vel: new THREE.Vector3(0, 0, 0),
    yaw: Math.random() * Math.PI * 2,
    yawSpeed: (Math.random() - 0.5) * 0.3,
    tilt: 0,
    time: Math.random() * 10,
  })

  useFrame((_, dt) => {
    const g = groupRef.current
    if (!g) return
    const s = stateRef.current
    s.time += dt

    // Base drift: low-frequency sines per axis driven by seed.
    const baseX = Math.sin(s.time * 0.35 + seed * 1.7) * 0.6
    const baseY = Math.sin(s.time * 0.27 + seed * 2.3) * 0.4
    const baseZ = Math.cos(s.time * 0.31 + seed * 0.9) * 0.5

    // Behaviour-specific motion.
    let vx = baseX * 0.4
    let vy = baseY * 0.3
    let vz = baseZ * 0.4
    let flap = 0

    if (preset.behaviour === 'fall') {
      vy -= 0.35 // gentle descent
      vx += Math.sin(s.time * 1.1 + seed) * 0.3 // sway
    } else if (preset.behaviour === 'flutter') {
      vx += Math.sin(s.time * 2.0 + seed) * 0.5
      vy += Math.sin(s.time * 1.7 + seed * 0.5) * 0.3
      flap = Math.sin(s.time * 9) * (preset.flapRange ?? 0.6)
    } else {
      // drift: smaller amplitudes
      vx *= 0.6
      vy *= 0.6
      vz *= 0.6
    }

    // Cursor impulses: each impulse pushes radially with decay.
    for (const imp of impulses.current) {
      const dx = s.pos.x - imp.point.x
      const dy = s.pos.y - imp.point.y
      const dz = s.pos.z - imp.point.z
      const distSq = dx * dx + dy * dy + dz * dz
      const fall = Math.max(0, 1 - imp.t / imp.duration)
      const reach = 2.5
      if (distSq < reach * reach) {
        const dist = Math.sqrt(distSq) + 0.001
        const force = (1 - dist / reach) * imp.strength * fall * 4
        vx += (dx / dist) * force
        vy += (dy / dist) * force + force * 0.4
        vz += (dz / dist) * force
      }
    }

    // Integrate, with damping so motion stays smooth.
    s.vel.x += (vx - s.vel.x) * Math.min(1, dt * 2.5)
    s.vel.y += (vy - s.vel.y) * Math.min(1, dt * 2.5)
    s.vel.z += (vz - s.vel.z) * Math.min(1, dt * 2.5)

    s.pos.x += s.vel.x * dt
    s.pos.y += s.vel.y * dt
    s.pos.z += s.vel.z * dt

    // Loop around when leaving the box, keeping the scene populated.
    const W = 6, H = 4, D = 5
    if (s.pos.x > W) s.pos.x = -W
    if (s.pos.x < -W) s.pos.x = W
    if (s.pos.y > H) s.pos.y = -H * 0.6
    if (s.pos.y < -H * 0.8) s.pos.y = H
    if (s.pos.z > D) s.pos.z = -D
    if (s.pos.z < -D) s.pos.z = D

    s.yaw += s.yawSpeed * dt
    s.tilt = Math.sin(s.time * 0.8 + seed) * 0.25

    g.position.copy(s.pos)
    g.rotation.set(-Math.PI / 2 + s.tilt, s.yaw, 0)

    if (wingLRef.current) wingLRef.current.rotation.y = flap
    if (wingRRef.current) wingRRef.current.rotation.y = -flap
  })

  return (
    <group ref={groupRef}>
      {preset.parts.map((part, i) => {
        if (part.group === 'wingL') {
          return (
            <group key={i} ref={wingLRef}>
              <PaperMesh part={part} scale={preset.scale} />
            </group>
          )
        }
        if (part.group === 'wingR') {
          return (
            <group key={i} ref={wingRRef}>
              <PaperMesh part={part} scale={preset.scale} />
            </group>
          )
        }
        return <PaperMesh key={i} part={part} scale={preset.scale} />
      })}
    </group>
  )
}

function PaperMesh({ part, scale }: { part: PaperPart; scale: number }) {
  const geom = useMemo(() => new THREE.ShapeGeometry(part.shape, 8), [part.shape])
  const offset = part.offset ?? [0, 0, 0]
  const rotation = part.rotation ?? [0, 0, 0]
  return (
    <mesh position={offset} rotation={rotation} scale={scale} castShadow>
      <primitive object={geom} attach="geometry" />
      <meshStandardMaterial
        color={part.color}
        side={THREE.DoubleSide}
        roughness={0.85}
        metalness={0}
        flatShading
      />
    </mesh>
  )
}
