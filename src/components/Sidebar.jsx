import { MapPin, LayoutDashboard, Building2, Users, LogOut, PenTool, ClipboardList, Clock, GraduationCap, BookOpen, Settings, Sparkles } from 'lucide-react'

export default function Sidebar({ currentPage, onNavigate, user, onLogout, sidebarOpen, setSidebarOpen }) {
  const role = user?.role
  
  const menuItems = [
    { id: 'map', label: 'Campus Map', icon: MapPin },
    { id: 'student-dashboard', label: 'My Dashboard', icon: GraduationCap, roles: ['user'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'instructor'] },
    { id: 'mapbuilder', label: 'Map Builder', icon: PenTool, roles: ['admin'] },
    { id: 'buildings', label: 'Buildings', icon: Building2, roles: ['admin'] },
    { id: 'academic', label: 'Academic Setup', icon: ClipboardList, roles: ['admin'] },
    { id: 'schedule', label: 'My Schedule', icon: Clock, roles: ['instructor'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['admin'] },
  ]

  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(role)
  )

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || 'U'

  const handleNav = (id) => {
    onNavigate(id)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const getRoleBadgeColor = () => {
    switch(role) {
      case 'admin': return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
      case 'instructor': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      default: return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    }
  }

  return (
    <>
      <div className={`glass sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
            animation: 'sidebarLogoGlow 2s ease-in-out infinite',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              animation: 'shimmer 3s ease-in-out infinite',
            }} />
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Navly Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          <div className="logo-text">
            <h1>Navly</h1>
            <span>Campus Navigator</span>
          </div>
        </div>

        <nav className="nav-menu">
          {filteredItems.map((item, index) => (
            <a
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
              style={{
                animation: `navSlideIn 0.4s ease-out ${index * 0.05}s forwards`,
                opacity: 0,
                transform: 'translateX(-10px)'
              }}
            >
              <item.icon />
              <span>{item.label}</span>
              {currentPage === item.id && (
                <Sparkles size={14} style={{ marginLeft: 'auto', color: '#a5b4fc' }} />
              )}
            </a>
          ))}
        </nav>

        <style>{`
          @keyframes sidebarLogoGlow {
            0%, 100% { 
              box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset;
            }
            50% { 
              box-shadow: 0 8px 32px rgba(139, 92, 246, 0.7), 0 0 20px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.15) inset;
            }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50%, 100% { transform: translateX(100%); }
          }
          @keyframes navSlideIn {
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>

        <div className="search-box" style={{ padding: 0 }}>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <h4 style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.5 }}>Quick Actions</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div 
                onClick={() => handleNav('map')}
                style={{ 
                  padding: 14, 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  borderRadius: 12, 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                }}
              >
                <MapPin size={18} color="#6366f1" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Explore</span>
              </div>
              <div 
                onClick={() => handleNav('dashboard')}
                style={{ 
                  padding: 14, 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  borderRadius: 12, 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                }}
              >
                <LayoutDashboard size={18} color="#8b5cf6" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#6366f1', boxShadow: '0 0 10px #6366f1' }}></div>
            <span>Academic</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }}></div>
            <span>Facility</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
            <span>Residential</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}></div>
            <span>Admin</span>
          </div>
        </div>

        <div className="user-info">
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: getRoleBadgeColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            {initials}
          </div>
          <div className="user-details">
            <h4>{user?.name || 'User'}</h4>
            <span style={{
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: '0.65rem',
              background: getRoleBadgeColor(),
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {user?.role}
            </span>
          </div>
          <button 
            className="btn btn-sm btn-secondary" 
            onClick={onLogout}
            style={{ 
              marginLeft: 'auto', 
              padding: 10,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  )
}
