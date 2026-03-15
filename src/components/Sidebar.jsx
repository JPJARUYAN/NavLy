import { useState } from 'react'
import { MapPin, LayoutDashboard, Building2, Users, LogOut, PenTool, ClipboardList, Menu, X, Clock, GraduationCap, BookOpen, Settings, Sparkles } from 'lucide-react'

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
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1001,
          display: 'none',
          padding: 12,
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
        }}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`glass sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            animation: 'logoGlow 3s ease-in-out infinite'
          }}>
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4C22.06 4 14 12.06 14 22C14 35 32 60 32 60C32 60 50 35 50 22C50 12.06 41.94 4 32 4Z" fill="#6366f1"/>
              <path d="M32 8C24.82 8 19 13.82 19 21C19 31 32 52 32 52C32 52 45 31 45 21C45 13.82 39.18 8 32 8Z" fill="#8b5cf6"/>
              <ellipse cx="25" cy="20" rx="3" ry="4" fill="white"/>
              <ellipse cx="39" cy="20" rx="3" ry="4" fill="white"/>
              <path d="M24 28C26 30 30 32 32 32C34 32 38 30 40 28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M22 6H42V14C42 14 42 20 32 20C22 20 22 14 22 14V6Z" fill="#1f2937"/>
              <path d="M26 2H38L42 14H22L26 2Z" fill="#1f2937"/>
              <rect x="28" y="0" width="8" height="4" rx="1" fill="#fbbf24"/>
              <circle cx="32" cy="8" r="2" fill="#fbbf24"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>NavLy</h1>
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
          @keyframes logoGlow {
            0%, 100% { box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4); }
            50% { box-shadow: 0 8px 32px rgba(139, 92, 246, 0.6); }
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
