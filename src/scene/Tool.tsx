import { useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { ToolPreset } from '../data/tools'

interface Props {
  tool: ToolPreset
  /** Called when the tool strikes a point. Direction is the strike vector. */
  onStrike: (worldPoint: THREE.Vector3, direction: THREE.Vector3, power: number) => void
}

/**
 * A simple hand-held tool floating where the cursor points on a virtual plane,
 * and swinging downward on click. The "strike" is registered when the swing
 * peaks — we report a downward vector at the target point with the tool's power.
 */
export function Tool({ tool, onStrike }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const targetRef = useRef(new THREE.Vector3(0, 1.5, 0))
  const [swingT, setSwingT] = useState(0) // 0 = idle, 1..0 = swinging
  const swingRef = useRef(0)
  const struckRef = useRef(false)
  const { camera, gl } = useThree()

  useFrame((_, dt) => {
    const g = groupRef.current
    if (!g) return

    // Decay swing
    if (swingRef.current > 0) {
      swingRef.current = Math.max(0, swingRef.current - dt * 3.5)
      setSwingT(swingRef.current)
      // Trigger strike when the swing passes the bottom of its arc.
      if (!struckRef.current && swingRef.current < 0.4) {
        struckRef.current = true
        const target = targetRef.current
        const dir = new THREE.Vector3(0, -1, 0)
        onStrike(target.clone(), dir, tool.power)
      }
    }

    // Position the tool above the target, with a swing rotation.
    const t = targetRef.current
    const swingAngle = swingT * Math.PI * 0.55 // up to ~100°
    g.position.set(t.x, t.y + 1.8 - swingT * 0.6, t.z + 0.3)
    g.rotation.set(-Math.PI / 4 + swingAngle, 0, 0)
  })

  // Track cursor → ground plane intersection for the tool's hover position.
  function onPointerMove(e: ThreeEvent<PointerEvent>) {
    const ndc = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1,
    )
    const ray = new THREE.Raycaster()
    ray.setFromCamera(ndc, camera)
    // Intersect a horizontal plane at y=1.0 (table height).
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0)
    const point = new THREE.Vector3()
    if (ray.ray.intersectPlane(plane, point)) {
      targetRef.current.copy(point)
    }
  }

  function onPointerDown() {
    if (swingRef.current > 0) return
    swingRef.current = 1
    struckRef.current = false
  }

  return (
    <>
      {/* Invisible cursor tracker covers the whole scene. */}
      <mesh position={[0, 1, 0]} onPointerMove={onPointerMove} onPointerDown={onPointerDown} visible={false}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <group ref={groupRef}>
        <ToolMesh tool={tool} />
      </group>
    </>
  )
}

function ToolMesh({ tool }: { tool: ToolPreset }) {
  if (tool.id === 'hammer') {
    return (
      <group>
        {/* handle */}
        <mesh position={[0, -0.6, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.2, 12]} />
          <meshStandardMaterial color={tool.handleColor} roughness={0.8} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.45, 0.22, 0.2]} />
          <meshStandardMaterial color={tool.headColor} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    )
  }
  if (tool.id === 'bat') {
    return (
      <group>
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.1, 1.5, 12]} />
          <meshStandardMaterial color={tool.handleColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.1, 0.5, 12]} />
          <meshStandardMaterial color={tool.headColor} roughness={0.5} />
        </mesh>
      </group>
    )
  }
  if (tool.id === 'saw') {
    return (
      <group>
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.04]} />
          <meshStandardMaterial color={tool.handleColor} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.9, 0.18, 0.02]} />
          <meshStandardMaterial color={tool.headColor} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    )
  }
  // drop: an anvil-like block
  return (
    <mesh castShadow>
      <boxGeometry args={[0.6, 0.4, 0.4]} />
      <meshStandardMaterial color={tool.headColor} metalness={0.5} roughness={0.4} />
    </mesh>
  )
}
