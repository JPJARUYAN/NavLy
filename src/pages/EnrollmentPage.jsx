import { useState, useMemo } from 'react'
import { 
  Users, BookOpen, Plus, Edit, Trash2, Save, X, GraduationCap, UserPlus, UserMinus,
  Clock, Calendar, Building2, CheckCircle, DoorOpen, Clipboard, User, LogOut, MapPin
} from 'lucide-react'
import { useStore } from '../store/useStore'

export default function EnrollmentPage({ user }) {
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [scheduleForm, setScheduleForm] = useState({})

  const students = useStore((state) => state.students)
  const courses = useStore((state) => state.courses)
  const departments = useStore((state) => state.departments)
  const schedules = useStore((state) => state.schedules)
  const semesters = useStore((state) => state.semesters)
  const rooms = useStore((state) => state.rooms)
  const markers = useStore((state) => state.markers)
  const instructors = useStore((state) => state.instructors)
  const accounts = useStore((state) => state.accounts)

  const addStudent = useStore((state) => state.addStudent)
  const updateStudent = useStore((state) => state.updateStudent)
  const deleteStudent = useStore((state) => state.deleteStudent)
  const enrollCourse = useStore((state) => state.enrollCourse)
  const dropCourse = useStore((state) => state.dropCourse)
  const addSchedule = useStore((state) => state.addSchedule)
  const updateSchedule = useStore((state) => state.updateSchedule)
  const deleteSchedule = useStore((state) => state.deleteSchedule)
  const addCourse = useStore((state) => state.addCourse)
  const updateCourse = useStore((state) => state.updateCourse)
  const deleteCourse = useStore((state) => state.deleteCourse)
  const getInstructorBySpecialty = useStore((state) => state.getInstructorBySpecialty)

  const isAdmin = user?.role === 'admin'
  const isInstructor = user?.role === 'instructor'
  const isStudent = user?.role === 'user'

  const currentAccount = useMemo(() => {
    if (!user) return null
    return accounts.find(a => a.email === user.email) || accounts.find(a => a.name === user.name)
  }, [user, accounts])

  const currentAccountInstructor = useMemo(() => {
    if (!isInstructor) return null
    return accounts.find(a => a.email === user.email && a.role === 'instructor')
  }, [isInstructor, user.email, accounts])

  const currentInstructor = useMemo(() => {
    if (!isInstructor) return null
    return instructors.find(i => i.email === user.email) || instructors.find(i => i.name.includes(user.name.replace('Prof. ', '').replace('Dr. ', '')))
  }, [isInstructor, user.name, user.email, instructors])

  const instructorData = currentInstructor || currentAccountInstructor

  const displayData = useMemo(() => {
    if (!isStudent) return null
    const fromStudents = students.find(s => s.email === user.email) || students.find(s => s.name === user.name)
    if (fromStudents) return fromStudents
    return accounts.find(a => a.email === user.email && a.role === 'user')
  }, [isStudent, user.email, user.name, students, accounts])

  const instructorCourses = useMemo(() => {
    if (!instructorData) return []
    return courses.filter(c => instructorData.specialties?.includes(c.code))
  }, [instructorData, courses])

  const instructorSchedules = useMemo(() => {
    if (!instructorData) return []
    return schedules.filter(s => instructorData.specialties?.includes(s.course))
  }, [instructorData, schedules])

  const studentEnrolledCourses = useMemo(() => {
    if (!displayData) return []
    return displayData.enrolledCourses?.map(id => courses.find(c => c.id === id)).filter(Boolean) || []
  }, [displayData, courses])

  const studentSchedules = useMemo(() => {
    if (!displayData || !displayData.enrolledCourses) return []
    const studentCourseCodes = displayData.enrolledCourses.map(id => courses.find(c => c.id === id)?.code).filter(Boolean)
    return schedules.filter(s => studentCourseCodes.includes(s.course))
  }, [displayData, courses, schedules])

  const studentClassmates = useMemo(() => {
    if (!displayData) return []
    return students.filter(s => 
      s.course === displayData.course && 
      s.id !== displayData.id &&
      s.status === 'active'
    )
  }, [displayData, students])

  const studentInstructors = useMemo(() => {
    if (!displayData) return []
    const studentCourseCodes = courses
      .filter(c => c.code === displayData.course)
      .map(c => c.code)
    
    if (studentCourseCodes.length === 0) {
      return instructors.filter(i => i.department === displayData.department)
    }
    
    return instructors.filter(i => 
      i.specialties?.some(s => studentCourseCodes.includes(s))
    )
  }, [displayData, currentAccount, courses, instructors])

  const courseSubjects = useMemo(() => {
    if (!displayData) return []
    return courses.filter(c => c.department === displayData.department)
  }, [displayData, courses])

  const getCourseById = (id) => courses.find(c => c.id === id)
  const getDepartmentName = (code) => departments.find(d => d.code === code)?.name || code

  const getBuildingByRoom = (roomName) => {
    for (const b of markers) {
      for (const floor of b.floors || []) {
        const room = floor.rooms?.find(r => r.name === roomName)
        if (room) return b.name
      }
    }
    return null
  }

  const handleSaveSchedule = () => {
    let instructor = scheduleForm.instructor
    if (!instructor && scheduleForm.course) {
      const matchedInstructor = getInstructorBySpecialty(scheduleForm.course)
      if (matchedInstructor) instructor = matchedInstructor.name
    }
    const scheduleData = { ...scheduleForm, instructor: instructor || 'TBA' }
    if (scheduleForm.id) {
      updateSchedule(scheduleForm.id, scheduleData)
    } else {
      addSchedule(scheduleData)
    }
    setScheduleForm({})
  }

  const totalUnits = (enrolledCourses) => {
    return enrolledCourses?.reduce((acc, id) => {
      const course = getCourseById(id)
      return acc + (course?.units || 0)
    }, 0) || 0
  }

  const availableCourses = isStudent && displayData
    ? courses.filter(c => !(displayData?.enrolledCourses || [])?.includes(c.id))
    : courses

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`
  }

  if (isStudent && displayData) {
    return (
      <div className="main-content">
        <div className="page-header">
          <h1>My Enrollment</h1>
        </div>

        <div style={{ padding: '0 24px' }}>
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: 16, 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700
              }}>
                {displayData.name?.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{displayData.name}</h2>
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>{displayData.email}</p>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{displayData.course}</p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{getDepartmentName(displayData.department)}</p>
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>{displayData.year === 1 ? '1st Year' : displayData.year === 2 ? '2nd Year' : displayData.year === 3 ? '3rd Year' : displayData.year === 4 ? '4th Year' : displayData.year + 'th Year'}</p>
                <span style={{ 
                  padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                  background: displayData.status === 'active' ? '#22c55e' : '#6b7280', color: '#fff'
                }}>
                  {displayData.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} />
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Date of Birth</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.personalInfo?.dateOfBirth || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Age</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.personalInfo?.age || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Gender</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.personalInfo?.gender || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Civil Status</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.personalInfo?.civilStatus || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Nationality</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.personalInfo?.nationality || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Student Type</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.studentType === 'new' ? 'New Student' : displayData.studentType === 'transferee' ? 'Transferee' : displayData.studentType === 'returnee' ? 'Returnee' : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={20} />
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Home Address</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.contactInfo?.homeAddress || displayData.personalInfo?.address || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Phone Number</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{displayData.contactInfo?.phoneNumber || displayData.personalInfo?.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={20} />
                My Classmates ({studentClassmates.length})
              </h3>
              {studentClassmates.length > 0 ? (
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {studentClassmates.slice(0, 10).map(classmate => (
                    <div key={classmate.id} style={{ 
                      padding: 10, borderRadius: 8, marginBottom: 8,
                      background: 'var(--glass-bg)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 12
                    }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 700, color: '#fff'
                      }}>
                        {classmate.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{classmate.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {classmate.year === 1 ? '1st Year' : classmate.year === 2 ? '2nd Year' : classmate.year === 3 ? '3rd Year' : classmate.year === 4 ? '4th Year' : classmate.year + 'th Year'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {studentClassmates.length > 10 && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      +{studentClassmates.length - 10} more classmates
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No classmates found</p>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} />
                My Instructors ({studentInstructors.length})
              </h3>
              {studentInstructors.length > 0 ? (
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {studentInstructors.map(instructor => (
                    <div key={instructor.id} style={{ 
                      padding: 10, borderRadius: 8, marginBottom: 8,
                      background: 'var(--glass-bg)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 12
                    }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 700, color: '#fff'
                      }}>
                        {instructor.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{instructor.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {instructor.position} - {getDepartmentName(instructor.department)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No instructors assigned</p>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={20} />
                My Subjects ({courseSubjects.length})
              </h3>
              {courseSubjects.length > 0 ? (
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {courseSubjects.map(subject => (
                    <div key={subject.id} style={{ 
                      padding: 10, borderRadius: 8, marginBottom: 8,
                      background: 'var(--glass-bg)', border: '1px solid var(--border)'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>{subject.code}</div>
                      <div style={{ fontSize: '0.8rem' }}>{subject.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subject.units} units</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No subjects available</p>
              )}
            </div>
          </div>

          <div className="dashboard-grid" style={{ paddingTop: 0 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} />
                My Courses ({displayData?.enrolledCourses?.length || 0})
              </h3>
              {(displayData?.enrolledCourses || []).map(courseId => {
                const course = getCourseById(courseId)
                if (!course) return null
                return (
                  <div key={courseId} style={{ 
                    padding: 12, borderRadius: 8, marginBottom: 8,
                    background: 'var(--glass-bg)', border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{course.code}</div>
                        <div style={{ fontSize: '0.9rem' }}>{course.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.units} units</div>
                      </div>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => dropCourse(displayData.id, courseId)}
                      >
                        Drop
                      </button>
                    </div>
                  </div>
                )
              })}
              {(!displayData?.enrolledCourses || displayData.enrolledCourses.length === 0) && (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No courses enrolled</p>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clipboard size={20} />
                My Schedule
              </h3>
              {studentSchedules.length > 0 ? (
                studentSchedules.map((schedule, idx) => (
                  <div key={idx} style={{ 
                    padding: 12, borderRadius: 8, marginBottom: 8,
                    background: 'var(--glass-bg)', border: '1px solid var(--border)'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{schedule.course}</div>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Calendar size={14} /> {schedule.day}
                    </div>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={14} /> {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </div>
                    <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Building2 size={14} /> {schedule.room} - {getBuildingByRoom(schedule.room)}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No schedule available</p>
              )}
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <DoorOpen size={20} />
                My Room
              </h3>
              <div style={{ 
                padding: 20, borderRadius: 12, 
                background: 'linear-gradient(135deg, var(--primary), #dc2626)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>{displayData.assignedRoom || 'TBA'}</div>
                <div style={{ fontSize: '1rem', opacity: 0.9 }}>{displayData.building || 'Main Building'}</div>
              </div>
              <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Your assigned classroom for the semester
              </p>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ marginBottom: 16 }}>Available Courses</h3>
              {availableCourses.slice(0, 8).map(course => (
                <div key={course.id} style={{ 
                  padding: 10, borderRadius: 8, marginBottom: 8,
                  background: 'var(--glass-bg)', border: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{course.code}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.name}</div>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => enrollCourse(displayData.id, course.id)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isInstructor && (currentInstructor || currentAccountInstructor)) {
    const instructorDisplayData = currentInstructor || currentAccountInstructor
    return (
      <div className="main-content">
        <div className="page-header">
          <h1>My Teaching</h1>
        </div>

        <div style={{ padding: '0 24px' }}>
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: 16, 
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700
              }}>
                {instructorDisplayData.name?.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>{instructorDisplayData.name}</h2>
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>{instructorDisplayData.email}</p>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>{instructorDisplayData.position} - {getDepartmentName(instructorDisplayData.department)}</p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{instructorDisplayData.assignedRoom || 'TBA'}</p>
                <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>{instructorDisplayData.building || 'Main Building'}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Office: {instructorDisplayData.office}</p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} />
              Personal Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Date of Birth</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.personalInfo?.dateOfBirth || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Age</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.personalInfo?.age || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Gender</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.personalInfo?.gender || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Civil Status</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.personalInfo?.civilStatus || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Nationality</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.personalInfo?.nationality || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={20} />
              Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Address</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.contactInfo?.address || instructorDisplayData.personalInfo?.address || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Contact Number</p>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>{instructorDisplayData.contactInfo?.phoneNumber || instructorDisplayData.personalInfo?.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-grid" style={{ paddingTop: 0 }}>
            <div className="glass-card" style={{ padding: 20, gridColumn: 'span 2' }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} />
                My Subjects ({instructorCourses.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {instructorCourses.map(course => {
                  const courseSchedules = instructorSchedules.filter(s => s.course === course.code)
                  return (
                    <div key={course.id} style={{ 
                      padding: 16, borderRadius: 12,
                      background: 'var(--glass-bg)', border: '1px solid var(--border)'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>{course.code}</div>
                      <div style={{ fontSize: '0.9rem', marginBottom: 8 }}>{course.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {course.units} units | {course.enrolled} students
                      </div>
                      {courseSchedules.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#22c55e' }}>
                          {courseSchedules[0].day} {formatTime(courseSchedules[0].startTime)}-{formatTime(courseSchedules[0].endTime)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20, gridColumn: 'span 2' }}>
              <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clipboard size={20} />
                My Class Schedule
              </h3>
              {instructorSchedules.length > 0 ? (
                <div className="glass" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Room</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructorSchedules.map(schedule => (
                        <tr key={schedule.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{schedule.course}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {courses.find(c => c.code === schedule.course)?.name}
                            </div>
                          </td>
                          <td>{schedule.room}</td>
                          <td>{schedule.day}</td>
                          <td>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => {
                              setScheduleForm(schedule)
                            }}>
                              <Edit size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No schedule assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState('students')
  const selectedStudent = null

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Enrollment Management</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => {
            setEditingItem(null)
            setFormData({ studentId: '', name: '', email: '', year: 1, department: '', status: 'active', enrolledCourses: [] })
            setShowModal(true)
          }}>
            <UserPlus size={18} />
            Add Student
          </button>
        )}
      </div>

      <div className="tabs" style={{ margin: '0 16px', padding: '8px' }}>
        <div className={`tab ${activeTab === 'students' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveTab('students')}>
          <Users size={16} />
          Students
        </div>
        <div className={`tab ${activeTab === 'courses' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveTab('courses')}>
          <BookOpen size={16} />
          Course Enrollment
        </div>
        <div className={`tab ${activeTab === 'instructors' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveTab('instructors')}>
          <BookOpen size={16} />
          Instructors
        </div>
        <div className={`tab ${activeTab === 'schedules' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveTab('schedules')}>
          <Clipboard size={16} />
          Schedules
        </div>
        <div className={`tab ${activeTab === 'subjects' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setActiveTab('subjects')}>
          <BookOpen size={16} />
          Subjects
        </div>
      </div>

      {activeTab === 'students' && (
        <div className="dashboard-grid" style={{ padding: '0 24px', paddingTop: 0 }}>
          {students.map((student) => (
            <div key={student.id} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ 
                  width: 50, height: 50, borderRadius: 12, 
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', fontWeight: 700
                }}>
                  {student.name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{student.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{student.email}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Course</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{student.course || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Department</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{getDepartmentName(student.department)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Year Level</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{student.year === 1 ? '1st Year' : student.year === 2 ? '2nd Year' : student.year === 3 ? '3rd Year' : student.year === 4 ? '4th Year' : student.year + 'th Year'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Student Type</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{student.studentType === 'new' ? 'New Student' : student.studentType === 'transferee' ? 'Transferee' : student.studentType === 'returnee' ? 'Returnee' : 'N/A'}</p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Personal Info</p>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>{student.personalInfo?.gender || '-'} | {student.personalInfo?.civilStatus || '-'} | {student.personalInfo?.nationality || '-'}</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Contact</p>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>{student.contactInfo?.homeAddress || 'No address'} | {student.contactInfo?.phoneNumber || 'No phone'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Enrolled</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{student.enrolledCourses?.length || 0} courses</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Room</p>
                  <p style={{ fontWeight: 500, margin: 0 }}>{student.assignedRoom || 'TBA'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    setEditingItem(student)
                    setFormData({ ...student })
                    setShowModal(true)
                  }}
                >
                  <Edit size={14} />
                  Edit
                </button>
                {isAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={() => {
                    if (window.confirm('Delete this student?')) deleteStudent(student.id)
                  }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'instructors' && (
        <div style={{ padding: '0 24px' }}>
          <div className="dashboard-grid" style={{ paddingTop: 0 }}>
            {instructors.map(instructor => {
              const instructorCoursesList = courses.filter(c => instructor.specialties?.includes(c.code))
              return (
                <div key={instructor.id} className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <div style={{ 
                      width: 56, height: 56, borderRadius: 12, 
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', fontWeight: 700
                    }}>
                      {instructor.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{instructor.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{instructor.position} - {getDepartmentName(instructor.department)}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Email</p>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{instructor.email}</p>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Personal Info</p>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>{instructor.personalInfo?.gender || '-'} | {instructor.personalInfo?.civilStatus || '-'} | {instructor.personalInfo?.nationality || '-'}</p>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Contact</p>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>{instructor.contactInfo?.address || 'No address'} | {instructor.contactInfo?.phoneNumber || 'No phone'}</p>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px' }}>Office & Room</p>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{instructor.office || 'TBA'} | {instructor.assignedRoom || 'TBA'}</p>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>Subjects Taught ({instructorCoursesList.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {instructorCoursesList.map(c => (
                        <span key={c.id} style={{ 
                          padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                          background: 'var(--primary)', color: '#fff'
                        }}>
                          {c.code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div style={{ padding: '0 24px' }}>
          <div className="glass" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Room</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Instructor</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {schedules.map(schedule => {
                  const course = courses.find(c => c.code === schedule.course)
                  return (
                    <tr key={schedule.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{schedule.course}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course?.name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <DoorOpen size={14} />
                          <div>
                            <div>{schedule.room}</div>
                            {getBuildingByRoom(schedule.room) && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getBuildingByRoom(schedule.room)}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{schedule.day}</td>
                      <td>{schedule.startTime} - {schedule.endTime}</td>
                      <td>{schedule.instructor}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setScheduleForm(schedule)}>
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => {
                              if (window.confirm('Delete?')) deleteSchedule(schedule.id)
                            }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && isAdmin && (
        <div style={{ padding: '0 24px' }}>
          <div className="glass" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Year</th>
                  <th>Sem</th>
                  <th>Category</th>
                  <th>Units</th>
                  <th>Enrollment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => {
                  const categoryColors = { 'Major': '#ef4444', 'GE': '#22c55e', 'Elective': '#3b82f6', 'Minor': '#f59e0b' }
                  const yearLabels = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }
                  const semesterLabels = { 1: '1st Sem', 2: '2nd Sem', 3: 'Summer' }
                  return (
                    <tr key={course.id}>
                      <td><div style={{ fontWeight: 700, color: 'var(--primary)' }}>{course.code}</div></td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{course.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{course.description?.slice(0, 50)}...</div>
                      </td>
                      <td>{yearLabels[course.year]}</td>
                      <td>{semesterLabels[course.semester]}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, background: categoryColors[course.category], color: '#fff' }}>
                          {course.category}
                        </span>
                      </td>
                      <td>{course.units}</td>
                      <td>{course.enrolled} / {course.maxStudents}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          if (window.confirm('Delete course?')) deleteCourse(course.id)
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>{editingItem ? 'Edit' : 'Add'} Student</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label>Student ID</label>
              <input type="text" className="form-input" value={formData.studentId || ''} onChange={(e) => setFormData({...formData, studentId: e.target.value})} placeholder="2024-0001" />
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="student@navly.edu" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Year</label>
                <select className="form-select" value={formData.year || 1} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}>
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select className="form-select" value={formData.status || 'active'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Department</label>
              <select className="form-select" value={formData.department || ''} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                if (editingItem) updateStudent(editingItem.id, formData)
                else addStudent(formData)
                setShowModal(false)
              }}>
                <Save size={18} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
