import { useStore } from '../store/useStore'
import { BookOpen, Users, MapPin, GraduationCap, Clock, Building, User, Mail } from 'lucide-react'

export default function StudentDashboardPage({ user }) {
  const students = useStore((s) => s.students)
  const courses = useStore((s) => s.courses)
  const schedules = useStore((s) => s.schedules)
  const instructors = useStore((s) => s.instructors)

  const currentStudent = students.find((st) => st.studentId === user?.studentId || st.email === user?.email)

  if (!currentStudent) {
    return (
      <div style={{ padding: '24px', minHeight: '100vh' }}>
        <div className="glass" style={{ padding: '32px', textAlign: 'center', borderRadius: '12px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(239, 68, 68, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <User size={40} style={{ color: '#ef4444' }} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>No Student Data Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Your account is not properly registered as a student.</p>
        </div>
      </div>
    )
  }

  const enrolledCourses = courses.filter((c) => currentStudent.enrolledCourses?.includes(c.id))

  const getInstructorForCourse = (courseCode) => {
    const schedule = schedules.find((s) => s.course === courseCode)
    if (schedule?.instructor) {
      return instructors.find((i) => i.name === schedule.instructor)
    }
    return instructors.find((i) => i.specialties?.includes(courseCode))
  }

  const getClassmates = (courseId) => {
    return students.filter(
      (s) => s.id !== currentStudent.id && s.enrolledCourses?.includes(courseId)
    )
  }

  const getScheduleForCourse = (courseCode) => {
    return schedules.find((s) => s.course === courseCode)
  }

  const allClassmates = []
  enrolledCourses.forEach((course) => {
    const classmates = getClassmates(course.id)
    classmates.forEach((c) => {
      if (!allClassmates.find((ac) => ac.id === c.id)) {
        allClassmates.push({ ...c, courseCode: course.code })
      }
    })
  })
  const uniqueClassmates = [...new Map(allClassmates.map((c) => [c.id, c])).values()]

  const teacherMap = new Map()
  enrolledCourses.forEach((course) => {
    const instructor = getInstructorForCourse(course.code)
    if (instructor && !teacherMap.has(instructor.id)) {
      teacherMap.set(instructor.id, { instructor, courseCode: course.code })
    }
  })
  const teachers = Array.from(teacherMap.values())

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '4px' }}>My Dashboard</h2>
        <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} />
          Welcome back, {currentStudent.name}!
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2px' }}>Enrolled Subjects</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{enrolledCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Users size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2px' }}>Total Classmates</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{uniqueClassmates.length}</p>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2px' }}>Assigned Room</p>
              <p style={{ fontSize: '1rem', fontWeight: '600' }}>{currentStudent.assignedRoom || 'Not assigned'}</p>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #ea580c, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2px' }}>Year Level</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>Year {currentStudent.year}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '24px' 
      }}>
        <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>My Enrolled Subjects</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{enrolledCourses.length} subjects</p>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Code</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Units</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teacher</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Room</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {enrolledCourses.map((course) => {
                  const instructor = getInstructorForCourse(course.code)
                  const schedule = getScheduleForCourse(course.code)
                  return (
                    <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          background: 'rgba(79, 70, 229, 0.1)', 
                          color: '#4f46e5', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {course.code}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: '500' }}>{course.name}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ 
                          background: 'rgba(5, 150, 105, 0.1)', 
                          color: '#059669', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {course.units}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {instructor ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%', 
                              background: 'linear-gradient(135deg, #ea580c, #f97316)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '600' }}>
                                {instructor.name?.charAt(0)}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.875rem' }}>{instructor.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Not assigned</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {schedule?.room ? (
                          <span style={{ fontSize: '0.875rem' }}>{schedule.room}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>TBD</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {schedule ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                            <span>{schedule.day} {schedule.startTime}-{schedule.endTime}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>TBD</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '24px' 
        }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>My Classmates</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{uniqueClassmates.length} students</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {uniqueClassmates.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No classmates found in your courses.</p>
              ) : (
                uniqueClassmates.map((classmate) => (
                  <div
                    key={classmate.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ color: 'white', fontWeight: '600' }}>
                          {classmate.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontWeight: '500', margin: 0 }}>{classmate.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                          Year {classmate.year} - {classmate.department || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#4f46e5',
                      background: 'rgba(79, 70, 229, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      {classmate.courseCode}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: '12px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: 'linear-gradient(135deg, #ea580c, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GraduationCap size={20} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>My Teachers</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{teachers.length} instructors</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {teachers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No teachers assigned yet.</p>
              ) : (
                teachers.map(({ instructor, courseCode }) => (
                  <div
                    key={instructor.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #ea580c, #f97316)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ color: 'white', fontWeight: '600' }}>
                          {instructor.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontWeight: '500', margin: 0 }}>{instructor.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} />
                          {instructor.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#ea580c',
                      background: 'rgba(234, 88, 12, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      {courseCode}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {currentStudent.assignedRoom && (
          <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building size={24} color="white" />
              </div>
              <div>
                <h4 style={{ fontWeight: '600', marginBottom: '4px' }}>My Room Assignment</h4>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                  {currentStudent.assignedRoom} - {currentStudent.building || 'Main Building'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}