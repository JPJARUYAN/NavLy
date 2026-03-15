import { useState } from 'react'
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function BuildingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const markers = useStore((state) => state.markers)

  const filteredBuildings = markers.filter(building =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const typeColors = {
    academic: '#4f46e5',
    facility: '#0891b2',
    residential: '#059669',
    admin: '#ea580c'
  }

  const stats = [
    { type: 'Academic', count: markers.filter(b => b.type === 'academic').length, color: '#4f46e5' },
    { type: 'Facility', count: markers.filter(b => b.type === 'facility').length, color: '#0891b2' },
    { type: 'Residential', count: markers.filter(b => b.type === 'residential').length, color: '#059669' },
    { type: 'Admin', count: markers.filter(b => b.type === 'admin').length, color: '#ea580c' },
  ]

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Buildings Management</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add Building
        </button>
      </div>

      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {stats.map((stat, i) => (
            <div key={i} className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.count}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.type} Buildings</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass" style={{ margin: '0 24px', padding: 20 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search buildings..."
              style={{ paddingLeft: 48 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Building Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Coordinates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuildings.map((building) => (
                <tr key={building.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 12, height: 12, borderRadius: 4, 
                        background: typeColors[building.type] 
                      }}></div>
                      <span style={{ fontWeight: 500 }}>{building.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${building.type}`}>
                      {building.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {building.description}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    [{building.position[0]}, {building.position[2]}]
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm">
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
