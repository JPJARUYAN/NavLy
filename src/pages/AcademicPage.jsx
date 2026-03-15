import { useState } from 'react'
import { 
  Calendar, Building2, BookOpen, Users, Clock, Plus, Edit, Trash2, Save, X,
  GraduationCap, ClipboardList, School
} from 'lucide-react'
import { useStore } from '../store/useStore'

export default function AcademicPage() {
  const [activeTab, setActiveTab] = useState('semesters')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [filterProgram, setFilterProgram] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterProgramSched, setFilterProgramSched] = useState('all')
  const [filterYearSched, setFilterYearSched] = useState('all')
  const [filterSemesterSched, setFilterSemesterSched] = useState('all')
  const [filterCourseSched, setFilterCourseSched] = useState('all')

  const semesters = useStore((state) => state.semesters)
  const departments = useStore((state) => state.departments)
  const courses = useStore((state) => state.courses)
  const rooms = useStore((state) => state.rooms)
  const schedules = useStore((state) => state.schedules)

  const addSemester = useStore((state) => state.addSemester)
  const updateSemester = useStore((state) => state.updateSemester)
  const deleteSemester = useStore((state) => state.deleteSemester)
  const addDepartment = useStore((state) => state.addDepartment)
  const updateDepartment = useStore((state) => state.updateDepartment)
  const deleteDepartment = useStore((state) => state.deleteDepartment)
  const addCourse = useStore((state) => state.addCourse)
  const updateCourse = useStore((state) => state.updateCourse)
  const deleteCourse = useStore((state) => state.deleteCourse)
  const addRoom = useStore((state) => state.addRoom)
  const updateRoom = useStore((state) => state.updateRoom)
  const deleteRoom = useStore((state) => state.deleteRoom)
  const addSchedule = useStore((state) => state.addSchedule)
  const updateSchedule = useStore((state) => state.updateSchedule)
  const deleteSchedule = useStore((state) => state.deleteSchedule)

  const tabs = [
    { id: 'semesters', label: 'Semesters', icon: Calendar },
    { id: 'programs', label: 'Programs', icon: GraduationCap },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'courses', label: 'Subjects', icon: BookOpen },
    { id: 'rooms', label: 'Rooms', icon: School },
    { id: 'schedules', label: 'Schedules', icon: ClipboardList },
  ]

  const programs = useStore((state) => state.programs)
  const addProgram = useStore((state) => state.addProgram)
  const updateProgram = useStore((state) => state.updateProgram)
  const deleteProgram = useStore((state) => state.deleteProgram)

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#10b981'
      case 'completed': return '#6b7280'
      case 'upcoming': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    switch(activeTab) {
      case 'semesters':
        setFormData({ name: '', startDate: '', endDate: '', status: 'upcoming' })
        break
      case 'programs':
        setFormData({ name: '', code: '', category: 'Teacher Education', dean: '', description: '' })
        break
      case 'departments':
        setFormData({ name: '', code: '', head: '', description: '' })
        break
      case 'courses':
        setFormData({ code: '', name: '', units: 3, year: 1, semester: 1, category: 'Major', department: '', maxStudents: 40, description: '' })
        break
      case 'rooms':
        setFormData({ name: '', building: '', floor: 1, capacity: 30, type: 'classroom' })
        break
      case 'schedules':
        setFormData({ course: '', room: '', day: 'Monday', startTime: '08:00', endTime: '10:00', semester: 2, instructor: '' })
        break
    }
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({ ...item })
    setShowModal(true)
  }

  const handleSave = () => {
    switch(activeTab) {
      case 'semesters':
        if (editingItem) updateSemester(editingItem.id, formData)
        else addSemester(formData)
        break
      case 'programs':
        if (editingItem) updateProgram(editingItem.id, formData)
        else addProgram(formData)
        break
      case 'departments':
        if (editingItem) updateDepartment(editingItem.id, formData)
        else addDepartment(formData)
        break
      case 'courses':
        if (editingItem) updateCourse(editingItem.id, formData)
        else addCourse(formData)
        break
      case 'rooms':
        if (editingItem) updateRoom(editingItem.id, formData)
        else addRoom(formData)
        break
      case 'schedules':
        if (editingItem) updateSchedule(editingItem.id, formData)
        else addSchedule(formData)
        break
    }
    setShowModal(false)
    setFormData({})
  }

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return
    switch(activeTab) {
      case 'semesters': deleteSemester(id); break
      case 'programs': deleteProgram(id); break
      case 'departments': deleteDepartment(id); break
      case 'courses': deleteCourse(id); break
      case 'rooms': deleteRoom(id); break
      case 'schedules': deleteSchedule(id); break
    }
  }

  const getAddLabel = (tab) => {
    const labels = {
      semesters: 'Semester',
      programs: 'Program',
      departments: 'Department',
      courses: 'Subject',
      rooms: 'Room',
      schedules: 'Schedule'
    }
    return labels[tab] || tab.slice(0, -1)
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Academic Setup</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <Plus size={18} />
          Add {getAddLabel(activeTab)}
        </button>
      </div>

      <div className="tabs" style={{ margin: '0 24px', padding: '8px' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <tab.icon size={16} />
            {tab.label}
          </div>
        ))}
      </div>

      <div className="glass" style={{ margin: '24px', padding: 0 }}>
        {activeTab === 'semesters' && (
          <table>
            <thead>
              <tr>
                <th>Semester Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((sem) => (
                <tr key={sem.id}>
                  <td style={{ fontWeight: 500 }}>{sem.name}</td>
                  <td>{sem.startDate}</td>
                  <td>{sem.endDate}</td>
                  <td>
                    <span className="badge" style={{ background: `${getStatusColor(sem.status)}20`, color: getStatusColor(sem.status) }}>
                      {sem.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(sem)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sem.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'programs' && (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Program Name</th>
                <th>Category</th>
                <th>Dean/Head</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id}>
                  <td><span className="badge badge-academic">{program.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{program.name}</td>
                  <td><span className="badge badge-facility">{program.category}</span></td>
                  <td>{program.dean || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(program)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(program.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'departments' && (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Department Name</th>
                <th>Department Head</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td><span className="badge badge-academic">{dept.code}</span></td>
                  <td style={{ fontWeight: 500 }}>{dept.name}</td>
                  <td>{dept.head}</td>
                  <td>{dept.description}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(dept)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'courses' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 180 }}
                value={filterProgram} 
                onChange={(e) => setFilterProgram(e.target.value)}
              >
                <option value="all">All Programs</option>
                {programs.map(program => (
                  <option key={program.id} value={program.code}>{program.code} - {program.name}</option>
                ))}
              </select>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 140 }}
                value={filterYear} 
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 150 }}
                value={filterSemester} 
                onChange={(e) => setFilterSemester(e.target.value)}
              >
                <option value="all">All Semesters</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {(() => {
                  let filtered = courses
                  if (filterProgram !== 'all') {
                    filtered = filtered.filter(c => {
                      const parts = c.code.split('-')
                      const prog = parts.length > 2 ? parts.slice(0, 2).join('-') : parts[0]
                      return prog === filterProgram
                    })
                  }
                  if (filterYear !== 'all') filtered = filtered.filter(c => String(c.year) === filterYear)
                  if (filterSemester !== 'all') filtered = filtered.filter(c => String(c.semester) === filterSemester)
                  return `${filtered.length} subjects`
                })()}
              </span>
            </div>
            <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Year</th>
                <th>Sem</th>
                <th>Units</th>
                <th>Department</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let filtered = courses
                if (filterProgram !== 'all') {
                  filtered = filtered.filter(c => {
                    const parts = c.code.split('-')
                    const prog = parts.length > 2 ? parts.slice(0, 2).join('-') : parts[0]
                    return prog === filterProgram
                  })
                }
                if (filterYear !== 'all') filtered = filtered.filter(c => String(c.year) === filterYear)
                if (filterSemester !== 'all') filtered = filtered.filter(c => String(c.semester) === filterSemester)
                return filtered.map((course) => (
                  <tr key={course.id}>
                    <td><span className="badge badge-facility">{course.code}</span></td>
                    <td style={{ fontWeight: 500 }}>{course.name}</td>
                    <td>Year {course.year}</td>
                    <td>Sem {course.semester}</td>
                    <td>{course.units}</td>
                    <td>{course.department}</td>
                    <td><span className="badge badge-academic">{course.category}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(course)}><Edit size={14} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(course.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
          </div>
        )}

        {activeTab === 'rooms' && (
          <table>
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td style={{ fontWeight: 500 }}>{room.name}</td>
                  <td>{room.building}</td>
                  <td>{room.floor}</td>
                  <td>{room.capacity}</td>
                  <td><span className="badge badge-residential">{room.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(room)}><Edit size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(room.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'schedules' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 180 }}
                value={filterProgramSched} 
                onChange={(e) => setFilterProgramSched(e.target.value)}
              >
                <option value="all">All Programs</option>
                {programs.map(program => (
                  <option key={program.id} value={program.code}>{program.code} - {program.name}</option>
                ))}
              </select>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 140 }}
                value={filterYearSched} 
                onChange={(e) => setFilterYearSched(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 150 }}
                value={filterSemesterSched} 
                onChange={(e) => setFilterSemesterSched(e.target.value)}
              >
                <option value="all">All Semesters</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: 200 }}
                value={filterCourseSched} 
                onChange={(e) => setFilterCourseSched(e.target.value)}
              >
                <option value="all">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.code}>{c.code} - {c.name}</option>
                ))}
              </select>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {(() => {
                  let filtered = schedules
                  if (filterProgramSched !== 'all') {
                    filtered = filtered.filter(s => {
                      const course = courses.find(c => c.code === s.course)
                      if (!course) return false
                      const parts = course.code.split('-')
                      const prog = parts.length > 2 ? parts.slice(0, 2).join('-') : parts[0]
                      return prog === filterProgramSched
                    })
                  }
                  if (filterYearSched !== 'all') {
                    filtered = filtered.filter(s => {
                      const course = courses.find(c => c.code === s.course)
                      return course && String(course.year) === filterYearSched
                    })
                  }
                  if (filterSemesterSched !== 'all') filtered = filtered.filter(s => String(s.semester) === filterSemesterSched)
                  if (filterCourseSched !== 'all') filtered = filtered.filter(s => s.course === filterCourseSched)
                  return `${filtered.length} schedules`
                })()}
              </span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Sem</th>
                  <th>Room</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Instructor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let filtered = schedules
                  if (filterProgramSched !== 'all') {
                    filtered = filtered.filter(s => {
                      const course = courses.find(c => c.code === s.course)
                      if (!course) return false
                      const parts = course.code.split('-')
                      const prog = parts.length > 2 ? parts.slice(0, 2).join('-') : parts[0]
                      return prog === filterProgramSched
                    })
                  }
                  if (filterYearSched !== 'all') {
                    filtered = filtered.filter(s => {
                      const course = courses.find(c => c.code === s.course)
                      return course && String(course.year) === filterYearSched
                    })
                  }
                  if (filterSemesterSched !== 'all') filtered = filtered.filter(s => String(s.semester) === filterSemesterSched)
                  if (filterCourseSched !== 'all') filtered = filtered.filter(s => s.course === filterCourseSched)
                  return filtered.map((sched) => {
                    const course = courses.find(c => c.code === sched.course)
                    return (
                      <tr key={sched.id}>
                        <td style={{ fontWeight: 500 }}>{sched.course}</td>
                        <td>{course ? `Year ${course.year}` : '-'}</td>
                        <td>Sem {sched.semester}</td>
                        <td>{sched.room}</td>
                        <td>{sched.day}</td>
                        <td>{sched.startTime} - {sched.endTime}</td>
                        <td>{sched.instructor}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(sched)}><Edit size={14} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sched.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="glass modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>{editingItem ? 'Edit' : 'Add'} {getAddLabel(activeTab)}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {activeTab === 'semesters' && (
              <>
                <div className="form-group">
                  <label>Semester Name</label>
                  <input type="text" className="form-input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" className="form-input" value={formData.startDate || ''} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" className="form-input" value={formData.endDate || ''} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-select" value={formData.status || 'upcoming'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'programs' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Program Code</label>
                    <input type="text" className="form-input" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-select" value={formData.category || 'Teacher Education'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="Teacher Education">Teacher Education</option>
                      <option value="Business">Business</option>
                      <option value="Computing">Computing</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Criminal Justice">Criminal Justice</option>
                      <option value="Arts & Sciences">Arts & Sciences</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Health">Health</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Program Name</label>
                  <input type="text" className="form-input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Program Head/Dean</label>
                  <input type="text" className="form-input" value={formData.dean || ''} onChange={(e) => setFormData({...formData, dean: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows={2} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </>
            )}

            {activeTab === 'departments' && (
              <>
                <div className="form-group">
                  <label>Department Code</label>
                  <input type="text" className="form-input" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                </div>
                <div className="form-group">
                  <label>Department Name</label>
                  <input type="text" className="form-input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Department Head</label>
                  <input type="text" className="form-input" value={formData.head || ''} onChange={(e) => setFormData({...formData, head: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows={2} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </>
            )}

            {activeTab === 'courses' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Course Code</label>
                    <input type="text" className="form-input" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="form-group">
                    <label>Year Level</label>
                    <select className="form-select" value={formData.year || 1} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}>
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <select className="form-select" value={formData.semester || 1} onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}>
                      <option value={1}>1st Semester</option>
                      <option value={2}>2nd Semester</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Course Name</label>
                  <input type="text" className="form-input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Department</label>
                    <select className="form-select" value={formData.department || ''} onChange={(e) => setFormData({...formData, department: e.target.value})}>
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.code}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-select" value={formData.category || 'Major'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="Major">Major</option>
                      <option value="Foundation">Foundation</option>
                      <option value="Research">Research</option>
                      <option value="Practicum">Practicum</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Units</label>
                    <input type="number" className="form-input" value={formData.units || 3} onChange={(e) => setFormData({...formData, units: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Max Students</label>
                    <input type="number" className="form-input" value={formData.maxStudents || 40} onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-input" rows={2} value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
              </>
            )}

            {activeTab === 'rooms' && (
              <>
                <div className="form-group">
                  <label>Room Name</label>
                  <input type="text" className="form-input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Building</label>
                    <input type="text" className="form-input" value={formData.building || ''} onChange={(e) => setFormData({...formData, building: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Floor</label>
                    <input type="number" className="form-input" value={formData.floor || 1} onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Capacity</label>
                    <input type="number" className="form-input" value={formData.capacity || 30} onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select className="form-select" value={formData.type || 'classroom'} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option value="classroom">Classroom</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="lecture">Lecture Hall</option>
                      <option value="office">Office</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'schedules' && (
              <>
                <div className="form-group">
                  <label>Course</label>
                  <select className="form-select" value={formData.course || ''} onChange={(e) => setFormData({...formData, course: e.target.value})}>
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <select className="form-select" value={formData.room || ''} onChange={(e) => setFormData({...formData, room: e.target.value})}>
                    <option value="">Select Room</option>
                    {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Day</label>
                  <select className="form-select" value={formData.day || 'Monday'} onChange={(e) => setFormData({...formData, day: e.target.value})}>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input type="time" className="form-input" value={formData.startTime || '08:00'} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input type="time" className="form-input" value={formData.endTime || '10:00'} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Instructor</label>
                    <input type="text" className="form-input" value={formData.instructor || ''} onChange={(e) => setFormData({...formData, instructor: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <select className="form-select" value={formData.semester || 2} onChange={(e) => setFormData({...formData, semester: parseInt(e.target.value)})}>
                      {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
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
