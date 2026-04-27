import { useRef, useState, useMemo, useEffect } from 'react'
import { Text, Billboard } from '@react-three/drei'
import { useStore } from '../store/useStore'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'

function PegmanMarker({ pegmanMode, pegmanPosition, onPegmanDrop, isNavigating = false, navigationPath = [], gpsTracking = false, gpsHeading = null }) {
  const { camera, raycaster, pointer, gl } = useThree()
  const meshRef = useRef()
  const dragPlaneRef = useRef()
  const [hoverPosition, setHoverPosition] = useState(null)
  const [currentPathIndex, setCurrentPathIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const intersectPoint = useMemo(() => new THREE.Vector3(), [])
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const dragPoint = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (navigationPath && navigationPath.length > 0) {
      setCurrentPathIndex(0)
    }
  }, [navigationPath])

  // When animated navigation starts (no GPS), imperatively set the starting position
  // so useFrame can take over smoothly from there.
  useEffect(() => {
    if (isNavigating && !gpsTracking && meshRef.current) {
      const startPos = pegmanPosition || (navigationPath && navigationPath[0])
      if (startPos) {
        meshRef.current.position.set(startPos[0], 0, startPos[2])
      }
    }
  }, [isNavigating, gpsTracking]) // only re-run when navigation state changes

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Apply GPS compass heading as rotation
    if (gpsTracking && gpsHeading !== null) {
      meshRef.current.rotation.y = (gpsHeading * Math.PI) / 180
    }

    // Smooth path animation ONLY when navigating without GPS
    // (GPS mode uses declarative position prop instead)
    if (isNavigating && !gpsTracking && navigationPath.length > 1) {
      const targetPos = navigationPath[currentPathIndex]
      if (targetPos) {
        const currentPos = meshRef.current.position
        const target = new THREE.Vector3(targetPos[0], 0, targetPos[2])
        const distance = currentPos.distanceTo(target)

        if (distance < 0.5) {
          if (currentPathIndex < navigationPath.length - 1) {
            setCurrentPathIndex(currentPathIndex + 1)
          }
        } else {
          const direction = target.clone().sub(currentPos).normalize()
          currentPos.add(direction.multiplyScalar(3 * delta))
        }
      }
    }
  })

  useEffect(() => {
    if (!pegmanMode || !gl?.domElement) return

    const canvas = gl.domElement

    const getMapPosition = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -((clientY - rect.top) / rect.height) * 2 + 1
      
      const tempRaycaster = new THREE.Raycaster()
      tempRaycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const point = new THREE.Vector3()
      
      if (tempRaycaster.ray.intersectPlane(groundPlane, point)) {
        return [point.x, 0, point.z]
      }
      return null
    }

    const handleMove = (e) => {
      const pos = getMapPosition(e.clientX, e.clientY)
      if (pos) {
        setHoverPosition(pos)
        canvas.style.cursor = 'crosshair'
      }
    }

    const handleClick = (e) => {
      if (!pegmanMode) return
      const pos = getMapPosition(e.clientX, e.clientY)
      console.log('Canvas click - pegman placement:', pos)
      if (pos && onPegmanDrop) {
        onPegmanDrop(pos)
      }
    }

    const handlePointerUp = (e) => {
      if (!pegmanMode) return
      const pos = getMapPosition(e.clientX, e.clientY)
      console.log('Pointer up - pegman placement:', pos)
      if (pos && onPegmanDrop) {
        onPegmanDrop(pos)
      }
    }

    canvas.style.cursor = 'crosshair'
    canvas.addEventListener('pointermove', handleMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    
    return () => {
      canvas.removeEventListener('pointermove', handleMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.style.cursor = 'default'
    }
  }, [pegmanMode, camera, gl, onPegmanDrop])

  useEffect(() => {
    if (!pegmanPosition || isNavigating || gpsTracking || !gl?.domElement) return

    const canvas = gl.domElement

    const handleDragStart = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      
      const tempRaycaster = new THREE.Raycaster()
      tempRaycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const point = new THREE.Vector3()
      
      if (tempRaycaster.ray.intersectPlane(groundPlane, point)) {
        const dx = point.x - pegmanPosition[0]
        const dz = point.z - pegmanPosition[2]
        const dist = Math.sqrt(dx * dx + dz * dz)
        
        if (dist < 3) {
          e.preventDefault()
          canvas.style.cursor = 'grabbing'
          const handleDrag = (moveEvent) => {
            const newPos = getMapPositionDirect(moveEvent.clientX, moveEvent.clientY)
            if (newPos && onPegmanDrop) {
              onPegmanDrop(newPos)
            }
          }
          
          const handleDragEnd = () => {
            canvas.style.cursor = 'grab'
            window.removeEventListener('pointermove', handleDrag)
            window.removeEventListener('pointerup', handleDragEnd)
          }
          
          window.addEventListener('pointermove', handleDrag)
          window.addEventListener('pointerup', handleDragEnd)
        }
      }
    }

    const getMapPositionDirect = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = ((clientX - rect.left) / rect.width) * 2 - 1
      const y = -((clientY - rect.top) / rect.height) * 2 + 1
      
      const tempRaycaster = new THREE.Raycaster()
      tempRaycaster.setFromCamera(new THREE.Vector2(x, y), camera)
      
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const point = new THREE.Vector3()
      
      if (tempRaycaster.ray.intersectPlane(groundPlane, point)) {
        return [point.x, 0, point.z]
      }
      return null
    }

    canvas.addEventListener('pointerdown', handleDragStart)
    return () => {
      canvas.removeEventListener('pointerdown', handleDragStart)
    }
  }, [pegmanPosition, camera, gl, onPegmanDrop, isNavigating, gpsTracking])

  const pegmanColor = isNavigating ? '#10b981' : '#ef4444'
  const pegmanEmissive = isNavigating ? '#10b981' : '#ef4444'

  // --- Position strategy ---
  // GPS tracking or static placement → use DECLARATIVE position prop so R3F
  // reactively updates the Three.js object every time pegmanPosition changes.
  // Animated navigation (isNavigating && !gpsTracking) → position is managed
  // by useFrame imperatively; do NOT pass a position prop so R3F doesn't fight it.
  const useDeclarativePos = gpsTracking || !isNavigating
  const declarativePos = useDeclarativePos && pegmanPosition
    ? [pegmanPosition[0], 0, pegmanPosition[2]]
    : null

  const pegmanBody = (color, emissive) => (
    <>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isNavigating ? 1.5 : 1.2, 32]} />
        <meshStandardMaterial color={color} transparent opacity={isNavigating ? 0.6 : 0.4} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 1.8, 8]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[0.35, 0.5, 8]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.3} />
      </mesh>
      {isNavigating && (
        <pointLight position={[0, 2, 0]} intensity={1.5} color={color} distance={12} />
      )}
    </>
  )

  return (
    <>
      {/* Hover preview while in placement mode */}
      {pegmanMode && hoverPosition && (
        <group position={hoverPosition}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <circleGeometry args={[2, 32]} />
            <meshStandardMaterial color="#ef4444" transparent opacity={0.3} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 1.8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <coneGeometry args={[0.35, 0.5, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}

      {/* Actual pegman — visible when placed, navigating, or GPS tracking */}
      {(pegmanPosition || isNavigating || gpsTracking) && !pegmanMode && (
        declarativePos
          /* GPS / static mode: R3F owns the position declaratively.
             Every pegmanPosition prop change is immediately applied. */
          ? <group ref={meshRef} position={declarativePos}>
              {pegmanBody(pegmanColor, pegmanEmissive)}
            </group>
          /* Animated navigation mode: useFrame owns position imperatively.
             No position prop → R3F won't reset it between frames. */
          : <group ref={meshRef}>
              {pegmanBody(pegmanColor, pegmanEmissive)}
            </group>
      )}
    </>
  )
}

function DropZone({ onDrop, isActive }) {
  const { camera, raycaster, pointer } = useThree()
  const [hoverPosition, setHoverPosition] = useState(null)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const intersectPoint = useMemo(() => new THREE.Vector3(), [])
  
  useEffect(() => {
    if (!isActive) return
    
    const handleMove = () => {
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        setHoverPosition([intersectPoint.x, 0, intersectPoint.z])
      }
    }
    
    const handleClick = (e) => {
      if (!isActive) return
      raycaster.setFromCamera(pointer, camera)
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        onDrop([intersectPoint.x, 0, intersectPoint.z])
      }
    }
    
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('click', handleClick)
    }
  }, [isActive, camera, raycaster, pointer, plane, intersectPoint, onDrop])

  if (!isActive) return null

  return (
    <>
      {hoverPosition && (
        <group position={hoverPosition}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <circleGeometry args={[3, 32]} />
            <meshStandardMaterial color="#10b981" transparent opacity={0.3} />
          </mesh>
          <pointLight position={[0, 2, 0]} intensity={1} color="#10b981" distance={10} />
        </group>
      )}
    </>
  )
}

function DraggableBuilding({ building, onSelect, isSelected, adminMode, onDragEnd }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const { camera, gl } = useThree()
  
  const dimensions = useMemo(() => {
    const baseWidth = building.type === 'residential' ? 14 : building.type === 'facility' ? 12 : 10
    const baseDepth = building.type === 'residential' ? 10 : building.type === 'facility' ? 12 : 10
    const baseHeight = building.type === 'residential' ? 14 : building.type === 'academic' ? 10 : 7
    return [
      baseWidth * (building.scale?.[0] || 1),
      baseHeight * (building.scale?.[1] || 1),
      baseDepth * (building.scale?.[2] || 1)
    ]
  }, [building.type, building.scale])

  const handlePointerDown = (e) => {
    if (adminMode && !building.locked) {
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({
        x: e.point.x,
        z: e.point.z,
        buildingX: building.position[0],
        buildingZ: building.position[2]
      })
      gl.domElement.style.cursor = 'grabbing'
    }
  }

  const handlePointerMove = (e) => {
    if (isDragging && dragStart) {
      const dx = e.point.x - dragStart.x
      const dz = e.point.z - dragStart.z
      const newX = dragStart.buildingX + dx
      const newZ = dragStart.buildingZ + dz
      onDragEnd(building.id, [newX, 0, newZ])
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    setDragStart(null)
    gl.domElement.style.cursor = hovered ? 'pointer' : 'auto'
  }

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const tempPoint = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => {
        const rect = gl.domElement.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
        raycaster.ray.intersectPlane(groundPlane, tempPoint)
        
        if (tempPoint) {
          const dx = tempPoint.x - dragStart.x
          const dz = tempPoint.z - dragStart.z
          onDragEnd(building.id, [dragStart.buildingX + dx, 0, dragStart.buildingZ + dz])
        }
      }
      
      const handleUp = () => {
        setIsDragging(false)
        setDragStart(null)
        gl.domElement.style.cursor = 'auto'
      }
      
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [isDragging, dragStart, camera, gl, building.id, onDragEnd])

  const buildingColors = {
    academic: { main: '#CD853F', roof: '#8B4513', trim: '#654321', windows: '#1e3a5f' },
    admin: { main: '#F5F5DC', roof: '#D2691E', trim: '#8B4513', windows: '#4169E1' },
    facility: { main: '#708090', roof: '#2F4F4F', trim: '#1C1C1C', windows: '#87CEEB' },
    residential: { main: '#DEB887', roof: '#A0522D', trim: '#8B4513', windows: '#E6E6FA' },
    feature: { main: '#808080', roof: '#505050', trim: '#303030', windows: '#87CEEB' }
  }

  const getBuildingStyle = () => {
    const style = buildingColors[building.type] || buildingColors.feature
    if (building.color) {
      style.main = building.color
    }
    return style
  }

  const style = getBuildingStyle()
  const isChapel = building.name?.toLowerCase().includes('chapel')
  const isGym = building.name?.toLowerCase().includes('gym')
  const isLibrary = building.name?.toLowerCase().includes('library') || building.name?.toLowerCase().includes('lic')
  const isDorm = building.type === 'residential'
  const isGate = building.modelType?.includes('Gate') || building.type === 'feature' && building.name?.toLowerCase().includes('gate')
  const isWall = building.type === 'wall'
  const isNewGate = building.type === 'gate'
  const isLongBuilding = building.type === 'long_building'
  const isFeature = building.type === 'feature' && !isGate
  const isNavPoint = building.type === 'navPoint'
  const modelType = building.modelType || (isGate ? 'archGate' : null)

  const renderNavPoint = () => {
    const scale = building.scale || [0.5, 0.5, 0.5]
    const baseColor = building.color || '#10B981'
    const room = building.floors?.[0]?.rooms?.[0]
    const pointType = room?.type || 'waypoint'
    
    const typeColors = {
      entrance: '#10B981',
      junction: '#F59E0B',
      exit: '#EF4444',
      meeting: '#8B5CF6',
      info: '#3B82F6',
      landmark: '#EC4899',
      waypoint: '#6B7280'
    }
    
    const glowColor = typeColors[pointType] || baseColor
    
    return (
      <group>
        <mesh position={[0, scale[1] / 2, 0]}>
          <cylinderGeometry args={[scale[0] * 0.4, scale[0] * 0.4, scale[1], 16]} />
          <meshStandardMaterial color={baseColor} metalness={0.3} roughness={0.5} />
        </mesh>
        
        <mesh position={[0, scale[1] + scale[0] * 0.3, 0]}>
          <sphereGeometry args={[scale[0] * 0.5, 16, 16]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.6} />
        </mesh>
        
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[scale[0] * 0.8, scale[0] * 0.8, 0.1, 16]} />
          <meshStandardMaterial color={baseColor} metalness={0.2} roughness={0.6} />
        </mesh>
        
        <pointLight position={[0, scale[1] + 1, 0]} intensity={0.5} color={glowColor} distance={8} />
      </group>
    )
  }

  const renderWall = () => {
    const scale = building.scale || [10, 2.5, 0.3]
    const baseColor = building.color || '#9CA3AF'
    
    if (modelType === 'concreteWall' || modelType === 'cinderWall') {
      return (
        <group>
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0], scale[1], scale[2]]} />
            <meshStandardMaterial color={baseColor} roughness={0.9} />
          </mesh>
          {Array.from({ length: Math.floor(scale[0] / 3) }).map((_, i) => (
            <mesh key={i} position={[-scale[0]/2 + 1.5 + i * 3, scale[1], 0]}>
              <boxGeometry args={[0.1, 0.15, scale[2] + 0.1]} />
              <meshStandardMaterial color="#6B6B6B" roughness={0.8} />
            </mesh>
          ))}
        </group>
      )
    }
    
    if (modelType === 'brickWall') {
      return (
        <group>
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0], scale[1], scale[2]]} />
            <meshStandardMaterial color={baseColor} roughness={0.85} />
          </mesh>
          {Array.from({ length: Math.floor(scale[0] / 2) }).map((_, i) => (
            <mesh key={i} position={[-(scale[0]/2) + 1 + i * 2, scale[1]/2, scale[2]/2 + 0.01]}>
              <boxGeometry args={[1.9, 0.1, 0.05]} />
              <meshStandardMaterial color="#6B3A1A" roughness={0.9} />
            </mesh>
          ))}
          {Array.from({ length: Math.floor(scale[0] / 2) }).map((_, i) => (
            <mesh key={`top-${i}`} position={[-(scale[0]/2) + 1 + i * 2, scale[1] - 0.15, scale[2]/2 + 0.01]}>
              <boxGeometry args={[1.9, 0.1, 0.05]} />
              <meshStandardMaterial color="#6B3A1A" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )
    }
    
    if (modelType === 'stoneWall') {
      return (
        <group>
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0], scale[1], scale[2]]} />
            <meshStandardMaterial color={baseColor} roughness={0.95} />
          </mesh>
          {Array.from({ length: Math.floor(scale[0] / 1.5) }).map((_, i) => (
            <mesh key={i} position={[-(scale[0]/2) + 0.75 + i * 1.5, scale[1]/2, scale[2]/2 + 0.01]}>
              <boxGeometry args={[1.4, scale[1] - 0.2, 0.08]} />
              <meshStandardMaterial color="#5B5B5B" roughness={0.9} />
            </mesh>
          ))}
        </group>
      )
    }
    
    if (modelType === 'woodFence' || modelType === 'picketFence') {
      const postColor = modelType === 'picketFence' ? '#E6E6E6' : '#8B6914'
      return (
        <group>
          {Array.from({ length: Math.floor(scale[0] / 2) + 1 }).map((_, i) => (
            <mesh key={`post-${i}`} position={[-scale[0]/2 + i * 2, scale[1]/2, 0]}>
              <boxGeometry args={[0.15, scale[1], 0.15]} />
              <meshStandardMaterial color={postColor} roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, scale[1] * 0.7, 0]}>
            <boxGeometry args={[scale[0], 0.1, 0.08]} />
            <meshStandardMaterial color={postColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, scale[1] * 0.4, 0]}>
            <boxGeometry args={[scale[0], 0.1, 0.08]} />
            <meshStandardMaterial color={postColor} roughness={0.7} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'chainLinkFence') {
      return (
        <group>
          {Array.from({ length: Math.floor(scale[0] / 3) + 1 }).map((_, i) => (
            <mesh key={`post-${i}`} position={[-scale[0]/2 + i * 3, scale[1]/2, 0]}>
              <boxGeometry args={[0.1, scale[1], 0.1]} />
              <meshStandardMaterial color="#2B2B2B" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0], scale[1], 0.02]} />
            <meshStandardMaterial color="#3D3D3D" transparent opacity={0.7} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, scale[1], 0]}>
            <boxGeometry args={[scale[0] + 0.2, 0.08, 0.15]} />
            <meshStandardMaterial color="#2B2B2B" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'wroughtIronFence') {
      return (
        <group>
          {Array.from({ length: Math.floor(scale[0] / 2) + 1 }).map((_, i) => (
            <mesh key={`post-${i}`} position={[-scale[0]/2 + i * 2, scale[1]/2, 0]}>
              <boxGeometry args={[0.08, scale[1], 0.08]} />
              <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          <mesh position={[0, scale[1] * 0.75, 0]}>
            <boxGeometry args={[scale[0], 0.06, 0.06]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, scale[1] * 0.5, 0]}>
            <boxGeometry args={[scale[0], 0.06, 0.06]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, scale[1] * 0.25, 0]}>
            <boxGeometry args={[scale[0], 0.06, 0.06]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>
          {Array.from({ length: Math.floor(scale[0] / 0.5) }).map((_, i) => (
            <mesh key={`bar-${i}`} position={[-scale[0]/2 + 0.25 + i * 0.5, scale[1]/2, 0]}>
              <boxGeometry args={[0.03, scale[1], 0.03]} />
              <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )
    }
    
    if (modelType === 'hedge') {
      return (
        <group>
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0], scale[1], scale[2]]} />
            <meshStandardMaterial color={baseColor} roughness={0.95} />
          </mesh>
          <mesh position={[0, scale[1] + 0.2, 0]}>
            <boxGeometry args={[scale[0] - 0.5, 0.4, scale[2] - 0.2]} />
            <meshStandardMaterial color="#1A5B1A" roughness={0.9} />
          </mesh>
        </group>
      )
    }
    
    return (
      <mesh position={[0, scale[1]/2, 0]}>
        <boxGeometry args={[scale[0], scale[1], scale[2]]} />
        <meshStandardMaterial color={baseColor} roughness={0.8} />
      </mesh>
    )
  }

  const renderLongBuilding = () => {
    const scaleX = building.scale?.[0] || 30
    const scaleY = building.scale?.[1] || 4
    const scaleZ = building.scale?.[2] || 15
    const baseColor = building.color || '#DEB887'
    const roomsPerSide = building.roomsPerSide || 3
    const corridorWidth = building.corridorWidth || 3
    
    const buildingLength = scaleX
    const buildingDepth = scaleZ
    const buildingHeight = scaleY
    const wallThickness = 0.3
    const corridorHalfWidth = corridorWidth / 2
    
    const roomDepth = (buildingDepth / 2 - corridorHalfWidth - wallThickness)
    const roomWidth = buildingLength / roomsPerSide
    
    const rooms = []
    
    for (let i = 0; i < roomsPerSide; i++) {
      const leftX = -buildingLength / 2 + (i + 0.5) * roomWidth
      const rightX = leftX
      
      rooms.push(
        <group key={`room-left-${i}`}>
          <mesh position={[leftX, buildingHeight / 2, -corridorHalfWidth - roomDepth / 2 - wallThickness]}>
            <boxGeometry args={[roomWidth - 0.2, buildingHeight, roomDepth]} />
            <meshStandardMaterial color={baseColor} roughness={0.8} />
          </mesh>
          <mesh position={[leftX, buildingHeight, -corridorHalfWidth - roomDepth / 2 - wallThickness]}>
            <boxGeometry args={[roomWidth - 0.2, 0.2, roomDepth]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
          <mesh position={[leftX, buildingHeight / 2, -corridorHalfWidth - roomDepth / 2 - wallThickness - 0.01]}>
            <boxGeometry args={[1.5, 1.8, 0.05]} />
            <meshStandardMaterial color="#333333" roughness={0.9} />
          </mesh>
          <mesh position={[leftX, buildingHeight / 2, -corridorHalfWidth - roomDepth / 2 - wallThickness - 0.02]}>
            <planeGeometry args={[1.3, 1.6]} />
            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
        </group>
      )
      
      rooms.push(
        <group key={`room-right-${i}`}>
          <mesh position={[rightX, buildingHeight / 2, corridorHalfWidth + roomDepth / 2 + wallThickness]}>
            <boxGeometry args={[roomWidth - 0.2, buildingHeight, roomDepth]} />
            <meshStandardMaterial color={baseColor} roughness={0.8} />
          </mesh>
          <mesh position={[rightX, buildingHeight, corridorHalfWidth + roomDepth / 2 + wallThickness]}>
            <boxGeometry args={[roomWidth - 0.2, 0.2, roomDepth]} />
            <meshStandardMaterial color="#8B4513" roughness={0.7} />
          </mesh>
          <mesh position={[rightX, buildingHeight / 2, corridorHalfWidth + roomDepth / 2 + wallThickness + 0.01]}>
            <boxGeometry args={[1.5, 1.8, 0.05]} />
            <meshStandardMaterial color="#333333" roughness={0.9} />
          </mesh>
          <mesh position={[rightX, buildingHeight / 2, corridorHalfWidth + roomDepth / 2 + wallThickness + 0.02]}>
            <planeGeometry args={[1.3, 1.6]} />
            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
        </group>
      )
    }
    
    return (
      <group>
        {rooms}
        
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[buildingLength, 0.3, corridorWidth]} />
          <meshStandardMaterial color="#808080" roughness={0.9} />
        </mesh>
        
        <mesh position={[0, buildingHeight + 0.2, 0]}>
          <boxGeometry args={[buildingLength + 0.4, 0.4, buildingDepth + 0.4]} />
          <meshStandardMaterial color="#A0522D" roughness={0.6} />
        </mesh>
        
        <mesh position={[-buildingLength / 2 - wallThickness / 2, buildingHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, buildingHeight + 0.4, buildingDepth]} />
          <meshStandardMaterial color={baseColor} roughness={0.8} />
        </mesh>
        <mesh position={[buildingLength / 2 + wallThickness / 2, buildingHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, buildingHeight + 0.4, buildingDepth]} />
          <meshStandardMaterial color={baseColor} roughness={0.8} />
        </mesh>
        
        <mesh position={[0, buildingHeight / 2, -corridorHalfWidth - wallThickness / 2]}>
          <boxGeometry args={[buildingLength + wallThickness * 2, buildingHeight + 0.4, wallThickness]} />
          <meshStandardMaterial color={baseColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, buildingHeight / 2, corridorHalfWidth + wallThickness / 2]}>
          <boxGeometry args={[buildingLength + wallThickness * 2, buildingHeight + 0.4, wallThickness]} />
          <meshStandardMaterial color={baseColor} roughness={0.8} />
        </mesh>
        
        <mesh position={[0, 0.15, buildingDepth / 2 + 2]}>
          <boxGeometry args={[4, 0.2, 3]} />
          <meshStandardMaterial color="#A0A0A0" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.15, -buildingDepth / 2 - 2]}>
          <boxGeometry args={[4, 0.2, 3]} />
          <meshStandardMaterial color="#A0A0A0" roughness={0.9} />
        </mesh>
      </group>
    )
  }

  const renderNewGate = () => {
    const scale = building.scale || [8, 2.5, 0.3]
    const baseColor = building.color || '#2B2B2B'
    
    if (modelType === 'modernGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.4, scale[1]/2, 0]}>
            <boxGeometry args={[0.5, scale[1], scale[2]]} />
            <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.4, scale[1]/2, 0]}>
            <boxGeometry args={[0.5, scale[1], scale[2]]} />
            <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.3} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.4, scale[1] + 0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, scale[2] + 0.15]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.4, scale[1] + 0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, scale[2] + 0.15]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, scale[1] + 0.4, 0]}>
            <boxGeometry args={[scale[0], 0.6, scale[2] + 0.3]} />
            <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0] - 1, scale[1] - 0.5, 0.08]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {Array.from({ length: Math.floor(scale[0] / 3) }).map((_, i) => (
            <mesh key={`bar-${i}`} position={[-scale[0]/2 + 1.5 + i * 3, scale[1]/2, scale[2]/2 + 0.05]}>
              <boxGeometry args={[0.06, scale[1] - 0.8, 0.06]} />
              <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          
          <mesh position={[scale[0]/2 - 0.4, scale[1] * 0.4, scale[2]/2 + 0.1]}>
            <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          
          <pointLight position={[0, scale[1] + 0.5, 0]} intensity={0.3} color="#87CEEB" distance={10} />
        </group>
      )
    }
    
    if (modelType === 'classicGate') {
      const pillarHeight = scale[1] + 1.5
      return (
        <group>
          <mesh position={[-scale[0]/2 + 1, pillarHeight/2, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[1.5, pillarHeight, 1]} />
            <meshStandardMaterial color="#B8A080" roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[scale[0]/2 - 1, pillarHeight/2, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[1.5, pillarHeight, 1]} />
            <meshStandardMaterial color="#B8A080" roughness={0.7} metalness={0.1} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 1, pillarHeight + 0.3, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[1.8, 0.6, 1.2]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[scale[0]/2 - 1, pillarHeight + 0.3, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[1.8, 0.6, 1.2]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 1, pillarHeight + 0.7, -scale[2]/2 + 0.5]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[scale[0]/2 - 1, pillarHeight + 0.7, -scale[2]/2 + 0.5]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, scale[1] + 1, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[scale[0] - 1, 1.8, 0.8]} />
            <meshStandardMaterial color="#C9B896" roughness={0.6} metalness={0.1} />
          </mesh>
          
          <mesh position={[0, scale[1] + 1.9, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[scale[0], 0.3, 1]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 1, scale[1]/2, 0]}>
            <boxGeometry args={[0.2, scale[1] - 0.3, scale[2] - 1]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 1, scale[1]/2, 0]}>
            <boxGeometry args={[0.2, scale[1] - 0.3, scale[2] - 1]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[scale[0] + 1, 0.2, scale[2] + 1]} />
            <meshStandardMaterial color="#696969" roughness={0.9} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'pedestrianGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.1, scale[1]/2, 0]}>
            <boxGeometry args={[0.2, scale[1], scale[2] + 0.1]} />
            <meshStandardMaterial color="#4A4A4A" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.1, scale[1]/2, 0]}>
            <boxGeometry args={[0.2, scale[1], scale[2] + 0.1]} />
            <meshStandardMaterial color="#4A4A4A" metalness={0.6} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, scale[1], 0]}>
            <boxGeometry args={[scale[0], 0.2, scale[2] + 0.15]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.5} roughness={0.5} />
          </mesh>
          
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0] - 0.3, scale[1] - 0.4, 0.08]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.4} roughness={0.6} />
          </mesh>
          
          <mesh position={[0, scale[1]/2, scale[2]/2 + 0.05]}>
            <boxGeometry args={[scale[0] - 0.4, scale[1] - 0.6, 0.05]} />
            <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
          </mesh>
          
          <mesh position={[0, scale[1] - 0.15, scale[2]/2 + 0.08]}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, scale[1] - 0.4, scale[2]/2 + 0.1]}>
            <boxGeometry args={[0.5, 0.1, 0.05]} />
            <meshStandardMaterial color="#B8860B" metalness={0.8} roughness={0.3} />
          </mesh>
          
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0] + 0.3, 0.15, scale[2] + 0.3]} />
            <meshStandardMaterial color="#505050" roughness={0.8} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'woodenGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.15, scale[1]/2, 0]}>
            <boxGeometry args={[0.25, scale[1], scale[2] + 0.1]} />
            <meshStandardMaterial color="#5D4037" roughness={0.8} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.15, scale[1]/2, 0]}>
            <boxGeometry args={[0.25, scale[1], scale[2] + 0.1]} />
            <meshStandardMaterial color="#5D4037" roughness={0.8} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.15, scale[1] + 0.05, 0]}>
            <boxGeometry args={[0.3, 0.15, scale[2] + 0.15]} />
            <meshStandardMaterial color="#4A3728" roughness={0.8} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.15, scale[1] + 0.05, 0]}>
            <boxGeometry args={[0.3, 0.15, scale[2] + 0.15]} />
            <meshStandardMaterial color="#4A3728" roughness={0.8} />
          </mesh>
          
          <mesh position={[0, scale[1]/2, scale[2]/2 + 0.05]}>
            <boxGeometry args={[scale[0] - 0.2, scale[1] - 0.3, 0.1]} />
            <meshStandardMaterial color={baseColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, scale[1]/2, -scale[2]/2 - 0.05]}>
            <boxGeometry args={[scale[0] - 0.2, scale[1] - 0.3, 0.1]} />
            <meshStandardMaterial color={baseColor} roughness={0.7} />
          </mesh>
          
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0], 0.15, scale[2] + 0.2]} />
            <meshStandardMaterial color="#696969" roughness={0.9} />
          </mesh>
          
          <mesh position={[0, scale[1] * 0.7, scale[2]/2 + 0.12]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
            <meshStandardMaterial color="#8B7355" metalness={0.3} roughness={0.7} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'steelGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.3, scale[1]/2, 0]}>
            <boxGeometry args={[0.4, scale[1], scale[2]]} />
            <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.3, scale[1]/2, 0]}>
            <boxGeometry args={[0.4, scale[1], scale[2]]} />
            <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, scale[1] + 0.25, 0]}>
            <boxGeometry args={[scale[0] + 0.4, 0.5, scale[2] + 0.3]} />
            <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.3, scale[1] + 0.05, 0]}>
            <boxGeometry args={[0.5, 0.15, scale[2] + 0.1]} />
            <meshStandardMaterial color="#353535" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.3, scale[1] + 0.05, 0]}>
            <boxGeometry args={[0.5, 0.15, scale[2] + 0.1]} />
            <meshStandardMaterial color="#353535" metalness={0.7} roughness={0.3} />
          </mesh>
          
          {Array.from({ length: Math.floor(scale[0] / 1.5) }).map((_, i) => (
            <mesh key={`bar-${i}`} position={[-scale[0]/2 + 0.75 + i * 1.5, scale[1]/2, 0]}>
              <boxGeometry args={[0.12, scale[1] - 0.4, 0.08]} />
              <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}
          
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0], 0.15, scale[2] + 0.2]} />
            <meshStandardMaterial color="#404040" roughness={0.8} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'slidingGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.4, scale[1]/2, scale[2]/2]}>
            <boxGeometry args={[0.4, scale[1], 0.4]} />
            <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-scale[0]/2 + 0.4, scale[1]/2, -scale[2]/2]}>
            <boxGeometry args={[0.4, scale[1], 0.4]} />
            <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[0, scale[1] + 0.2, 0]}>
            <boxGeometry args={[scale[0] + 0.5, 0.4, scale[2] + 0.3]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.6} roughness={0.4} />
          </mesh>
          
          {Array.from({ length: Math.floor(scale[0] / 2) }).map((_, i) => (
            <mesh key={`bar-${i}`} position={[-scale[0]/2 + 1 + i * 2, scale[1]/2, 0]}>
              <boxGeometry args={[0.1, scale[1] - 0.3, 0.1]} />
              <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
          
          <mesh position={[0, scale[1] * 0.5, scale[2]/2 + 0.2]}>
            <boxGeometry args={[scale[0] - 0.6, scale[1] * 0.9, 0.1]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.5} roughness={0.5} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.4, scale[1] + 0.5, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'swingGateDouble') {
      return (
        <group>
          <mesh position={[-scale[0]/4 - 0.15, scale[1]/2, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[0.3, scale[1], scale[2] - 0.4]} />
            <meshStandardMaterial color="#2A4A2A" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[scale[0]/4 + 0.15, scale[1]/2, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[0.3, scale[1], scale[2] - 0.4]} />
            <meshStandardMaterial color="#2A4A2A" roughness={0.6} metalness={0.2} />
          </mesh>
          
          <mesh position={[0, scale[1] + 0.25, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[scale[0]/2 + 0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#1A3A1A" roughness={0.6} metalness={0.2} />
          </mesh>
          
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0], 0.15, scale[2] + 0.5]} />
            <meshStandardMaterial color="#404040" roughness={0.8} />
          </mesh>
          
          <mesh position={[-scale[0]/4 - 0.15, scale[1] * 0.5, -scale[2]/2 + 0.5]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/4 + 0.15, scale[1] * 0.5, -scale[2]/2 + 0.5]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
            <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )
    }

    if (modelType === 'doubleGateModern') {
      const halfWidth = scale[0] / 2 - 0.3
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.5, scale[1]/2, 0]}>
            <boxGeometry args={[0.6, scale[1], scale[2]]} />
            <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1]/2, 0]}>
            <boxGeometry args={[0.6, scale[1], scale[2]]} />
            <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.3} />
          </mesh>

          <mesh position={[-scale[0]/2 + 0.5, scale[1] + 0.15, 0]}>
            <boxGeometry args={[0.7, 0.3, scale[2] + 0.2]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1] + 0.15, 0]}>
            <boxGeometry args={[0.7, 0.3, scale[2] + 0.2]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.7} roughness={0.4} />
          </mesh>

          <mesh position={[-halfWidth/2, scale[1] + 0.4, 0]}>
            <boxGeometry args={[halfWidth, 0.8, scale[2] + 0.4]} />
            <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
          </mesh>

          <mesh position={[-halfWidth/2, scale[1]/2, 0]}>
            <boxGeometry args={[halfWidth - 0.5, scale[1] - 0.5, 0.1]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.5} roughness={0.5} />
          </mesh>

          {Array.from({ length: Math.floor(halfWidth / 2.5) }).map((_, i) => (
            <mesh key={`bar-${i}`} position={[-halfWidth/2 + 0.6 + i * 2.5, scale[1]/2, scale[2]/2 + 0.06]}>
              <boxGeometry args={[0.08, scale[1] - 0.8, 0.08]} />
              <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}

          <mesh position={[-halfWidth/2, scale[1] * 0.5, -scale[2]/2 + 0.3]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[halfWidth/2, scale[1] * 0.5, -scale[2]/2 + 0.3]}>
            <cylinderGeometry args={[0.06, 0.06, 0.4, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>

          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0] + 1, 0.15, scale[2] + 0.8]} />
            <meshStandardMaterial color="#505050" roughness={0.8} />
          </mesh>

          <pointLight position={[0, scale[1] + 0.6, 0]} intensity={0.4} color="#87CEEB" distance={12} />
        </group>
      )
    }

    if (modelType === 'doubleGateClassic') {
      const pillarHeight = scale[1] + 1.5
      const halfWidth = scale[0] / 2
      return (
        <group>
          <mesh position={[-halfWidth + 1.2, pillarHeight/2, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[1.8, pillarHeight, 1.2]} />
            <meshStandardMaterial color="#B8A080" roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[halfWidth - 1.2, pillarHeight/2, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[1.8, pillarHeight, 1.2]} />
            <meshStandardMaterial color="#B8A080" roughness={0.7} metalness={0.1} />
          </mesh>

          <mesh position={[-halfWidth + 1.2, pillarHeight + 0.4, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[2.2, 0.8, 1.4]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[halfWidth - 1.2, pillarHeight + 0.4, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[2.2, 0.8, 1.4]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
          </mesh>

          <mesh position={[-halfWidth + 1.2, pillarHeight + 0.9, -scale[2]/2 + 0.5]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[halfWidth - 1.2, pillarHeight + 0.9, -scale[2]/2 + 0.5]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.8} roughness={0.2} />
          </mesh>

          <mesh position={[0, scale[1] + 1.2, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[scale[0] - 1.5, 2, 0.9]} />
            <meshStandardMaterial color="#C9B896" roughness={0.6} metalness={0.1} />
          </mesh>

          <mesh position={[0, scale[1] + 2.2, -scale[2]/2 + 0.5]}>
            <boxGeometry args={[scale[0], 0.35, 1.1]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} metalness={0.1} />
          </mesh>

          <mesh position={[-halfWidth + 0.8, scale[1]/2, 0]}>
            <boxGeometry args={[0.25, scale[1] - 0.3, scale[2] - 1.2]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[halfWidth - 0.8, scale[1]/2, 0]}>
            <boxGeometry args={[0.25, scale[1] - 0.3, scale[2] - 1.2]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.7} roughness={0.3} />
          </mesh>

          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[scale[0] + 1.2, 0.2, scale[2] + 1.2]} />
            <meshStandardMaterial color="#696969" roughness={0.9} />
          </mesh>
        </group>
      )
    }

    if (modelType === 'doubleGateSteel') {
      const halfWidth = scale[0] / 2 - 0.4
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.5, scale[1]/2, 0]}>
            <boxGeometry args={[0.5, scale[1], scale[2]]} />
            <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1]/2, 0]}>
            <boxGeometry args={[0.5, scale[1], scale[2]]} />
            <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} />
          </mesh>

          <mesh position={[0, scale[1] + 0.3, 0]}>
            <boxGeometry args={[scale[0] + 0.5, 0.6, scale[2] + 0.4]} />
            <meshStandardMaterial color="#404040" metalness={0.7} roughness={0.3} />
          </mesh>

          <mesh position={[-scale[0]/2 + 0.5, scale[1] + 0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, scale[2] + 0.15]} />
            <meshStandardMaterial color="#353535" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1] + 0.1, 0]}>
            <boxGeometry args={[0.6, 0.2, scale[2] + 0.15]} />
            <meshStandardMaterial color="#353535" metalness={0.7} roughness={0.3} />
          </mesh>

          <mesh position={[-halfWidth/2, scale[1]/2, 0]}>
            <boxGeometry args={[halfWidth - 0.3, scale[1] - 0.4, 0.12]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[halfWidth/2, scale[1]/2, 0]}>
            <boxGeometry args={[halfWidth - 0.3, scale[1] - 0.4, 0.12]} />
            <meshStandardMaterial color="#3A3A3A" metalness={0.7} roughness={0.3} />
          </mesh>

          {Array.from({ length: Math.floor(halfWidth / 1.2) }).map((_, i) => (
            <mesh key={`bar-${i}`} position={[-halfWidth/2 + 0.5 + i * 1.2, scale[1]/2, 0]}>
              <boxGeometry args={[0.15, scale[1] - 0.6, 0.1]} />
              <meshStandardMaterial color="#505050" metalness={0.8} roughness={0.2} />
            </mesh>
          ))}

          <mesh position={[-halfWidth/2, scale[1] * 0.5, -scale[2]/2 + 0.25]}>
            <cylinderGeometry args={[0.07, 0.07, 0.35, 10]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[halfWidth/2, scale[1] * 0.5, -scale[2]/2 + 0.25]}>
            <cylinderGeometry args={[0.07, 0.07, 0.35, 10]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>

          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0], 0.15, scale[2] + 0.3]} />
            <meshStandardMaterial color="#404040" roughness={0.8} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'guardBooth') {
      return (
        <group>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[scale[0], 1, scale[2]]} />
            <meshStandardMaterial color="#F5F5DC" roughness={0.7} />
          </mesh>
          
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[scale[0] * 0.95, 0.5, scale[2] * 0.95]} />
            <meshStandardMaterial color="#E8E0D0" roughness={0.6} />
          </mesh>
          
          <mesh position={[0, 1.55, 0]}>
            <boxGeometry args={[scale[0] * 1.05, 0.2, scale[2] * 1.05]} />
            <meshStandardMaterial color="#8B7355" roughness={0.5} />
          </mesh>
          
          <mesh position={[0, 1.1, scale[2]/2 + 0.05]}>
            <boxGeometry args={[scale[0] * 0.6, 0.5, 0.08]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} metalness={0.3} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, 1.1, -scale[2]/2 - 0.05]}>
            <boxGeometry args={[scale[0] * 0.6, 0.5, 0.08]} />
            <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} metalness={0.3} roughness={0.2} />
          </mesh>
          
          <mesh position={[scale[0]/2 + 0.05, 0.6, 0]}>
            <boxGeometry args={[0.15, 1, scale[2] * 0.5]} />
            <meshStandardMaterial color="#2B2B2B" metalness={0.6} roughness={0.4} />
          </mesh>
          
          <mesh position={[scale[0]/2 + 0.1, 1.15, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[scale[0] + 0.5, 0.1, scale[2] + 0.5]} />
            <meshStandardMaterial color="#696969" roughness={0.9} />
          </mesh>
          
          <pointLight position={[0, 2, 0]} intensity={0.6} color="#87CEEB" distance={10} />
        </group>
      )
    }
    
    if (modelType === 'gateWithWall') {
      const wallSection = scale[0] - 8
      return (
        <group>
          <mesh position={[-scale[0]/2 + wallSection/4, scale[1]/2, 0]}>
            <boxGeometry args={[wallSection/2, scale[1], scale[2]]} />
            <meshStandardMaterial color="#A0A0A0" roughness={0.8} />
          </mesh>
          <mesh position={[scale[0]/2 - wallSection/4, scale[1]/2, 0]}>
            <boxGeometry args={[wallSection/2, scale[1], scale[2]]} />
            <meshStandardMaterial color="#A0A0A0" roughness={0.8} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.6, scale[1]/2, -scale[2]/2 + 0.4]}>
            <boxGeometry args={[0.8, scale[1], 0.8]} />
            <meshStandardMaterial color="#909090" roughness={0.7} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.6, scale[1]/2, -scale[2]/2 + 0.4]}>
            <boxGeometry args={[0.8, scale[1], 0.8]} />
            <meshStandardMaterial color="#909090" roughness={0.7} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.6, scale[1] + 0.4, -scale[2]/2 + 0.4]}>
            <boxGeometry args={[1, 0.6, 1]} />
            <meshStandardMaterial color="#808080" roughness={0.6} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.6, scale[1] + 0.4, -scale[2]/2 + 0.4]}>
            <boxGeometry args={[1, 0.6, 1]} />
            <meshStandardMaterial color="#808080" roughness={0.6} />
          </mesh>
          
          <mesh position={[0, scale[1] + 0.3, 0]}>
            <boxGeometry args={[6, scale[1] + 0.5, scale[2] + 0.3]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.6} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, scale[1] + 0.7, 0]}>
            <boxGeometry args={[6.3, 0.5, scale[2] + 0.5]} />
            <meshStandardMaterial color="#2A2A2A" metalness={0.5} roughness={0.5} />
          </mesh>
          
          <mesh position={[-1.5, scale[1] * 0.5, scale[2]/2 + 0.15]}>
            <boxGeometry args={[2, scale[1] * 0.8, 0.08]} />
            <meshStandardMaterial color="#252525" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[1.5, scale[1] * 0.5, scale[2]/2 + 0.15]}>
            <boxGeometry args={[2, scale[1] * 0.8, 0.08]} />
            <meshStandardMaterial color="#252525" metalness={0.4} roughness={0.6} />
          </mesh>
          
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[scale[0] + 2, 0.1, scale[2] + 2]} />
            <meshStandardMaterial color="#505050" roughness={0.9} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'boomBarrier') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.3, scale[1]/2, 0]}>
            <boxGeometry args={[0.4, scale[1], scale[2] + 0.2]} />
            <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.3, scale[1]/2, 0]}>
            <boxGeometry args={[0.4, scale[1], scale[2] + 0.2]} />
            <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
          </mesh>
          
          <mesh position={[-scale[0]/2 + 0.3, scale[1] + 0.1, 0]}>
            <boxGeometry args={[0.5, 0.2, scale[2] + 0.3]} />
            <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.3, scale[1] + 0.1, 0]}>
            <boxGeometry args={[0.5, 0.2, scale[2] + 0.3]} />
            <meshStandardMaterial color="#404040" metalness={0.6} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, scale[1] * 0.6, scale[2]/2 + 0.2]}>
            <boxGeometry args={[scale[0] - 0.8, 0.18, 0.25]} />
            <meshStandardMaterial color="#DC143C" roughness={0.5} metalness={0.2} />
          </mesh>
          
          <mesh position={[-scale[0]/4, scale[1] * 0.6, scale[2]/2 + 0.35]}>
            <boxGeometry args={[0.08, 0.15, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          <mesh position={[scale[0]/4, scale[1] * 0.6, scale[2]/2 + 0.35]}>
            <boxGeometry args={[0.08, 0.15, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          <mesh position={[0, scale[1] * 0.6, scale[2]/2 + 0.35]}>
            <boxGeometry args={[0.08, 0.15, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          
          <mesh position={[scale[0]/2 - 0.5, scale[1] * 0.6, scale[2]/2 + 0.2]}>
            <boxGeometry args={[0.5, 0.5, 0.3]} />
            <meshStandardMaterial color="#8B0000" roughness={0.6} />
          </mesh>
          
          <mesh position={[scale[0]/2 - 0.35, scale[1] * 0.6 + 0.3, scale[2]/2 + 0.2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.3, 12]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
          </mesh>
          
          <pointLight position={[scale[0]/2 - 0.4, scale[1] + 0.3, scale[2]/2]} intensity={0.4} color="#FF0000" distance={8} />
          
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[scale[0] + 1, 0.15, scale[2] + 0.5]} />
            <meshStandardMaterial color="#404040" roughness={0.8} />
          </mesh>
        </group>
      )
    }
    
    return (
      <mesh position={[0, scale[1]/2, 0]}>
        <boxGeometry args={[scale[0], scale[1], scale[2]]} />
        <meshStandardMaterial color={baseColor} roughness={0.7} />
      </mesh>
    )
  }

  const renderFeature = () => {
    const scale = building.scale || [1, 1, 1]
    const baseColor = building.color || '#808080'
    const name = building.name?.toLowerCase() || ''

    // ── Basketball Court ──────────────────────────────────────────
    if (name.includes('basketball')) {
      const W = scale[0] * 5, H = 0.15, D = scale[2] * 5
      return (
        <group>
          {/* Court surface */}
          <mesh position={[0, H/2, 0]}>
            <boxGeometry args={[W, H, D]} />
            <meshStandardMaterial color="#B91C1C" roughness={0.7} />
          </mesh>
          {/* Boundary lines */}
          <mesh position={[0, H+0.01, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W-0.4, D-0.4]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
          </mesh>
          {/* Center circle */}
          <mesh position={[0, H+0.02, 0]} rotation={[-Math.PI/2,0,0]}>
            <ringGeometry args={[D*0.1-0.1, D*0.1, 32]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
          </mesh>
          {/* Backboard L */}
          <mesh position={[-W/2+0.3, H+2.5, 0]}>
            <boxGeometry args={[0.15, 1.1, 1.8]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.5} />
          </mesh>
          {/* Hoop L */}
          <mesh position={[-W/2+0.55, H+2.2, 0]} rotation={[Math.PI/2,0,0]}>
            <torusGeometry args={[0.23, 0.025, 8, 24]} />
            <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Pole L */}
          <mesh position={[-W/2+0.15, H+1.3, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 2.8, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Backboard R */}
          <mesh position={[W/2-0.3, H+2.5, 0]}>
            <boxGeometry args={[0.15, 1.1, 1.8]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.5} />
          </mesh>
          {/* Hoop R */}
          <mesh position={[W/2-0.55, H+2.2, 0]} rotation={[Math.PI/2,0,0]}>
            <torusGeometry args={[0.23, 0.025, 8, 24]} />
            <meshStandardMaterial color="#f97316" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Pole R */}
          <mesh position={[W/2-0.15, H+1.3, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 2.8, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Mid-line */}
          <mesh position={[0, H+0.02, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[0.12, D-0.4]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
          </mesh>
        </group>
      )
    }

    // ── Swimming Pool ─────────────────────────────────────────────
    if (name.includes('swimming') || name.includes('pool')) {
      const W = scale[0] * 5, H = 0.5, D = scale[2] * 5
      const laneCount = 6
      return (
        <group>
          {/* Pool shell */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[W+0.8, 0.4, D+0.8]} />
            <meshStandardMaterial color="#bae6fd" roughness={0.6} />
          </mesh>
          {/* Pool walls */}
          <mesh position={[0, 0.35, -D/2-0.1]}>
            <boxGeometry args={[W+0.8, 0.7, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.35, D/2+0.1]}>
            <boxGeometry args={[W+0.8, 0.7, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          <mesh position={[-W/2-0.1, 0.35, 0]}>
            <boxGeometry args={[0.2, 0.7, D+0.8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          <mesh position={[W/2+0.1, 0.35, 0]}>
            <boxGeometry args={[0.2, 0.7, D+0.8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          {/* Water */}
          <mesh position={[0, 0.28, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W, D]} />
            <meshStandardMaterial color="#06b6d4" transparent opacity={0.75} roughness={0.05} metalness={0.1} />
          </mesh>
          {/* Lane ropes */}
          {Array.from({length: laneCount-1}).map((_,i)=>(
            <mesh key={i} position={[-W/2 + (i+1)*(W/laneCount), 0.32, 0]}>
              <boxGeometry args={[0.06, 0.06, D]} />
              <meshStandardMaterial color={i%2===0?'#f97316':'#3b82f6'} roughness={0.6} />
            </mesh>
          ))}
          {/* Deck */}
          <mesh position={[0, 0.05, D/2+1.2]}>
            <boxGeometry args={[W+1, 0.1, 1.8]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
          </mesh>
          {/* Diving board */}
          <mesh position={[W/2-1, 0.9, D/2-0.5]}>
            <boxGeometry args={[0.5, 0.08, 2]} />
            <meshStandardMaterial color="#0ea5e9" roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[W/2-1, 0.45, D/2+0.3]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      )
    }

    // ── Tennis Court ──────────────────────────────────────────────
    if (name.includes('tennis')) {
      const W = scale[0] * 5, H = 0.12, D = scale[2] * 5
      return (
        <group>
          <mesh position={[0, H/2, 0]}>
            <boxGeometry args={[W, H, D]} />
            <meshStandardMaterial color="#4ade80" roughness={0.7} />
          </mesh>
          {/* Baselines */}
          <mesh position={[0, H+0.01, -D/2+0.25]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W-0.5, 0.1]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, H+0.01, D/2-0.25]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W-0.5, 0.1]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          {/* Sidelines */}
          <mesh position={[-W/2+0.25, H+0.01, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[0.1, D-0.5]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <mesh position={[W/2-0.25, H+0.01, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[0.1, D-0.5]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          {/* Net */}
          <mesh position={[0, H+0.55, 0]}>
            <boxGeometry args={[W+0.3, 0.9, 0.06]} />
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.5} roughness={0.5} />
          </mesh>
          {/* Net posts */}
          <mesh position={[-W/2-0.15, H+0.55, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[W/2+0.15, H+0.55, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Service lines */}
          <mesh position={[0, H+0.01, -D*0.18]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W-0.5, 0.08]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, H+0.01, D*0.18]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W-0.5, 0.08]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
        </group>
      )
    }

    // ── Running Track ─────────────────────────────────────────────
    if (name.includes('running') || name.includes('track')) {
      const W = scale[0] * 6, D = scale[2] * 5
      const trackW = W * 0.18
      return (
        <group>
          {/* Inner field */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2,0,0]}>
            <ellipseGeometry args={[W/2 - trackW, D/2 - trackW, 48]} />
            <meshStandardMaterial color="#4ade80" roughness={0.8} />
          </mesh>
          {/* Track surface */}
          {[0,1,2,3,4,5].map((lane)=>{
            const trackColors = ['#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c', '#fdba74'];
            return (
            <mesh key={lane} position={[0, 0.06+lane*0.001, 0]} rotation={[-Math.PI/2,0,0]}>
              <ringGeometry args={[W/2 - trackW + lane*(trackW/6), W/2 - trackW + (lane+1)*(trackW/6), 64]} />
              <meshStandardMaterial color={trackColors[lane]} roughness={0.7} />
            </mesh>
          )})}
          {/* Lane dividers */}
          {[1,2,3,4,5].map(i=>(
            <mesh key={i} position={[0, 0.08, 0]} rotation={[-Math.PI/2,0,0]}>
              <ringGeometry args={[W/2 - trackW + i*(trackW/6) - 0.04, W/2 - trackW + i*(trackW/6) + 0.04, 64]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
            </mesh>
          ))}
          {/* Start line */}
          <mesh position={[0, 0.07, D/2 - trackW/2]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[trackW*2, 0.2]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        </group>
      )
    }

    // ── Flag Pole ─────────────────────────────────────────────────
    if (name.includes('flag')) {
      const poleH = scale[1] * 8
      return (
        <group>
          {/* Base */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.5, 12]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.5} />
          </mesh>
          {/* Pole */}
          <mesh position={[0, poleH/2+0.5, 0]}>
            <cylinderGeometry args={[0.04, 0.06, poleH, 8]} />
            <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Flag */}
          <mesh position={[0.7, poleH+0.1, 0]}>
            <boxGeometry args={[1.4, 0.9, 0.04]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.5} />
          </mesh>
          <mesh position={[0.7, poleH+0.02, 0]}>
            <boxGeometry args={[1.4, 0.12, 0.04]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.5} />
          </mesh>
          <mesh position={[0.7, poleH-0.06, 0]}>
            <boxGeometry args={[1.4, 0.12, 0.04]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
          {/* Rope */}
          <mesh position={[0.04, poleH/2+0.5, 0]}>
            <cylinderGeometry args={[0.009, 0.009, poleH, 4]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.9} />
          </mesh>
          {/* Tip */}
          <mesh position={[0, poleH+0.5+0.15, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )
    }

    // ── Central Plaza ─────────────────────────────────────────────
    if (name.includes('plaza') || name.includes('quad')) {
      const W = scale[0] * 5, D = scale[2] * 5
      return (
        <group>
          {/* Paved area */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W, D]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
          </mesh>
          {/* Plaza tiles pattern */}
          {[[-1,-1],[-1,0],[-1,1],[0,-1],[0,0],[0,1],[1,-1],[1,0],[1,1]].map(([xi,zi])=>(
            <mesh key={`${xi}-${zi}`} position={[xi*(W/3), 0.06, zi*(D/3)]} rotation={[-Math.PI/2,0,0]}>
              <planeGeometry args={[W/3-0.15, D/3-0.15]} />
              <meshStandardMaterial color={(xi+zi)%2===0 ? '#d1dae6' : '#c8cfd8'} roughness={0.8} />
            </mesh>
          ))}
          {/* Center fountain */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[1.2, 1.4, 0.5, 24]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.55, 0]} rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[1, 24]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} roughness={0.05} />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.5} />
          </mesh>
          {/* Benches */}
          {[[W/2-1.5,0],[-(W/2-1.5),0],[0,D/2-1.5],[0,-(D/2-1.5)]].map(([bx,bz],i)=>(
            <group key={i} position={[bx, 0.3, bz]} rotation={[0, (i%2===0?Math.PI/2:0), 0]}>
              <mesh><boxGeometry args={[2,0.12,0.5]} /><meshStandardMaterial color="#78350f" roughness={0.7}/></mesh>
              <mesh position={[-0.8, -0.2, 0]}><cylinderGeometry args={[0.05,0.05,0.4,6]}/><meshStandardMaterial color="#6b7280"/></mesh>
              <mesh position={[0.8, -0.2, 0]}><cylinderGeometry args={[0.05,0.05,0.4,6]}/><meshStandardMaterial color="#6b7280"/></mesh>
            </group>
          ))}
          {/* Lamp posts */}
          {[[W/2-0.5,D/2-0.5],[-(W/2-0.5),D/2-0.5],[W/2-0.5,-(D/2-0.5)],[-(W/2-0.5),-(D/2-0.5)]].map(([lx,lz],i)=>(
            <group key={i} position={[lx,0,lz]}>
              <mesh position={[0,2,0]}><cylinderGeometry args={[0.05,0.07,4,8]}/><meshStandardMaterial color="#374151" metalness={0.5}/></mesh>
              <mesh position={[0,4.2,0]}><sphereGeometry args={[0.15,12,12]}/><meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.8}/></mesh>
              <pointLight position={[lx,4.2,lz]} intensity={0.3} color="#fef9c3" distance={8}/>
            </group>
          ))}
        </group>
      )
    }

    // ── Tree Avenue ───────────────────────────────────────────────
    if (name.includes('tree') || name.includes('avenue')) {
      const L = scale[2] * 6
      const treeCount = 5
      return (
        <group>
          {/* Path */}
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[3, L]} />
            <meshStandardMaterial color="#a8a29e" roughness={0.9} />
          </mesh>
          {/* Trees on both sides */}
          {Array.from({length:treeCount}).flatMap((_,i) => {
            const z = -L/2 + (i+0.5)*(L/treeCount)
            return [
              <group key={`L${i}`} position={[-2.5, 0, z]}>
                <mesh position={[0,1.8,0]}><cylinderGeometry args={[0.12,0.18,3.6,8]}/><meshStandardMaterial color="#5d4037" roughness={0.9}/></mesh>
                <mesh position={[0,3.8,0]}><sphereGeometry args={[1.2,12,10]}/><meshStandardMaterial color="#15803d" roughness={0.8}/></mesh>
              </group>,
              <group key={`R${i}`} position={[2.5, 0, z]}>
                <mesh position={[0,1.8,0]}><cylinderGeometry args={[0.12,0.18,3.6,8]}/><meshStandardMaterial color="#5d4037" roughness={0.9}/></mesh>
                <mesh position={[0,3.8,0]}><sphereGeometry args={[1.2,12,10]}/><meshStandardMaterial color="#16a34a" roughness={0.8}/></mesh>
              </group>
            ]
          })}
        </group>
      )
    }

    // ── Botanical Garden ──────────────────────────────────────────
    if (name.includes('botanical') || name.includes('garden')) {
      const W = scale[0] * 5, D = scale[2] * 5
      return (
        <group>
          {/* Ground */}
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W, D]} />
            <meshStandardMaterial color="#4ade80" roughness={0.9} />
          </mesh>
          {/* Raised garden beds */}
          {[[-W/3,0,-D/3],[W/3,0,-D/3],[-W/3,0,D/3],[W/3,0,D/3],[0,0,0]].map(([bx,by,bz],i)=>(
            <group key={i} position={[bx,by,bz]}>
              <mesh position={[0,0.2,0]}>
                <boxGeometry args={[W/4, 0.4, D/4]} />
                <meshStandardMaterial color="#92400e" roughness={0.9} />
              </mesh>
              {/* Soil */}
              <mesh position={[0,0.42,0]} rotation={[-Math.PI/2,0,0]}>
                <planeGeometry args={[W/4-0.2, D/4-0.2]} />
                <meshStandardMaterial color="#451a03" roughness={0.95} />
              </mesh>
              {/* Plants */}
              {Array.from({length:6}).map((_,pi)=>{
                const plantColors = ['#16a34a', '#15803d', '#22c55e', '#166534', '#4ade80', '#065f46']
                return (
                  <mesh key={pi} position={[(pi%3-1)*(W/12), 0.55+(pi%2)*0.25, Math.floor(pi/3)*(D/8)-D/16]}>
                    <sphereGeometry args={[0.18+pi*0.03,8,6]}/>
                    <meshStandardMaterial color={plantColors[pi]} roughness={0.8}/>
                  </mesh>
                )
              })}
              {/* Stone path */}
            </group>
          ))}
          {/* Small stone path */}
          <mesh position={[0,0.05,0]}>
            <boxGeometry args={[W*0.12,0.06,D*0.7]} />
            <meshStandardMaterial color="#d1d5db" roughness={0.85} />
          </mesh>
          <mesh position={[0,0.05,0]}>
            <boxGeometry args={[W*0.7,0.06,D*0.12]} />
            <meshStandardMaterial color="#d1d5db" roughness={0.85} />
          </mesh>
        </group>
      )
    }

    // ── Fountain ──────────────────────────────────────────────────
    if (name.includes('fountain')) {
      const R = Math.min(scale[0],scale[2]) * 1.5
      return (
        <group>
          {/* Base basin */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[R, R*1.02, 0.4, 32]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
          </mesh>
          {/* Water in basin */}
          <mesh position={[0, 0.22, 0]} rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[R-0.18, 32]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.8} roughness={0.05} metalness={0.1} />
          </mesh>
          {/* Central column */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.12, 0.18, 0.8, 12]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.6} />
          </mesh>
          {/* Middle tier */}
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[R*0.45, R*0.47, 0.2, 24]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.08, 0]} rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[R*0.42, 24]} />
            <meshStandardMaterial color="#7dd3fc" transparent opacity={0.75} roughness={0.05} />
          </mesh>
          {/* Top nozzle */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.05, 0.09, 0.25, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Water spray (transparent pillar) */}
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.04, 0.12, 1.0, 8]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.4} roughness={0.1} />
          </mesh>
          {/* Surround paving */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2,0,0]}>
            <ringGeometry args={[R, R+0.8, 32]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
          </mesh>
        </group>
      )
    }

    // ── Parking Lot ───────────────────────────────────────────────
    if (name.includes('parking')) {
      const W = scale[0] * 5, D = scale[2] * 5
      const spotW = 2.5, spotD = 5
      const cols = Math.max(2, Math.floor(W / spotW))
      const rows = Math.max(1, Math.floor(D / spotD))
      return (
        <group>
          {/* Asphalt */}
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W, D]} />
            <meshStandardMaterial color="#374151" roughness={0.9} />
          </mesh>
          {/* Parking lines */}
          {Array.from({length:cols+1}).map((_,i)=>(
            <mesh key={i} position={[-W/2+i*spotW, 0.06, 0]} rotation={[-Math.PI/2,0,0]}>
              <planeGeometry args={[0.08, D]} />
              <meshStandardMaterial color="#f9fafb" transparent opacity={0.7} />
            </mesh>
          ))}
          {/* Row divider */}
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI/2,0,0]}>
            <planeGeometry args={[W, 0.1]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={0.8} />
          </mesh>
          {/* Wheel stops */}
          {Array.from({length:cols}).map((_,i)=>(
            <group key={i}>
              <mesh position={[-W/2+(i+0.5)*spotW, 0.12, -D/4+0.4]}>
                <boxGeometry args={[spotW-0.4, 0.18, 0.3]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.7} />
              </mesh>
              <mesh position={[-W/2+(i+0.5)*spotW, 0.12, D/4-0.4]}>
                <boxGeometry args={[spotW-0.4, 0.18, 0.3]} />
                <meshStandardMaterial color="#fbbf24" roughness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      )
    }

    // ── Waiting Shed ──────────────────────────────────────────────
    if (name.includes('waiting') || name.includes('shed') && name.includes('wait')) {
      const W = scale[0] * 4, D = scale[2] * 3, H = scale[1] * 2.8
      return (
        <group>
          {/* Floor slab */}
          <mesh position={[0,0.06,0]}>
            <boxGeometry args={[W+0.4, 0.12, D+0.3]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.85} />
          </mesh>
          {/* Roof */}
          <mesh position={[0,H+0.08,0]}>
            <boxGeometry args={[W+0.6, 0.15, D+0.5]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.2} />
          </mesh>
          {/* Front overhang */}
          <mesh position={[0,H+0.08,D/2+0.5]}>
            <boxGeometry args={[W+0.6,0.12,1]} />
            <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.2} />
          </mesh>
          {/* Columns */}
          {[[-W/2+0.2,0],[W/2-0.2,0],[-W/2+0.2,D/2],[W/2-0.2,D/2]].map(([cx,cz],i)=>(
            <mesh key={i} position={[cx,H/2,cz]}>
              <cylinderGeometry args={[0.09,0.11,H,8]} />
              <meshStandardMaterial color="#6b7280" roughness={0.6} metalness={0.2} />
            </mesh>
          ))}
          {/* Back wall */}
          <mesh position={[0,H/3,-D/2+0.05]}>
            <boxGeometry args={[W,H*0.67,0.15]} />
            <meshStandardMaterial color="#e5e7eb" roughness={0.7} />
          </mesh>
          {/* Bench */}
          <mesh position={[0,0.45,-D/2+0.5]}>
            <boxGeometry args={[W-0.5,0.12,0.5]} />
            <meshStandardMaterial color="#92400e" roughness={0.7} />
          </mesh>
          <mesh position={[-W/2+0.6,0.28,-D/2+0.5]}>
            <boxGeometry args={[0.1,0.4,0.4]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh position={[W/2-0.6,0.28,-D/2+0.5]}>
            <boxGeometry args={[0.1,0.4,0.4]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
        </group>
      )
    }

    // ── Bleachers (Outdoor) ───────────────────────────────────────
    if (name.includes('bleacher')) {
      const W = scale[0] * 6, stepCount = 5, stepH = 0.55, stepD = 0.8
      return (
        <group>
          {Array.from({length:stepCount}).map((_,i)=>(
            <group key={i}>
              {/* Riser slab */}
              <mesh position={[0,(i+0.5)*stepH+0.05,i*stepD]}>
                <boxGeometry args={[W,stepH,stepD]} />
                <meshStandardMaterial color="#9ca3af" roughness={0.8} />
              </mesh>
              {/* Seats */}
              {Array.from({length:Math.floor(W/1.2)}).map((_,j)=>(
                <mesh key={j} position={[-W/2+0.6+j*1.2,(i+1)*stepH+0.14,i*stepD+0.2]}>
                  <boxGeometry args={[0.9,0.08,0.55]} />
                  <meshStandardMaterial color={j%2===0?'#3b82f6':'#1d4ed8'} roughness={0.5} />
                </mesh>
              ))}
            </group>
          ))}
          {/* Support frame */}
          {[-W/2+0.2, 0, W/2-0.2].map((fx,i)=>(
            <mesh key={i} position={[fx,(stepCount*stepH)/2,stepCount*stepD/2]}>
              <boxGeometry args={[0.15,stepCount*stepH,stepCount*stepD]} />
              <meshStandardMaterial color="#6b7280" metalness={0.4} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )
    }

    // ── Storage Shed ──────────────────────────────────────────────
    if (name.includes('storage')) {
      const W = scale[0]*4, D = scale[2]*4, H = scale[1]*3
      return (
        <group>
          {/* Walls */}
          <mesh position={[0,H/2,0]}>
            <boxGeometry args={[W,H,D]} />
            <meshStandardMaterial color="#6b7280" roughness={0.8} />
          </mesh>
          {/* Corrugated roof */}
          <mesh position={[0,H+0.2,0]}>
            <boxGeometry args={[W+0.4,0.2,D+0.4]} />
            <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.3} />
          </mesh>
          {/* Roof ridge */}
          <mesh position={[0,H+0.38,0]}>
            <boxGeometry args={[W+0.5,0.12,0.3]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Door */}
          <mesh position={[0,H*0.42,D/2+0.01]}>
            <boxGeometry args={[W*0.38,H*0.78,0.08]} />
            <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.4} />
          </mesh>
          {/* Door handle */}
          <mesh position={[W*0.1,H*0.42,D/2+0.06]}>
            <sphereGeometry args={[0.06,8,8]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Window */}
          <mesh position={[W*0.28,H*0.62,D/2+0.01]}>
            <boxGeometry args={[W*0.25,H*0.22,0.06]} />
            <meshStandardMaterial color="#87ceeb" transparent opacity={0.5} roughness={0.1} />
          </mesh>
        </group>
      )
    }

    // ── Gate House / Gate types ───────────────────────────────────
    if (name.includes('gate house') || name.includes('gatehouse') || (name.includes('gate') && !name.includes('arch')))
      return null  // Handled by existing renderGate

    // ── Default feature: flat pad ─────────────────────────────────
    return (
      <group>
        <mesh position={[0, scale[1]*0.1, 0]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[scale[0]*3, scale[2]*3]} />
          <meshStandardMaterial color={baseColor} roughness={0.8} />
        </mesh>
      </group>
    )
  }

  const renderGate = () => {
    const scale = building.scale || [1, 1, 1]
    const baseColor = building.color || '#808080'
    
    if (modelType === 'archGate') {
      return (
        <group>
          <mesh position={[0, 0, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[0.8, scale[1], 0.6]} />
            <meshStandardMaterial color={baseColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, scale[2]/2 - 0.3]}>
            <boxGeometry args={[0.8, scale[1], 0.6]} />
            <meshStandardMaterial color={baseColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, scale[1]/2 + 0.3, 0]}>
            <boxGeometry args={[scale[0], 0.8, scale[2]]} />
            <meshStandardMaterial color={baseColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, scale[1] + 0.8, 0]}>
            <boxGeometry args={[scale[0] * 0.7, 1, scale[2] * 0.8]} />
            <meshStandardMaterial color="#8B0000" roughness={0.5} />
          </mesh>
          <mesh position={[-scale[0]/2 - 0.1, scale[1]/2, 0]}>
            <boxGeometry args={[0.15, scale[1] - 0.5, scale[2] - 1]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[scale[0]/2 + 0.1, scale[1]/2, 0]}>
            <boxGeometry args={[0.15, scale[1] - 0.5, scale[2] - 1]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'pillarGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.5, scale[1]/2, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[1.2, scale[1], 1]} />
            <meshStandardMaterial color={baseColor} roughness={0.5} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1]/2, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[1.2, scale[1], 1]} />
            <meshStandardMaterial color={baseColor} roughness={0.5} />
          </mesh>
          <mesh position={[-scale[0]/2 + 0.5, scale[1] + 0.5, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[1.4, 1.2, 1.2]} />
            <meshStandardMaterial color={baseColor} roughness={0.5} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1] + 0.5, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[1.4, 1.2, 1.2]} />
            <meshStandardMaterial color={baseColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, scale[1] + 1.2, -scale[2]/2 + 0.3]}>
            <boxGeometry args={[scale[0], 1.5, 0.8]} />
            <meshStandardMaterial color={baseColor} roughness={0.5} />
          </mesh>
          <mesh position={[-scale[0]/2 + 0.5, scale[1]/2, 0]}>
            <boxGeometry args={[0.2, scale[1] - 0.5, scale[2] - 1]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.5, scale[1]/2, 0]}>
            <boxGeometry args={[0.2, scale[1] - 0.5, scale[2] - 1]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'simpleGate') {
      return (
        <group>
          <mesh position={[-scale[0]/2 + 0.2, scale[1]/2, 0]}>
            <boxGeometry args={[0.4, scale[1], 0.3]} />
            <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[scale[0]/2 - 0.2, scale[1]/2, 0]}>
            <boxGeometry args={[0.4, scale[1], 0.3]} />
            <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[0, scale[1], 0]}>
            <boxGeometry args={[scale[0], 0.3, 0.2]} />
            <meshStandardMaterial color="#1F2937" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0] - 0.8, scale[1] - 0.5, 0.1]} />
            <meshStandardMaterial color="#4B5563" roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      )
    }
    
    if (modelType === 'gateHouse') {
      return (
        <group>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[scale[0], 1.2, scale[2]]} />
            <meshStandardMaterial color={baseColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.8, 0]}>
            <boxGeometry args={[scale[0] * 0.9, 0.8, scale[2] * 0.9]} />
            <meshStandardMaterial color={baseColor} roughness={0.6} />
          </mesh>
          <mesh position={[scale[0]/2 + 0.1, 0.6, 0]}>
            <boxGeometry args={[0.2, 1.2, scale[2] * 0.8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1.2, scale[2]/2 + 0.05]}>
            <boxGeometry args={[1.2, 0.8, 0.1]} />
            <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.2} />
          </mesh>
          <mesh position={[0, 1.2, scale[2]/2 + 0.06]}>
            <boxGeometry args={[1, 0.6, 0.05]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
          <pointLight position={[0, 2.5, 0]} intensity={0.5} color="#FFA500" distance={5} />
        </group>
      )
    }
    
    return null
  }

  const gateScale = building.scale || [1, 1, 1]
  const isVoxel = building.type === 'voxel'
  const blockType = building.blockType || building.modelType

  const renderVoxel = () => {
    const scale = building.scale || [1, 1, 1]
    const baseColor = building.color || '#808080'
    const isTransparent = building.transparent
    const isEmissive = building.emissive
    
    const materialProps = {
      color: baseColor,
      roughness: 0.8,
      metalness: isEmissive ? 0.3 : 0.1,
    }
    
    if (isTransparent) {
      materialProps.transparent = true
      materialProps.opacity = 0.7
    }
    
    if (isEmissive) {
      materialProps.emissive = baseColor
      materialProps.emissiveIntensity = 0.8
    }

    if (blockType === 'oak_tree' || blockType === 'spruce_tree' || blockType === 'birch_tree' || 
        blockType === 'jungle_tree' || blockType === 'dark_oak_tree' || blockType === 'acacia_tree') {
      return (
        <group>
          <mesh position={[0, scale[1]/2, 0]}>
            <boxGeometry args={[scale[0] * 0.4, scale[1], scale[2] * 0.4]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          <mesh position={[0, scale[1] + scale[0] * 0.5, 0]}>
            <boxGeometry args={[scale[0], scale[0], scale[2]]} />
            <meshStandardMaterial color={blockType.includes('spruce') ? '#1A3B1A' : blockType.includes('birch') ? '#5B8C35' : '#3E6B2B'} roughness={0.8} />
          </mesh>
        </group>
      )
    }

    if (blockType === 'torch' || blockType === 'soul_torch') {
      return (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 6]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          <pointLight position={[0, 0.8, 0]} intensity={1} color={blockType === 'soul_torch' ? '#5BC9E6' : '#E63E1A'} distance={8} />
        </group>
      )
    }

    if (blockType === 'lantern' || blockType === 'soul_lantern') {
      return (
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#3D3D3D" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.3]} />
            <meshStandardMaterial color="#3D3D3D" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.3]} />
            <meshStandardMaterial color="#3D3D3D" roughness={0.5} metalness={0.5} />
          </mesh>
          <pointLight position={[0, 0, 0]} intensity={1.5} color={blockType === 'soul_lantern' ? '#5BC9E6' : '#E6C91A'} distance={10} />
        </group>
      )
    }

    if (blockType === 'fence' || blockType === 'iron_bars' || blockType === 'cobblestone_wall') {
      const postColor = blockType === 'iron_bars' ? '#D1D1D1' : '#9B7B5B'
      return (
        <group>
          <mesh position={[-0.35, 0.5, 0]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial color={postColor} roughness={0.7} metalness={blockType === 'iron_bars' ? 0.8 : 0.1} />
          </mesh>
          <mesh position={[0.35, 0.5, 0]}>
            <boxGeometry args={[0.1, 1, 0.1]} />
            <meshStandardMaterial color={postColor} roughness={0.7} metalness={blockType === 'iron_bars' ? 0.8 : 0.1} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.1]} />
            <meshStandardMaterial color={postColor} roughness={0.7} metalness={blockType === 'iron_bars' ? 0.8 : 0.1} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.8, 0.1, 0.1]} />
            <meshStandardMaterial color={postColor} roughness={0.7} metalness={blockType === 'iron_bars' ? 0.8 : 0.1} />
          </mesh>
        </group>
      )
    }

    if (blockType === 'water') {
      return (
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[scale[0], scale[1] * 0.9, scale[2]]} />
            <meshStandardMaterial color="#3E8EE6" transparent opacity={0.6} roughness={0.1} />
          </mesh>
        </group>
      )
    }

    if (blockType === 'lava' || blockType === 'magma_block') {
      return (
        <group>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[scale[0], scale[1], scale[2]]} />
            <meshStandardMaterial 
              color={blockType === 'lava' ? '#E63E1A' : '#B84B2B'} 
              emissive={blockType === 'lava' ? '#E63E1A' : '#B84B2B'}
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
        </group>
      )
    }

    return (
      <group>
        <mesh position={[0, scale[1]/2, 0]}>
          <boxGeometry args={[scale[0], scale[1], scale[2]]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        <mesh position={[0, scale[1], 0]}>
          <boxGeometry args={[scale[0] + 0.02, 0.02, scale[2] + 0.02]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
      </group>
    )
  }

  const renderCustomBuilding = () => {
    const name = building.name?.toLowerCase() || ''
    const W = dimensions[0], H = dimensions[1], D = dimensions[2]
    const buildingColor = building.color || style.main
    const roofColor = building.type === 'admin' ? '#991b1b' : building.type === 'facility' ? '#dc2626' : '#404040'
    
    // ── Administration Building ───────────────────────────────
    if (name.includes('administration') || name.includes('admin') || name.includes('registrar')) {
      return (
        <group>
          {/* Main Building - 3 story central block */}
          <mesh position={[0, H * 0.5, 0]}>
            <boxGeometry args={[W * 0.8, H, D * 0.7]} />
            <meshStandardMaterial color={buildingColor} roughness={0.75} />
          </mesh>
          
          {/* Left Wing - Finance/Admin offices */}
          <mesh position={[-W * 0.45, H * 0.35, -D * 0.1]}>
            <boxGeometry args={[W * 0.25, H * 0.65, D * 0.5]} />
            <meshStandardMaterial color={buildingColor} roughness={0.75} />
          </mesh>
          
          {/* Right Wing - Registrar */}
          <mesh position={[W * 0.45, H * 0.35, -D * 0.1]}>
            <boxGeometry args={[W * 0.25, H * 0.65, D * 0.5]} />
            <meshStandardMaterial color={buildingColor} roughness={0.75} />
          </mesh>
          
          {/* Central entrance with canopy */}
          <mesh position={[0, H * 0.2, D * 0.4]}>
            <boxGeometry args={[W * 0.3, H * 0.35, D * 0.15]} />
            <meshStandardMaterial color={buildingColor} roughness={0.7} />
          </mesh>
          
          {/* Canopy roof */}
          <mesh position={[0, H * 0.45, D * 0.5]}>
            <boxGeometry args={[W * 0.35, 0.15, D * 0.25]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} />
          </mesh>
          
          {/* Support columns for canopy */}
          {[-W * 0.12, W * 0.12].map((x, i) => (
            <mesh key={i} position={[x, H * 0.22, D * 0.45]}>
              <cylinderGeometry args={[0.15, 0.15, H * 0.35, 8]} />
              <meshStandardMaterial color="#d1d5db" roughness={0.6} />
            </mesh>
          ))}
          
          {/* Grand stairs */}
          <mesh position={[0, 0.1, D * 0.6]}>
            <boxGeometry args={[W * 0.35, 0.2, D * 0.25]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.25, D * 0.75]}>
            <boxGeometry args={[W * 0.4, 0.1, D * 0.15]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.8} />
          </mesh>
          
          {/* Main entrance glass doors */}
          <mesh position={[0, H * 0.15, D * 0.37]}>
            <boxGeometry args={[W * 0.15, H * 0.28, 0.05]} />
            <meshStandardMaterial color="#1e3a8a" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
          </mesh>
          
          {/* Side windows - left wing */}
          {Array.from({length: 3}).map((_, i) => (
            <mesh key={`lw${i}`} position={[-W * 0.45, H * 0.4, -D * 0.1 + (i - 1) * D * 0.15]}>
              <boxGeometry args={[0.08, H * 0.3, W * 0.12]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
            </mesh>
          ))}
          
          {/* Side windows - right wing (registrar) */}
          {Array.from({length: 3}).map((_, i) => (
            <mesh key={`rw${i}`} position={[W * 0.45, H * 0.4, -D * 0.1 + (i - 1) * D * 0.15]}>
              <boxGeometry args={[0.08, H * 0.3, W * 0.12]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
            </mesh>
          ))}
          
          {/* Windows on front */}
          {Array.from({length: 4}).map((_, i) => (
            <mesh key={`fw${i}`} position={[-W * 0.25 + i * W * 0.15, H * 0.65, D * 0.36]}>
              <boxGeometry args={[W * 0.1, H * 0.25, 0.05]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
            </mesh>
          ))}
          
          {/* Roof */}
          <mesh position={[0, H + 0.25, 0]}>
            <boxGeometry args={[W * 0.9, 0.5, D * 0.8]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} />
          </mesh>
          
          {/* Roof detail - penthouse/stairwell */}
          <mesh position={[W * 0.3, H + 0.6, -D * 0.2]}>
            <boxGeometry args={[W * 0.15, 0.5, D * 0.15]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} />
          </mesh>
          
          {/* Signage - Administration */}
          <mesh position={[0, H * 0.85, D * 0.37]}>
            <boxGeometry args={[W * 0.25, 0.6, 0.1]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} />
          </mesh>
          <mesh position={[0, H * 0.85, D * 0.39]}>
            <boxGeometry args={[W * 0.2, 0.4, 0.05]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} />
          </mesh>
          
          {/* Flag pole */}
          <mesh position={[-W * 0.35, H * 0.5, D * 0.5]}>
            <cylinderGeometry args={[0.08, 0.08, H * 0.8, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[-W * 0.35, H + 0.2, D * 0.5]}>
            <boxGeometry args={[1, 0.6, 0.05]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
          
          {/* Parking/drop-off area marker */}
          <mesh position={[0, 0.02, D * 0.9]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[W * 0.4, D * 0.2]} />
            <meshStandardMaterial color="#374151" roughness={0.9} />
          </mesh>
          
          {/* Exterior lights */}
          <pointLight position={[-W * 0.2, H * 0.8, D * 0.3]} intensity={0.5} color="#fef3c7" distance={10} />
          <pointLight position={[W * 0.2, H * 0.8, D * 0.3]} intensity={0.5} color="#fef3c7" distance={10} />
        </group>
      )
    }

    // ── Academic Buildings (Colleges) ───────────────────────────
    if (name.includes('college') || name.includes('academic') || name.includes('science') || name.includes('art')) {
      return (
        <group>
          {/* U-Shape Foundation */}
          <mesh position={[0, H/2, -D*0.15]}>
            <boxGeometry args={[W, H, D*0.7]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          <mesh position={[-W/2 + W*0.15, H/2, D*0.35]}>
            <boxGeometry args={[W*0.3, H, D*0.3]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          <mesh position={[W/2 - W*0.15, H/2, D*0.35]}>
            <boxGeometry args={[W*0.3, H, D*0.3]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          {/* Flat Parapet Roof */}
          <mesh position={[0, H + 0.1, -D*0.15]}>
            <boxGeometry args={[W+0.2, 0.2, D*0.7+0.2]} />
            <meshStandardMaterial color="#404040" roughness={0.9} />
          </mesh>
          <mesh position={[-W/2 + W*0.15, H + 0.1, D*0.35]}>
            <boxGeometry args={[W*0.3+0.2, 0.2, D*0.3+0.2]} />
            <meshStandardMaterial color="#404040" roughness={0.9} />
          </mesh>
          <mesh position={[W/2 - W*0.15, H + 0.1, D*0.35]}>
            <boxGeometry args={[W*0.3+0.2, 0.2, D*0.3+0.2]} />
            <meshStandardMaterial color="#404040" roughness={0.9} />
          </mesh>
          {/* HVAC Units on back roof */}
          <mesh position={[-W*0.2, H + 0.4, -D*0.2]}>
            <boxGeometry args={[1, 0.6, 1]} />
            <meshStandardMaterial color="#a3a3a3" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[W*0.2, H + 0.4, -D*0.3]}>
            <boxGeometry args={[1.5, 0.8, 1.2]} />
            <meshStandardMaterial color="#a3a3a3" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* Continuous Window Bands */}
          <mesh position={[0, H*0.7, D*0.2+0.01]}>
            <boxGeometry args={[W*0.35, 1, 0.1]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, H*0.3, D*0.2+0.01]}>
            <boxGeometry args={[W*0.35, 1, 0.1]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[-W/2 - 0.01, H*0.7, -D*0.15]}>
            <boxGeometry args={[0.1, 1, D*0.5]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Entrance */}
          <mesh position={[0, H*0.2, D*0.2+0.05]}>
            <boxGeometry args={[1.5, H*0.4, 0.1]} />
            <meshStandardMaterial color="#262626" metalness={0.5} />
          </mesh>
        </group>
      )
    }

    // ── Main Library ──────────────────────────────────────────────
    if (name.includes('library') || name.includes('lic')) {
      return (
        <group>
          {/* Base structure */}
          <mesh position={[0, H*0.3, 0]}>
            <boxGeometry args={[W, H*0.6, D]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          {/* Tiered upper level */}
          <mesh position={[0, H*0.8, -D*0.1]}>
            <boxGeometry args={[W*0.8, H*0.4, D*0.8]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          {/* Massive Glass Atrium Front */}
          <mesh position={[0, H/2, D/2 + 0.01]}>
            <boxGeometry args={[W*0.6, H*0.9, 0.1]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} roughness={0.1} metalness={0.9} />
          </mesh>
          {/* Atrium framing */}
          <mesh position={[-W*0.3, H/2, D/2 + 0.05]}>
            <boxGeometry args={[0.2, H*0.9, 0.1]} />
            <meshStandardMaterial color="#374151" metalness={0.7} />
          </mesh>
          <mesh position={[W*0.3, H/2, D/2 + 0.05]}>
            <boxGeometry args={[0.2, H*0.9, 0.1]} />
            <meshStandardMaterial color="#374151" metalness={0.7} />
          </mesh>
          {/* Slanted skylight roof */}
          <mesh position={[0, H*1.15, -D*0.1]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[W*0.85, 0.2, D*0.85]} />
            <meshStandardMaterial color="#1f2937" roughness={0.7} />
          </mesh>
          <mesh position={[0, H*1.15, -D*0.1]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[W*0.6, 0.21, D*0.6]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.4} metalness={0.8} />
          </mesh>
        </group>
      )
    }

    // ── Gymnasium ─────────────────────────────────────────────────
    if (name.includes('gym') || name.includes('sports')) {
      return (
        <group>
          {/* Main Court Building - Large rectangular hall */}
          <mesh position={[0, H*0.4, 0]}>
            <boxGeometry args={[W * 0.95, H * 0.75, D * 0.9]} />
            <meshStandardMaterial color={buildingColor} roughness={0.85} />
          </mesh>
          
          {/* Side wings - Locker rooms and offices */}
          <mesh position={[-W * 0.45, H * 0.25, -D * 0.2]}>
            <boxGeometry args={[W * 0.2, H * 0.45, D * 0.5]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          <mesh position={[W * 0.45, H * 0.25, -D * 0.2]}>
            <boxGeometry args={[W * 0.2, H * 0.45, D * 0.5]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          
          {/* Front entrance lobby */}
          <mesh position={[0, H * 0.3, D * 0.45]}>
            <boxGeometry args={[W * 0.35, H * 0.55, D * 0.15]} />
            <meshStandardMaterial color={buildingColor} roughness={0.75} />
          </mesh>
          
          {/* Glass entrance doors */}
          <mesh position={[0, H * 0.25, D * 0.47]}>
            <boxGeometry args={[W * 0.2, H * 0.45, 0.05]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
          </mesh>
          
          {/* Upper track/balcony level */}
          <mesh position={[0, H * 0.7, -D * 0.1]}>
            <boxGeometry args={[W * 0.9, 0.15, D * 0.7]} />
            <meshStandardMaterial color="#6b7280" roughness={0.9} />
          </mesh>
          
          {/* Track lane markings on balcony */}
          <mesh position={[0, H * 0.73, -D * 0.1]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[W * 0.85, D * 0.6]} />
            <meshStandardMaterial color="#92400e" roughness={0.8} />
          </mesh>
          
          {/* Bleachers - left side */}
          {Array.from({length: 5}).map((_, i) => (
            <mesh key={`bleachL${i}`} position={[-W * 0.35, 0.25 + i * 0.4, D * 0.1 + i * 0.15]}>
              <boxGeometry args={[W * 0.15, 0.3, 1.5]} />
              <meshStandardMaterial color="#374151" roughness={0.7} />
            </mesh>
          ))}
          
          {/* Bleachers - right side */}
          {Array.from({length: 5}).map((_, i) => (
            <mesh key={`bleachR${i}`} position={[W * 0.35, 0.25 + i * 0.4, D * 0.1 + i * 0.15]}>
              <boxGeometry args={[W * 0.15, 0.3, 1.5]} />
              <meshStandardMaterial color="#374151" roughness={0.7} />
            </mesh>
          ))}
          
          {/* Court markings - basketball court on floor */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[W * 0.7, D * 0.7]} />
            <meshStandardMaterial color="#f97316" roughness={0.7} />
          </mesh>
          
          {/* Center court circle */}
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[1.5, 1.7, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          
          {/* Court lines */}
          <mesh position={[0, 0.03, D * 0.25]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[W * 0.5, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.03, -D * 0.25]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[W * 0.5, 0.1]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
          
          {/* Roof - flat with slight pitch */}
          <mesh position={[0, H * 0.78, 0]}>
            <boxGeometry args={[W * 1.05, 0.4, D * 1.05]} />
            <meshStandardMaterial color="#374151" roughness={0.7} metalness={0.2} />
          </mesh>
          
          {/* Roof HVAC units */}
          <mesh position={[-W * 0.25, H * 0.9, -D * 0.15]}>
            <boxGeometry args={[2, 1.2, 2]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[W * 0.25, H * 0.9, -D * 0.15]}>
            <boxGeometry args={[2, 1.2, 2]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Wall windows - high windows for natural light */}
          <mesh position={[-W * 0.48, H * 0.5, 0]}>
            <boxGeometry args={[0.1, H * 0.4, D * 0.6]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
          </mesh>
          <mesh position={[W * 0.48, H * 0.5, 0]}>
            <boxGeometry args={[0.1, H * 0.4, D * 0.6]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
          </mesh>
          
          {/* Scoreboard */}
          <mesh position={[0, H * 0.6, -D * 0.35]}>
            <boxGeometry args={[4, 2, 0.3]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, H * 0.6, -D * 0.33]}>
            <boxGeometry args={[3.5, 1.5, 0.1]} />
            <meshStandardMaterial color="#000000" emissive="#ef4444" emissiveIntensity={0.3} roughness={0.3} />
          </mesh>
          
          {/* Entrance sign */}
          <mesh position={[0, H * 0.75, D * 0.5]}>
            <boxGeometry args={[W * 0.3, 0.8, 0.2]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} />
          </mesh>
          <mesh position={[0, H * 0.75, D * 0.52]}>
            <boxGeometry args={[W * 0.25, 0.5, 0.05]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} />
          </mesh>
          
          {/* Exterior light fixtures */}
          <pointLight position={[-W * 0.3, H * 0.8, D * 0.3]} intensity={0.8} color="#fef3c7" distance={15} />
          <pointLight position={[W * 0.3, H * 0.8, D * 0.3]} intensity={0.8} color="#fef3c7" distance={15} />
        </group>
      )
    }

    // ── Grand Auditorium ──────────────────────────────────────────
    if (name.includes('auditorium') || name.includes('theater')) {
      return (
        <group>
          {/* Wedge shaped seating area */}
          <mesh position={[0, H*0.6, -D*0.1]}>
            <cylinderGeometry args={[W/2.5, W/2, D, 4]} rotation={[0, Math.PI/4, Math.PI/2]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          {/* Front Lobby Facade */}
          <mesh position={[0, H*0.7, D/2]}>
            <boxGeometry args={[W, H*1.4, 1.5]} />
            <meshStandardMaterial color={buildingColor} roughness={0.7} />
          </mesh>
          {/* Marquee Overhang */}
          <mesh position={[0, H*0.6, D/2 + 1.5]}>
            <boxGeometry args={[W*0.8, 0.3, 2]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} />
          </mesh>
          {/* Poster boxes */}
          {[-W*0.3, W*0.3].map((px, i) => (
            <mesh key={i} position={[px, H*0.3, D/2 + 0.76]}>
              <boxGeometry args={[1, 1.5, 0.1]} />
              <meshStandardMaterial color="#ffffff" emissive="#fbbf24" emissiveIntensity={0.2} />
            </mesh>
          ))}
          <mesh position={[0, H*0.25, D/2 + 0.76]}>
            <boxGeometry args={[W*0.4, H*0.5, 0.1]} />
            <meshStandardMaterial color="#000000" metalness={0.8} />
          </mesh>
        </group>
      )
    }

    // ── Dormitory ─────────────────────────────────────────────────
    if (name.includes('dorm') || building.type === 'residential') {
      const floors = Math.max(3, Math.floor(H / 1.5))
      return (
        <group>
          {/* Main linear frame */}
          <mesh position={[0, H/2, 0]}>
            <boxGeometry args={[W, H, D]} />
            <meshStandardMaterial color={buildingColor} roughness={0.85} />
          </mesh>
          {/* Stairwell bump */}
          <mesh position={[0, H/2 + 0.5, D/2 + 0.2]}>
            <boxGeometry args={[2, H + 1, 1]} />
            <meshStandardMaterial color="#fdba74" roughness={0.8} />
          </mesh>
          {/* Balconies / Windows per floor */}
          {Array.from({length: floors}).map((_, fl) => (
            <group key={fl}>
              <mesh position={[-W*0.25, (fl+0.5)*(H/floors), D/2 + 0.05]}>
                <boxGeometry args={[W*0.35, 0.8, 0.2]} />
                <meshStandardMaterial color="#bfdbfe" metalness={0.6} roughness={0.2} />
              </mesh>
              <mesh position={[W*0.25, (fl+0.5)*(H/floors), D/2 + 0.05]}>
                <boxGeometry args={[W*0.35, 0.8, 0.2]} />
                <meshStandardMaterial color="#bfdbfe" metalness={0.6} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Roof overhang */}
          <mesh position={[0, H + 0.1, 0]}>
            <boxGeometry args={[W + 0.4, 0.2, D + 0.4]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>
      )
    }

    // ── Computer Laboratory ───────────────────────────────────────
    if (name.includes('computer') || name.includes('lab')) {
      return (
        <group>
          {/* Blocky Modern Base */}
          <mesh position={[0, H/2, 0]}>
            <boxGeometry args={[W, H, D]} />
            <meshStandardMaterial color={buildingColor} roughness={0.8} />
          </mesh>
          {/* Tech/Glass wrap around */}
          <mesh position={[0, H*0.6, 0]}>
            <boxGeometry args={[W+0.1, H*0.4, D+0.1]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, H*0.8, 0]}>
            <boxGeometry args={[W+0.15, 0.1, D+0.15]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} />
          </mesh>
          {/* Server AC Vents on Roof */}
          <mesh position={[W*0.2, H+0.5, 0]}>
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} />
          </mesh>
          <mesh position={[-W*0.2, H+0.5, 0]}>
            <boxGeometry args={[1.5, 1, 1.5]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.6} />
          </mesh>
          {/* Offset entrance element */}
          <mesh position={[W*0.3, H*0.25, D/2 + 0.3]}>
            <boxGeometry args={[2, H*0.5, 0.6]} />
            <meshStandardMaterial color="#d4d4d8" roughness={0.6} />
          </mesh>
        </group>
      )
    }

    // ── Chapel / Prayer Room ──────────────────────────────────────
    if (name.includes('chapel') || name.includes('prayer')) {
      return (
        <group>
          {/* Base */}
          <mesh position={[0, H*0.3, 0]}>
            <boxGeometry args={[W, H*0.6, D]} />
            <meshStandardMaterial color={buildingColor} roughness={0.9} />
          </mesh>
          {/* Super steep A roof */}
          <mesh position={[0, H*1.3, 0]}>
            <coneGeometry args={[Math.max(W/1.5, D/1.5), H*1.4, 4]} rotation={[0, Math.PI/4, 0]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.7} />
          </mesh>
          {/* Stained Glass Front */}
          <mesh position={[0, H*0.6, D/2 + 0.01]}>
            <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial color="#d8b4fe" emissive="#d8b4fe" emissiveIntensity={0.4} metalness={0.5} roughness={0.2} />
          </mesh>
          {/* Small Cross */}
          <group position={[0, H*2.1, 0]}>
            <mesh><boxGeometry args={[0.1, 1, 0.1]} /><meshStandardMaterial color="#d4af37" metalness={0.8} /></mesh>
            <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.6, 0.1, 0.1]} /><meshStandardMaterial color="#d4af37" metalness={0.8} /></mesh>
          </group>
          {/* Double Doors */}
          <mesh position={[0, H*0.2, D/2 + 0.02]}>
            <boxGeometry args={[1.2, H*0.4, 0.1]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        </group>
      )
    }

    // ── Health Services / Clinic ──────────────────────────────────
    if (name.includes('health') || name.includes('clinic')) {
      return (
        <group>
          {/* Main clinic building - single story with central corridor */}
          <mesh position={[0, H * 0.35, 0]}>
            <boxGeometry args={[W * 0.85, H * 0.65, D * 0.9]} />
            <meshStandardMaterial color={buildingColor} roughness={0.7} />
          </mesh>
          
          {/* Reception/waiting wing */}
          <mesh position={[0, H * 0.25, D * 0.45]}>
            <boxGeometry args={[W * 0.4, H * 0.45, D * 0.15]} />
            <meshStandardMaterial color={buildingColor} roughness={0.7} />
          </mesh>
          
          {/* Emergency/ambulance bay on side */}
          <mesh position={[-W * 0.45, H * 0.2, 0]}>
            <boxGeometry args={[W * 0.15, H * 0.35, D * 0.5]} />
            <meshStandardMaterial color={buildingColor} roughness={0.7} />
          </mesh>
          
          {/* Examination rooms wing */}
          <mesh position={[W * 0.45, H * 0.25, -D * 0.1]}>
            <boxGeometry args={[W * 0.15, H * 0.45, D * 0.6]} />
            <meshStandardMaterial color={buildingColor} roughness={0.7} />
          </mesh>
          
          {/* Main entrance with canopy */}
          <mesh position={[0, H * 0.25, D * 0.52]}>
            <boxGeometry args={[W * 0.25, H * 0.35, D * 0.08]} />
            <meshStandardMaterial color={buildingColor} roughness={0.6} />
          </mesh>
          
          {/* Canopy roof */}
          <mesh position={[0, H * 0.5, D * 0.55]}>
            <boxGeometry args={[W * 0.3, 0.12, D * 0.12]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
          
          {/* Glass entrance doors */}
          <mesh position={[0, H * 0.2, D * 0.49]}>
            <boxGeometry args={[W * 0.12, H * 0.35, 0.05]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
          </mesh>
          
          {/* Reception window */}
          <mesh position={[0, H * 0.35, D * 0.45]}>
            <boxGeometry args={[W * 0.3, 0.8, 0.05]} />
            <meshStandardMaterial color="#1e3a8a" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
          </mesh>
          
          {/* Green Cross emblem - large on front */}
          <group position={[0, H * 0.6, D * 0.46]}>
            <mesh>
              <boxGeometry args={[0.3, 1.2, 0.08]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>
            <mesh>
              <boxGeometry args={[1.2, 0.3, 0.08]} />
              <meshStandardMaterial color="#16a34a" />
            </mesh>
          </group>
          
          {/* Clinic sign */}
          <mesh position={[0, H * 0.85, D * 0.47]}>
            <boxGeometry args={[W * 0.3, 0.5, 0.08]} />
            <meshStandardMaterial color="#1f2937" roughness={0.6} />
          </mesh>
          <mesh position={[0, H * 0.85, D * 0.49]}>
            <boxGeometry args={[W * 0.25, 0.35, 0.04]} />
            <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.3} />
          </mesh>
          
          {/* Windows along sides - examination rooms */}
          {Array.from({length: 3}).map((_, i) => (
            <mesh key={`clinicwin${i}`} position={[W * 0.35, H * 0.35, -D * 0.25 + i * D * 0.2]}>
              <boxGeometry args={[0.06, H * 0.25, W * 0.12]} />
              <meshStandardMaterial color="#93c5fd" transparent opacity={0.5} roughness={0.1} metalness={0.8} />
            </mesh>
          ))}
          
          {/* Emergency entrance door */}
          <mesh position={[-W * 0.45, H * 0.15, D * 0.1]}>
            <boxGeometry args={[0.8, H * 0.28, 0.05]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>
          
          {/* Ambulance bay roof */}
          <mesh position={[-W * 0.45, H * 0.4, 0]}>
            <boxGeometry args={[W * 0.18, 0.1, D * 0.55]} />
            <meshStandardMaterial color="#374151" roughness={0.7} />
          </mesh>
          
          {/* Ambulance bay pillars */}
          <mesh position={[-W * 0.52, H * 0.2, D * 0.2]}>
            <cylinderGeometry args={[0.1, 0.1, H * 0.35, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[-W * 0.52, H * 0.2, -D * 0.2]}>
            <cylinderGeometry args={[0.1, 0.1, H * 0.35, 8]} />
            <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.4} />
          </mesh>
          
          {/* Roof */}
          <mesh position={[0, H * 0.68, 0]}>
            <boxGeometry args={[W * 0.95, 0.25, D * 1.0]} />
            <meshStandardMaterial color="#374151" roughness={0.7} />
          </mesh>
          
          {/* HVAC units on roof */}
          <mesh position={[-W * 0.2, H * 0.75, -D * 0.2]}>
            <boxGeometry args={[1.5, 0.8, 1.5]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[W * 0.25, H * 0.75, D * 0.1]}>
            <boxGeometry args={[1, 0.6, 1]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.5} />
          </mesh>
          
          {/* Wheelchair ramp at entrance */}
          <mesh position={[0, 0.08, D * 0.65]}>
            <boxGeometry args={[W * 0.2, 0.16, D * 0.15]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.8} />
          </mesh>
          
          {/* Sidewalk/pavement */}
          <mesh position={[0, 0.02, D * 0.8]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[W * 0.6, D * 0.3]} />
            <meshStandardMaterial color="#d1d5db" roughness={0.9} />
          </mesh>
          
          {/* Handicap parking sign */}
          <mesh position={[-W * 0.3, H * 0.5, D * 0.7]}>
            <cylinderGeometry args={[0.05, 0.05, H * 0.6, 8]} />
            <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[-W * 0.3, H * 0.8, D * 0.7]}>
            <boxGeometry args={[0.4, 0.4, 0.05]} />
            <meshStandardMaterial color="#3b82f6" />
          </mesh>
          
          {/* Exterior lights */}
          <pointLight position={[-W * 0.2, H * 0.6, D * 0.4]} intensity={0.5} color="#fef3c7" distance={10} />
          <pointLight position={[W * 0.2, H * 0.6, D * 0.4]} intensity={0.5} color="#fef3c7" distance={10} />
        </group>
      )
    }

    // ── Comfort Room (CR) ─────────────────────────────────────────
    if (name.includes('cr') || name.includes('comfort room') || name.includes('restroom')) {
      return (
        <group>
          <mesh position={[0, H/2, 0]}>
            <boxGeometry args={[W, H, D]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.7} />
          </mesh>
          <mesh position={[0, H + 0.1, 0]}>
            <boxGeometry args={[W+0.2, 0.2, D+0.2]} />
            <meshStandardMaterial color="#0284c7" roughness={0.8} />
          </mesh>
          <mesh position={[0, H*0.7, D/2 + 0.05]}>
            <boxGeometry args={[W*0.6, 0.4, 0.1]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
          <mesh position={[-W*0.25, H*0.3, D/2 + 0.05]}>
            <boxGeometry args={[0.8, H*0.6, 0.1]} />
            <meshStandardMaterial color="#0ea5e9" />
          </mesh>
          <mesh position={[W*0.25, H*0.3, D/2 + 0.05]}>
            <boxGeometry args={[0.8, H*0.6, 0.1]} />
            <meshStandardMaterial color="#ec4899" />
          </mesh>
        </group>
      )
    }

    // ── Student Center / Cafeteria / Canteen ──────────────────────
    if (name.includes('student') || name.includes('cafeteria') || name.includes('canteen')) {
      return (
        <group>
          {/* Main irregular shaped hub */}
          <mesh position={[0, H/2, -D*0.1]}>
            <cylinderGeometry args={[W/2, W/2, H, 6]} />
            <meshStandardMaterial color="#fef08a" roughness={0.8} />
          </mesh>
          {/* Circular outdoor patio ring */}
          <mesh position={[0, 0.2, D*0.3]}>
            <cylinderGeometry args={[W*0.6, W*0.6, 0.4, 16]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.9} />
          </mesh>
          {/* Glass facade facing patio */}
          <mesh position={[0, H/2, D*0.15]} rotation={[0,0,0]}>
            <boxGeometry args={[W*0.8, H*0.8, 0.2]} />
            <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} metalness={0.5} roughness={0.2} />
          </mesh>
          {/* Umbrellas on patio */}
          {[[-W*0.3, D*0.5], [W*0.3, D*0.5], [0, D*0.7]].map(([ux, uz], i) => (
            <group key={i} position={[ux, 0.4, uz]}>
              <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.04, 0.04, 1.6, 8]}/><meshStandardMaterial color="#475569"/></mesh>
              <mesh position={[0, 1.6, 0]}><coneGeometry args={[0.8, 0.3, 8]}/><meshStandardMaterial color={i%2===0 ? "#ef4444" : "#eab308"}/></mesh>
            </group>
          ))}
          {/* Flat roof overhang */}
          <mesh position={[0, H+0.1, -D*0.1]}>
            <cylinderGeometry args={[W/2 + 0.3, W/2 + 0.3, 0.2, 6]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
        </group>
      )
    }

    // ── Generic / Default (Enhanced) ──────────────────────────────
    const floors = Math.max(1, Math.floor(H / 1.5))
    return (
      <group>
        {/* Main Box */}
        <mesh position={[0, H/2, 0]}>
          <boxGeometry args={[W, H, D]} />
          <meshStandardMaterial color={buildingColor} roughness={0.8} />
        </mesh>
        {/* Foundation Lip */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[W + 0.4, 0.3, D + 0.4]} />
          <meshStandardMaterial color="#696969" roughness={0.95} />
        </mesh>
        {/* Roof Parapet */}
        <mesh position={[0, H + 0.15, 0]}>
          <boxGeometry args={[W + 0.2, 0.3, D + 0.2]} />
          <meshStandardMaterial color={style.roof} roughness={0.7} />
        </mesh>
        {/* Roof HVAC inner gap dark area */}
        <mesh position={[0, H + 0.16, 0]}>
          <boxGeometry args={[W - 0.2, 0.3, D - 0.2]} />
          <meshStandardMaterial color="#171717" roughness={0.9} />
        </mesh>
        {/* HVAC Unit */}
        <mesh position={[W*0.2, H + 0.4, -D*0.2]}>
          <boxGeometry args={[0.8, 0.5, 0.8]} />
          <meshStandardMaterial color="#a3a3a3" metalness={0.4} />
        </mesh>
        {/* Enhanced Windows Front & Back Pattern */}
        {[-W/2 + 1, 0, W/2 - 1].map((xPos, xi) => (
          <group key={`win-col-${xi}`}>
            {Array.from({length: floors}).map((_, floor) => (
               <group key={`win-${floor}`}>
                 {/* Front window */}
                 <mesh position={[xPos, 0.8 + floor * 1.5, D/2 + 0.05]}>
                    <boxGeometry args={[0.8, 1, 0.1]} />
                    <meshStandardMaterial color={style.windows} metalness={0.5} roughness={0.2} />
                 </mesh>
                 {/* Back window */}
                 <mesh position={[xPos, 0.8 + floor * 1.5, -D/2 - 0.05]}>
                    <boxGeometry args={[0.8, 1, 0.1]} />
                    <meshStandardMaterial color={style.windows} metalness={0.5} roughness={0.2} />
                 </mesh>
               </group>
            ))}
          </group>
        ))}
        {/* Defined prominent door entrance */}
        <mesh position={[0, 0.5, D/2 + 0.06]}>
          <boxGeometry args={[1.5, 1, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.2, D/2 + 0.06]}>
          <boxGeometry args={[1.5, 0.4, 0.1]} />
          <meshStandardMaterial color={style.trim} roughness={0.8} />
        </mesh>
      </group>
    )
  }

  return (
    <group 
      position={building.position} 
      rotation={[building.rotationX || 0, building.rotation || 0, building.rotationZ || 0]}
    >
      {isVoxel ? (
        <>
          {renderVoxel()}
          <mesh 
            position={[0, (building.scale?.[1] || 1)/2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={[building.scale?.[0] || 1, building.scale?.[1] || 1, building.scale?.[2] || 1]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, (building.scale?.[1] || 1) / 2, 0]}>
              <boxGeometry args={[(building.scale?.[0] || 1) + 0.1, (building.scale?.[1] || 1) + 0.1, (building.scale?.[2] || 1) + 0.1]} />
              <meshBasicMaterial 
                color={building.locked ? '#ef4444' : isSelected ? '#10b981' : '#6366f1'} 
                wireframe 
                transparent 
                opacity={0.5} 
              />
            </mesh>
          )}
          <Billboard position={[0, (building.scale?.[1] || 1) + 1.5, 0]}>
            <Text
              fontSize={1.2}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
        </>
      ) : isWall ? (
        <>
          {renderWall()}
          <mesh 
            position={[0, (building.scale?.[1] || 2.5)/2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={[building.scale?.[0] || 10, building.scale?.[1] || 2.5, building.scale?.[2] || 0.3]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, (building.scale?.[1] || 2.5) / 2, 0]}>
              <boxGeometry args={[(building.scale?.[0] || 10) + 0.1, (building.scale?.[1] || 2.5) + 0.1, (building.scale?.[2] || 0.3) + 0.1]} />
              <meshBasicMaterial 
                color={building.locked ? '#ef4444' : isSelected ? '#10b981' : '#6366f1'} 
                wireframe 
                transparent 
                opacity={0.5} 
              />
            </mesh>
          )}
          <Billboard position={[0, (building.scale?.[1] || 2.5) + 1.5, 0]}>
            <Text
              fontSize={1.2}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
        </>
      ) : isNewGate ? (
        <>
          {renderNewGate()}
          <mesh 
            position={[0, (building.scale?.[1] || 2.5)/2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={[building.scale?.[0] || 8, building.scale?.[1] || 2.5, building.scale?.[2] || 0.3]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, (building.scale?.[1] || 2.5) / 2, 0]}>
              <boxGeometry args={[(building.scale?.[0] || 8) + 0.1, (building.scale?.[1] || 2.5) + 0.1, (building.scale?.[2] || 0.3) + 0.1]} />
              <meshBasicMaterial color={isSelected ? '#10b981' : '#6366f1'} wireframe transparent opacity={0.5} />
            </mesh>
          )}
          <Billboard position={[0, (building.scale?.[1] || 2.5) + 1.5, 0]}>
            <Text
              fontSize={1.2}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
        </>
      ) : isLongBuilding ? (
        <>
          {renderLongBuilding()}
          <mesh 
            position={[0, (building.scale?.[1] || 4) / 2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={[building.scale?.[0] || 30, building.scale?.[1] || 4, building.scale?.[2] || 15]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, (building.scale?.[1] || 4) / 2, 0]}>
              <boxGeometry args={[(building.scale?.[0] || 30) + 0.5, (building.scale?.[1] || 4) + 0.5, (building.scale?.[2] || 15) + 0.5]} />
              <meshBasicMaterial color={isSelected ? '#10b981' : '#6366f1'} wireframe transparent opacity={0.5} />
            </mesh>
          )}
          <Billboard position={[0, (building.scale?.[1] || 4) + 3, 0]}>
            <Text
              fontSize={1.5}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
          <pointLight
            position={[0, (building.scale?.[1] || 4) + 1, 0]}
            intensity={hovered || isSelected ? 2.5 : 0}
            color={isSelected ? '#fbbf24' : '#f472b6'}
            distance={25}
          />
        </>
      ) : isFeature ? (
        <>
          {renderFeature()}
          <mesh 
            position={[0, (building.scale?.[1] || 1)/2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={[building.scale?.[0]*5||5, 1, building.scale?.[2]*5||5]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[(building.scale?.[0]*5||5)+0.3, 1.3, (building.scale?.[2]*5||5)+0.3]} />
              <meshBasicMaterial 
                color={building.locked ? '#ef4444' : isSelected ? '#10b981' : '#6366f1'} 
                wireframe 
                transparent 
                opacity={0.4} 
              />
            </mesh>
          )}
          <Billboard position={[0, 6, 0]}>
            <Text
              fontSize={1.5}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
          <pointLight
            position={[0, 5, 0]}
            intensity={hovered || isSelected ? 2 : 0}
            color={isSelected ? '#fbbf24' : '#f472b6'}
            distance={20}
          />
        </>
      ) : isNavPoint ? (
        <>
          {renderNavPoint()}
          <mesh 
            position={[0, (building.scale?.[1] || 0.5) / 2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <cylinderGeometry args={[building.scale?.[0] * 0.6 || 0.3, building.scale?.[0] * 0.6 || 0.3, building.scale?.[1] || 0.5, 16]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, (building.scale?.[1] || 0.5) / 2, 0]}>
              <boxGeometry args={[(building.scale?.[0] || 0.5) * 1.5, (building.scale?.[1] || 0.5) * 1.5, (building.scale?.[2] || 0.5) * 1.5]} />
              <meshBasicMaterial 
                color={building.locked ? '#ef4444' : isSelected ? '#10b981' : '#6366f1'} 
                wireframe 
                transparent 
                opacity={0.4} 
              />
            </mesh>
          )}
          <Billboard position={[0, 2.5, 0]}>
            <Text
              fontSize={0.6}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.04}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
        </>
      ) : isGate ? (
        <>
          {renderGate()}
          <mesh 
            position={[0, gateScale[1]/2, 0]} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={[gateScale[0], gateScale[1], gateScale[2]]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          {adminMode && (
            <mesh position={[0, gateScale[1] / 2, 0]}>
              <boxGeometry args={[gateScale[0] + 0.5, gateScale[1] + 0.5, gateScale[2] + 0.5]} />
              <meshBasicMaterial 
                color={building.locked ? '#ef4444' : isSelected ? '#10b981' : '#6366f1'} 
                wireframe 
                transparent 
                opacity={0.3} 
              />
            </mesh>
          )}
          <Billboard position={[0, gateScale[1] + 3, 0]}>
            <Text
              fontSize={1.5}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.1}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>
          <pointLight
            position={[0, gateScale[1] + 1, 0]}
            intensity={hovered || isSelected ? 2 : 0}
            color={isSelected ? '#fbbf24' : '#f472b6'}
            distance={15}
          />
        </>
      ) : (
        <>
          {renderCustomBuilding()}
          {/* Main Selection/Drag Interactor */}
          <mesh
            ref={meshRef}
            position={[0, dimensions[1] / 2, 0]}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!isDragging) onSelect(building) 
            }}
            onPointerOver={(e) => { 
              e.stopPropagation(); 
              setHovered(true); 
              document.body.style.cursor = adminMode ? 'grab' : 'pointer' 
            }}
            onPointerOut={() => { 
              setHovered(false); 
              if (!isDragging) document.body.style.cursor = 'auto' 
            }}
            onPointerDown={handlePointerDown}
          >
            <boxGeometry args={dimensions} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>

          {/* Admin wireframe box */}
          {adminMode && (
            <mesh position={[0, dimensions[1] / 2, 0]}>
              <boxGeometry args={[dimensions[0] + 0.5, dimensions[1] + 0.5, dimensions[2] + 0.5]} />
              <meshBasicMaterial color={isSelected ? '#10b981' : '#6366f1'} wireframe transparent opacity={0.3} />
            </mesh>
          )}

          {/* Label */}
          <Billboard position={[0, dimensions[1] + 5, 0]}>
            <Text
              fontSize={2}
              color={isSelected ? '#fbbf24' : '#ffffff'}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.15}
              outlineColor="#000000"
            >
              {building.name}
            </Text>
          </Billboard>

          {/* Glow Light */}
          <pointLight
            position={[0, dimensions[1] + 1, 0]}
            intensity={hovered || isSelected ? 2.5 : 0}
            color={isSelected ? '#fbbf24' : '#f472b6'}
            distance={25}
          />
        </>
      )}
    </group>
  )
}

function IndoorScene({ building, onExit, adminMode, onSelectRoom }) {
  const currentFloor = useStore((state) => state.currentFloor)
  const setCurrentFloor = useStore((state) => state.setCurrentFloor)
  const selectedRoom = useStore((state) => state.selectedRoom)
  const students = useStore((state) => state.students)
  const instructors = useStore((state) => state.instructors)
  const schedules = useStore((state) => state.schedules)
  const courses = useStore((state) => state.courses)
  
  const floorHeight = 4
  const floorY = currentFloor * floorHeight
  const roomSize = 5
  const roomDepth = 6

  const getStudentsInRoom = (roomName) => {
    return students.filter(s => s.assignedRoom === roomName && s.building === building.name)
  }

  const getInstructorInRoom = (roomName) => {
    return instructors.find(i => i.assignedRoom === roomName && i.building === building.name)
  }

  const getCoursesInRoom = (roomName) => {
    const roomSchedules = schedules.filter(s => s.room === roomName)
    return roomSchedules.map(s => s.course)
  }

  const roomColors = {
    classroom: '#4f46e5',
    laboratory: '#10b981',
    office: '#f59e0b',
    reading: '#8b5cf6',
    computer: '#06b6d4',
    dorm: '#ec4899',
    dining: '#ef4444',
    gym: '#14b8a6',
    auditorium: '#84cc16',
    lounge: '#f97316',
    storage: '#6b7280',
    lobby: '#6366f1',
    bathroom: '#475569',
    meeting: '#a855f7',
    seminar: '#3b82f6',
    stage: '#eab308',
    technical: '#78716c',
    security: '#dc2626',
    server: '#0f172a',
    kitchen: '#ea580c',
    seating: '#374151',
    study: '#0d9488'
  }

  const renderFurniture = (room, position) => {
    const type = room.type
    const items = []

    if (type === 'classroom' || type === 'seminar') {
      const rows = Math.floor(room.capacity / 5) || 2
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < 5; c++) {
          items.push(
            <group key={`desk-${r}-${c}`} position={[position[0] - 2 + c * 1, position[1] + 0.3, position[2] + 1.5 - r * 1.2]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.8, 0.05, 0.5]} />
                <meshStandardMaterial color="#8B4513" roughness={0.8} />
              </mesh>
              <mesh position={[0.35, -0.2, 0.2]}>
                <boxGeometry args={[0.05, 0.4, 0.4]} />
                <meshStandardMaterial color="#5D4037" />
              </mesh>
              <mesh position={[-0.35, -0.2, 0.2]}>
                <boxGeometry args={[0.05, 0.4, 0.4]} />
                <meshStandardMaterial color="#5D4037" />
              </mesh>
              <mesh position={[0, 0.4, -0.1]}>
                <boxGeometry args={[0.5, 0.5, 0.4]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            </group>
          )
        }
      }
      items.push(
        <group key="teacher-desk" position={[position[0], position[1] + 0.3, position[2] - 2.5]}>
          <mesh>
            <boxGeometry args={[2, 0.05, 0.8]} />
            <meshStandardMaterial color="#654321" roughness={0.7} />
          </mesh>
          <mesh position={[0.8, -0.4, 0.3]}>
            <boxGeometry args={[0.05, 0.8, 0.5]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          <mesh position={[-0.8, -0.4, 0.3]}>
            <boxGeometry args={[0.05, 0.8, 0.5]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.4, 0.4, 0.3]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )
      items.push(
        <group key="whiteboard" position={[position[0], position[1] + 1.2, position[2] - 2.9]}>
          <mesh>
            <boxGeometry args={[2.5, 1.2, 0.05]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, -0.7, 0.03]}>
            <boxGeometry args={[2.6, 0.1, 0.02]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        </group>
      )
    }

    if (type === 'computer' || type === 'laboratory') {
      const computers = Math.min(room.capacity, 10)
      for (let i = 0; i < computers; i++) {
        const row = Math.floor(i / 5)
        const col = i % 5
        items.push(
          <group key={`computer-${i}`} position={[position[0] - 2 + col * 1, position[1] + 0.4, position[2] + 1 - row * 1.5]}>
            <mesh>
              <boxGeometry args={[0.8, 0.05, 0.5]} />
              <meshStandardMaterial color="#374151" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.3, -0.15]}>
              <boxGeometry args={[0.6, 0.4, 0.02]} />
              <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.3} />
            </mesh>
            <mesh position={[0.2, -0.2, 0]}>
              <boxGeometry args={[0.3, 0.02, 0.3]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0.35, -0.1, 0.2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.2, 8]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          </group>
        )
      }
    }

    if (type === 'office') {
      items.push(
        <group key="office-desk" position={[position[0], position[1] + 0.3, position[2] - 1]}>
          <mesh>
            <boxGeometry args={[1.8, 0.05, 0.8]} />
            <meshStandardMaterial color="#92400e" roughness={0.7} />
          </mesh>
          <mesh position={[0.7, -0.35, 0.3]}>
            <boxGeometry args={[0.05, 0.7, 0.4]} />
            <meshStandardMaterial color="#78716c" />
          </mesh>
          <mesh position={[-0.7, -0.35, 0.3]}>
            <boxGeometry args={[0.05, 0.7, 0.4]} />
            <meshStandardMaterial color="#78716c" />
          </mesh>
          <mesh position={[0, 0.45, -0.2]}>
            <boxGeometry args={[0.5, 0.4, 0.35]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )
      items.push(
        <group key="file-cabinet" position={[position[0] + 2, position[1] + 0.5, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[0.5, 1, 0.4]} />
            <meshStandardMaterial color="#64748b" metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.3, 0.21]}>
            <boxGeometry args={[0.4, 0.02, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, 0.21]}>
            <boxGeometry args={[0.4, 0.02, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )
      items.push(
        <group key="chair" position={[position[0], position[1] + 0.25, position[2] - 0.2]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.25, -0.15]}>
            <boxGeometry args={[0.35, 0.45, 0.05]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0.15, -0.15, 0.15]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[-0.15, -0.15, 0.15]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0.15, -0.15, -0.15]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[-0.15, -0.15, -0.15]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      )
    }

    if (type === 'reading' || type === 'study') {
      const tables = Math.min(4, Math.ceil(room.capacity / 4))
      for (let i = 0; i < tables; i++) {
        items.push(
          <group key={`reading-table-${i}`} position={[position[0] - 2 + (i % 2) * 4, position[1] + 0.3, position[2] - 1 + Math.floor(i / 2) * 3]}>
            <mesh>
              <boxGeometry args={[1.5, 0.05, 1]} />
              <meshStandardMaterial color="#a16207" roughness={0.6} />
            </mesh>
            <mesh position={[0.6, -0.35, 0.4]}>
              <boxGeometry args={[0.05, 0.7, 0.05]} />
              <meshStandardMaterial color="#713f12" />
            </mesh>
            <mesh position={[-0.6, -0.35, 0.4]}>
              <boxGeometry args={[0.05, 0.7, 0.05]} />
              <meshStandardMaterial color="#713f12" />
            </mesh>
            <mesh position={[0.6, -0.35, -0.4]}>
              <boxGeometry args={[0.05, 0.7, 0.05]} />
              <meshStandardMaterial color="#713f12" />
            </mesh>
            <mesh position={[-0.6, -0.35, -0.4]}>
              <boxGeometry args={[0.05, 0.7, 0.05]} />
              <meshStandardMaterial color="#713f12" />
            </mesh>
          </group>
        )
      }
    }

    if (type === 'lobby') {
      items.push(
        <group key="reception" position={[position[0], position[1] + 0.4, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[2.5, 1, 0.6]} />
            <meshStandardMaterial color="#6366f1" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.3} />
          </mesh>
        </group>
      )
      items.push(
        <group key="sofa-1" position={[position[0] - 2.5, position[1] + 0.25, position[2] + 1]}>
          <mesh>
            <boxGeometry args={[1.5, 0.4, 0.6]} />
            <meshStandardMaterial color="#7c3aed" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.3, -0.35]}>
            <boxGeometry args={[1.5, 0.5, 0.1]} />
            <meshStandardMaterial color="#6d28d9" />
          </mesh>
        </group>
      )
      items.push(
        <group key="sofa-2" position={[position[0] + 2.5, position[1] + 0.25, position[2] + 1]}>
          <mesh>
            <boxGeometry args={[1.5, 0.4, 0.6]} />
            <meshStandardMaterial color="#7c3aed" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.3, -0.35]}>
            <boxGeometry args={[1.5, 0.5, 0.1]} />
            <meshStandardMaterial color="#6d28d9" />
          </mesh>
        </group>
      )
    }

    if (type === 'meeting' || type === 'conference') {
      items.push(
        <group key="conference-table" position={[position[0], position[1] + 0.35, position[2]]}>
          <mesh>
            <boxGeometry args={[3.5, 0.08, 1.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.2} />
          </mesh>
          {[...Array(8)].map((_, i) => (
            <group key={`chair-${i}`} position={[
              position[0] + Math.cos(i * Math.PI / 4) * 2.2,
              position[1] + 0.25,
              position[2] + Math.sin(i * Math.PI / 4) * 1
            ]}>
              <mesh>
                <boxGeometry args={[0.4, 0.05, 0.4]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
              <mesh position={[0, 0.25, -0.15]}>
                <boxGeometry args={[0.35, 0.45, 0.05]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            </group>
          ))}
        </group>
      )
      items.push(
        <group key="tv" position={[position[0], position[1] + 1.2, position[2] - 2.9]}>
          <mesh>
            <boxGeometry args={[2, 1.2, 0.05]} />
            <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.8, 1, 0.01]} />
            <meshStandardMaterial color="#1e3a5f" emissive="#1e3a5f" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )
    }

    if (type === 'dorm') {
      items.push(
        <group key="bed-1" position={[position[0] - 2, position[1] + 0.2, position[2] + 1]}>
          <mesh>
            <boxGeometry args={[1, 0.25, 2]} />
            <meshStandardMaterial color="#f5f5f4" />
          </mesh>
          <mesh position={[0.4, 0.25, -0.7]}>
            <boxGeometry args={[0.1, 0.5, 0.6]} />
            <meshStandardMaterial color="#6366f1" />
          </mesh>
          <mesh position={[-0.35, 0.3, 0.2]}>
            <boxGeometry args={[0.5, 0.02, 0.6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      )
      items.push(
        <group key="bed-2" position={[position[0] + 2, position[1] + 0.2, position[2] + 1]}>
          <mesh>
            <boxGeometry args={[1, 0.25, 2]} />
            <meshStandardMaterial color="#f5f5f4" />
          </mesh>
          <mesh position={[-0.4, 0.25, -0.7]}>
            <boxGeometry args={[0.1, 0.5, 0.6]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <mesh position={[0.35, 0.3, 0.2]}>
            <boxGeometry args={[0.5, 0.02, 0.6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      )
      items.push(
        <group key="desk-dorm" position={[position[0], position[1] + 0.3, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[1.2, 0.05, 0.6]} />
            <meshStandardMaterial color="#78716c" />
          </mesh>
          <mesh position={[0.5, -0.25, 0.25]}>
            <boxGeometry args={[0.05, 0.5, 0.3]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
          <mesh position={[-0.5, -0.25, 0.25]}>
            <boxGeometry args={[0.05, 0.5, 0.3]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
        </group>
      )
    }

    if (type === 'dining') {
      const tables = 4
      for (let i = 0; i < tables; i++) {
        items.push(
          <group key={`dining-table-${i}`} position={[position[0] - 2 + (i % 2) * 4, position[1] + 0.35, position[2] - 1 + Math.floor(i / 2) * 3]}>
            <mesh>
              <cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
              <meshStandardMaterial color="#92400e" roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.35, 0]}>
              <cylinderGeometry args={[0.05, 0.3, 0.6, 8]} />
              <meshStandardMaterial color="#713f12" />
            </mesh>
            {[0, Math.PI/2, Math.PI, Math.PI * 1.5].map((angle, j) => (
              <mesh key={`chair-${i}-${j}`} position={[Math.cos(angle) * 0.5, position[1] + 0.2, position[2] - 1 + Math.floor(i / 2) * 3 + Math.sin(angle) * 0.5]}>
                <boxGeometry args={[0.35, 0.35, 0.35]} />
                <meshStandardMaterial color="#b45309" />
              </mesh>
            ))}
          </group>
        )
      }
    }

    if (type === 'gym') {
      items.push(
        <group key="treadmill" position={[position[0] - 3, position[1] + 0.4, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[0.7, 0.8, 1.5]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.5, -0.5]}>
            <boxGeometry args={[0.5, 0.6, 0.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )
      items.push(
        <group key="weights" position={[position[0] + 3, position[1] + 0.3, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[0.8, 0.6, 0.3]} />
            <meshStandardMaterial color="#475569" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        </group>
      )
    }

    if (type === 'bathroom') {
      items.push(
        <group key="toilet-1" position={[position[0] - 1.5, position[1] + 0.25, position[2] + 1]}>
          <mesh>
            <boxGeometry args={[0.4, 0.4, 0.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.25, -0.3]}>
            <boxGeometry args={[0.3, 0.3, 0.1]} />
            <meshStandardMaterial color="#f1f5f9" />
          </mesh>
        </group>
      )
      items.push(
        <group key="sink-1" position={[position[0] + 2, position[1] + 0.4, position[2] + 1]}>
          <mesh>
            <boxGeometry args={[0.6, 0.05, 0.4]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.2, 0.1]}>
            <cylinderGeometry args={[0.1, 0.08, 0.3, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
      )
    }

    if (type === 'kitchen') {
      items.push(
        <group key="stove" position={[position[0] - 2, position[1] + 0.4, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[1.2, 0.9, 0.6]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {[0, 0.3].map((offset, i) => (
            <mesh key={`burner-${i}`} position={[position[0] - 2 + offset, position[1] + 0.86, position[2] - 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      )
      items.push(
        <group key="fridge" position={[position[0] + 2.5, position[1] + 0.6, position[2] - 2]}>
          <mesh>
            <boxGeometry args={[0.8, 1.2, 0.6]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0.31]}>
            <boxGeometry args={[0.6, 0.3, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      )
    }

    return items
  }

  return (
    <group position={[building.position[0], building.position[1], building.position[2]]}>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, floorY + 3.5, 0]} intensity={1.2} color="#ffffff" distance={30} />
      <pointLight position={[-8, floorY + 3, -8]} intensity={0.4} color="#fef3c7" />
      <pointLight position={[8, floorY + 3, 8]} intensity={0.3} color="#dbeafe" />

      {[-10, 10].map((x) => (
        <mesh key={`wall-x-${x}`} position={[x, floorY + floorHeight/2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[20, floorHeight]} />
          <meshStandardMaterial color="#f1f5f9" side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {[-10, 10].map((z) => (
        <mesh key={`wall-z-${z}`} position={[0, floorY + floorHeight/2, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[20, floorHeight]} />
          <meshStandardMaterial color="#f1f5f9" side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      <mesh position={[0, floorY, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>

      <mesh position={[0, floorY + floorHeight, 0]} rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>

      {[-10, 10].map((x) => (
        <group key={`windows-x-${x}`}>
          {[1, 2].map((h) => (
            <mesh key={`window-${x}-${h}`} position={[x - (x > 0 ? 0.01 : -0.01), floorY + h * 1.2, 0]} rotation={[0, x > 0 ? -Math.PI/2 : Math.PI/2, 0]}>
              <planeGeometry args={[0.8, 1]} />
              <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
      ))}

      <Billboard position={[0, floorY + floorHeight + 2, -9]}>
        <Text fontSize={2.5} color="#1f2937" anchorX="center" anchorY="middle">
          {building.name}
        </Text>
        <Text fontSize={1.5} color="#6366f1" anchorX="center" anchorY="middle" position={[0, -2, 0]}>
          {building.floors[currentFloor]?.name || 'Floor'}
        </Text>
      </Billboard>

      <group position={[0, floorY, 0]}>
        {building.floors[currentFloor]?.rooms.map((room, index) => {
          const cols = Math.ceil(Math.sqrt(building.floors[currentFloor].rooms.length))
          const row = Math.floor(index / cols)
          const col = index % cols
          const xPos = (col - (cols - 1) / 2) * (roomSize + 1)
          const zPos = (row - (Math.floor(building.floors[currentFloor].rooms.length / cols) - 1) / 2) * (roomDepth + 0.5)
          
          const studentsInRoom = getStudentsInRoom(room.name)
          const instructorInRoom = getInstructorInRoom(room.name)
          const coursesInRoom = getCoursesInRoom(room.name)
          
          return (
            <group 
              key={room.id} 
              position={[xPos, 0, zPos]}
              onClick={(e) => { e.stopPropagation(); onSelectRoom(room) }}
              onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
              onPointerOut={() => document.body.style.cursor = 'auto'}
            >
              <mesh position={[0, roomDepth/2, 0]}>
                <boxGeometry args={[roomSize - 0.2, 0.15, roomDepth - 0.2]} />
                <meshStandardMaterial 
                  color={selectedRoom?.id === room.id ? '#fbbf24' : (roomColors[room.type] || '#6366f1')} 
                  metalness={0.1} 
                  roughness={0.7} 
                />
              </mesh>

              {renderFurniture(room, [xPos, 0, zPos])}

              <Billboard position={[0, roomDepth/2 + 0.3, -roomDepth/2 - 0.3]}>
                <Text fontSize={0.45} color={selectedRoom?.id === room.id ? '#000' : '#f8fafc'} anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000">
                  {room.name}
                </Text>
                <Text fontSize={0.28} color={selectedRoom?.id === room.id ? '#333' : '#cbd5e1'} anchorX="center" anchorY="middle" position={[0, -0.5, 0]}>
                  {room.type} | Cap: {room.capacity}
                </Text>
                {instructorInRoom && (
                  <Text fontSize={0.25} color="#22c55e" anchorX="center" anchorY="middle" position={[0, -0.9, 0]}>
                    Prof: {instructorInRoom.name.split(' ').slice(1).join(' ')}
                  </Text>
                )}
                {coursesInRoom.length > 0 && (
                  <Text fontSize={0.22} color="#fbbf24" anchorX="center" anchorY="middle" position={[0, -1.3, 0]}>
                    {coursesInRoom.slice(0, 2).join(', ')}{coursesInRoom.length > 2 ? '...' : ''}
                  </Text>
                )}
                {studentsInRoom.length > 0 && (
                  <Text fontSize={0.22} color="#60a5fa" anchorX="center" anchorY="middle" position={[0, -1.7, 0]}>
                    {studentsInRoom.length} student(s)
                  </Text>
                )}
              </Billboard>
            </group>
          )
        })}
      </group>

      <group position={[9, floorY + floorHeight/2, 0]}>
        <mesh>
          <boxGeometry args={[2, floorHeight - 0.5, 0.3]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <Billboard position={[0, 0, 0.2]}>
          <Text fontSize={0.7} color="#fff" anchorX="center">EXIT</Text>
        </Billboard>
      </group>

      {building.floors.length > 1 && (
        <group position={[-9, floorY + floorHeight/2, 0]}>
          {[...Array(building.floors.length)].map((_, i) => (
            <group key={i} position={[0, (i - currentFloor) * 1.8, 0]}>
              <mesh 
                onClick={(e) => { e.stopPropagation(); setCurrentFloor(i) }}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
                onPointerOut={() => document.body.style.cursor = 'auto'}
              >
                <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
                <meshStandardMaterial color={currentFloor === i ? '#10b981' : '#64748b'} />
              </mesh>
              <Billboard position={[0, 0.8, 0]}>
                <Text fontSize={0.35} color="#fff" anchorX="center">{building.floors[i]?.name}</Text>
              </Billboard>
            </group>
          ))}
        </group>
      )}
    </group>
  )
}

function PathLine({ path, isSelected, onSelect, onDragEnd, adminMode, selectedPointIndex, onPointSelect }) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragPointIndex, setDragPointIndex] = useState(null)
  const { camera, gl } = useThree()
  
  const points = useMemo(() => {
    return path.points.map(p => new THREE.Vector3(p[0], 0.1, p[2]))
  }, [path.points])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  const handlePointPointerDown = (e, index) => {
    if (adminMode) {
      e.stopPropagation()
      setIsDragging(true)
      setDragPointIndex(index)
      gl.domElement.style.cursor = 'grabbing'
      onPointSelect(index)
    }
  }

  useEffect(() => {
    if (isDragging && dragPointIndex !== null) {
      const handleMove = (e) => {
        const rect = gl.domElement.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        
        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera)
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
        const point = new THREE.Vector3()
        raycaster.ray.intersectPlane(plane, point)
        
        if (point) {
          onDragEnd(path.id, dragPointIndex, [point.x, 0, point.z])
        }
      }
      
      const handleUp = () => {
        setIsDragging(false)
        setDragPointIndex(null)
        gl.domElement.style.cursor = 'auto'
      }
      
      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }
    }
  }, [isDragging, dragPointIndex, path.id, camera, gl, onDragEnd])

  return (
    <group>
      {path.type !== 'railway' && path.type !== 'highway' && path.type !== 'road' && (
        <line geometry={geometry}>
          <lineBasicMaterial color={isSelected ? '#fbbf24' : path.color} linewidth={3} />
        </line>
      )}

      {(path.type === 'highway' || path.type === 'road') && (
        <>
          {path.points.length >= 2 && path.points.slice(0, -1).map((point, i) => {
            const start = new THREE.Vector3(point[0], 0.05, point[2])
            const end = new THREE.Vector3(path.points[i + 1][0], 0.05, path.points[i + 1][2])
            const direction = new THREE.Vector3().subVectors(end, start)
            const length = direction.length()
            const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
            const angle = Math.atan2(direction.x, direction.z)
            const roadWidth = path.width || (path.type === 'highway' ? 12 : 8)
            const isHighway = path.type === 'highway'
            
            return (
              <group key={`road-${i}`}>
                {/* Main asphalt plane */}
                <mesh position={[center.x, 0.02, center.z]} rotation={[-Math.PI/2, 0, angle]}>
                  <planeGeometry args={[roadWidth, length]} />
                  <meshStandardMaterial color={isHighway ? '#1F2937' : '#374151'} roughness={0.9} />
                </mesh>
                
                {/* Dashed center lines */}
                {Array.from({length: Math.floor(length / 2.5)}).map((_, j) => {
                  const dashLen = 1
                  const progress = ((j * 2.5) + (dashLen / 2)) / length
                  if (progress > 1) return null
                  const dashX = start.x + direction.x * progress
                  const dashZ = start.z + direction.z * progress
                  
                  return (
                    <group key={`dash-${j}`}>
                      {isHighway ? (
                        <>
                          {/* Double yellow lines for highway */}
                          <mesh position={[dashX + Math.cos(angle)*0.2, 0.03, dashZ - Math.sin(angle)*0.2]} rotation={[-Math.PI/2, 0, angle]}>
                            <planeGeometry args={[0.15, dashLen]} />
                            <meshStandardMaterial color="#fbbf24" roughness={1} />
                          </mesh>
                          <mesh position={[dashX - Math.cos(angle)*0.2, 0.03, dashZ + Math.sin(angle)*0.2]} rotation={[-Math.PI/2, 0, angle]}>
                            <planeGeometry args={[0.15, dashLen]} />
                            <meshStandardMaterial color="#fbbf24" roughness={1} />
                          </mesh>
                        </>
                      ) : (
                        <mesh position={[dashX, 0.03, dashZ]} rotation={[-Math.PI/2, 0, angle]}>
                          <planeGeometry args={[0.2, dashLen]} />
                          <meshStandardMaterial color="#ffffff" roughness={1} />
                        </mesh>
                      )}
                    </group>
                  )
                })}
              </group>
            )
          })}
        </>
      )}
      
      {path.type === 'railway' && (
        <>
          {path.points.length >= 2 && path.points.slice(0, -1).map((point, i) => {
            const start = new THREE.Vector3(point[0], 0.05, point[2])
            const end = new THREE.Vector3(path.points[i + 1][0], 0.05, path.points[i + 1][2])
            const direction = new THREE.Vector3().subVectors(end, start)
            const length = direction.length()
            const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
            const angle = Math.atan2(direction.x, direction.z)
            
            return (
              <group key={`rail-${i}`}>
                <mesh position={[center.x, 0.03, center.z]} rotation={[-Math.PI/2, 0, angle]}>
                  <planeGeometry args={[4, length]} />
                  <meshStandardMaterial color="#5c4033" />
                </mesh>
                <mesh position={[center.x - 1, 0.08, center.z]} rotation={[-Math.PI/2, 0, angle]}>
                  <planeGeometry args={[0.25, length]} />
                  <meshStandardMaterial color="#2f2f2f" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[center.x + 1, 0.08, center.z]} rotation={[-Math.PI/2, 0, angle]}>
                  <planeGeometry args={[0.25, length]} />
                  <meshStandardMaterial color="#2f2f2f" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            )
          })}
          
          {path.points.map((point, i) => (
            <mesh key={`tie-${i}`} position={[point[0], 0.06, point[2]]} rotation={[-Math.PI/2, 0, 0]}>
              <boxGeometry args={[5, 0.25, 0.35]} />
              <meshStandardMaterial color="#3d2817" />
            </mesh>
          ))}
        </>
      )}
      
      {path.points.map((point, i) => (
        <group key={i}>
          <mesh 
            position={[point[0], 0.12, point[2]]}
            onClick={(e) => { e.stopPropagation(); if (adminMode) onSelect(path, i) }}
            onPointerDown={(e) => handlePointPointerDown(e, i)}
            onPointerOver={(e) => { e.stopPropagation(); if (adminMode) document.body.style.cursor = 'grab' }}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <cylinderGeometry args={[0.6, 0.6, 0.3, 16]} />
            <meshStandardMaterial 
              color={selectedPointIndex === i ? '#10b981' : isSelected ? '#fbbf24' : path.type === 'railway' ? '#dc2626' : '#64748b'} 
              emissive={selectedPointIndex === i ? '#10b981' : isSelected ? '#fbbf24' : '#000'}
              emissiveIntensity={selectedPointIndex === i || isSelected ? 0.5 : 0}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Ground({ showDecorations = true, pegmanMode = false, onPegmanDrop = null }) {
  const grassPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 200; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 250,
        z: (Math.random() - 0.5) * 250,
        type: Math.random() > 0.7 ? 'flower' : 'grass'
      })
    }
    return positions
  }, [])

  const handleGroundClick = (e) => {
    if (pegmanMode && onPegmanDrop) {
      e.stopPropagation()
      const point = e.point
      if (point) {
        onPegmanDrop([point.x, 0, point.z])
      }
    }
  }

  return (
    <group>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.2, 0]}
        onClick={handleGroundClick}
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#5B4423" roughness={0.95} />
      </mesh>
      {pegmanMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} onClick={handleGroundClick}>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.1} />
        </mesh>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#6B4423" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#5B8C35" roughness={0.9} />
      </mesh>
      
      {showDecorations && grassPositions.map((pos, i) => (
        pos.type === 'grass' ? (
          <mesh key={`grass-${i}`} position={[pos.x, 0.1, pos.z]}>
            <boxGeometry args={[0.1, 0.2, 0.1]} />
            <meshStandardMaterial color="#3E6B2B" roughness={0.9} />
          </mesh>
        ) : (
          <mesh key={`flower-${i}`} position={[pos.x, 0.15, pos.z]}>
            <boxGeometry args={[0.15, 0.3, 0.15]} />
            <meshStandardMaterial color={['#FFD700', '#FF69B4', '#FFFFFF', '#FFA500'][i % 4]} roughness={1} />
          </mesh>
        )
      ))}
    </group>
  )
}

function RulerMeasurement({ rulerMode, rulerPoints, onRulerPointClick }) {
  const { camera, gl } = useThree()
  const planeRef = useRef()
  
  const handleClick = (e) => {
    if (!rulerMode) return
    e.stopPropagation()
    onRulerPointClick([e.point.x, 0, e.point.z])
  }
  
  if (!rulerMode) return null
  
  return (
    <group>
      <mesh 
        ref={planeRef}
        position={[0, 0.1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
      >
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {rulerPoints.map((point, i) => (
        <group key={i} position={[point.x, 0.5, point.z]}>
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
            <meshStandardMaterial color="#8B5CF6" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
      
      {rulerPoints.length >= 2 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={rulerPoints.length}
              array={new Float32Array(rulerPoints.flatMap(p => [p.x, 0.5, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#8B5CF6" linewidth={3} />
        </line>
      )}
      
      {rulerPoints.map((point, i) => (
        i < rulerPoints.length - 1 && (
          <Billboard key={i} position={[(rulerPoints[i].x + rulerPoints[i+1].x)/2, 2, (rulerPoints[i].z + rulerPoints[i+1].z)/2]}>
            <Text
              fontSize={1.5}
              color="#8B5CF6"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.15}
              outlineColor="#ffffff"
            >
              {Math.sqrt(
                Math.pow(rulerPoints[i+1].x - rulerPoints[i].x, 2) + 
                Math.pow(rulerPoints[i+1].z - rulerPoints[i].z, 2)
              ).toFixed(2)}m
            </Text>
          </Billboard>
        )
      ))}
    </group>
  )
}

function Grid({ showGrid, gridSize }) {
  if (!showGrid) return null
  
  const size = 200
  const divisions = size / gridSize
  
  return (
    <group>
      <gridHelper 
        args={[size, divisions, '#444444', '#333333']} 
        position={[0, 0.05, 0]}
      />
      {Array.from({ length: divisions + 1 }).map((_, i) => {
        const pos = -size / 2 + i * gridSize
        return (
          <group key={i}>
            <mesh position={[pos, 0.06, -size/2]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[0.1, size]} />
              <meshBasicMaterial color="#555555" transparent opacity={0.5} />
            </mesh>
            <mesh position={[-size/2, 0.06, pos]} rotation={[-Math.PI/2, 0, 0]}>
              <planeGeometry args={[size, 0.1]} />
              <meshBasicMaterial color="#555555" transparent opacity={0.5} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Trees() {
  const treePositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 40 + Math.random() * 120
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const nearBuildings = Math.abs(x) < 45 && Math.abs(z) < 40
      if (!nearBuildings || Math.random() > 0.65) {
        positions.push({
          pos: [x, 0, z],
          scale: 0.5 + Math.random() * 0.7,
          rotation: Math.random() * Math.PI * 2,
          type: Math.random() > 0.5 ? 'palm' : Math.random() > 0.5 ? 'regular' : 'bush'
        })
      }
    }
    
    const boundaryTrees = []
    for (let i = 0; i < 80; i++) {
      const side = i < 20 ? 0 : i < 40 ? 1 : i < 60 ? 2 : 3
      const t = (i % 20) / 19
      const radius = 75
      let x, z
      if (side === 0) { x = -radius + t * 150; z = -55 }
      else if (side === 1) { x = -radius + t * 150; z = 55 }
      else if (side === 2) { x = -55; z = -radius + t * 110 }
      else { x = 55; z = -radius + t * 110 }
      boundaryTrees.push({ 
        pos: [x, 0, z], 
        scale: 0.7 + Math.random() * 0.4, 
        rotation: Math.random() * Math.PI * 2, 
        type: Math.random() > 0.3 ? 'regular' : 'palm' 
      })
    }
    
    return [...positions, ...boundaryTrees]
  }, [])

  return (
    <>
      {treePositions.map((tree, i) => (
        <group key={i} position={tree.pos} rotation={[0, tree.rotation, 0]} scale={tree.scale}>
          {tree.type === 'palm' ? (
            <>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.12, 0.2, 5, 8]} />
                <meshStandardMaterial color="#8B7355" roughness={0.9} />
              </mesh>
              {[0, 72, 144, 216, 288].map((angle, j) => (
                <mesh key={j} position={[Math.sin(angle * Math.PI / 180) * 0.7, 5, Math.cos(angle * Math.PI / 180) * 0.7]} rotation={[0.4, angle * Math.PI / 180, 0.6]}>
                  <coneGeometry args={[0.25, 2.5, 4]} />
                  <meshStandardMaterial color="#228B22" roughness={0.75} />
                </mesh>
              ))}
              <mesh position={[0, 5.3, 0]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshStandardMaterial color="#2E8B57" roughness={0.8} />
              </mesh>
            </>
          ) : tree.type === 'bush' ? (
            <>
              <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.8, 8, 8]} />
                <meshStandardMaterial color="#228B22" roughness={0.9} />
              </mesh>
              <mesh position={[0.3, 0.3, 0.2]}>
                <sphereGeometry args={[0.5, 8, 8]} />
                <meshStandardMaterial color="#2E7D32" roughness={0.85} />
              </mesh>
            </>
          ) : (
            <>
              <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.25, 0.4, 2.4, 8]} />
                <meshStandardMaterial color="#5D4037" roughness={0.9} />
              </mesh>
              <mesh position={[0, 3.5, 0]}>
                <coneGeometry args={[2, 4, 8]} />
                <meshStandardMaterial color="#1B5E20" roughness={0.8} />
              </mesh>
              <mesh position={[0, 5, 0]}>
                <coneGeometry args={[1.6, 3, 8]} />
                <meshStandardMaterial color="#2E7D32" roughness={0.8} />
              </mesh>
              <mesh position={[0, 5.8, 0]}>
                <coneGeometry args={[1.3, 2.5, 8]} />
                <meshStandardMaterial color="#388E3C" roughness={0.8} />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  )
}

function LampPosts() {
  const lampPositions = useMemo(() => {
    const positions = []
    const lampRows = [
      [-35, 25], [-15, 25], [5, 25], [25, 25], [45, 25],
      [-35, 0], [45, 0],
      [-35, -20], [-15, -20], [25, -20], [45, -20],
      [-35, -35], [15, -35],
    ]
    lampRows.forEach(([x, z]) => {
      positions.push({ pos: [x, 0, z] })
    })
    return positions
  }, [])

  return (
    <>
      {lampPositions.map((lamp, i) => (
        <group key={i} position={lamp.pos}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.08, 0.12, 5, 8]} />
            <meshStandardMaterial color="#2c2c2c" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 5.3, 0]}>
            <cylinderGeometry args={[0.35, 0.45, 0.5, 8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, 5.1, 0]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial 
              color="#FFFACD" 
              emissive="#FFFACD" 
              emissiveIntensity={0.8}
              transparent 
              opacity={0.9}
            />
          </mesh>
          <pointLight position={[0, 5, 0]} intensity={1.2} color="#FFFACD" distance={20} decay={2} />
        </group>
      ))}
    </>
  )
}

function ParkingLot({ position, capacity, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[capacity * 0.85, 6.5]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.92} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[capacity * 0.85 - 0.5, 6.5 - 0.5]} />
        <meshStandardMaterial color="#505050" roughness={0.9} />
      </mesh>
      
      <mesh position={[capacity * 0.4 + 0.3, 1.2, 0]}>
        <boxGeometry args={[1.5, 2.4, 1.5]} />
        <meshStandardMaterial color="#FFD700" roughness={0.6} />
      </mesh>
      <mesh position={[capacity * 0.4 + 0.3, 2.6, 0]}>
        <boxGeometry args={[1.2, 0.4, 1.2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[capacity * 0.8, 0.15]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.8} />
      </mesh>
      
      {Array.from({ length: Math.floor(capacity / 2) }).map((_, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-capacity * 0.35 + i * 2, 0.02, 2.3]}>
            <planeGeometry args={[1.7, 4.3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-capacity * 0.35 + i * 2, 0.02, -2.3]}>
            <planeGeometry args={[1.7, 4.3]} />
            <meshStandardMaterial color="#ffffff" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function FlagPole() {
  return (
    <group position={[0, 0, 18]}>
      <mesh position={[0, 6, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 12, 8]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 12.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.8, 11.5, 0]}>
        <planeGeometry args={[2.5, 1.6]} />
        <meshStandardMaterial color="#0066cc" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 16]} />
        <meshStandardMaterial color="#808080" roughness={0.8} />
      </mesh>
    </group>
  )
}

function SwimmingPool() {
  return (
    <group position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[20, 30]} />
        <meshStandardMaterial color="#1e90ff" roughness={0.1} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[20.5, 0.5, 30.5]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
      </mesh>
      {[-9, -3, 3, 9].map((x, i) => (
        <mesh key={`lane-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, 0]}>
          <planeGeometry args={[0.15, 28]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 15.5]}>
        <boxGeometry args={[22, 0.3, 1]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, -15.5]}>
        <boxGeometry args={[22, 0.3, 1]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
      </mesh>
    </group>
  )
}

function BasketballCourt({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[22, 36]} />
        <meshStandardMaterial color="#cd853f" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -16]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 16]}>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      {[-9, 9].map((x, i) => (
        <group key={`hoop-${i}`}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[x * 2.2, 2.5, -17]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
            <meshStandardMaterial color="#ff4500" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[x * 2.2, 2.5, 17]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
            <meshStandardMaterial color="#ff4500" />
          </mesh>
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -8]}>
        <planeGeometry args={[12, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 8]}>
        <planeGeometry args={[12, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function TrackField({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[10, 12, 4]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <planeGeometry args={[20, 24]} />
        <meshStandardMaterial color="#228B22" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, 0.03, 0]}>
        <planeGeometry args={[1, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.03, 0]}>
        <planeGeometry args={[1, 24]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -12]}>
        <planeGeometry args={[20, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 12]}>
        <planeGeometry args={[20, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function CampusMonuments() {
  return (
    <>
      <group position={[-20, 0, 25]}>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[2, 3, 1]} />
          <meshStandardMaterial color="#808080" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.3, 0]}>
          <boxGeometry args={[1.5, 0.6, 0.8]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.2, 8]} />
          <meshStandardMaterial color="#696969" roughness={0.8} />
        </mesh>
      </group>
      <group position={[25, 0, 30]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.8, 1, 4, 8]} />
          <meshStandardMaterial color="#b8860b" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 4.3, 0]}>
          <coneGeometry args={[0.6, 0.8, 8]} />
          <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </>
  )
}

function RoadsAndPaths({ paths }) {
  return (
    <>
      {paths.map((path) => {
        if (path.type === 'road' || path.type === 'path' || path.type === 'highway') {
          const points = path.points
          const width = path.width || 4
          const isHighway = path.type === 'highway'
          
          return (
            <group key={path.id}>
              {points.length >= 2 && points.slice(0, -1).map((point, i) => {
                const start = new THREE.Vector3(point[0], 0, point[2])
                const end = new THREE.Vector3(points[i + 1][0], 0, points[i + 1][2])
                const direction = new THREE.Vector3().subVectors(end, start)
                const length = direction.length()
                const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
                const angle = Math.atan2(direction.x, direction.z)
                
                return (
                  <group key={i}>
                    <mesh 
                      position={[center.x, 0.05, center.z]} 
                      rotation={[0, angle, 0]}
                    >
                      <boxGeometry args={[width, 0.1, length]} />
                      <meshStandardMaterial color={path.color} roughness={0.95} />
                    </mesh>
                    {isHighway && (
                      <>
                        <mesh position={[center.x, 0.12, center.z]} rotation={[0, angle, 0]}>
                          <boxGeometry args={[0.3, 0.05, length]} />
                          <meshStandardMaterial color="#FBBF24" emissive="#FBBF24" emissiveIntensity={0.2} />
                        </mesh>
                        <mesh position={[center.x - width/4, 0.12, center.z]} rotation={[0, angle, 0]}>
                          <boxGeometry args={[0.15, 0.03, length * 0.6]} />
                          <meshStandardMaterial color="#FFFFFF" />
                        </mesh>
                        <mesh position={[center.x + width/4, 0.12, center.z]} rotation={[0, angle, 0]}>
                          <boxGeometry args={[0.15, 0.03, length * 0.6]} />
                          <meshStandardMaterial color="#FFFFFF" />
                        </mesh>
                      </>
                    )}
                  </group>
                )
              })}
            </group>
          )
        }
        return null
      })}
    </>
  )
}

function Railway({ path }) {
  const points = useMemo(() => path.points, [path.points])
  
  return (
    <group>
      {points.length >= 2 && points.slice(0, -1).map((point, i) => {
        const start = new THREE.Vector3(point[0], 0.05, point[2])
        const end = new THREE.Vector3(points[i + 1][0], 0.05, points[i + 1][2])
        const direction = new THREE.Vector3().subVectors(end, start)
        const length = direction.length()
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
        const angle = Math.atan2(direction.x, direction.z)
        
        return (
          <group key={i}>
            <mesh position={[center.x, 0.03, center.z]} rotation={[-Math.PI/2, 0, angle]}>
              <planeGeometry args={[4, length]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[center.x - 1, 0.08, center.z]} rotation={[-Math.PI/2, 0, angle]}>
              <planeGeometry args={[0.3, length]} />
              <meshStandardMaterial color="#1f1f1f" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[center.x + 1, 0.08, center.z]} rotation={[-Math.PI/2, 0, angle]}>
              <planeGeometry args={[0.3, length]} />
              <meshStandardMaterial color="#1f1f1f" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )
      })}
      
      {points.map((point, i) => (
        <group key={`tie-${i}`}>
          <mesh position={[point[0], 0.06, point[2]]} rotation={[-Math.PI/2, 0, 0]}>
            <boxGeometry args={[5, 0.3, 0.4]} />
            <meshStandardMaterial color="#3d2817" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function NavigationPath({ path }) {
  useEffect(() => {
    console.log('NavigationPath received path:', path)
  }, [path])
  
  if (!path || path.length < 2) {
    console.log('NavigationPath: no path or path too short')
    return null
  }

  const pathWidth = 1.2
  const pathColor = '#6366f1'
  const pathEmissive = '#4f46e5'
  
  return (
    <group>
      {path.slice(0, -1).map((point, index) => {
        const start = new THREE.Vector3(point[0], 0.05, point[2])
        const end = new THREE.Vector3(path[index + 1][0], 0.05, path[index + 1][2])
        const direction = new THREE.Vector3().subVectors(end, start)
        const length = direction.length()
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
        const angle = Math.atan2(direction.x, direction.z)
        
        return (
          <group key={`segment-${index}`}>
            <mesh 
              position={[center.x, 0.02, center.z]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[pathWidth, 0.08, length + 0.3]} />
              <meshStandardMaterial color={pathColor} emissive={pathEmissive} emissiveIntensity={0.3} roughness={0.8} />
            </mesh>
          </group>
        )
      })}
      
      {path.map((point, index) => (
        <group key={`node-${index}`} position={[point[0], 0.05, point[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[pathWidth * 0.6, 16]} />
            <meshStandardMaterial 
              color={index === 0 ? '#10b981' : index === path.length - 1 ? '#ef4444' : pathColor}
              emissive={index === 0 ? '#10b981' : index === path.length - 1 ? '#ef4444' : pathEmissive}
              emissiveIntensity={0.5}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function CampusScene({ onBuildingSelect, selectedBuilding, adminMode, onDragEnd, onSelectRoom, selectedPath, onSelectPath, onPathPointDrag, selectedPointIndex, onPointSelect, showGrid = false, gridSize = 5, showDecorations = false, creativeMode = false, rulerMode = false, rulerPoints = [], onRulerPointClick, pegmanMode = false, pegmanPosition = null, onPegmanDrop, draggedResource = null, onDropResource = null, navigationPath, isNavigating = false, gpsTracking = false, gpsHeading = null }) {
  const markers = useStore((state) => state.markers)
  const paths = useStore((state) => state.paths)
  const viewMode = useStore((state) => state.viewMode)
  const navigationPathFromStore = useStore((state) => state.navigationPath)
  const currentFloor = useStore((state) => state.currentFloor)
  const firstPersonMode = useStore((state) => state.firstPersonMode)
  const storeShowDecorations = useStore((state) => state.showDecorations)
  
  useEffect(() => {
    console.log('CampusScene: store navigationPath:', navigationPathFromStore)
  }, [navigationPathFromStore])
  
  const activePath = navigationPathFromStore
  const decorationsEnabled = showDecorations || storeShowDecorations
  
  const handleDrop = (position) => {
    if (onDropResource && draggedResource) {
      onDropResource(position)
    }
  }

  const memoizedMarkers = useMemo(() => markers, [markers.length])
  const memoizedPaths = useMemo(() => paths, [paths.length])
  const memoizedRoads = useMemo(() => paths.filter(p => p.type !== 'railway'), [paths.length])
  const memoizedRails = useMemo(() => paths.filter(p => p.type === 'railway'), [paths.length])
  
  return (
    <>
      <Ground showDecorations={decorationsEnabled} pegmanMode={pegmanMode} onPegmanDrop={onPegmanDrop} />
      {decorationsEnabled && <Trees />}
      {decorationsEnabled && <LampPosts />}
      {decorationsEnabled && <FlagPole />}
      <BasketballCourt position={[-10, 0, -20]} />
      <PegmanMarker pegmanMode={pegmanMode} pegmanPosition={pegmanPosition} onPegmanDrop={onPegmanDrop} isNavigating={isNavigating} navigationPath={activePath} gpsTracking={gpsTracking} gpsHeading={gpsHeading} />
      
      <DropZone onDrop={handleDrop} isActive={!!draggedResource} />
      
      {memoizedMarkers.map((building) => (
        <DraggableBuilding
          key={building.id}
          building={building}
          onSelect={onBuildingSelect}
          isSelected={selectedBuilding?.id === building.id}
          adminMode={adminMode}
          onDragEnd={onDragEnd}
        />
      ))}
      
      {memoizedPaths.map((path) => (
        <PathLine 
          key={path.id} 
          path={path} 
          isSelected={selectedPath?.id === path.id}
          onSelect={onSelectPath}
          onDragEnd={onPathPointDrag}
          adminMode={adminMode}
          selectedPointIndex={selectedPointIndex}
          onPointSelect={onPointSelect}
        />
      ))}
      
      <NavigationPath path={activePath} />
    </>
  )
}

export { IndoorScene }
