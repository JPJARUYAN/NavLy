import { useState } from 'react'
import { Clock, Users, BookOpen, Calendar, MapPin, GraduationCap } from 'lucide-react'
import { useStore } from '../store/useStore'

export default function InstructorSchedulePage({ user }) {
  const schedules = useStore((state) => state.schedules)
  const courses = useStore((state) => state.courses)
  const students = useStore((state) => state.students)
  const rooms = useStore((state) => state.rooms)
  const instructors = useStore((state) => state.instructors)
  
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  
  const instructorName = user?.name || user?.email
  
  const mySchedules = schedules.filter(s => 
    s.instructor?.toLowerCase().includes(instructorName?.toLowerCase().split(' ')[0] || '')
  )
  
  const getCourseDetails = (courseCode) => {
    return courses.find(c => c.code === courseCode)
  }
  
  const getEnrolledStudents = (courseCode) => {
    return students.filter(s => 
      s.enrolledCourses?.some(ec => {
        const enrolledCourse = courses.find(c => c.id === ec)
        return enrolledCourse?.code === courseCode
      })
    )
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = mySchedules.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
    return acc
  }, {})

  return (
    <div className="page-container" style={{ padding: 24 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Schedule</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
          {mySchedules.length} subject{mySchedules.length !== 1 ? 's' : ''} assigned this semester
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 600 }}>
            <Calendar size={20} />
            Weekly Class Schedule
          </h3>
          
          {mySchedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p>No schedules assigned yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {days.map(day => (
                groupedByDay[day]?.length > 0 && (
                  <div key={day} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ 
                        width: 8, height: 8, borderRadius: '50%', 
                        background: 'var(--primary)' 
                      }}></span>
                      {day}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {groupedByDay[day].map(schedule => {
                        const course = getCourseDetails(schedule.course)
                        const enrolledCount = getEnrolledStudents(schedule.course).length
                        const isSelected = selectedSchedule?.id === schedule.id
                        return (
                          <div 
                            key={schedule.id}
                            onClick={() => setSelectedSchedule(schedule)}
                            style={{ 
                              padding: 16, 
                              background: isSelected ? 'var(--primary)' : 'var(--bg)',
                              color: isSelected ? 'white' : 'var(--text)',
                              borderRadius: 10,
                              cursor: 'pointer',
                              border: isSelected ? 'none' : '1px solid var(--border)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{schedule.course}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{course?.name}</div>
                              </div>
                              <div style={{ 
                                background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--primary)', 
                                padding: '4px 10px', 
                                borderRadius: 20,
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}>
                                {enrolledCount} student{enrolledCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', opacity: 0.9 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={14} />
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin size={14} />
                                {schedule.room}
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
            Enrolled Students
          </h3>
          
          {!selectedSchedule ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <GraduationCap size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: '0.9rem' }}>Select a class to view students</p>
            </div>
          ) : (
            <div>
              <div style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: '12px 16px', 
                borderRadius: 8,
                marginBottom: 16 
              }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedSchedule.course}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  {getCourseDetails(selectedSchedule.course)?.name}
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: 8, display: 'flex', gap: 16, opacity: 0.9 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {selectedSchedule.day}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {selectedSchedule.startTime} - {selectedSchedule.endTime}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {selectedSchedule.room}
                  </span>
                </div>
              </div>
              
              {(() => {
                const enrolledStudents = getEnrolledStudents(selectedSchedule.course)
                if (enrolledStudents.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p style={{ fontSize: '0.85rem' }}>No students enrolled</p>
                    </div>
                  )
                }
                return (
                  <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-muted)' }}>ID</th>
                          <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-muted)' }}>Student</th>
                          <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-muted)' }}>Yr</th>
                          <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-muted)' }}>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrolledStudents.map(student => (
                          <tr key={student.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 4px' }}>
                              <span className="badge badge-academic" style={{ fontSize: '0.7rem' }}>
                                {student.studentId}
                              </span>
                            </td>
                            <td style={{ padding: '10px 4px', fontWeight: 500 }}>{student.name}</td>
                            <td style={{ padding: '10px 4px' }}>{student.year}</td>
                            <td style={{ padding: '10px 4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {student.assignedRoom || '-'}
                            </td>
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
    </div>
  )
}
