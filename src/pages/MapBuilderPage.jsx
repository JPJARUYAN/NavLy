import { useState, useCallback, useRef, useEffect } from 'react'
import CampusMap from '../components/CampusMap'
import { 
  X, MapPin, Save, RotateCw, Maximize2, Move, Trash2, Plus, Undo, Redo, Grid3X3, Eye, EyeOff,
  Layers, Settings, Info, Check, Copy, ArrowUp, ArrowDown, ChevronDown, Train, Download, Upload, 
  RotateCcw, Pencil, Circle, Square, Hexagon
} from 'lucide-react'
import { useStore } from '../store/useStore'

export default function MapBuilderPage() {
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedPath, setSelectedPath] = useState(null)
  const [selectedPointIndex, setSelectedPointIndex] = useState(null)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(5)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [mapName, setMapName] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  const markers = useStore((state) => state.markers)
  const paths = useStore((state) => state.paths)
  const savedMaps = useStore((state) => state.savedMaps)
  const currentMapName = useStore((state) => state.currentMapName)
  const updateBuildingPosition = useStore((state) => state.updateBuildingPosition)
  const updateBuildingRotation = useStore((state) => state.updateBuildingRotation)
  const updateBuildingScale = useStore((state) => state.updateBuildingScale)
  const addBuilding = useStore((state) => state.addBuilding)
  const deleteBuilding = useStore((state) => state.deleteBuilding)
  const addPath = useStore((state) => state.addPath)
  const updatePath = useStore((state) => state.updatePath)
  const deletePath = useStore((state) => state.deletePath)
  const updatePathPoint = useStore((state) => state.updatePathPoint)
  const addPathPoint = useStore((state) => state.addPathPoint)
  const removePathPoint = useStore((state) => state.removePathPoint)
  const saveMap = useStore((state) => state.saveMap)
  const loadMap = useStore((state) => state.loadMap)
  const deleteSavedMap = useStore((state) => state.deleteSavedMap)
  const resetToDefault = useStore((state) => state.resetToDefault)

  const [buildingForm, setBuildingForm] = useState({
    name: 'New Building',
    type: 'academic',
    description: 'New building',
    position: [0, 0, 0],
    rotation: 0,
    scale: [1, 1, 1]
  })

  const [pathForm, setPathForm] = useState({
    name: 'New Path',
    type: 'path',
    points: [[0, 0, 0], [20, 0, 0]],
    width: 4
  })

  const handleDragEnd = (id, newPosition) => {
    let finalPosition = newPosition
    if (snapToGrid) {
      finalPosition = [
        Math.round(newPosition[0] / gridSize) * gridSize,
        0,
        Math.round(newPosition[2] / gridSize) * gridSize
      ]
    }
    updateBuildingPosition(id, finalPosition)
  }

  const handlePathPointDrag = (pathId, pointIndex, newPosition) => {
    let finalPosition = newPosition
    if (snapToGrid) {
      finalPosition = [
        Math.round(newPosition[0] / gridSize) * gridSize,
        0,
        Math.round(newPosition[2] / gridSize) * gridSize
      ]
    }
    updatePathPoint(pathId, pointIndex, finalPosition)
  }

  const handleBuildingSelect = (building) => {
    setSelectedBuilding(building)
    setSelectedPath(null)
    setSelectedPointIndex(null)
    if (building) {
      setBuildingForm({
        name: building.name,
        type: building.type,
        description: building.description || '',
        position: building.position,
        rotation: building.rotation || 0,
        scale: building.scale || [1, 1, 1]
      })
    }
  }

  const handlePathSelect = (path, pointIndex = null) => {
    setSelectedPath(path)
    setSelectedPointIndex(pointIndex)
    setSelectedBuilding(null)
    setPathForm({
      name: path.name,
      type: path.type,
      points: path.points,
      width: path.width
    })
  }

  const handlePointSelect = (index) => {
    setSelectedPointIndex(index)
  }

  const handleUpdateBuilding = () => {
    if (selectedBuilding) {
      useStore.getState().updateBuilding(selectedBuilding.id, {
        name: buildingForm.name,
        type: buildingForm.type,
        description: buildingForm.description,
        rotation: buildingForm.rotation,
        scale: buildingForm.scale
      })
      setSelectedBuilding({ ...selectedBuilding, ...buildingForm })
    }
  }

  const handleUpdatePath = () => {
    if (selectedPath) {
      updatePath(selectedPath.id, {
        name: pathForm.name,
        type: pathForm.type,
        width: pathForm.width,
        points: pathForm.points
      })
      setSelectedPath({ ...selectedPath, ...pathForm })
    }
  }

  const handleDeleteBuilding = () => {
    if (selectedBuilding && window.confirm(`Delete ${selectedBuilding.name}?`)) {
      deleteBuilding(selectedBuilding.id)
      setSelectedBuilding(null)
    }
  }

  const handleDeletePath = () => {
    if (selectedPath && window.confirm(`Delete ${selectedPath.name}?`)) {
      deletePath(selectedPath.id)
      setSelectedPath(null)
      setSelectedPointIndex(null)
    }
  }

  const handleAddPathPoint = () => {
    if (selectedPath) {
      const lastPoint = selectedPath.points[selectedPath.points.length - 1]
      addPathPoint(selectedPath.id, [lastPoint[0] + 10, 0, lastPoint[2] + 10])
      setSelectedPath({ ...selectedPath, points: [...selectedPath.points, [lastPoint[0] + 10, 0, lastPoint[2] + 10]] })
    }
  }

  const handleRemovePathPoint = () => {
    if (selectedPath && selectedPointIndex !== null && selectedPath.points.length > 2) {
      removePathPoint(selectedPath.id, selectedPointIndex)
      setSelectedPointIndex(null)
    }
  }

  const handleRotateLeft = () => {
    if (selectedBuilding) {
      const newRotation = (selectedBuilding.rotation || 0) - 15
      updateBuildingRotation(selectedBuilding.id, newRotation)
      setSelectedBuilding({ ...selectedBuilding, rotation: newRotation })
      setBuildingForm({ ...buildingForm, rotation: newRotation })
    }
  }

  const handleRotateRight = () => {
    if (selectedBuilding) {
      const newRotation = (selectedBuilding.rotation || 0) + 15
      updateBuildingRotation(selectedBuilding.id, newRotation)
      setSelectedBuilding({ ...selectedBuilding, rotation: newRotation })
      setBuildingForm({ ...buildingForm, rotation: newRotation })
    }
  }

  const handleScaleUp = () => {
    if (selectedBuilding) {
      const newScale = [
        Math.min((selectedBuilding.scale?.[0] || 1) + 0.1, 2),
        Math.min((selectedBuilding.scale?.[1] || 1) + 0.1, 2),
        Math.min((selectedBuilding.scale?.[2] || 1) + 0.1, 2)
      ]
      updateBuildingScale(selectedBuilding.id, newScale)
      setSelectedBuilding({ ...selectedBuilding, scale: newScale })
      setBuildingForm({ ...buildingForm, scale: newScale })
    }
  }

  const handleScaleDown = () => {
    if (selectedBuilding) {
      const newScale = [
        Math.max((selectedBuilding.scale?.[0] || 1) - 0.1, 0.5),
        Math.max((selectedBuilding.scale?.[1] || 1) - 0.1, 0.5),
        Math.max((selectedBuilding.scale?.[2] || 1) - 0.1, 0.5)
      ]
      updateBuildingScale(selectedBuilding.id, newScale)
      setSelectedBuilding({ ...selectedBuilding, scale: newScale })
      setBuildingForm({ ...buildingForm, scale: newScale })
    }
  }

  const handleMove = (dx, dz) => {
    if (selectedBuilding) {
      const newPos = [
        selectedBuilding.position[0] + dx,
        0,
        selectedBuilding.position[2] + dz
      ]
      updateBuildingPosition(selectedBuilding.id, newPos)
      setSelectedBuilding({ ...selectedBuilding, position: newPos })
      setBuildingForm({ ...buildingForm, position: newPos })
    }
  }

  const handleAddPath = (type = 'path', color = null) => {
    const newPath = {
      name: type === 'railway' ? 'New Railway' : type === 'road' ? 'New Road' : 'New Path',
      type: type,
      points: type === 'railway' ? [[-30, 0, 0], [30, 0, 0]] : [[0, 0, 0], [20, 0, 0], [40, 0, 20]],
      width: type === 'railway' ? 4 : type === 'road' ? 8 : 3,
      color: color || (type === 'railway' ? '#1f2937' : type === 'road' ? '#374151' : '#64748b')
    }
    addPath(newPath)
  }

  const handleAddElement = (element) => {
    if (element.type === 'path' || element.type === 'road' || element.type === 'railway') {
      handleAddPath(element.type, element.color)
      return
    }
    const newBuilding = {
      name: element.name,
      type: element.type,
      description: element.description,
      position: [Math.random() * 40 - 20, 0, Math.random() * 40 - 20],
      rotation: 0,
      scale: element.scale || [1, 1, 1],
      floors: element.floors || [{name: 'Ground Floor', rooms: [{id: 'f1', name: 'Main Area', type: 'feature', capacity: 0}]}],
      color: element.color
    }
    addBuilding(newBuilding)
  }

  const handleSave = () => {
    if (mapName.trim()) {
      saveMap(mapName.trim())
      setShowSaveModal(false)
      setMapName('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    }
  }

  const handleLoad = (mapData) => {
    loadMap(mapData)
    setShowLoadModal(false)
    setSelectedBuilding(null)
    setSelectedPath(null)
  }

  const handleReset = () => {
    if (window.confirm('Reset to default campus? This will clear all unsaved changes.')) {
      resetToDefault()
      setSelectedBuilding(null)
      setSelectedPath(null)
    }
  }

  const resources = [
    { category: 'Academic Buildings', items: [
      { name: 'College of Education', type: 'academic', description: 'Teacher Education Building - BEEd, BSEd, BPE, BTVTEd programs', color: '#8B4513', floors: [{name: 'Ground Floor', rooms: [{id: 'ce1', name: 'Registration Office', type: 'office', capacity: 5}, {id: 'ce2', name: 'Dean\'s Office', type: 'office', capacity: 8}, {id: 'ce3', name: 'Lecture Room 101', type: 'classroom', capacity: 45}, {id: 'ce4', name: 'Lecture Room 102', type: 'classroom', capacity: 45}]}, {name: '1st Floor', rooms: [{id: 'ce5', name: 'Lecture Room 201', type: 'classroom', capacity: 40}, {id: 'ce6', name: 'Lecture Room 202', type: 'classroom', capacity: 40}, {id: 'ce7', name: 'Practice Teaching Room', type: 'laboratory', capacity: 30}, {id: 'ce8', name: 'Faculty Room', type: 'office', capacity: 15}]}] },
      { name: 'College of Business', type: 'academic', description: 'Business Administration - BSA, BSMA, BSBA programs', color: '#1E3A5F', floors: [{name: 'Ground Floor', rooms: [{id: 'cb1', name: 'Business Center', type: 'office', capacity: 10}, {id: 'cb2', name: 'Accounting Lab', type: 'laboratory', capacity: 35}, {id: 'cb3', name: 'Lecture Hall A', type: 'lecture', capacity: 80}, {id: 'cb4', name: 'Lecture Hall B', type: 'lecture', capacity: 60}]}, {name: '1st Floor', rooms: [{id: 'cb5', name: 'Management Lab', type: 'computer', capacity: 40}, {id: 'cb6', name: 'Marketing Room', type: 'classroom', capacity: 45}, {id: 'cb7', name: 'Finance Room', type: 'classroom', capacity: 40}, {id: 'cb8', name: 'Dean\'s Office', type: 'office', capacity: 6}]}] },
      { name: 'College of Computer Studies', type: 'academic', description: 'IT & Engineering - BSIT, BSCpE programs', color: '#2563EB', floors: [{name: 'Ground Floor', rooms: [{id: 'ccs1', name: 'IT Office', type: 'office', capacity: 8}, {id: 'ccs2', name: 'Programming Lab 1', type: 'computer', capacity: 35}, {id: 'ccs3', name: 'Programming Lab 2', type: 'computer', capacity: 35}, {id: 'ccs4', name: 'Server Room', type: 'server', capacity: 5}]}, {name: '1st Floor', rooms: [{id: 'ccs5', name: 'Engineering Lab', type: 'laboratory', capacity: 30}, {id: 'ccs6', name: 'Multimedia Lab', type: 'computer', capacity: 30}, {id: 'ccs7', name: 'Lecture Room', type: 'classroom', capacity: 50}, {id: 'ccs8', name: 'Dean\'s Office', type: 'office', capacity: 6}]}] },
      { name: 'College of Science', type: 'academic', description: 'Natural Sciences - Physics, Chemistry, Biology', color: '#059669', floors: [{name: 'Ground Floor', rooms: [{id: 'sc1', name: 'Physics Lab 1', type: 'laboratory', capacity: 30}, {id: 'sc2', name: 'Physics Lab 2', type: 'laboratory', capacity: 30}, {id: 'sc3', name: 'Physics Prep Room', type: 'storage', capacity: 5}, {id: 'sc4', name: 'Faculty Room', type: 'office', capacity: 10}]}, {name: '1st Floor', rooms: [{id: 'sc5', name: 'Chemistry Lab 1', type: 'laboratory', capacity: 30}, {id: 'sc6', name: 'Chemistry Lab 2', type: 'laboratory', capacity: 30}, {id: 'sc7', name: 'Chemical Storage', type: 'storage', capacity: 3}, {id: 'sc8', name: 'Dean\'s Office', type: 'office', capacity: 5}]}] },
      { name: 'College of Arts & Sciences', type: 'academic', description: 'Arts, Social Sciences, Humanities', color: '#7C3AED', floors: [{name: 'Ground Floor', rooms: [{id: 'cas1', name: 'Psychology Lab', type: 'laboratory', capacity: 25}, {id: 'cas2', name: 'Communication Room', type: 'classroom', capacity: 35}, {id: 'cas3', name: 'Political Science Room', type: 'classroom', capacity: 40}, {id: 'cas4', name: 'Dean\'s Office', type: 'office', capacity: 6}]}, {name: '1st Floor', rooms: [{id: 'cas5', name: 'Lecture Hall', type: 'lecture', capacity: 60}, {id: 'cas6', name: 'Social Work Lab', type: 'laboratory', capacity: 25}, {id: 'cas7', name: 'Faculty Room', type: 'office', capacity: 12}, {id: 'cas8', name: 'Research Center', type: 'office', capacity: 10}]}] },
      { name: 'College of Criminal Justice', type: 'academic', description: 'Criminal Justice Education - Criminology', color: '#4B5563', floors: [{name: 'Ground Floor', rooms: [{id: 'crim1', name: 'Mock Courtroom', type: 'classroom', capacity: 50}, {id: 'crim2', name: 'Forensic Lab', type: 'laboratory', capacity: 25}, {id: 'crim3', name: 'Police Science Room', type: 'classroom', capacity: 40}, {id: 'crim4', name: 'Dean\'s Office', type: 'office', capacity: 5}]}, {name: '1st Floor', rooms: [{id: 'crim5', name: 'Lecture Hall', type: 'lecture', capacity: 60}, {id: 'crim6', name: 'Criminology Lab', type: 'laboratory', capacity: 30}, {id: 'crim7', name: 'Faculty Room', type: 'office', capacity: 10}]}] },
      { name: 'College of Tourism & Hospitality', type: 'academic', description: 'Hospitality and Tourism Management', color: '#F59E0B', floors: [{name: 'Ground Floor', rooms: [{id: 'th1', name: 'Hotel Lab / Mini Hotel', type: 'laboratory', capacity: 30}, {id: 'th2', name: 'Culinary Kitchen', type: 'laboratory', capacity: 25}, {id: 'th3', name: 'Food & Beverage Lab', type: 'laboratory', capacity: 25}, {id: 'th4', name: 'Dean\'s Office', type: 'office', capacity: 5}]}, {name: '1st Floor', rooms: [{id: 'th5', name: 'Tourism Classroom', type: 'classroom', capacity: 40}, {id: 'th6', name: 'Event Management Room', type: 'classroom', capacity: 35}, {id: 'th7', name: 'Faculty Room', type: 'office', capacity: 8}]}] },
    ]},
    { category: 'Facilities & Amenities', items: [
      { name: 'Main Library', type: 'facility', description: 'Central Library - Digital resources, study areas', color: '#DAA520', floors: [{name: 'Ground Floor', rooms: [{id: 'lib1', name: 'Circulation Desk', type: 'lobby', capacity: 5}, {id: 'lib2', name: 'New Arrivals Section', type: 'reading', capacity: 30}, {id: 'lib3', name: 'Computer Stations', type: 'computer', capacity: 40}]}, {name: '1st Floor', rooms: [{id: 'lib4', name: 'Reading Area A', type: 'reading', capacity: 60}, {id: 'lib5', name: 'Reading Area B', type: 'reading', capacity: 60}, {id: 'lib6', name: 'Quiet Zone', type: 'reading', capacity: 40}]}, {name: '2nd Floor', rooms: [{id: 'lib7', name: 'Digital Archive', type: 'storage', capacity: 10}, {id: 'lib8', name: 'Research Center', type: 'reading', capacity: 30}, {id: 'lib9', name: 'Group Study 1', type: 'meeting', capacity: 10}, {id: 'lib10', name: 'Group Study 2', type: 'meeting', capacity: 10}]}] },
      { name: 'Gymnasium / Sports Center', type: 'facility', description: 'Indoor sports and fitness facilities', color: '#DC2626', floors: [{name: 'Ground Floor', rooms: [{id: 'gym1', name: 'Main Court', type: 'gym', capacity: 500}, {id: 'gym2', name: 'Bleachers', type: 'seating', capacity: 300}, {id: 'gym3', name: 'Equipment Room', type: 'storage', capacity: 5}]}, {name: '1st Floor', rooms: [{id: 'gym4', name: 'Fitness Gym', type: 'gym', capacity: 50}, {id: 'gym5', name: 'Locker Room M', type: 'locker', capacity: 30}, {id: 'gym6', name: 'Locker Room F', type: 'locker', capacity: 30}, {id: 'gym7', name: 'Trainer\'s Office', type: 'office', capacity: 3}]}] },
      { name: 'Student Center / Cafeteria', type: 'facility', description: 'Food court, dining, and student activities', color: '#EA580C', floors: [{name: 'Ground Floor', rooms: [{id: 'sc1', name: 'Main Dining Area', type: 'dining', capacity: 200}, {id: 'sc2', name: 'Fast Food Area', type: 'dining', capacity: 80}, {id: 'sc3', name: 'Coffee Shop', type: 'dining', capacity: 40}, {id: 'sc4', name: 'Student Council Office', type: 'office', capacity: 8}]}, {name: '1st Floor', rooms: [{id: 'sc5', name: 'VIP Dining', type: 'dining', capacity: 50}, {id: 'sc6', name: 'Function Hall', type: 'event', capacity: 150}, {id: 'sc7', name: 'Kitchen', type: 'kitchen', capacity: 20}, {id: 'sc8', name: 'Storage Room', type: 'storage', capacity: 10}]}] },
      { name: 'Administration Building', type: 'admin', description: 'Main Administration - Registrar, Finance, President', color: '#A0522D', floors: [{name: 'Ground Floor', rooms: [{id: 'admin1', name: 'Guard House', type: 'security', capacity: 4}, {id: 'admin2', name: 'Information Desk', type: 'lobby', capacity: 5}, {id: 'admin3', name: 'Waiting Area', type: 'lobby', capacity: 30}, {id: 'admin4', name: 'Cashier', type: 'office', capacity: 4}]}, {name: '1st Floor', rooms: [{id: 'admin5', name: 'Registrar Office', type: 'office', capacity: 12}, {id: 'admin6', name: 'Finance Office', type: 'office', capacity: 10}, {id: 'admin7', name: 'Admission Office', type: 'office', capacity: 8}]}, {name: '2nd Floor', rooms: [{id: 'admin8', name: 'President\'s Office', type: 'office', capacity: 6}, {id: 'admin9', name: 'Vice President', type: 'office', capacity: 4}, {id: 'admin10', name: 'Board Room', type: 'meeting', capacity: 25}]}] },
      { name: 'Grand Auditorium', type: 'facility', description: 'Events hall, concerts, assemblies', color: '#65A30D', floors: [{name: 'Ground Floor', rooms: [{id: 'aud1', name: 'Main Stage', type: 'stage', capacity: 50}, {id: 'aud2', name: 'Audience Seating', type: 'auditorium', capacity: 500}, {id: 'aud3', name: 'Control Room', type: 'technical', capacity: 5}]}, {name: '1st Floor', rooms: [{id: 'aud4', name: 'VIP Lounge', type: 'lounge', capacity: 30}, {id: 'aud5', name: 'Green Room', type: 'lounge', capacity: 15}, {id: 'aud6', name: 'Storage', type: 'storage', capacity: 10}]}] },
      { name: 'Dormitory - Male', type: 'residential', description: 'Male Student Housing', color: '#0891B2', floors: [{name: 'Ground Floor', rooms: [{id: 'dm1', name: 'Lobby', type: 'lobby', capacity: 15}, {id: 'dm2', name: 'Dorm Manager Office', type: 'office', capacity: 3}, {id: 'dm3', name: 'Common Room', type: 'lounge', capacity: 30}]}, {name: '1st Floor', rooms: [{id: 'dm4', name: 'Room 101', type: 'dorm', capacity: 4}, {id: 'dm5', name: 'Room 102', type: 'dorm', capacity: 4}, {id: 'dm6', name: 'Room 103', type: 'dorm', capacity: 4}, {id: 'dm7', name: 'Room 104', type: 'dorm', capacity: 4}, {id: 'dm8', name: 'Bathroom', type: 'bath', capacity: 8}]}, {name: '2nd Floor', rooms: [{id: 'dm9', name: 'Room 201', type: 'dorm', capacity: 4}, {id: 'dm10', name: 'Room 202', type: 'dorm', capacity: 4}, {id: 'dm11', name: 'Room 203', type: 'dorm', capacity: 4}, {id: 'dm12', name: 'Room 204', type: 'dorm', capacity: 4}, {id: 'dm13', name: 'Bathroom', type: 'bath', capacity: 8}]}] },
      { name: 'Dormitory - Female', type: 'residential', description: 'Female Student Housing', color: '#DB2777', floors: [{name: 'Ground Floor', rooms: [{id: 'df1', name: 'Lobby', type: 'lobby', capacity: 15}, {id: 'df2', name: 'Dorm Manager Office', type: 'office', capacity: 3}, {id: 'df3', name: 'Common Room', type: 'lounge', capacity: 30}]}, {name: '1st Floor', rooms: [{id: 'df4', name: 'Room 101', type: 'dorm', capacity: 4}, {id: 'df5', name: 'Room 102', type: 'dorm', capacity: 4}, {id: 'df6', name: 'Room 103', type: 'dorm', capacity: 4}, {id: 'df7', name: 'Room 104', type: 'dorm', capacity: 4}, {id: 'df8', name: 'Bathroom', type: 'bath', capacity: 8}]}, {name: '2nd Floor', rooms: [{id: 'df9', name: 'Room 201', type: 'dorm', capacity: 4}, {id: 'df10', name: 'Room 202', type: 'dorm', capacity: 4}, {id: 'df11', name: 'Room 203', type: 'dorm', capacity: 4}, {id: 'df12', name: 'Room 204', type: 'dorm', capacity: 4}, {id: 'df13', name: 'Bathroom', type: 'bath', capacity: 8}]}] },
      { name: 'Computer Laboratory', type: 'academic', description: 'General computer labs for all students', color: '#3B82F6', floors: [{name: 'Ground Floor', rooms: [{id: 'cl1', name: 'Lab 1', type: 'computer', capacity: 30, computers: 30}, {id: 'cl2', name: 'Lab 2', type: 'computer', capacity: 30, computers: 30}, {id: 'cl3', name: 'Server Room', type: 'server', capacity: 3}]}, {name: '1st Floor', rooms: [{id: 'cl4', name: 'Lab 3', type: 'computer', capacity: 25, computers: 25}, {id: 'cl5', name: 'Lab 4', type: 'computer', capacity: 25, computers: 25}, {id: 'cl6', name: 'IT Support Office', type: 'office', capacity: 8}]}] },
      { name: 'Chapel / Prayer Room', type: 'facility', description: 'Spiritual activities and meditation', color: '#E5E7EB', floors: [{name: 'Ground Floor', rooms: [{id: 'chap1', name: 'Main Chapel', type: 'auditorium', capacity: 100}, {id: 'chap2', name: 'Prayer Room', type: 'reading', capacity: 30}]}] },
      { name: 'Health Services / Clinic', type: 'facility', description: 'Medical clinic and first aid', color: '#10B981', floors: [{name: 'Ground Floor', rooms: [{id: 'clinic1', name: 'Reception', type: 'lobby', capacity: 5}, {id: 'clinic2', name: 'Consultation Room', type: 'office', capacity: 3}, {id: 'clinic3', name: 'First Aid Room', type: 'office', capacity: 4}, {id: 'clinic4', name: 'Nurse\'s Office', type: 'office', capacity: 2}]}] },
    ]},
    { category: 'Outdoor & Recreation', items: [
      { name: 'Main Gate', type: 'feature', description: 'Campus main entrance', color: '#374151', scale: [4, 0.5, 4] },
      { name: 'Flag Pole', type: 'feature', description: 'Flag pole with school flag', color: '#FBBF24', scale: [0.3, 4, 0.3] },
      { name: 'Open Basketball Court', type: 'feature', description: 'Outdoor basketball court', color: '#B91C1C', scale: [4, 0.3, 3] },
      { name: 'Swimming Pool', type: 'feature', description: 'Olympic size swimming pool', color: '#06B6D4', scale: [6, 0.5, 3] },
      { name: ' tennis Court', type: 'feature', description: 'Outdoor tennis court', color: '#84CC16', scale: [2.5, 0.2, 4] },
      { name: 'Running Track', type: 'feature', description: '400 meter athletic track', color: '#92400E', scale: [8, 0.1, 5] },
      { name: 'Central Plaza', type: 'feature', description: 'Central open plaza / quad', color: '#A8A29E', scale: [5, 0.1, 5] },
      { name: 'Tree Avenue', type: 'feature', description: 'Trees lined pathway', color: '#166534', scale: [1, 3, 8] },
      { name: 'Botanical Garden', type: 'feature', description: 'Landscaped botanical garden', color: '#22C55E', scale: [4, 0.5, 4] },
      { name: 'Fountain', type: 'feature', description: 'Decorative fountain', color: '#0EA5E9', scale: [2, 1, 2] },
      { name: 'Parking Lot A', type: 'feature', description: 'Vehicle parking area - Main', color: '#374151', scale: [6, 0.2, 5] },
      { name: 'Parking Lot B', type: 'feature', description: 'Vehicle parking area - Secondary', color: '#4B5563', scale: [4, 0.2, 3] },
      { name: 'Waiting Shed', type: 'feature', description: 'Student waiting area / shed', color: '#78716C', scale: [2, 0.8, 1.5] },
      { name: 'Bleachers (Outdoor)', type: 'feature', description: 'Outdoor sports bleachers', color: '#9CA3AF', scale: [5, 1, 2] },
      { name: 'Storage Shed', type: 'feature', description: 'Maintenance storage', color: '#6B7280', scale: [2, 1, 2] },
    ]},
    { category: 'Roads & Pathways', items: [
      { name: 'Main Road', type: 'road', description: 'Main driveway through campus', color: '#374151' },
      { name: 'Service Road', type: 'road', description: 'Service/utility road', color: '#4B5563' },
      { name: 'Pedestrian Walkway', type: 'path', description: 'Concrete pedestrian path', color: '#9CA3AF' },
      { name: 'Garden Path', type: 'path', description: 'Paved path through gardens', color: '#A8A29E' },
      { name: 'Railway', type: 'railway', description: 'Train tracks bordering campus', color: '#1F2937' },
    ]}
  ]

  return (
    <div className="main-content" style={{ marginLeft: 0, height: '100vh', overflow: 'hidden' }}>
      <CampusMap 
        onBuildingSelect={handleBuildingSelect}
        selectedBuilding={selectedBuilding}
        adminMode={true}
        onDragEnd={handleDragEnd}
        showGrid={showGrid}
        gridSize={gridSize}
        selectedPath={selectedPath}
        onSelectPath={handlePathSelect}
        onPathPointDrag={handlePathPointDrag}
        selectedPointIndex={selectedPointIndex}
        onPointSelect={handlePointSelect}
      />

      <div className="glass" style={{ 
        position: 'fixed', 
        top: 24, 
        left: 344, 
        right: 24,
        padding: 16,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Map Builder</h3>
          <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>Admin Mode</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{currentMapName}</span>
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${showGrid ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid3X3 size={16} />
          </button>
          
          <button 
            className={`btn btn-sm ${snapToGrid ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Snap to Grid"
          >
            <Move size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grid:</span>
            <select 
              value={gridSize} 
              onChange={(e) => setGridSize(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', color: 'var(--text)', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value={1}>1m</option>
              <option value={5}>5m</option>
              <option value={10}>10m</option>
              <option value={20}>20m</option>
            </select>
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />

          <button className="btn btn-sm btn-secondary" onClick={handleReset} title="Reset to Default">
            <RotateCcw size={16} />
          </button>

          <button className="btn btn-sm btn-secondary" onClick={() => setShowLoadModal(true)} title="Load Map">
            <Download size={16} />
            Load
          </button>

          <button className="btn btn-sm btn-primary" onClick={() => setShowSaveModal(true)} title="Save Map">
            <Save size={16} />
            Save
          </button>

          <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }} />

          <button className="btn btn-sm btn-secondary" onClick={() => setShowResourcesModal(true)} title="Add Resources">
            <Plus size={16} />
            Resources
          </button>

          <button className="btn btn-sm btn-secondary" onClick={() => handleAddPath('path')} title="Add Path">
            <Layers size={16} />
            Path
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleAddPath('railway')} title="Add Railway">
            <Train size={16} />
            Railway
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="notification success" style={{ position: 'fixed', top: 100, right: 24, zIndex: 200 }}>
          Map saved successfully!
        </div>
      )}

      {(selectedBuilding || selectedPath) && (
        <div className="glass building-panel" style={{ right: 24, maxHeight: 'calc(100vh - 120px)', overflow: 'auto', width: 380 }}>
          {selectedBuilding && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2>Building Editor</h2>
                <button onClick={() => setSelectedBuilding(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <button className="btn btn-secondary" onClick={() => handleMove(-gridSize, 0)}>
                  <ArrowUp size={14} style={{ transform: 'rotate(-90deg)' }} /> Left
                </button>
                <button className="btn btn-secondary" onClick={() => handleMove(0, -gridSize)}>
                  <ArrowUp size={14} /> Up
                </button>
                <button className="btn btn-secondary" onClick={() => handleMove(0, gridSize)}>
                  <ArrowUp size={14} style={{ transform: 'rotate(180deg)' }} /> Down
                </button>
                <button className="btn btn-secondary" onClick={() => handleMove(gridSize, 0)}>
                  Right <ArrowUp size={14} style={{ transform: 'rotate(90deg)' }} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleRotateLeft}>
                  <RotateCw size={14} /> Rotate Left
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleRotateRight}>
                  Rotate Right <RotateCw size={14} style={{ transform: 'scaleX(-1)' }} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleScaleDown}>
                  <Maximize2 size={14} style={{ transform: 'rotate(180deg)' }} /> Shrink
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleScaleUp}>
                  <Maximize2 size={14} /> Grow
                </button>
              </div>

              <div className="form-group">
                <label>Building Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({...buildingForm, name: e.target.value})}
                  onBlur={handleUpdateBuilding}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select 
                  className="form-select"
                  value={buildingForm.type}
                  onChange={(e) => setBuildingForm({...buildingForm, type: e.target.value})}
                  onBlur={handleUpdateBuilding}
                >
                  <option value="academic">Academic</option>
                  <option value="facility">Facility</option>
                  <option value="residential">Residential</option>
                  <option value="admin">Admin</option>
                  <option value="feature">Feature</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  value={buildingForm.description}
                  onChange={(e) => setBuildingForm({...buildingForm, description: e.target.value})}
                  onBlur={handleUpdateBuilding}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>X Position</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={Math.round(buildingForm.position?.[0] || 0)}
                    onChange={(e) => setBuildingForm({...buildingForm, position: [Number(e.target.value), 0, buildingForm.position?.[2] || 0]})}
                    onBlur={handleUpdateBuilding}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Z Position</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={Math.round(buildingForm.position?.[2] || 0)}
                    onChange={(e) => setBuildingForm({...buildingForm, position: [buildingForm.position?.[0] || 0, 0, Number(e.target.value)]})}
                    onBlur={handleUpdateBuilding}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Rotation</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={Math.round(buildingForm.rotation || 0)}
                    onChange={(e) => setBuildingForm({...buildingForm, rotation: Number(e.target.value)})}
                    onBlur={handleUpdateBuilding}
                  />
                </div>
              </div>

              {selectedBuilding?.type !== 'feature' && (
                <div className="form-group">
                  <label>Floors</label>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {selectedBuilding?.floors?.length || 0} floors, {selectedBuilding?.floors?.reduce((acc, f) => acc + (f.rooms?.length || 0), 0) || 0} rooms
                  </div>
                </div>
              )}

              <button className="btn btn-danger" style={{ width: '100%', marginTop: 8 }} onClick={handleDeleteBuilding}>
                <Trash2 size={18} />
                Delete Building
              </button>
            </>
          )}

          {selectedPath && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2>Path Editor</h2>
                <button onClick={() => { setSelectedPath(null); setSelectedPointIndex(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                Drag the green circles to move path points
              </p>

              <div className="form-group">
                <label>Path Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={pathForm.name}
                  onChange={(e) => setPathForm({...pathForm, name: e.target.value})}
                  onBlur={handleUpdatePath}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select 
                  className="form-select"
                  value={pathForm.type}
                  onChange={(e) => setPathForm({...pathForm, type: e.target.value})}
                  onBlur={handleUpdatePath}
                >
                  <option value="path">Walking Path</option>
                  <option value="road">Road</option>
                  <option value="railway">Railway</option>
                </select>
              </div>

              <div className="form-group">
                <label>Width</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={pathForm.width || 4}
                  onChange={(e) => setPathForm({...pathForm, width: Number(e.target.value)})}
                  onBlur={handleUpdatePath}
                />
              </div>

              <div className="form-group">
                <label>Points ({pathForm.points?.length || 0})</label>
                <div style={{ maxHeight: 150, overflow: 'auto' }}>
                  {(pathForm.points || []).map((point, index) => (
                    <div 
                      key={index}
                      className={`building-list-item ${selectedPointIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedPointIndex(index)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Circle size={12} fill={selectedPointIndex === index ? '#10b981' : '#64748b'} />
                      <span>Point {index + 1}: ({Math.round(point?.[0] || 0)}, {Math.round(point?.[2] || 0)})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleAddPathPoint}>
                  <Plus size={14} /> Add Point
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={handleRemovePathPoint}
                  disabled={!selectedPointIndex || pathForm.points.length <= 2}
                >
                  <Trash2 size={14} /> Remove Point
                </button>
              </div>

              <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleDeletePath}>
                <Trash2 size={18} />
                Delete Path
              </button>
            </>
          )}
        </div>
      )}

      <div className="glass" style={{ position: 'fixed', left: 344, bottom: 24, padding: 16, maxWidth: 300 }}>
        <h4 style={{ fontSize: '0.85rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={16} />
          Buildings ({markers.length}) & Paths ({paths.length})
        </h4>
        <div className="building-list" style={{ maxHeight: 200 }}>
          {markers.map((building) => (
            <div 
              key={building.id}
              className={`building-list-item ${selectedBuilding?.id === building.id ? 'active' : ''}`}
              onClick={() => handleBuildingSelect(building)}
            >
              <div className="building-color" style={{ background: building.color || '#6366f1' }}></div>
              <div>
                <div style={{ fontWeight: 500 }}>{building.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {building.type} | {building.floors?.length || 0} floors
                </div>
              </div>
            </div>
          ))}
          {paths.map((path) => (
            <div 
              key={path.id}
              className={`building-list-item ${selectedPath?.id === path.id ? 'active' : ''}`}
              onClick={() => handlePathSelect(path)}
            >
              <Circle size={12} fill={path.type === 'railway' ? '#dc2626' : '#64748b'} />
              <div>
                <div style={{ fontWeight: 500 }}>{path.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {path.type} | {path.points?.length || 0} points
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <h2>Save Map</h2>
            <div className="form-group">
              <label>Map Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Enter map name"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                autoFocus
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              This will save {markers.length} buildings and {paths.length} paths.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!mapName.trim()}>
                <Save size={18} />
                Save Map
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoadModal && (
        <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="glass modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <h2>Load Saved Map</h2>
            {savedMaps && savedMaps.length > 0 ? (
              <div className="building-list" style={{ maxHeight: 300, marginBottom: 16 }}>
                {savedMaps.map((map, index) => (
                  <div 
                    key={index}
                    className="building-list-item"
                    onClick={() => handleLoad(map)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{map.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {map.buildings?.length || 0} buildings | {new Date(map.savedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={(e) => { e.stopPropagation(); deleteSavedMap(index) }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No saved maps yet. Save a map first!
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLoadModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showResourcesModal && (
        <div className="modal-overlay" onClick={() => setShowResourcesModal(false)}>
          <div className="glass modal" style={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2>Add Resources</h2>
            {resources.map((category, catIndex) => (
              <div key={catIndex} style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, color: 'var(--text-muted)' }}>{category.category}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {category.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      className="btn btn-secondary"
                      style={{ justifyContent: 'flex-start', padding: '12px' }}
                      onClick={() => {
                        if (item.type === 'path' || item.type === 'road' || item.type === 'railway') {
                          handleAddPath(item.type)
                        } else {
                          handleAddElement(item)
                        }
                        setShowResourcesModal(false)
                      }}
                    >
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: item.color || '#64748b', marginRight: 8 }}></div>
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowResourcesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
