import type { Part, Shard } from '../data/objects'

export function PartMesh({ part }: { part: Part | Shard }) {
  const color = part.color
  const metalness = 'metalness' in part ? part.metalness ?? 0.05 : 0.05
  const roughness = 'roughness' in part ? part.roughness ?? 0.6 : 0.6
  const position = part.position ?? [0, 0, 0]
  const rotation = part.rotation ?? [0, 0, 0]
  const s = part.shape

  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      {s.kind === 'box' && <boxGeometry args={s.size} />}
      {s.kind === 'cylinder' && (
        <cylinderGeometry args={[s.radius, s.radius, s.height, s.segments ?? 16]} />
      )}
      {s.kind === 'sphere' && <sphereGeometry args={[s.radius, 16, 12]} />}
      {s.kind === 'torus' && <torusGeometry args={[s.radius, s.tube, 12, 24]} />}
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  )
}
