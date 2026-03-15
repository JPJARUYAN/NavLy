import { useState } from 'react'
import { Users, Plus, Edit, Trash2, Search, Shield, BookOpen, GraduationCap } from 'lucide-react'

const mockUsers = [
  { id: 1, name: 'John Smith', email: 'john.smith@umdc.edu', role: 'admin', status: 'active' },
  { id: 2, name: 'Sarah Johnson', email: 'sarah.j@umdc.edu', role: 'instructor', status: 'active' },
  { id: 3, name: 'Mike Davis', email: 'mike.d@umdc.edu', role: 'instructor', status: 'active' },
  { id: 4, name: 'Emily Brown', email: 'emily.b@umdc.edu', role: 'user', status: 'active' },
  { id: 5, name: 'Chris Wilson', email: 'chris.w@umdc.edu', role: 'user', status: 'active' },
  { id: 6, name: 'Amanda Lee', email: 'amanda.l@umdc.edu', role: 'user', status: 'inactive' },
]

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState(mockUsers)

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const roleIcons = {
    admin: Shield,
    instructor: BookOpen,
    user: GraduationCap
  }

  const roleColors = {
    admin: '#ef4444',
    instructor: '#f59e0b',
    user: '#10b981'
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
    { label: 'Administrators', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: '#ef4444' },
    { label: 'Instructors', value: users.filter(u => u.role === 'instructor').length, icon: BookOpen, color: '#f59e0b' },
    { label: 'Students', value: users.filter(u => u.role === 'user').length, icon: GraduationCap, color: '#10b981' },
  ]

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>User Management</h1>
        <button className="btn btn-primary">
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="dashboard-grid" style={{ paddingTop: 0 }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card dashboard-card">
            <h3>{stat.label}</h3>
            <div className="value" style={{ color: stat.color }}>
              <stat.icon style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="glass" style={{ margin: '0 24px', padding: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search users..."
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
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role]
                return (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 40, height: 40, borderRadius: 10,
                          background: `linear-gradient(135deg, ${roleColors[user.role]}, transparent)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <span style={{ fontWeight: 600 }}>{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RoleIcon size={16} style={{ color: roleColors[user.role] }} />
                        <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge`} style={{ 
                        background: user.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: user.status === 'active' ? '#34d399' : '#f87171'
                      }}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm">
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
