import { useState } from 'react'
import { Calendar, Plus, Trash2, Edit, MapPin, Clock } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function EventsPage({ user }) {
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const markers = useStore((state) => state.markers)
  const events = useStore((state) => state.events)
  const addEvent = useStore((state) => state.addEvent)
  const deleteEvent = useStore((state) => state.deleteEvent)

  const [formData, setFormData] = useState({
    title: '',
    building: '',
    date: '',
    time: '',
    description: ''
  })

  const canEdit = user?.role === 'admin' || user?.role === 'instructor'

  const handleSubmit = (e) => {
    e.preventDefault()
    addEvent(formData)
    setShowModal(false)
    setFormData({ title: '', building: '', date: '', time: '', description: '' })
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent(id)
    }
  }

  const eventIcons = ['🎓', '🔬', '💻', '🎭', '🏃', '📚', '🎨', '🎵']

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Events Management</h1>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Event
          </button>
        )}
      </div>

      <div className="dashboard-grid" style={{ paddingTop: 0 }}>
        {events.map((event, index) => (
          <div key={event.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ 
              height: 8, 
              background: `linear-gradient(90deg, #6366f1, #ec4899)` 
            }} />
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: 16 }}>
                <div style={{ 
                  width: 48, height: 48, 
                  borderRadius: 12, 
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24
                }}>
                  {eventIcons[index % eventIcons.length]}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 4 }}>{event.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{event.description}</p>
                </div>
              </div>

              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 12, marginTop: 16 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <MapPin size={14} />
                  {event.building}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Calendar size={14} />
                  {event.date}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Clock size={14} />
                  {event.time}
                </div>
              </div>

              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setEditingEvent(event)
                      setFormData(event)
                      setShowModal(true)
                    }}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    style={{ flex: 1 }}
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="empty-state">
          <Calendar size={64} />
          <h3>No Events Yet</h3>
          <p>Create your first event to get started</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditingEvent(null); }}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Building</label>
                <select
                  className="form-select"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  required
                >
                  <option value="">Select building</option>
                  {markers.map((marker) => (
                    <option key={marker.id} value={marker.name}>{marker.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  placeholder="Enter event description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingEvent(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
