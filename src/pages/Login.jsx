import { useState, useEffect } from 'react'
import { MapPin, GraduationCap, Shield, BookOpen, UserPlus, LogIn, ChevronRight, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'

const digosCityBarangays = [
  "Aplaya", "Balabag", "Benglen", "Camanse", "Cohen", "Dedicated",
  "Dulangan", "Goma", "Guisi", "Ibo", "Igat", "Kapatagan", "Lapu-Lapu",
  "Luna", "Magsaysay", "Mahayahay", "Malinao", "Matti", "Palo", "Poblacion",
  "Ramon Magsaysay", "Rica", "San Jose", "San Miguel", "San Roque", "Santa Cruz",
  "Sinaragan", "Talog", "Tampakan", "Tuban", "Tulunan", "Vidad", "Wangan"
]

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({})
  const [loaded, setLoaded] = useState(false)
  const { login, addAccount, getAccountByEmail, initializeAccounts, departments, courses, programs } = useStore()

  useEffect(() => {
    setLoaded(true)
    initializeAccounts()
  }, [])

  const getProgramsByCategory = (category) => {
    return programs
      .filter(p => p.category === category)
      .map(p => `${p.code} - ${p.name}`)
  }

  const getCategories = () => {
    const categories = [...new Set(programs.map(p => p.category))]
    return categories
  }

  const getCourseCode = (major) => {
    return major.split(' - ')[0]
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    
    if (!email) {
      setError('Please enter your ID number')
      return
    }
    
    if (role === 'admin' && !password) {
      setError('Please enter your password')
      return
    }
    
    const loginData = role === 'user' ? { course: formData?.course } : role === 'instructor' ? { department: formData?.department } : {}
    const account = login(email, password, role, loginData)
    
    if (account) {
      onLogin({ ...account })
    } else {
      setError('Invalid credentials. Please check your ID.')
    }
  }

  const handleCreateAccount = (e) => {
    e.preventDefault()
    setError('')
    
    const { firstName, middleName, lastName, studentId, teacherId, course, department, age, address, major, college } = formData
    
    if (!firstName || !lastName) {
      setError('Please enter your full name')
      return
    }
    
    if (!age) {
      setError('Please enter your age')
      return
    }
    
    if (!address) {
      setError('Please select your address')
      return
    }

    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim()
    
    if (role === 'user') {
      if (!studentId) {
        setError('Please enter your Student ID Number')
        return
      }
      if (!college) {
        setError('Please select a program category')
        return
      }
      if (!major) {
        setError('Please select your major')
        return
      }
      if (!formData.year) {
        setError('Please select your year')
        return
      }
      
      const courseCode = getCourseCode(major)
      const courseInfo = courses.find(c => c.code.startsWith(courseCode))
      
      addAccount({ 
        email: '', 
        password: '', 
        name: fullName, 
        role: 'user', 
        studentId: studentId,
        department: courseInfo?.department || '',
        course: courseCode,
        major: major,
        college: college,
        year: formData.year,
        studentType: 'new',
        age: age,
        address: address,
        personalInfo: {
          firstName,
          middleName,
          lastName,
          age,
          address
        }
      })
    } else if (role === 'instructor') {
      if (!teacherId) {
        setError('Please enter your Teacher ID Number')
        return
      }
      if (!department) {
        setError('Please select your department')
        return
      }
      
      addAccount({ 
        email: '', 
        password: '', 
        name: fullName, 
        role: 'instructor', 
        teacherId: teacherId,
        department: department,
        position: 'Ms',
        age: age,
        address: address,
        personalInfo: {
          firstName,
          middleName,
          lastName,
          age,
          address
        }
      })
    }
    
    setMode('login')
    setEmail('')
    setPassword('')
    setName('')
    setFormData({})
    setError('Account created! Please login.')
  }

  const demoLogin = (roleId) => {
    const accounts = useStore.getState().accounts
    let account = null
    
    if (roleId === 'admin') {
      account = accounts?.find(a => a.role === 'admin')
    } else if (roleId === 'instructor') {
      account = accounts?.find(a => a.role === 'instructor')
    } else if (roleId === 'user') {
      account = accounts?.find(a => a.role === 'user')
    }
    
    if (account) {
      onLogin({ ...account })
    }
  }

  const roles = [
    { id: 'admin', label: 'Administrator', icon: Shield, color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
    { id: 'instructor', label: 'Teacher', icon: BookOpen, color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    { id: 'user', label: 'Student', icon: GraduationCap, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
  ]

  return (
    <div className="login-container">
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: 250,
        height: 250,
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 5s ease-in-out infinite 2s',
        pointerEvents: 'none'
      }} />
      
      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            background: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'][i % 5],
            borderRadius: '50%',
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            animation: `float ${3 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.4,
            pointerEvents: 'none'
          }}
        />
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(180deg); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="glass login-box" style={{ 
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div className="login-logo">
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            borderRadius: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)',
            animation: 'pulse 3s ease-in-out infinite'
          }}>
            <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 4C22.06 4 14 12.06 14 22C14 35 32 60 32 60C32 60 50 35 50 22C50 12.06 41.94 4 32 4Z" fill="url(#paint0_linear)"/>
              <path d="M32 8C24.82 8 19 13.82 19 21C19 31 32 52 32 52C32 52 45 31 45 21C45 13.82 39.18 8 32 8Z" fill="url(#paint1_linear)"/>
              <ellipse cx="25" cy="20" rx="3" ry="4" fill="white"/>
              <ellipse cx="39" cy="20" rx="3" ry="4" fill="white"/>
              <path d="M24 28C26 30 30 32 32 32C34 32 38 30 40 28" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M22 6H42V14C42 14 42 20 32 20C22 20 22 14 22 14V6Z" fill="#1f2937"/>
              <path d="M26 2H38L42 14H22L26 2Z" fill="#1f2937"/>
              <rect x="28" y="0" width="8" height="4" rx="1" fill="#fbbf24"/>
              <circle cx="32" cy="8" r="2" fill="#fbbf24"/>
              <defs>
                <linearGradient id="paint0_linear" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="32" y1="8" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8b5cf6"/>
                  <stop offset="1" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 style={{ animation: 'slideInUp 0.5s ease-out 0.2s forwards', opacity: 0 }}>NavLy</h1>
          <p style={{ animation: 'slideInUp 0.5s ease-out 0.3s forwards', opacity: 0 }}>Campus Navigator</p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ animation: 'slideInUp 0.5s ease-out 0.4s forwards', opacity: 0 }}>
            <div style={{ marginBottom: 20 }}>
              <select
                value={role}
                onChange={(e) => { setRole(e.target.value); setError(''); }}
                style={{ 
                  width: '100%', 
                  padding: '16px 20px', 
                  borderRadius: 14, 
                  border: '1px solid var(--glass-border)', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--text)', 
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <option value="user">Student</option>
                <option value="instructor">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {role === 'admin' ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="email"
                    placeholder="Official Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '16px 20px', 
                      borderRadius: 14, 
                      border: '1px solid var(--glass-border)', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'var(--text)', 
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '16px 20px', 
                      borderRadius: 14, 
                      border: '1px solid var(--glass-border)', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'var(--text)', 
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </>
            ) : role === 'user' ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Student ID Number (e.g., 24001)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={5}
                    style={{ 
                      width: '100%', 
                      padding: '16px 20px', 
                      borderRadius: 14, 
                      border: '1px solid var(--glass-border)', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'var(--text)', 
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="Teacher ID Number (e.g., T0001)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '16px 20px', 
                      borderRadius: 14, 
                      border: '1px solid var(--glass-border)', 
                      background: 'rgba(255,255,255,0.05)', 
                      color: 'var(--text)', 
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>
              </>
            )}
            
            {error && (
              <div style={{ 
                color: '#ef4444', 
                fontSize: '0.85rem', 
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 10,
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {error}
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: '1rem', borderRadius: 14 }}>
              <LogIn size={20} />
              Sign In as {role === 'user' ? 'Student' : role === 'instructor' ? 'Teacher' : 'Administrator'}
            </button>

            <div style={{ textAlign: 'center', margin: '24px 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={14} /> or use demo account
              </span>
            </div>

            <div className="login-options">
              {roles.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  className={`login-btn ${r.id}`}
                  onClick={() => demoLogin(r.id)}
                  style={{ animation: `slideInUp 0.4s ease-out ${0.5 + i * 0.1}s forwards`, opacity: 0 }}
                >
                  <div className="icon" style={{ background: r.color }}>
                    <r.icon size={20} color="white" />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Demo Login</div>
                  </div>
                  <ChevronRight size={20} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </button>
              ))}
            </div>

            <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setMode('register'); setError(''); setFormData({}); setRole('user') }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#6366f1', 
                  cursor: 'pointer', 
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                Register Here <ChevronRight size={16} />
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount} style={{ animation: 'slideInUp 0.5s ease-out forwards', opacity: 0 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 10, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Account Type</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`btn ${role === 'user' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRole('user')}
                  style={{ flex: 1, padding: 14, borderRadius: 12 }}
                >
                  <GraduationCap size={18} /> Student
                </button>
                <button
                  type="button"
                  className={`btn ${role === 'instructor' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRole('instructor')}
                  style={{ flex: 1, padding: 14, borderRadius: 12 }}
                >
                  <BookOpen size={18} /> Teacher
                </button>
              </div>
            </div>

            {role === 'user' ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Student ID Number (e.g., 24001)"
                    value={formData?.studentId || ''}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    maxLength={5}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <select
                    value={formData?.college || ''}
                    onChange={(e) => setFormData({...formData, college: e.target.value, major: ''})}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                  >
                    <option value="">Select Program Category</option>
                    {getCategories().map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {formData?.college && (
                  <div style={{ marginBottom: 14 }}>
                    <select
                      value={formData?.major || ''}
                      onChange={(e) => setFormData({...formData, major: e.target.value, course: getCourseCode(e.target.value)})}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                    >
                      <option value="">Select Program</option>
                      {getProgramsByCategory(formData.college).map((prog) => (
                        <option key={prog} value={prog}>{prog}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <select
                    value={formData?.year || ''}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder="Teacher ID Number (e.g., T0001)"
                    value={formData?.teacherId || ''}
                    onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <select
                    value={formData?.department || ''}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.code}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: '#6366f1' }}>Personal Information</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData?.firstName || ''}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={formData?.middleName || ''}
                  onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData?.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Age"
                  value={formData?.age || ''}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <select
                value={formData?.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: '0.95rem' }}
              >
                <option value="">Select Address (Barangay, Digos City)</option>
                {digosCityBarangays.map((barangay) => (
                  <option key={barangay} value={`${barangay}, Digos City`}>{barangay}, Digos City</option>
                ))}
              </select>
            </div>

            {error && (
              <div style={{ 
                color: '#ef4444', 
                fontSize: '0.85rem', 
                marginBottom: 16,
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 10,
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                {error}
              </div>
            )}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: '1rem', borderRadius: 14 }}>
              <UserPlus size={20} />
              Register as {role === 'user' ? 'Student' : 'Teacher'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => { setMode('login'); setError('') }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Sign In <ChevronRight size={16} />
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
