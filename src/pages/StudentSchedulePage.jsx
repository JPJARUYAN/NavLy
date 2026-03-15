import { useState, useEffect, useMemo } from 'react'
import { Clock, Users, Calendar, MapPin, GraduationCap, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function StudentSchedulePage({ user, onNavigate }) {
  const schedules = useStore((state) => state.schedules)
  const courses = useStore((state) => state.courses)
  const students = useStore((state) => state.students)
  const instructors = useStore((state) => state.instructors)
  const enrollCourse = useStore((state) => state.enrollCourse)
  const dropCourse = useStore((state) => state.dropCourse)
  
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [refresh, setRefresh] = useState(0)
  
  const studentFromStore = students.find(s => 
    String(s.studentId) === String(user?.studentId) || 
    s.email === user?.email ||
    s.name === user?.name
  )
  
  useEffect(() => {
    setRefresh(r => r + 1)
  }, [students])
  
  const studentInfo = { ...user, ...studentFromStore }
  const enrolledCourseIds = studentInfo?.enrolledCourses || []
  const program = studentInfo?.course || studentInfo?.department || ''
  const year = studentInfo?.year || 1
  
  const enrolledCourses = useMemo(() => {
    return enrolledCourseIds.map(id => courses.find(c => c.id === id)).filter(Boolean)
  }, [enrolledCourseIds, courses])
  
  const getSchedule = (courseCode) => schedules.find(s => s.course === courseCode)
  const getInstructor = (courseCode) => {
    const sched = getSchedule(courseCode)
    return instructors.find(i => i.name === sched?.instructor)
  }
  
  const getClassmates = (courseCode) => {
    return students.filter(s => 
      s.id !== studentInfo?.id && 
      s.enrolledCourses?.some(ec => {
        const c = courses.find(c => c.id === ec)
        return c?.code === courseCode
      })
    )
  }
  
  const handleEnroll = (courseId) => {
    enrollCourse(studentInfo.id, courseId)
    setShowEnrollModal(false)
    setTimeout(() => setRefresh(r => r + 1), 100)
  }
  
  const handleDrop = (courseId) => {
    dropCourse(studentInfo.id, courseId)
    setTimeout(() => setRefresh(r => r + 1), 100)
  }
  
  const handleNavigateToRoom = () => {
    if (onNavigate) onNavigate('map')
  }
  
  const availableCourses = useMemo(() => {
    return courses.filter(c => {
      const isEnrolled = enrolledCourseIds.includes(c.id)
      const isSameProgram = c.code.startsWith(program)
      const isSameYear = c.year === year
      return !isEnrolled && isSameProgram && isSameYear
    }).sort((a, b) => a.semester - b.semester)
  }, [enrolledCourseIds, courses, program, year])

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  const getMySchedules = () => {
    return enrolledCourses.map(course => {
      const schedule = getSchedule(course.code)
      return { course, schedule }
    }).filter(item => item.schedule)
  }
  
  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = getMySchedules().filter(item => item.schedule?.day === day)
    return acc
  }, {})

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Subjects</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            Program: <strong>{program}</strong> • Year: <strong>{year}</strong> • {enrolledCourses.length} subject{enrolledCourses.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowEnrollModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} /> Add Subject
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 600 }}>
            <Calendar size={20} />
            My Class Schedule
          </h3>
          
          {enrolledCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p>No subjects enrolled yet</p>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowEnrollModal(true)}
                style={{ marginTop: 16 }}
              >
                <Plus size={18} style={{ marginRight: 8 }} /> Enroll Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {days.map(day => (
                groupedByDay[day]?.length > 0 && (
                  <div key={day} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></span>
                      {day}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                      {groupedByDay[day].map(({ course, schedule }) => {
                        if (!schedule) return null
                        const instructor = getInstructor(course.code)
                        const isSelected = selectedSchedule?.course === course.code
                        return (
                          <div 
                            key={course.id}
                            onClick={() => setSelectedSchedule(schedule)}
                            style={{ 
                              padding: 16, 
                              background: isSelected ? 'var(--primary)' : 'var(--bg)',
                              color: isSelected ? 'white' : 'var(--text)',
                              borderRadius: 10,
                              cursor: 'pointer',
                              border: isSelected ? 'none' : '1px solid var(--border)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{course.code}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{course.name}</div>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDrop(course.id); }}
                                style={{ background: '#ef4444', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: 'white' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', opacity: 0.9 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={14} /> {schedule.startTime} - {schedule.endTime}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Users size={14} /> {instructor?.name || 'TBA'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleNavigateToRoom(); }}>
                                <MapPin size={14} /> {schedule.room}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 600 }}>
            <Users size={20} />
            {selectedSchedule ? `Classmates in ${selectedSchedule.course}` : 'Select a Subject'}
          </h3>
          
          {!selectedSchedule ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: '0.9rem' }}>Select a subject to view classmates</p>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--primary)', color: 'white', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedSchedule.course}</div>
                <div style={{ fontSize: '0.8rem', marginTop: 8, display: 'flex', gap: 16, opacity: 0.9 }}>
                  <span><Calendar size={12} /> {selectedSchedule.day}</span>
                  <span><Clock size={12} /> {selectedSchedule.startTime}-{selectedSchedule.endTime}</span>
                  <span><MapPin size={12} /> {selectedSchedule.room}</span>
                </div>
              </div>
              
              {(() => {
                const classmates = getClassmates(selectedSchedule.course)
                if (classmates.length === 0) {
                  return <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No classmates yet</div>
                }
                return (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Student</th>
                          <th style={{ textAlign: 'left', padding: 8 }}>Yr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classmates.map(student => (
                          <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: 10 }}><span className="badge badge-academic">{student.studentId}</span></td>
                            <td style={{ padding: 10, fontWeight: 500 }}>{student.name}</td>
                            <td style={{ padding: 10 }}>{student.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>

      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal-content glass" style={{ maxWidth: 600, maxHeight: '80vh', overflow: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Add Subject</h2>
              <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            
            {availableCourses.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                {enrolledCourses.length === 0 ? 'No subjects available' : 'All subjects enrolled'}
              </p>
            ) : (
              [1, 2].map(semester => {
                const semCourses = availableCourses.filter(c => c.semester === semester)
                if (semCourses.length === 0) return null
                return (
                  <div key={semester}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>Semester {semester}</h4>
                    {semCourses.map(course => {
                      const schedule = getSchedule(course.code)
                      return (
                        <div key={course.id} style={{ padding: 16, background: 'var(--bg)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{course.code}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{course.name}</div>
                              <div style={{ fontSize: '0.8rem', marginTop: 4, color: 'var(--text-muted)' }}>
                                {course.units} units • {schedule ? `${schedule.day} ${schedule.startTime}-${schedule.endTime} ${schedule.room}` : 'No schedule'}
                              </div>
                            </div>
                            <button className="btn btn-primary" onClick={() => handleEnroll(course.id)} style={{ padding: '8px 16px' }}>
                              <Plus size={14} /> Add
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
