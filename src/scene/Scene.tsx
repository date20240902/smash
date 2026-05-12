import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import type { ObjectPreset } from '../data/objects'
import type { ToolPreset } from '../data/tools'
import { Breakable, type BreakableHandle } from './Breakable'
import { Tool } from './Tool'

interface SpawnedItem {
  id: number
  preset: ObjectPreset
  position: [number, number, number]
}

interface Props {
  items: SpawnedItem[]
  tool: ToolPreset
  onShatter: () => void
}

export function Scene({ items, tool, onShatter }: Props) {
  const refs = useRef<Map<number, BreakableHandle | null>>(new Map())

  function handleStrike(worldPoint: THREE.Vector3, direction: THREE.Vector3, power: number) {
    // Find the closest item to the strike point and hit it.
    let closest: { id: number; dist: number } | null = null
    for (const item of items) {
      const dx = item.position[0] - worldPoint.x
      const dz = item.position[2] - worldPoint.z
      const d = Math.hypot(dx, dz)
      if (!closest || d < closest.dist) closest = { id: item.id, dist: d }
    }
    if (!closest || closest.dist > 2.5) return
    const handle = refs.current.get(closest.id)
    if (!handle) return
    const shattered = handle.strike(worldPoint, direction, power)
    if (shattered) onShatter()
  }

  return (
    <Canvas shadows camera={{ position: [0, 3, 6], fov: 50 }}>
      <color attach="background" args={['#0b0d12']} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment preset="city" />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Floor / table */}
        <RigidBody type="fixed" friction={0.9} restitution={0.1}>
          <mesh receiveShadow position={[0, 0.95, 0]}>
            <boxGeometry args={[12, 0.1, 8]} />
            <meshStandardMaterial color="#1b2030" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[6, 0.05, 4]} position={[0, 0.95, 0]} />
        </RigidBody>

        {/* Walls (invisible) to keep shards from flying off forever */}
        <RigidBody type="fixed">
          <CuboidCollider args={[6, 3, 0.1]} position={[0, 3, -4]} />
          <CuboidCollider args={[6, 3, 0.1]} position={[0, 3, 4]} />
          <CuboidCollider args={[0.1, 3, 4]} position={[-6, 3, 0]} />
          <CuboidCollider args={[0.1, 3, 4]} position={[6, 3, 0]} />
        </RigidBody>

        {items.map((item) => (
          <Breakable
            key={item.id}
            ref={(h) => {
              refs.current.set(item.id, h)
            }}
            preset={item.preset}
            position={[item.position[0], 1.0 + item.preset.groundOffset, item.position[2]]}
          />
        ))}

        <Tool tool={tool} onStrike={handleStrike} />
      </Physics>

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.2}
        makeDefault
        mouseButtons={{
          LEFT: undefined as unknown as THREE.MOUSE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />
    </Canvas>
  )
}

export type { SpawnedItem }
