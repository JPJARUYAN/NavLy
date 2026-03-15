import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CampusPage from './pages/CampusPage'
import MapBuilderPage from './pages/MapBuilderPage'
import BuildingsPage from './pages/BuildingsPage'
import UsersPage from './pages/UsersPage'
import AcademicPage from './pages/AcademicPage'
import EnrollmentPage from './pages/EnrollmentPage'
import InstructorSchedulePage from './pages/InstructorSchedulePage'
import StudentDashboardPage from './pages/StudentDashboardPage'

function App() {
  const [user, setUser] = useState(null)
  const [currentPage, setCurrentPage] = useState('map')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogin = (account) => {
    setUser(account)
    setCurrentPage(account.role === 'user' ? 'student-dashboard' : 'dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentPage('map')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'map':
        return <CampusPage />
      case 'mapbuilder':
        return <MapBuilderPage />
      case 'events':
        return <EventsPage user={user} />
      case 'buildings':
        return <BuildingsPage />
      case 'users':
        return <UsersPage />
      case 'academic':
        return <AcademicPage user={user} />
      case 'schedule':
        return <InstructorSchedulePage user={user} />
      case 'enrollment':
        return <EnrollmentPage user={user} />
      case 'student-dashboard':
        return <StudentDashboardPage user={user} />
      default:
        return <CampusPage />
    }
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const sidebarWidth = isMobile ? '100%' : 320
  const mainMarginLeft = isMobile ? 0 : 320

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        user={user}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      {isMobile && sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
            display: isMobile ? 'block' : 'none'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{ 
            marginLeft: mainMarginLeft, 
            width: `calc(100% - ${mainMarginLeft}px)`, 
            height: '100vh', 
            overflow: currentPage === 'mapbuilder' ? 'hidden' : 'auto',
            paddingTop: isMobile ? 60 : 0
          }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default App
