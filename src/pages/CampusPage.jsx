import { useState, useEffect, useRef } from 'react'
import CampusMap from '../components/CampusMap'
import { 
  X, MapPin, Calendar, Home, ArrowRight, Navigation, Building, Footprints, 
  Plus, Trash2, Edit, Save, ChevronDown
} from 'lucide-react'
import { useStore } from '../store/useStore'

function findPath(startPos, endPos) {
  const directPath = [
    [startPos[0], 0, startPos[2]],
    [endPos[0], 0, endPos[2]]
  ]
  return directPath
}

export default function CampusPage() {
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showDirections, setShowDirections] = useState(false)
  const [directionsFrom, setDirectionsFrom] = useState(null)
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [roomForm, setRoomForm] = useState({
    name: '',
    type: 'classroom',
    capacity: 30,
    computers: 0
  })
  const mapControlsRef = useRef()
  
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedBuilding(null)
        setShowDirections(false)
        setShowRoomModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    if (directionsFrom && selectedBuilding) {
      const fromBuilding = markers.find(m => m.name === directionsFrom)
      if (fromBuilding) {
        const path = findPath(fromBuilding.position, selectedBuilding.position)
        setNavigationPath(path)
        setShowDirections(false)
      }
    }
  }

  const handleCancelDirections = () => {
    setDirectionsFrom(null)
    setNavigationPath([])
    setShowDirections(false)
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
      />

      {viewMode === 'outdoor' && (
        <div className="nav-controls">
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

      {showDirections && (
        <div className="modal-overlay" onClick={() => setShowDirections(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <h2>Get Directions</h2>
            <div className="form-group">
              <label>From</label>
              <select className="form-select" value={directionsFrom || ''} onChange={(e) => setDirectionsFrom(e.target.value)}>
                <option value="">Select starting point</option>
                {markers.map((marker) => (
                  <option key={marker.id} value={marker.name} disabled={marker.id === selectedBuilding?.id}>
                    {marker.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <ArrowRight size={24} color="#6366f1" />
            </div>
            <div className="form-group">
              <label>To</label>
              <div className="glass" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <MapPin size={20} color="#ef4444" />
                <span>{selectedBuilding?.name}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDirections(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGetDirections} disabled={!directionsFrom}>
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
