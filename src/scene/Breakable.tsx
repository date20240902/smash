import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { RigidBody, type RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import type { ObjectPreset, Shard } from '../data/objects'
import { PartMesh } from './PartMesh'

export interface BreakableHandle {
  /** Apply an impulse at world point. Returns true if it shattered. */
  strike: (worldPoint: THREE.Vector3, direction: THREE.Vector3, power: number) => boolean
  reset: () => void
}

interface Props {
  preset: ObjectPreset
  position: [number, number, number]
}

export const Breakable = forwardRef<BreakableHandle, Props>(function Breakable({ preset, position }, ref) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const [broken, setBroken] = useState(false)

  useImperativeHandle(ref, () => ({
    strike(worldPoint, direction, power) {
      if (broken) return false
      const body = bodyRef.current
      if (!body) return false
      // Apply impulse at the strike point.
      const impulse = direction.clone().multiplyScalar(power * 3)
      body.applyImpulseAtPoint(
        { x: impulse.x, y: impulse.y, z: impulse.z },
        { x: worldPoint.x, y: worldPoint.y, z: worldPoint.z },
        true,
      )

      if (power >= preset.toughness) {
        // Capture current transform + velocity so shards inherit motion.
        const t = body.translation()
        const r = body.rotation()
        const lv = body.linvel()
        const av = body.angvel()
        setBroken({
          origin: [t.x, t.y, t.z],
          quat: [r.x, r.y, r.z, r.w],
          lin: [lv.x, lv.y, lv.z],
          ang: [av.x, av.y, av.z],
          strikeDir: [direction.x, direction.y, direction.z],
          strikePower: power,
        } as any)
        return true
      }
      return false
    },
    reset() {
      setBroken(false)
    },
  }))

  if (broken && typeof broken === 'object') {
    const b = broken as unknown as BrokenState
    return (
      <group>
        {preset.shards.map((shard, i) => (
          <Shardlet
            key={i}
            shard={shard}
            origin={b.origin}
            parentQuat={b.quat}
            inheritedLin={b.lin}
            inheritedAng={b.ang}
            strikeDir={b.strikeDir}
            strikePower={b.strikePower}
          />
        ))}
      </group>
    )
  }

  return (
    <RigidBody
      ref={bodyRef}
      colliders="hull"
      position={position}
      restitution={0.2}
      friction={0.6}
      mass={1.2}
    >
      {preset.parts.map((part, i) => (
        <PartMesh key={i} part={part} />
      ))}
    </RigidBody>
  )
})

interface BrokenState {
  origin: [number, number, number]
  quat: [number, number, number, number]
  lin: [number, number, number]
  ang: [number, number, number]
  strikeDir: [number, number, number]
  strikePower: number
}

function Shardlet({
  shard,
  origin,
  parentQuat,
  inheritedLin,
  inheritedAng,
  strikeDir,
  strikePower,
}: {
  shard: Shard
  origin: [number, number, number]
  parentQuat: [number, number, number, number]
  inheritedLin: [number, number, number]
  inheritedAng: [number, number, number]
  strikeDir: [number, number, number]
  strikePower: number
}) {
  // Rotate the shard's local offset by the parent's quaternion to get its
  // world spawn position, so shards explode from where the object actually was.
  const q = new THREE.Quaternion(parentQuat[0], parentQuat[1], parentQuat[2], parentQuat[3])
  const local = new THREE.Vector3(...shard.position)
  local.applyQuaternion(q)

  const worldPos: [number, number, number] = [
    origin[0] + local.x,
    origin[1] + local.y,
    origin[2] + local.z,
  ]

  const dir = new THREE.Vector3(...strikeDir).normalize()
  const outward = local.clone().normalize().multiplyScalar(2.0 + strikePower)
  const burst = dir.multiplyScalar(1.5 + strikePower).add(outward)

  const linVel: [number, number, number] = [
    inheritedLin[0] + burst.x,
    inheritedLin[1] + burst.y + 1.0,
    inheritedLin[2] + burst.z,
  ]
  const angVel: [number, number, number] = [
    inheritedAng[0] + (Math.random() - 0.5) * 8,
    inheritedAng[1] + (Math.random() - 0.5) * 8,
    inheritedAng[2] + (Math.random() - 0.5) * 8,
  ]

  return (
    <RigidBody
      colliders={false}
      position={worldPos}
      linearVelocity={linVel}
      angularVelocity={angVel}
      restitution={0.3}
      friction={0.7}
      mass={0.15}
    >
      {/* Use a simple cuboid collider sized to the shard's bbox for cheap physics */}
      <ShardCollider shard={shard} />
      <PartMesh part={{ ...shard, position: [0, 0, 0] }} />
    </RigidBody>
  )
}

function ShardCollider({ shard }: { shard: Shard }) {
  const s = shard.shape
  if (s.kind === 'box') {
    return <CuboidCollider args={[s.size[0] / 2, s.size[1] / 2, s.size[2] / 2]} />
  }
  // Approximate other shapes with a box for cheap physics.
  if (s.kind === 'cylinder') return <CuboidCollider args={[s.radius, s.height / 2, s.radius]} />
  if (s.kind === 'sphere') return <CuboidCollider args={[s.radius, s.radius, s.radius]} />
  return <CuboidCollider args={[0.1, 0.1, 0.1]} />
}
