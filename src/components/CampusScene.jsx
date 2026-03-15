import { useRef, useState, useMemo, useEffect } from 'react'
import { Text, Billboard } from '@react-three/drei'
import { useStore } from '../store/useStore'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

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
    if (adminMode) {
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

  useEffect(() => {
    if (isDragging) {
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
          const dx = point.x - dragStart.x
          const dz = point.z - dragStart.z
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

  return (
    <group 
      position={building.position} 
      rotation={[0, building.rotation || 0, 0]}
    >
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
        <meshStandardMaterial 
          color={isSelected ? '#fbbf24' : (hovered ? '#f472b6' : style.main)}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {isChapel ? (
        <mesh position={[0, dimensions[1] + 2.5, 0]}>
          <coneGeometry args={[dimensions[0] * 0.6, 5, 4]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.6} />
        </mesh>
      ) : isGym ? (
        <mesh position={[0, dimensions[1] + 1.5, 0]}>
          <boxGeometry args={[dimensions[0] + 1, 3, dimensions[2] + 1]} />
          <meshStandardMaterial color="#8B0000" roughness={0.7} />
        </mesh>
      ) : isLibrary ? (
        <>
          <mesh position={[0, dimensions[1] + 1.5, 0]}>
            <boxGeometry args={[dimensions[0] * 0.4, 3, dimensions[2] * 0.4]} />
            <meshStandardMaterial color={style.roof} roughness={0.6} />
          </mesh>
          <mesh position={[0, dimensions[1] + 3.5, 0]}>
            <boxGeometry args={[dimensions[0] * 0.25, 2, dimensions[2] * 0.25]} />
            <meshStandardMaterial color={style.roof} roughness={0.6} />
          </mesh>
        </>
      ) : isDorm ? (
        <mesh position={[0, dimensions[1] + 0.8, 0]}>
          <boxGeometry args={[dimensions[0] + 0.3, 1.6, dimensions[2] + 0.3]} />
          <meshStandardMaterial color={style.roof} roughness={0.7} />
        </mesh>
      ) : (
        <mesh position={[0, dimensions[1] + 0.3, 0]}>
          <boxGeometry args={[dimensions[0] + 0.4, 0.6, dimensions[2] + 0.4]} />
          <meshStandardMaterial color={style.roof} roughness={0.5} metalness={0.2} />
        </mesh>
      )}

      {[-dimensions[0]/2 + 2, 0, dimensions[0]/2 - 2].map((xPos, xi) => (
        [...Array(Math.floor(dimensions[1] / 3))].map((_, floor) => (
          <group key={`window-${xi}-${floor}`}>
            <mesh position={[xPos, 2 + floor * 3, dimensions[2]/2 + 0.05]}>
              <boxGeometry args={[1.5, 1.8, 0.1]} />
              <meshStandardMaterial color="#333333" roughness={0.9} />
            </mesh>
            <mesh position={[xPos, 2 + floor * 3, dimensions[2]/2 + 0.12]}>
              <planeGeometry args={[1.3, 1.6]} />
              <meshStandardMaterial 
                color={hovered || isSelected ? '#fef3c7' : style.windows}
                emissive={hovered || isSelected ? '#fef3c7' : '#000000'}
                emissiveIntensity={hovered || isSelected ? 0.4 : 0}
              />
            </mesh>
          </group>
        ))
      ))}

      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[dimensions[0] + 3, 0.3, dimensions[2] + 3]} />
        <meshStandardMaterial color="#696969" roughness={0.95} />
      </mesh>

      <mesh position={[dimensions[0]/2 + 0.5, 0.5, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-dimensions[0]/2 - 0.5, 0.5, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      <mesh position={[0, 0.02, dimensions[2]/2 + 1.5]}>
        <boxGeometry args={[3, 0.15, 2]} />
        <meshStandardMaterial color="#A0A0A0" roughness={0.9} />
      </mesh>

      {adminMode && (
        <mesh position={[0, dimensions[1] / 2, 0]}>
          <boxGeometry args={[dimensions[0] + 0.5, dimensions[1] + 0.5, dimensions[2] + 0.5]} />
          <meshBasicMaterial color={isSelected ? '#10b981' : '#6366f1'} wireframe transparent opacity={0.3} />
        </mesh>
      )}

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

      <pointLight
        position={[0, dimensions[1] + 1, 0]}
        intensity={hovered || isSelected ? 2.5 : 0}
        color={isSelected ? '#fbbf24' : '#f472b6'}
        distance={25}
      />
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
      {path.type !== 'railway' && (
        <line geometry={geometry}>
          <lineBasicMaterial color={isSelected ? '#fbbf24' : path.color} linewidth={3} />
        </line>
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

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#3d6b2f" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#4a7c3f" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#5a8c4f" roughness={0.85} />
      </mesh>
      
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh key={`flower-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[
          (Math.random() - 0.5) * 300,
          -0.08,
          (Math.random() - 0.5) * 300
        ]}>
          <circleGeometry args={[0.3 + Math.random() * 0.3, 8]} />
          <meshStandardMaterial color={['#FFD700', '#FF69B4', '#FFFFFF', '#FFA500'][Math.floor(Math.random() * 4)]} roughness={1} />
        </mesh>
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
        if (path.type === 'road' || path.type === 'path') {
          const points = path.points
          const width = path.width || 4
          
          return (
            <group key={path.id}>
              {points.length >= 2 && points.slice(0, -1).map((point, i) => {
                const start = new THREE.Vector3(point[0], 0.02, point[2])
                const end = new THREE.Vector3(points[i + 1][0], 0.02, points[i + 1][2])
                const direction = new THREE.Vector3().subVectors(end, start)
                const length = direction.length()
                const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
                const angle = Math.atan2(direction.x, direction.z)
                
                return (
                  <mesh 
                    key={i} 
                    position={[center.x, 0.02, center.z]} 
                    rotation={[0, angle, 0]}
                   
                  >
                    <planeGeometry args={[width, length]} />
                    <meshStandardMaterial color={path.color} />
                  </mesh>
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
  if (!path || path.length < 2) return null

  return (
    <group>
      {path.map((point, index) => (
        <group key={index} position={[point[0], 0.3, point[2]]}>
          <mesh>
            <cylinderGeometry args={[0.6, 0.6, 0.15, 16]} />
            <meshStandardMaterial 
              color={index === 0 ? '#10b981' : index === path.length - 1 ? '#ef4444' : '#6366f1'}
              emissive={index === 0 ? '#10b981' : index === path.length - 1 ? '#ef4444' : '#6366f1'}
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}
      {path.slice(0, -1).map((point, index) => {
        const start = new THREE.Vector3(point[0], 0.3, point[2])
        const end = new THREE.Vector3(path[index + 1][0], 0.3, path[index + 1][2])
        const direction = new THREE.Vector3().subVectors(end, start)
        const length = direction.length()
        const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
        const angle = Math.atan2(direction.x, direction.z)
        
        return (
          <mesh 
            key={`line-${index}`}
            position={[center.x, 0.3, center.z]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.4, 0.1, length]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function CampusScene({ onBuildingSelect, selectedBuilding, adminMode, onDragEnd, onSelectRoom, selectedPath, onSelectPath, onPathPointDrag, selectedPointIndex, onPointSelect, showGrid = false, gridSize = 5 }) {
  const markers = useStore((state) => state.markers)
  const paths = useStore((state) => state.paths)
  const viewMode = useStore((state) => state.viewMode)
  const navigationPath = useStore((state) => state.navigationPath)
  const currentFloor = useStore((state) => state.currentFloor)

  return (
    <>
      <fog attach="fog" args={['#87CEEB', 80, 250]} />
      <Ground />
      <Grid showGrid={showGrid} gridSize={gridSize} />
      <RoadsAndPaths paths={paths} />
      {paths.filter(p => p.type === 'railway').map((path) => (
        <Railway key={path.id} path={path} />
      ))}
      <Trees />
      <LampPosts />
      <FlagPole />
      <BasketballCourt position={[-10, 0, -20]} />
      
      {markers.map((building) => (
        <DraggableBuilding
          key={building.id}
          building={building}
          onSelect={onBuildingSelect}
          isSelected={selectedBuilding?.id === building.id}
          adminMode={adminMode}
          onDragEnd={onDragEnd}
        />
      ))}
      
      {paths.map((path) => (
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
      
      <NavigationPath path={navigationPath} />
    </>
  )
}

export { IndoorScene }
