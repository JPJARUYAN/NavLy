import { useState, useEffect, useRef } from 'react'
import CampusMap from '../components/CampusMap'
import { 
  X, MapPin, Calendar, Home, ArrowRight, Navigation, Building, Footprints, 
  Plus, Trash2, Edit, Save, ChevronDown
} from 'lucide-react'
import { useStore } from '../store/useStore'

function findPath(startPos, endPos, markers, paths) {
  const startPoint = [startPos[0], 0, startPos[2]]
  const endPoint = [endPos[0], 0, endPos[2]]
  
  console.log('findPath start:', startPoint, 'end:', endPoint)
  
  const dist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2)
  
  const getBuildingBounds = (m) => {
    if (!m.position) return null
    const pos = m.position
    const scale = m.scale || [1, 1, 1]
    const w = scale[0] || 1
    const d = scale[2] || 1
    return { 
      minX: pos[0] - w/2 - 2, 
      maxX: pos[0] + w/2 + 2, 
      minZ: pos[2] - d/2 - 2, 
      maxZ: pos[2] + d/2 + 2,
      name: m.name
    }
  }
  
  const getAllObstacles = () => {
    const obstacles = []
    for (const m of markers) {
      if (m.type === 'navPoint') continue
      const b = getBuildingBounds(m)
      if (b) obstacles.push(b)
    }
    return obstacles
  }
  
  const allObstacles = getAllObstacles()
  
  const isObstacle = (x, z) => {
    for (const obs of allObstacles) {
      if (x >= obs.minX && x <= obs.maxX && z >= obs.minZ && z <= obs.maxZ) {
        return true
      }
    }
    return false
  }

  const isNearPath = (x, z) => {
    for (const p of paths) {
      if (p.points && p.points.length >= 2) {
        const width = p.width || 3
        for (let i = 0; i < p.points.length - 1; i++) {
          const p1 = p.points[i]
          const p2 = p.points[i + 1]
          const dx = p2[0] - p1[0]
          const dz = p2[2] - p1[2]
          const len = Math.sqrt(dx * dx + dz * dz)
          if (len < 0.1) continue
          const t = Math.max(0, Math.min(1, ((x - p1[0]) * dx + (z - p1[2]) * dz) / (len * len)))
          const nearX = p1[0] + t * dx
          const nearZ = p1[2] + t * dz
          if (Math.sqrt((x - nearX) ** 2 + (z - nearZ) ** 2) < width / 2 + 2) {
            return true
          }
        }
      }
    }
    return false
  }
  
  const findNearestFreePoint = (point, maxRadius = 50) => {
    for (let r = 2; r < maxRadius; r += 2) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
        const x = point[0] + Math.cos(angle) * r
        const z = point[2] + Math.sin(angle) * r
        if (!isObstacle(x, z)) {
          return [x, 0, z]
        }
      }
    }
    return null
  }
  
  const startBlocked = isObstacle(startPoint[0], startPoint[2])
  const endBlocked = isObstacle(endPoint[0], endPoint[2])
  
  console.log('Start obstacle:', startBlocked, 'End obstacle:', endBlocked)
  console.log('Obstacles:', allObstacles.map(o => o.name))
  
  let adjustedStart = [...startPoint]
  let adjustedEnd = [...endPoint]
  
  if (startBlocked) {
    const newStart = findNearestFreePoint(startPoint)
    if (newStart) adjustedStart = newStart
    console.log('Adjusted start to:', adjustedStart)
  }
  if (endBlocked) {
    const newEnd = findNearestFreePoint(endPoint)
    if (newEnd) adjustedEnd = newEnd
    console.log('Adjusted end to:', adjustedEnd)
  }
  
  const GRID_SIZE = 2
  const heuristic = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[2] - b[2])
  
  const getNeighbors = (pos) => {
    const [x, , z] = pos
    const neighbors = []
    const dirs = [
      [GRID_SIZE, 0], [-GRID_SIZE, 0], [0, GRID_SIZE], [0, -GRID_SIZE],
      [GRID_SIZE, GRID_SIZE], [-GRID_SIZE, GRID_SIZE], [GRID_SIZE, -GRID_SIZE], [-GRID_SIZE, -GRID_SIZE]
    ]
    for (const [dx, dz] of dirs) {
      const newX = x + dx
      const newZ = z + dz
      if (!isObstacle(newX, newZ)) {
        const nearPath = isNearPath(newX, newZ)
        neighbors.push({ pos: [newX, 0, newZ], nearPath })
      }
    }
    return neighbors
  }
  
  const openSet = new Map()
  const closedSet = new Set()
  const cameFrom = new Map()
  const gScore = new Map()
  
  const startKey = `${adjustedStart[0].toFixed(1)},${adjustedStart[2].toFixed(1)}`
  openSet.set(startKey, { pos: adjustedStart, f: heuristic(adjustedStart, adjustedEnd) })
  gScore.set(startKey, 0)
  
  let iterations = 0
  const maxIterations = 20000
  
  while (openSet.size > 0 && iterations < maxIterations) {
    iterations++
    
    let current = null
    let lowestF = Infinity
    for (const [key, data] of openSet) {
      if (data.f < lowestF) { lowestF = data.f; current = key }
    }
    
    if (!current) break
    const currentPos = openSet.get(current).pos
    
    if (dist(currentPos, adjustedEnd) < GRID_SIZE * 3) {
      const path = [currentPos]
      let c = current
      while (cameFrom.has(c)) {
        const prev = cameFrom.get(c)
        path.unshift(prev)
        c = `${prev[0].toFixed(1)},${prev[2].toFixed(1)}`
      }
      path.unshift(adjustedStart)
      path.push(adjustedEnd)
      console.log('A* path found, points:', path.length)
      return path
    }
    
    openSet.delete(current)
    closedSet.add(current)
    
    for (const neighbor of getNeighbors(currentPos)) {
      const nKey = `${neighbor.pos[0].toFixed(1)},${neighbor.pos[2].toFixed(1)}`
      if (closedSet.has(nKey)) continue
      const distToNeighbor = dist(currentPos, neighbor.pos)
      const pathBonus = neighbor.nearPath ? 0.5 : 0
      const tentativeG = (gScore.get(current) || 0) + distToNeighbor - pathBonus
      if (!openSet.has(nKey) || tentativeG < (gScore.get(nKey) || Infinity)) {
        cameFrom.set(nKey, currentPos)
        gScore.set(nKey, tentativeG)
        const f = tentativeG + heuristic(neighbor.pos, adjustedEnd)
        openSet.set(nKey, { pos: neighbor.pos, f })
      }
    }
  }
  
  console.log('A* failed after', iterations, 'iterations, using direct navigation')
  
  return findDirectPath(adjustedStart, adjustedEnd, isObstacle)
}

function findDirectPath(start, end, isObstacle) {
  const path = [start]
  let current = [...start]
  const stepSize = 4
  const maxSteps = 500
  const TOLERANCE = 0.5
  
  for (let step = 0; step < maxSteps; step++) {
    const dx = end[0] - current[0]
    const dz = end[2] - current[2]
    const distToEnd = Math.sqrt(dx * dx + dz * dz)
    
    if (distToEnd < stepSize * 1.5) {
      if (!isObstacle(end[0], end[2])) {
        path.push(end)
      }
      break
    }
    
    const dirX = dx / distToEnd
    const dirZ = dz / distToEnd
    
    let nextX = current[0] + dirX * stepSize
    let nextZ = current[2] + dirZ * stepSize
    
    if (isObstacle(nextX, nextZ)) {
      let found = null
      for (let r = 3; r < 40; r += 3) {
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          const testX = current[0] + Math.cos(angle) * r
          const testZ = current[2] + Math.sin(angle) * r
          if (!isObstacle(testX, testZ)) {
            found = [testX, 0, testZ]
            break
          }
        }
        if (found) break
      }
      if (found) {
        nextX = found[0]
        nextZ = found[2]
      } else {
        const escaped = findNearestFreePointEscaping(current, end, isObstacle)
        if (escaped) {
          nextX = escaped[0]
          nextZ = escaped[2]
        } else {
          break
        }
      }
    }
    
    current = [nextX, 0, nextZ]
    path.push(current)
    
    const dxEnd = Math.abs(current[0] - end[0])
    const dzEnd = Math.abs(current[2] - end[2])
    const distToEndNow = Math.sqrt(dxEnd * dxEnd + dzEnd * dzEnd)
    if (distToEndNow < stepSize * 2) {
      break
    }
  }
  
  const last = path[path.length - 1]
  const distToLast = Math.sqrt((end[0] - last[0]) ** 2 + (end[2] - last[2]) ** 2)
  if (distToLast > stepSize && !isObstacle(end[0], end[2])) {
    path.push(end)
  }
  
  console.log('Direct path created with', path.length, 'points')
  
  const simplified = simplifyPath(path, isObstacle)
  return simplified
}

function findNearestFreePointEscaping(from, to, isObstacle) {
  const dx = to[0] - from[0]
  const dz = to[2] - from[2]
  const baseAngle = Math.atan2(dz, dx)
  
  for (let offset = -Math.PI/2; offset <= Math.PI/2; offset += Math.PI/6) {
    const angle = baseAngle + offset
    for (let dist = 5; dist < 60; dist += 5) {
      const tx = from[0] + Math.cos(angle) * dist
      const tz = from[2] + Math.sin(angle) * dist
      if (!isObstacle(tx, tz)) {
        return [tx, 0, tz]
      }
    }
  }
  return null
}

function simplifyPath(path, isObstacle) {
  if (!path || path.length < 3) return path
  
  const simplified = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1]
    const next = path[i + 1]
    const dx = next[0] - prev[0]
    const dz = next[2] - prev[2]
    const segDist = Math.sqrt(dx * dx + dz * dz)
    if (segDist < 3) continue
    for (let check = 5; check < segDist; check += 5) {
      const checkX = prev[0] + (dx * check) / segDist
      const checkZ = prev[2] + (dz * check) / segDist
      if (isObstacle(checkX, checkZ)) {
        simplified.push(path[i])
        break
      }
    }
  }
  simplified.push(path[path.length - 1])
  return simplified
}

function dist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2)
}

function hasLineOfSight(p1, p2, isObstacle) {
  const dx = p2[0] - p1[0]
  const dz = p2[2] - p1[2]
  const length = Math.sqrt(dx * dx + dz * dz)
  if (length < 3) return true
  
  const steps = Math.ceil(length / 3)
  
  for (let i = 1; i <= steps; i++) {
    const x = p1[0] + (dx * i) / steps
    const z = p1[2] + (dz * i) / steps
    if (isObstacle(x, z)) return false
  }
  return true
}

function optimizePath(path, isObstacle) {
  if (path.length <= 2) return path
  
  const simplified = [path[0]]
  
  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1]
    const next = path[i + 1]
    if (prev && next && hasLineOfSight(prev, next, isObstacle)) {
      continue
    }
    simplified.push(path[i])
  }
  
  simplified.push(path[path.length - 1])
  
  return simplified
}

export default function CampusPage() {
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showDirections, setShowDirections] = useState(false)
  const [directionsFrom, setDirectionsFrom] = useState(null)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [pegmanMode, setPegmanMode] = useState(false)
  const [pegmanPosition, setPegmanPosition] = useState(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentPathStep, setCurrentPathStep] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [gpsTracking, setGpsTracking] = useState(false)
  const [gpsPosition, setGpsPosition] = useState(null)
  const [gpsHeading, setGpsHeading] = useState(null)
  const [totalDistance, setTotalDistance] = useState(0)
  const [lastGpsPosition, setLastGpsPosition] = useState(null)
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'classroom',
    capacity: 30,
    computers: 0
  })
  const mapControlsRef = useRef()
  const lastSpokenDirectionRef = useRef(null)
  
  const markers = useStore((state) => state.markers)
  const events = useStore((state) => state.events)
  const viewMode = useStore((state) => state.viewMode)
  const setViewMode = useStore((state) => state.setViewMode)
  const adminMode = useStore((state) => state.adminMode)
  const setAdminMode = useStore((state) => state.setAdminMode)
  const navigationPath = useStore((state) => state.navigationPath)
  const setNavigationPath = useStore((state) => state.setNavigationPath)
  const paths = useStore((state) => state.paths)
  const selectedPath = useStore((state) => state.selectedPath)
  const setSelectedPath = useStore((state) => state.setSelectedPath)
  const currentMapName = useStore((state) => state.currentMapName)
  
  const updateBuildingPosition = useStore((state) => state.updateBuildingPosition)
  const updateBuildingRotation = useStore((state) => state.updateBuildingRotation)
  const updateBuildingScale = useStore((state) => state.updateBuildingScale)
  const updateBuilding = useStore((state) => state.updateBuilding)
  const deleteBuilding = useStore((state) => state.deleteBuilding)
  const addBuilding = useStore((state) => state.addBuilding)
  const addPath = useStore((state) => state.addPath)
  const updatePath = useStore((state) => state.updatePath)
  const deletePath = useStore((state) => state.deletePath)
  const setSelectedRoomStore = useStore((state) => state.setSelectedRoom)
  const currentFloor = useStore((state) => state.currentFloor)
  const setCurrentFloor = useStore((state) => state.setCurrentFloor)
  const addRoom = useStore((state) => state.addRoom)
  const deleteRoom = useStore((state) => state.deleteRoom)
  const updateRoom = useStore((state) => state.updateRoom)

  const [buildingForm, setBuildingForm] = useState({
    name: '', type: 'academic', description: '', floors: [{name: 'Ground Floor', rooms: [{name: 'Room 1', type: 'classroom', capacity: 30}]}]
  })

  const [pathForm, setPathForm] = useState({
    name: '', type: 'path', points: [[0, 0, 0], [10, 0, 10]], width: 3
  })

  const getNavPoints = () => {
    return markers.filter(m => m.type === 'navPoint').map(m => ({
      ...m,
      roomName: m.floors?.[0]?.rooms?.[0]?.name || 'Waypoint',
      roomType: m.floors?.[0]?.rooms?.[0]?.type || 'waypoint'
    }))
  }

  const navPoints = getNavPoints()

  const speak = (text) => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    if (navigationPath.length > 0 && !isNavigating) {
      setIsNavigating(true)
      setCurrentPathStep(0)
      if (!pegmanPosition && navigationPath.length > 0) {
        setPegmanPosition(navigationPath[0])
      }
      speak(`Starting navigation to ${selectedBuilding?.name}. Follow the blue path.`)
    }
  }, [navigationPath])

  useEffect(() => {
    if (!isNavigating || navigationPath.length === 0) return
    
    // If we are tracking GPS, do not auto-step the path. We will manually recalculate as the user moves.
    if (gpsTracking) return

    const stepDuration = 800

    const interval = setInterval(() => {
      setCurrentPathStep((prev) => {
        if (prev >= navigationPath.length - 1) {
          clearInterval(interval)
          setIsNavigating(false)
          speak(`You have arrived at ${selectedBuilding?.name}`)
          return prev
        }
        
        const nextStep = prev + 1
        const currentPoint = navigationPath[prev]
        const nextPoint = navigationPath[nextStep]
        
        if (currentPoint && nextPoint) {
          const dx = nextPoint[0] - currentPoint[0]
          const dz = nextPoint[2] - currentPoint[2]
          const angle = Math.atan2(dz, dx) * 180 / Math.PI
          let direction = ''
          if (angle > -22.5 && angle <= 22.5) direction = 'Go east'
          else if (angle > 22.5 && angle <= 67.5) direction = 'Go southeast'
          else if (angle > 67.5 && angle <= 112.5) direction = 'Go south'
          else if (angle > 112.5 && angle <= 157.5) direction = 'Go southwest'
          else if (angle > 157.5 || angle <= -157.5) direction = 'Go west'
          else if (angle > -67.5 && angle <= -22.5) direction = 'Go northeast'
          else if (angle > -112.5 && angle <= -67.5) direction = 'Go north'
          else if (angle > -157.5 && angle <= -112.5) direction = 'Go northwest'
          
          if (voiceEnabled && direction) {
            speak(direction)
          }
        }
        
        return nextStep
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [isNavigating, navigationPath, gpsTracking])

  useEffect(() => {
    if (isNavigating && gpsTracking && selectedBuilding && pegmanPosition) {
      if (!isNavigating || !selectedBuilding || !pegmanPosition) return
      
      const dxDist = Math.abs(selectedBuilding.position[0] - pegmanPosition[0])
      const dzDist = Math.abs(selectedBuilding.position[2] - pegmanPosition[2])
      const currentDist = Math.sqrt(dxDist * dxDist + dzDist * dzDist)
      
      if (currentDist < 3) {
        if (lastSpokenDirectionRef.current !== 'arrived') {
          lastSpokenDirectionRef.current = 'arrived'
          speak(`You have arrived at ${selectedBuilding.name}`)
          setIsNavigating(false)
        }
        return
      }

      // Re-calculate the path
      const path = findPath(pegmanPosition, selectedBuilding.position, markers, paths)
      if (path && path.length > 0) {
        setNavigationPath(path)
        
        if (path.length > 1) {
          const currentPoint = path[0]
          const nextPoint = path[1]
          const dx = nextPoint[0] - currentPoint[0]
          const dz = nextPoint[2] - currentPoint[2]
          const angle = Math.atan2(dz, dx) * 180 / Math.PI
          let direction = ''
          if (angle > -22.5 && angle <= 22.5) direction = 'Go east'
          else if (angle > 22.5 && angle <= 67.5) direction = 'Go southeast'
          else if (angle > 67.5 && angle <= 112.5) direction = 'Go south'
          else if (angle > 112.5 && angle <= 157.5) direction = 'Go southwest'
          else if (angle > 157.5 || angle <= -157.5) direction = 'Go west'
          else if (angle > -67.5 && angle <= -22.5) direction = 'Go northeast'
          else if (angle > -112.5 && angle <= -67.5) direction = 'Go north'
          else if (angle > -157.5 && angle <= -112.5) direction = 'Go northwest'
          
          if (voiceEnabled && direction && lastSpokenDirectionRef.current !== direction) {
            lastSpokenDirectionRef.current = direction
            speak(direction)
          }
        }
      }
    }
  }, [pegmanPosition, isNavigating, gpsTracking, selectedBuilding])

  useEffect(() => {
    if (!gpsTracking) return

    let watchId = null
    let orientationHandler = null
    let firstPos = null
    const startMapPos = pegmanPosition || [0, 0, 0]

    // Show pegman immediately at the anchor position so it's visible
    // even before the first GPS reading arrives.
    setPegmanPosition(startMapPos)
    setLastGpsPosition(startMapPos)

    const startTracking = async () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser')
        setGpsTracking(false)
        return
      }

      const onPosition = (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        if (!firstPos) {
          firstPos = { lat, lng }
        }

        const dLat = lat - firstPos.lat
        const dLng = lng - firstPos.lng

        // Convert GPS deltas (degrees→meters) to map units (1 map unit ≈ 1 meter)
        const dx = dLng * 111320 * Math.cos(firstPos.lat * Math.PI / 180)
        const dz = -dLat * 111320

        const mapPos = [
          startMapPos[0] + dx,
          0,
          startMapPos[2] + dz
        ]

        // Update distance counter only when moved meaningfully
        setLastGpsPosition(prev => {
          if (prev) {
            const dist = Math.sqrt((mapPos[0] - prev[0]) ** 2 + (mapPos[2] - prev[2]) ** 2)
            if (dist > 0.5) {
              setTotalDistance(d => d + dist)
              return mapPos
            }
            return prev
          }
          return mapPos
        })

        // Always update pegman position — this is what moves the 3D figure
        setGpsPosition(mapPos)
        setPegmanPosition(mapPos)
      }

      const errorHandler = (err) => {
        console.error('GPS Error:', err)
        alert('Unable to get location. Please enable location services.')
        setGpsTracking(false)
      }

      watchId = navigator.geolocation.watchPosition(onPosition, errorHandler, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      })

      // Device orientation for compass heading
      if (window.DeviceOrientationEvent) {
        const attachOrientation = () => {
          orientationHandler = (e) => {
            if (e.alpha !== null) setGpsHeading(e.alpha)
          }
          window.addEventListener('deviceorientation', orientationHandler)
        }

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission()
            if (permission === 'granted') attachOrientation()
          } catch (e) {
            console.log('Device orientation permission denied')
          }
        } else {
          attachOrientation()
        }
      }
    }

    startTracking()

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      if (orientationHandler) window.removeEventListener('deviceorientation', orientationHandler)
    }
  }, [gpsTracking])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedBuilding(null)
        setShowDirections(false)
        setShowRoomModal(false)
        if (isNavigating) {
          setIsNavigating(false)
          window.speechSynthesis?.cancel()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isNavigating])

  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building)
    setSelectedRoom(null)
    setCurrentFloor(0)
    if (viewMode === 'indoor') {
      setViewMode('outdoor')
    }
  }

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
    setSelectedRoomStore(room)
  }

  const handleGetDirections = () => {
    console.log('=== handleGetDirections START ===')
    console.log('directionsFrom:', directionsFrom)
    console.log('selectedBuilding:', selectedBuilding)
    console.log('markers:', markers.length)
    console.log('paths:', paths.length)
    
    if (!directionsFrom || !selectedBuilding) {
      console.log('MISSING directionFrom or selectedBuilding!')
      return
    }
    
    let startPos
    if (directionsFrom === '__pegman__') {
      if (!pegmanPosition) {
        alert('Please set your location first')
        return
      }
      startPos = pegmanPosition
    } else {
      const fromBuilding = markers.find(m => m.name === directionsFrom)
      if (!fromBuilding) {
        console.log('From building not found:', directionsFrom)
        return
      }
      startPos = fromBuilding.position
    }
    
    console.log('Start pos:', startPos)
    console.log('End pos:', selectedBuilding.position)
    
    const path = findPath(startPos, selectedBuilding.position, markers, paths)
    console.log('Path result:', path)
    console.log('Path length:', path.length)
    
    setNavigationPath(path)
    setShowDirections(false)
    console.log('=== handleGetDirections END ===')
  }

  const handleCancelDirections = () => {
    setDirectionsFrom(null)
    setNavigationPath([])
    setShowDirections(false)
    setIsNavigating(false)
    setCurrentPathStep(0)
    window.speechSynthesis?.cancel()
  }

  const handleDragEnd = (id, newPosition) => {
    updateBuildingPosition(id, newPosition)
  }

  const handleSelectPath = (path, pointIndex = null) => {
    setSelectedPath(path)
  }

  const handlePathPointDrag = (pathId, pointIndex, newPosition) => {
    // Not available in view mode
  }

  const buildingEvents = selectedBuilding 
    ? events.filter(e => e.building === selectedBuilding.name)
    : []

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
    lobby: '#6366f1'
  }

  const roomTypes = [
    { value: 'classroom', label: 'Classroom' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'computer', label: 'Computer Lab' },
    { value: 'office', label: 'Office' },
    { value: 'reading', label: 'Reading Room' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'lounge', label: 'Lounge' },
    { value: 'dining', label: 'Dining' },
    { value: 'dorm', label: 'Dorm Room' },
    { value: 'gym', label: 'Gym' },
    { value: 'storage', label: 'Storage' },
    { value: 'lobby', label: 'Lobby' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'meeting', label: 'Meeting Room' },
    { value: 'seminar', label: 'Seminar Room' },
    { value: 'stage', label: 'Stage' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'locker', label: 'Locker Room' },
    { value: 'security', label: 'Security' },
    { value: 'server', label: 'Server Room' },
  ]

  const openAddRoom = () => {
    setEditingRoom(null)
    setRoomForm({ name: '', type: 'classroom', capacity: 30, computers: 0 })
    setShowRoomModal(true)
  }

  const openEditRoom = (room) => {
    setEditingRoom(room)
    setRoomForm({
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      computers: room.computers || 0
    })
    setShowRoomModal(true)
  }

  const handleSaveRoom = () => {
    if (!roomForm.name || !selectedBuilding) return

    if (editingRoom) {
      updateRoom(selectedBuilding.id, currentFloor, editingRoom.id, roomForm)
    } else {
      addRoom(selectedBuilding.id, currentFloor, roomForm)
    }
    setShowRoomModal(false)
    setSelectedRoom(null)
  }

  const handleDeleteRoom = () => {
    if (!selectedRoom || !selectedBuilding) return
    if (window.confirm(`Delete ${selectedRoom.name}?`)) {
      deleteRoom(selectedBuilding.id, currentFloor, selectedRoom.id)
      setSelectedRoom(null)
    }
  }

  return (
    <div className="main-content" style={{ marginLeft: 0, height: '100vh', overflow: 'hidden' }}>
      <CampusMap 
        onBuildingSelect={handleBuildingSelect}
        selectedBuilding={selectedBuilding}
        viewMode={viewMode}
        navigationPath={navigationPath}
        adminMode={adminMode}
        onDragEnd={handleDragEnd}
        onSelectRoom={handleRoomSelect}
        selectedPath={selectedPath}
        onSelectPath={handleSelectPath}
        onPathPointDrag={handlePathPointDrag}
        selectedPointIndex={null}
        onPointSelect={() => {}}
        pegmanMode={pegmanMode}
        pegmanPosition={pegmanPosition}
        isNavigating={isNavigating}
        gpsTracking={gpsTracking}
        gpsHeading={gpsHeading}
        onPegmanDrop={(position) => {
          setPegmanPosition(position)
          setPegmanMode(false)
        }}
      />

      {viewMode === 'outdoor' && (
        <div className="nav-controls">
          <button 
            className="nav-control-btn" 
            onClick={() => setPegmanMode(!pegmanMode)} 
            title="Set your location"
            style={{
              background: pegmanMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              border: `1px solid ${pegmanMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.2)'}`
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C9 2 6 4 6 8c0 2.5 1.5 4.5 3.5 5.5L9 22h6l-.5-8.5C16.5 12.5 18 10.5 18 8c0-4-3-6-6-6zm0 2c2 0 4 1.5 4 4 0 1.5-1 3-2.5 3.5L12 13l-1.5-1.5C9 11.5 8 9.5 8 8c0-2.5 2-4 4-4z"/>
            </svg>
          </button>
          <button 
            className="nav-control-btn" 
            onClick={() => setGpsTracking(!gpsTracking)} 
            title="Toggle GPS Tracking"
            style={{
              background: gpsTracking ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.1)',
              border: `1px solid ${gpsTracking ? 'rgba(16, 185, 129, 0.8)' : 'rgba(99, 102, 241, 0.2)'}`
            }}
          >
            <MapPin size={18} />
          </button>
          <button 
            className="nav-control-btn" 
            onClick={() => setViewMode('indoor')} 
            title="View Indoor"
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}
          >
            <Building size={18} />
          </button>
          <button 
            className="nav-control-btn" 
            onClick={() => setShowDirections(true)} 
            title="Get Directions"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <Navigation size={18} />
          </button>
        </div>
      )}

      {selectedBuilding && viewMode === 'outdoor' && (
        <div className="glass building-panel" style={{ 
          right: 24, 
          maxHeight: 'calc(100vh - 180px)', 
          overflow: 'auto', 
          width: 380,
          background: 'linear-gradient(145deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <h2>{selectedBuilding.name}</h2>
            <button onClick={() => setSelectedBuilding(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <span className={`badge badge-${selectedBuilding.type}`}>{selectedBuilding.type}</span>
          <p className="building-description">{selectedBuilding.description}</p>

          <div className="building-stats">
            <div className="stat-card">
              <h4>{selectedBuilding.floors?.length || 0}</h4>
              <span>Floors</span>
            </div>
            <div className="stat-card">
              <h4>{selectedBuilding.floors?.reduce((acc, f) => acc + f.rooms.length, 0) || 0}</h4>
              <span>Rooms</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setViewMode('indoor')}>
              <Building size={18} />
              View Indoor
            </button>
            
            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowDirections(true)}>
              <Navigation size={18} />
              Get Directions
            </button>
          </div>

          {buildingEvents.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                Upcoming Events
              </h4>
              <div className="events-list">
                {buildingEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div className="event-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}>
                      <Calendar size={16} color="white" />
                    </div>
                    <div className="event-details">
                      <h4 style={{ fontSize: '0.9rem' }}>{event.title}</h4>
                      <p>{event.date} at {event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'indoor' && selectedBuilding && (
        <div className="glass building-panel" style={{ 
          right: 24, 
          maxHeight: 'calc(100vh - 180px)', 
          overflow: 'auto', 
          width: 380,
          background: 'linear-gradient(145deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2>{selectedBuilding.name}</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {selectedBuilding.floors[currentFloor]?.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openAddRoom()} className="btn btn-primary btn-sm" title="Add Room">
                <Plus size={14} /> Add Room
              </button>
              <button onClick={() => { setViewMode('outdoor'); setSelectedBuilding(null); }} className="btn btn-secondary btn-sm">
                <Home size={14} />
                Exit
              </button>
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: 16 }}>
            {selectedBuilding.floors?.map((floor, index) => (
              <div 
                key={floor.name}
                className={`tab ${currentFloor === index ? 'active' : ''}`}
                onClick={() => setCurrentFloor(index)}
              >
                {floor.name}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div className="stat-card">
              <h4 style={{ fontSize: '1.2rem' }}>{selectedBuilding.floors[currentFloor]?.rooms.length || 0}</h4>
              <span>Rooms</span>
            </div>
            <div className="stat-card">
              <h4 style={{ fontSize: '1.2rem' }}>{selectedBuilding.floors[currentFloor]?.rooms.reduce((acc, r) => acc + r.capacity, 0) || 0}</h4>
              <span>Capacity</span>
            </div>
          </div>

          <div className="building-list">
            {selectedBuilding.floors[currentFloor]?.rooms.map((room) => (
              <div 
                key={room.id} 
                className={`building-list-item ${selectedRoom?.id === room.id ? 'active' : ''}`}
                onClick={() => handleRoomSelect(room)}
                style={{ cursor: 'pointer' }}
              >
                <div className="building-color" style={{ background: roomColors[room.type] || '#6366f1' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{room.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {room.type} | {room.capacity} seats
                    {room.computers && ` | ${room.computers} PCs`}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditRoom(room) }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  <Edit size={14} />
                </button>
              </div>
            ))}
          </div>

          {selectedRoom && (
            <div className="glass" style={{ marginTop: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{selectedRoom.name}</h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => openEditRoom(selectedRoom)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px' }}
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button 
                    onClick={handleDeleteRoom}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '6px 10px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                Type: {selectedRoom.type}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Capacity: {selectedRoom.capacity} people
              </p>
              {selectedRoom.computers && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Computers: {selectedRoom.computers}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="glass" style={{ 
        position: 'fixed', 
        left: 324, 
        bottom: 24, 
        padding: 16, 
        maxWidth: 300,
        background: 'linear-gradient(145deg, rgba(15, 15, 25, 0.9) 0%, rgba(10, 10, 18, 0.95) 100%)'
      }}>
        <h4 style={{ fontSize: '0.85rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} />
          Campus Map
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6366f1' }}>{currentMapName}</span>
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {[
            { type: 'Academic', color: '#4f46e5' },
            { type: 'Facility', color: '#0891b2' },
            { type: 'Residential', color: '#059669' },
            { type: 'Admin', color: '#ea580c' },
          ].map((item) => (
            <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }}></div>
              {item.type}
            </div>
          ))}
        </div>
        {navigationPath.length > 0 && (
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleCancelDirections}>
            <X size={14} />
            Clear Navigation
          </button>
        )}
      </div>

      {gpsTracking && (
        <div className="glass" style={{
          position: 'fixed',
          top: 80,
          right: 24,
          padding: '12px 20px',
          background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.95) 100%)',
          color: 'white',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 1000
        }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Distance Traveled</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalDistance.toFixed(1)} m</span>
        </div>
      )}

      {pegmanMode && (
        <div className="glass" style={{
          position: 'fixed',
          top: 80,
          right: 24,
          padding: '12px 20px',
          background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.95) 100%)',
          color: 'white',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          zIndex: 1000
        }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Set Your Location</span>
          <span style={{ fontSize: '0.85rem' }}>Click anywhere on the map</span>
        </div>
      )}

      {navigationPath.length > 0 && selectedBuilding && (
        <div className="glass" style={{ 
          position: 'fixed', 
          left: 24, 
          top: 80, 
          padding: 16, 
          width: 260,
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, rgba(15, 15, 25, 0.95) 0%, rgba(10, 10, 18, 0.98) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1' }}>
            <Navigation size={16} />
            Navigation Directions
          </h4>
          <div style={{ marginBottom: 12, padding: 8, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 6, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: 4 }}>FROM</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{directionsFrom === '__pegman__' ? '📍 My Location' : directionsFrom}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
            <ArrowRight size={20} color="#6366f1" />
          </div>
          <div style={{ marginBottom: 16, padding: 8, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: 4 }}>TO</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>🏢 {selectedBuilding.name}</div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>DIRECTIONS</div>
              <button 
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                style={{
                  background: voiceEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  color: voiceEnabled ? '#10b981' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>🔊</span>
                {voiceEnabled ? 'Voice On' : 'Voice Off'}
              </button>
            </div>
            {(() => {
              let totalDist = 0
              const steps = []
              for (let i = 0; i < navigationPath.length - 1; i++) {
                const dx = navigationPath[i + 1][0] - navigationPath[i][0]
                const dz = navigationPath[i + 1][2] - navigationPath[i][2]
                const dist = Math.sqrt(dx * dx + dz * dz)
                totalDist += dist
                
                let direction = ''
                const angle = Math.atan2(dz, dx) * 180 / Math.PI
                if (angle > -22.5 && angle <= 22.5) direction = '→ Go East'
                else if (angle > 22.5 && angle <= 67.5) direction = '↘ Go Southeast'
                else if (angle > 67.5 && angle <= 112.5) direction = '↓ Go South'
                else if (angle > 112.5 && angle <= 157.5) direction = '↙ Go Southwest'
                else if (angle > 157.5 || angle <= -157.5) direction = '← Go West'
                else if (angle > -67.5 && angle <= -22.5) direction = '↗ Go Northeast'
                else if (angle > -112.5 && angle <= -67.5) direction = '↑ Go North'
                else if (angle > -157.5 && angle <= -112.5) direction = '↖ Go Northwest'
                
                steps.push({
                  step: i + 1,
                  direction,
                  distance: dist.toFixed(1),
                  total: totalDist.toFixed(1)
                })
              }
              
              const totalSteps = steps.length
              
              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ padding: 8, background: 'rgba(99, 102, 241, 0.15)', borderRadius: 6 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1' }}>{totalDist.toFixed(0)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>meters total</div>
                    </div>
                    <div style={{ padding: 8, background: 'rgba(16, 185, 129, 0.15)', borderRadius: 6 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{totalSteps}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>steps total</div>
                    </div>
                  </div>
                  
                  {isNavigating && (
                    <div style={{ marginBottom: 12, padding: 10, background: 'rgba(239, 68, 68, 0.15)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: 4 }}>CURRENT STEP</div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                        Step {currentPathStep} of {totalSteps}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4 }}>
                        {steps[currentPathStep - 1]?.direction || 'Starting...'}
                      </div>
                    </div>
                  )}
                  
                  {steps.map((s, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '6px 0', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: isNavigating && currentPathStep === s.step ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        borderRadius: 4,
                        marginBottom: 2
                      }}
                    >
                      <div style={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%', 
                        background: isNavigating && currentPathStep === s.step ? '#ef4444' : 'rgba(99, 102, 241, 0.3)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.7rem', 
                        marginRight: 8,
                        color: isNavigating && currentPathStep === s.step ? '#fff' : '#9ca3af'
                      }}>
                        {s.step}
                      </div>
                      <div style={{ flex: 1, fontSize: '0.8rem', color: isNavigating && currentPathStep === s.step ? '#fff' : '#9ca3af' }}>{s.direction}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.distance}m</div>
                    </div>
                  ))}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {showDirections && (
        <div className="modal-overlay" onClick={() => setShowDirections(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <h2>Get Directions</h2>
            <div className="form-group">
              <label>From</label>
              <select className="form-select" value={directionsFrom || ''} onChange={(e) => setDirectionsFrom(e.target.value)}>
                <option value="">Select starting point</option>
                {pegmanPosition && (
                  <option value="__pegman__">📍 My Location (Pegman)</option>
                )}
                {markers.map((marker) => (
                  <option key={marker.id} value={marker.name}>
                    {marker.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <ArrowRight size={24} color="#6366f1" />
            </div>
            <div className="form-group">
              <label>To (Destination)</label>
              <select 
                className="form-select" 
                value={selectedBuilding?.id || ''}
                onChange={(e) => {
                  const building = markers.find(m => m.id === parseInt(e.target.value))
                  setSelectedBuilding(building)
                }}
              >
                <option value="">Select destination</option>
                <optgroup label="Buildings">
                  {markers.filter(m => m.type !== 'navPoint').map((marker) => (
                    <option key={marker.id} value={marker.id}>
                      🏢 {marker.name}
                    </option>
                  ))}
                </optgroup>
                {navPoints.length > 0 && (
                  <optgroup label="Navigation Points">
                    {navPoints.map((np) => (
                      <option key={np.id} value={np.id}>
                        📍 {np.roomName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDirections(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGetDirections} disabled={!directionsFrom || !selectedBuilding}>
                <Footprints size={18} />
                Start Navigation
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoomModal && (
        <div className="modal-overlay" onClick={() => setShowRoomModal(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
            
            <div className="form-group">
              <label>Room Name</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="e.g., Room 101, Computer Lab 1"
                value={roomForm.name}
                onChange={(e) => setRoomForm({...roomForm, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Room Type</label>
              <select 
                className="form-select"
                value={roomForm.type}
                onChange={(e) => setRoomForm({...roomForm, type: e.target.value})}
              >
                {roomTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Capacity</label>
                <input 
                  type="number" 
                  className="form-input"
                  min="1"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({...roomForm, capacity: parseInt(e.target.value) || 1})}
                />
              </div>
              {(roomForm.type === 'computer' || roomForm.type === 'laboratory') && (
                <div className="form-group">
                  <label>Computers</label>
                  <input 
                    type="number" 
                    className="form-input"
                    min="0"
                    value={roomForm.computers}
                    onChange={(e) => setRoomForm({...roomForm, computers: parseInt(e.target.value) || 0})}
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRoomModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRoom} disabled={!roomForm.name}>
                <Save size={18} />
                {editingRoom ? 'Update Room' : 'Add Room'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
