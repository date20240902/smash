import { useRef } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { PaperPreset } from '../data/papers'
import { Paper } from './Paper'
import type { ImpulseField } from './impulses'
import { spawnImpulse, tickImpulses } from './impulses'

export interface SpawnedPaper {
  id: number
  preset: PaperPreset
  spawn: [number, number, number]
  seed: number
}

interface Props {
  papers: SpawnedPaper[]
}

export function Scene({ papers }: Props) {
  return (
    <Canvas shadows camera={{ position: [0, 0, 9], fov: 45 }}>
      <SceneContents papers={papers} />
    </Canvas>
  )
}

function SceneContents({ papers }: Props) {
  const impulses: ImpulseField = useRef([])
  const { camera } = useThree()

  useFrame((_, dt) => tickImpulses(impulses, dt))

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    // Convert click on the background plane to a world point at z=0.
    const point = new THREE.Vector3(e.point.x, e.point.y, 0)
    spawnImpulse(impulses, point, 1)
  }

  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    // While the pointer is down, leave a light trailing breeze.
    if (e.buttons !== 1) return
    const point = new THREE.Vector3(e.point.x, e.point.y, 0)
    spawnImpulse(impulses, point, 0.35)
  }

  return (
    <>
      {/* Soft warm gradient background via a large plane behind the action. */}
      <BackgroundGradient />

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={['#fff5e6', '#d8e4ec', 0.4]} />

      {/* Invisible click-catcher plane in front of camera. */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        // Slightly behind the papers so they still get foreground depth.
        renderOrder={-1}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {papers.map((p) => (
        <Paper key={p.id} preset={p.preset} spawn={p.spawn} seed={p.seed} impulses={impulses} />
      ))}

      <FaceCamera camera={camera} />
    </>
  )
}

function FaceCamera({ camera }: { camera: THREE.Camera }) {
  // Keep camera looking straight at origin so the click plane (z=0) maps
  // cleanly to screen coordinates.
  useFrame(() => camera.lookAt(0, 0, 0))
  return null
}

function BackgroundGradient() {
  // A large plane far behind, vertex-colored top→bottom for a paper-warm sky.
  const geom = useRef<THREE.PlaneGeometry | null>(null)
  if (!geom.current) {
    const g = new THREE.PlaneGeometry(60, 40, 1, 1)
    const colors = new Float32Array([
      // top-left, top-right, bottom-left, bottom-right (PlaneGeometry order)
      0.95, 0.93, 0.86,
      0.95, 0.93, 0.86,
      0.92, 0.84, 0.74,
      0.92, 0.84, 0.74,
    ])
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geom.current = g
  }
  return (
    <mesh position={[0, 0, -10]}>
      <primitive object={geom.current} attach="geometry" />
      <meshBasicMaterial vertexColors />
    </mesh>
  )
}
