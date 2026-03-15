import { Building2, Users, BookOpen, Calendar, Clock, MapPin, GraduationCap, UserCheck, DoorOpen, TrendingUp, Bell, ChevronRight, Activity, Sun, Moon, Droplets, Wind, Eye, Edit, Trash2, Plus, Search, Filter, MoreVertical } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useState, useEffect } from 'react'

export default function Dashboard({ user }) {
  const markers = useStore((state) => state.markers)
  const events = useStore((state) => state.events)
  const students = useStore((state) => state.students)
  const instructors = useStore((state) => state.instructors)
  const courses = useStore((state) => state.courses)
  const schedules = useStore((state) => state.schedules)
  const semesters = useStore((state) => state.semesters)
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loaded, setLoaded] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    setLoaded(true)
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const today = currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' })
  const todaySchedules = schedules.filter(s => s.day === dayOfWeek)
  
  const activeSemester = semesters.find(s => s.status === 'active')
  const activeStudents = students.filter(s => s.status === 'active')
  const totalRooms = markers.reduce((acc, b) => acc + (b.floors?.reduce((fAcc, f) => fAcc + (f.rooms?.length || 0), 0) || 0), 0)

  const roleNames = {
    admin: 'Administrator',
    instructor: 'Instructor',
    user: 'Student'
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const statsData = [
    { label: 'Total Students', value: activeStudents.length, icon: GraduationCap, color: '#8b5cf6', bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', change: '+12%' },
    { label: 'Instructors', value: instructors.length, icon: UserCheck, color: '#06b6d4', bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', change: '+3%' },
    { label: 'Courses', value: courses.length, icon: BookOpen, color: '#10b981', bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', change: '+5%' },
    { label: 'Classrooms', value: totalRooms, icon: DoorOpen, color: '#f59e0b', bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', change: '+8%' },
  ]

  const quickActions = [
    { label: 'View Map', icon: MapPin, color: '#6366f1', action: 'map' },
    { label: 'Add Building', icon: Plus, color: '#10b981', action: 'building' },
    { label: 'Schedule', icon: Calendar, color: '#ec4899', action: 'schedule' },
    { label: 'Reports', icon: TrendingUp, color: '#8b5cf6', action: 'reports' },
  ]

  return (
    <div className="main-content" style={{ 
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: -50,
        left: -50,
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite 2s',
        pointerEvents: 'none'
      }} />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: ['#6366f1', '#10b981', '#ec4899', '#f59e0b', '#06b6d4'][i % 5],
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.5,
            pointerEvents: 'none'
          }}
        />
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide { animation: slideIn 0.5s ease-out forwards; }
        .animate-fade { animation: fadeIn 0.5s ease-out forwards; }
        .animate-scale { animation: scaleIn 0.5s ease-out forwards; }
      `}</style>

      <div className="page-header" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 16 }}>
          <div className="animate-slide" style={{ opacity: 0 }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 4
            }}>
              {getGreeting()}, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}>
              <Calendar size={14} /> {today}
            </p>
          </div>
          
          <div className="animate-fade" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: 0 }}>
            {/* Live Clock */}
            <div className="glass" style={{ 
              padding: '12px 20px', 
              borderRadius: 16, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)'
            }}>
              <div style={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'monospace', letterSpacing: 2 }}>
                  {timeString}
                </div>
              </div>
            </div>

            {/* Semester Badge */}
            <div className="glass" style={{ 
              padding: '10px 16px', 
              borderRadius: 12,
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: 'rgba(99, 102, 241, 0.1)'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>{activeSemester?.name || 'Current Semester'}</span>
            </div>

            {/* Role Badge */}
            <div style={{
              padding: '8px 16px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1
            }}>
              {roleNames[user?.role]}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-slide" style={{ padding: '0 24px', marginBottom: 24, opacity: 0, animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {quickActions.map((action, i) => (
            <button
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: hoveredCard === i ? action.color : 'rgba(255,255,255,0.05)',
                color: hoveredCard === i ? '#fff' : 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredCard === i ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hoveredCard === i ? `0 8px 25px ${action.color}40` : 'none'
              }}
            >
              <action.icon size={18} />
              <span style={{ fontWeight: 500 }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-grid" style={{ padding: '0 24px' }}>
        {statsData.map((stat, i) => (
          <div 
            key={i}
            className="glass-card animate-scale"
            onMouseEnter={() => setHoveredCard(`stat-${i}`)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ 
              opacity: 0, 
              animationDelay: `${0.1 * i}s`,
              padding: 24,
              borderRadius: 20,
              background: hoveredCard === `stat-${i}` 
                ? `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${hoveredCard === `stat-${i}` ? stat.color : 'rgba(255,255,255,0.05)'}`,
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Glow */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              background: `radial-gradient(circle, ${stat.color}30 0%, transparent 70%)`,
              borderRadius: '50%'
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                  {stat.label}
                </p>
                <div style={{ 
                  fontSize: '2.8rem', 
                  fontWeight: 800, 
                  background: stat.bgGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1
                }}>
                  {stat.value}
                </div>
              </div>
              <div style={{ 
                background: stat.bgGradient, 
                padding: 14, 
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 20px ${stat.color}40`
              }}>
                <stat.icon size={26} color="#fff" />
              </div>
            </div>
            <div style={{ 
              marginTop: 16, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              fontSize: '0.8rem',
              color: '#10b981'
            }}>
              <TrendingUp size={14} />
              <span>{stat.change} from last semester</span>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-slide" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, opacity: 0, animationDelay: '0.4s' }}>
        {/* Today's Schedule */}
        <div className="glass-card" style={{ 
          padding: 28, 
          borderRadius: 24,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12, fontSize: '1.2rem' }}>
              <div style={{
                padding: 10,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex'
              }}>
                <Clock size={20} color="#fff" />
              </div>
              Today's Schedule
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: 20, 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {todaySchedules.length} classes
              </span>
            </h3>
            <button style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.85rem'
            }}>
              View All <ChevronRight size={16} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {todaySchedules.length > 0 ? todaySchedules.slice(0, 4).map((schedule, i) => (
              <div key={schedule.id} 
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(8px)'
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
                style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: 18, 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 16,
                borderLeft: `4px solid ${['#6366f1', '#10b981', '#f59e0b', '#ec4899'][i % 4]}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ 
                  minWidth: 90,
                  paddingRight: 20,
                  borderRight: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{schedule.startTime}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{schedule.endTime}</div>
                </div>
                <div style={{ flex: 1, paddingLeft: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>{schedule.course}</div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                    {schedule.room} • {schedule.instructor}
                  </div>
                </div>
                <div style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  borderRadius: 20,
                  fontSize: '0.8rem',
                  color: '#a5b4fc'
                }}>
                  {schedule.day}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.4)' }}>
                <Calendar size={50} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p style={{ fontSize: '1.1rem' }}>No classes scheduled for today</p>
                <p style={{ fontSize: '0.9rem' }}>Enjoy your day off!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Upcoming Events */}
          <div className="glass-card" style={{ 
            padding: 24, 
            borderRadius: 24,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem' }}>
                <Bell size={20} style={{ color: '#f59e0b' }} />
                Upcoming Events
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {events.slice(0, 3).map((event, i) => (
                <div key={event.id} style={{ 
                  padding: 16, 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#10b981'][i % 3]} 0%, ${['#8b5cf6', '#f43f5e', '#059669'][i % 3]} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Calendar size={20} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {event.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{event.building}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>{event.date}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{event.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus Buildings */}
          <div className="glass-card" style={{ 
            padding: 24, 
            borderRadius: 24,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            flex: 1
          }}>
            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem' }}>
              <Building2 size={20} style={{ color: '#06b6d4' }}/>
              Campus Buildings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Academic', value: markers.filter(b => b.type === 'academic').length, color: '#8b5cf6', icon: BookOpen },
                { label: 'Facilities', value: markers.filter(b => b.type === 'facility').length, color: '#06b6d4', icon: Building2 },
                { label: 'Residential', value: markers.filter(b => b.type === 'residential').length, color: '#10b981', icon: Users },
                { label: 'Admin', value: markers.filter(b => b.type === 'admin').length, color: '#f59e0b', icon: DoorOpen },
              ].map((item, i) => (
                <div key={i} style={{ 
                  padding: 16, 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: 14,
                  textAlign: 'center',
                  borderTop: `3px solid ${item.color}`,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.background = `${item.color}15`
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
                >
                  <item.icon size={24} color={item.color} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Map Preview */}
      <div className="glass-card animate-slide" style={{ 
        margin: '0 24px 24px', 
        padding: 28, 
        borderRadius: 24,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        opacity: 0,
        animationDelay: '0.5s'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem' }}>
            <MapPin size={22} style={{ color: '#ec4899' }} />
            Campus Map Overview
          </h3>
          <button style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            Explore Map <ChevronRight size={18} />
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {markers.map((building, i) => (
            <div 
              key={building.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                padding: 14, 
                background: 'rgba(255,255,255,0.03)', 
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
                animation: `fadeIn 0.3s ease-out ${0.1 * i}s forwards`,
                opacity: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.boxShadow = `0 8px 25px ${building.color}30`
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ 
                width: 10, 
                height: 10, 
                borderRadius: 3, 
                background: building.color || '#6366f1',
                boxShadow: `0 0 10px ${building.color}60`,
                flexShrink: 0
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {building.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                  {building.type}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div style={{ 
        padding: '20px 24px', 
        background: 'rgba(0,0,0,0.3)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 20
      }}>
        {[
          { label: 'Total Buildings', value: markers.length, icon: Building2 },
          { label: 'Total Paths', value: 16, icon: MapPin },
          { label: 'Active Students', value: activeStudents.length, icon: GraduationCap },
          { label: 'Departments', value: 11, icon: BookOpen },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <item.icon size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{item.label}:</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
