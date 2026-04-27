import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultCourses } from './courses_data'

const defaultBuildings = [
  { id: 1, name: 'DPT Building', type: 'academic', position: [-15, 0, -20], rotation: 0, scale: [2, 1.8, 1.2], description: 'Dolores P. Torres Building - Main academic building', color: '#CD853F',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'dpt1', name: 'Lobby', type: 'lobby', capacity: 50}, {id: 'dpt2', name: 'Room 101', type: 'classroom', capacity: 45}, {id: 'dpt3', name: 'Room 102', type: 'classroom', capacity: 45}, {id: 'dpt4', name: 'AVR 1', type: 'seminar', capacity: 50}, {id: 'dpt5', name: 'AVR 2', type: 'seminar', capacity: 50}, {id: 'dpt6', name: 'Dean\'s Office', type: 'office', capacity: 8}, {id: 'dpt7', name: 'Auditorium', type: 'auditorium', capacity: 300}] },
      { name: '2nd Floor', rooms: [{id: 'dpt8', name: 'Room 201', type: 'classroom', capacity: 45}, {id: 'dpt9', name: 'Room 202', type: 'classroom', capacity: 45}, {id: 'dpt10', name: 'Computer Lab 1', type: 'computer', capacity: 35}, {id: 'dpt11', name: 'Computer Lab 2', type: 'computer', capacity: 35}, {id: 'dpt12', name: 'Faculty Room', type: 'office', capacity: 15}] },
      { name: '3rd Floor', rooms: [{id: 'dpt13', name: 'Room 301', type: 'classroom', capacity: 45}, {id: 'dpt14', name: 'Mac Laboratory', type: 'computer', capacity: 30}, {id: 'dpt15', name: 'Data Comm Lab', type: 'laboratory', capacity: 25}] },
      { name: '4th Floor', rooms: [{id: 'dpt16', name: 'Computer Lab 6', type: 'computer', capacity: 30}, {id: 'dpt17', name: 'CADD Laboratory', type: 'computer', capacity: 25}, {id: 'dpt18', name: 'Multimedia Lab', type: 'computer', capacity: 25}] },
    ]
  },
  { id: 2, name: 'LIC Building', type: 'facility', position: [0, 0, 0], rotation: 0, scale: [1.5, 1.5, 1.2], description: 'Learning and Information Center - Library', color: '#DAA520',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'lic1', name: 'Circulation Desk', type: 'lobby', capacity: 8}, {id: 'lic2', name: 'Computer Stations', type: 'computer', capacity: 50}, {id: 'lic3', name: 'AVR 4', type: 'seminar', capacity: 60}] },
      { name: '2nd Floor', rooms: [{id: 'lic4', name: 'Reading Area A', type: 'reading', capacity: 80}, {id: 'lic5', name: 'Reading Area B', type: 'reading', capacity: 80}, {id: 'lic6', name: 'Quiet Zone', type: 'reading', capacity: 50}] },
      { name: '3rd Floor', rooms: [{id: 'lic7', name: 'Research Center', type: 'reading', capacity: 40}, {id: 'lic8', name: 'Group Study 1', type: 'meeting', capacity: 12}, {id: 'lic9', name: 'Group Study 2', type: 'meeting', capacity: 12}] },
    ]
  },
  { id: 3, name: 'BE Building', type: 'academic', position: [15, 0, -20], rotation: 0, scale: [1.4, 1.4, 1.1], description: 'Business and Engineering Building', color: '#CD853F',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'be1', name: 'Open Computer Lab', type: 'computer', capacity: 40}, {id: 'be2', name: 'Room 101', type: 'classroom', capacity: 50}, {id: 'be3', name: 'BE Cashier', type: 'office', capacity: 3}] },
      { name: '2nd Floor', rooms: [{id: 'be4', name: 'CAD Laboratory', type: 'laboratory', capacity: 30}, {id: 'be5', name: 'Room 201', type: 'classroom', capacity: 45}, {id: 'be6', name: 'Board Room', type: 'meeting', capacity: 25}] },
      { name: '3rd Floor', rooms: [{id: 'be7', name: 'Accountancy Lab', type: 'computer', capacity: 25}, {id: 'be8', name: 'Room 301', type: 'classroom', capacity: 40}, {id: 'be9', name: 'Faculty Room', type: 'office', capacity: 12}] },
      { name: '4th Floor', rooms: [{id: 'be10', name: 'Room 401', type: 'classroom', capacity: 40}, {id: 'be11', name: 'Dean\'s Office', type: 'office', capacity: 6}] },
    ]
  },
  { id: 4, name: 'Administration', type: 'admin', position: [0, 0, 20], rotation: 0, scale: [1.2, 1.2, 1], description: 'Main Administration Building', color: '#F5F5DC',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'admin1', name: 'Guard House', type: 'security', capacity: 6}, {id: 'admin2', name: 'Information Desk', type: 'lobby', capacity: 10}, {id: 'admin3', name: 'Registrar Office', type: 'office', capacity: 15}, {id: 'admin4', name: 'Cashier', type: 'office', capacity: 6}, {id: 'admin5', name: 'Finance Office', type: 'office', capacity: 12}] },
      { name: '2nd Floor', rooms: [{id: 'admin6', name: 'President\'s Office', type: 'office', capacity: 8}, {id: 'admin7', name: 'Board Room', type: 'meeting', capacity: 30}, {id: 'admin8', name: 'HR Office', type: 'office', capacity: 10}] },
      { name: '3rd Floor', rooms: [{id: 'admin9', name: 'Student Affairs', type: 'office', capacity: 12}, {id: 'admin10', name: 'Guidance Office', type: 'office', capacity: 8}, {id: 'admin11', name: 'Clinic', type: 'office', capacity: 6}] },
    ]
  },
  { id: 5, name: 'Gymnasium', type: 'facility', position: [-25, 0, 15], rotation: 0, scale: [2, 1, 1.6], description: 'Indoor Sports Court and Fitness Gym', color: '#8B0000',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'gym1', name: 'Main Court', type: 'gym', capacity: 600}, {id: 'gym2', name: 'Bleachers', type: 'seating', capacity: 400}, {id: 'gym3', name: 'Equipment Room', type: 'storage', capacity: 10}, {id: 'gym4', name: 'Coaches Office', type: 'office', capacity: 4}] },
      { name: '2nd Floor', rooms: [{id: 'gym5', name: 'Fitness Gym', type: 'gym', capacity: 60}, {id: 'gym6', name: 'Locker Room M', type: 'locker', capacity: 40}, {id: 'gym7', name: 'Locker Room F', type: 'locker', capacity: 40}, {id: 'gym8', name: 'PE Faculty Room', type: 'office', capacity: 8}] },
    ]
  },
  { id: 6, name: 'Cafeteria', type: 'facility', position: [20, 0, 10], rotation: 0, scale: [1.3, 0.9, 1.2], description: 'Food court and dining area', color: '#FF6347',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'caf1', name: 'Main Dining', type: 'dining', capacity: 250}, {id: 'caf2', name: 'Fast Food Area', type: 'dining', capacity: 100}, {id: 'caf3', name: 'Coffee Shop', type: 'dining', capacity: 50}] },
      { name: '2nd Floor', rooms: [{id: 'caf4', name: 'Function Hall', type: 'event', capacity: 150}, {id: 'caf5', name: 'Kitchen', type: 'kitchen', capacity: 25}, {id: 'caf6', name: 'Storage Room', type: 'storage', capacity: 15}] },
    ]
  },
  { id: 7, name: 'Student Center', type: 'facility', position: [-20, 0, 10], rotation: 0, scale: [1.1, 0.8, 1], description: 'Student Center - COOP, Organizations, Lounge', color: '#9370DB',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'sc1', name: 'Student Lounge', type: 'lounge', capacity: 80}, {id: 'sc2', name: 'Student Council', type: 'office', capacity: 10}, {id: 'sc3', name: 'COOP Store', type: 'dining', capacity: 30}, {id: 'sc4', name: 'Prayer Room', type: 'lounge', capacity: 25}] },
      { name: '2nd Floor', rooms: [{id: 'sc5', name: 'Org Offices', type: 'office', capacity: 20}, {id: 'sc6', name: 'Meeting Room 1', type: 'meeting', capacity: 15}, {id: 'sc7', name: 'Game Room', type: 'lounge', capacity: 40}] },
    ]
  },
  { id: 8, name: 'GET Building', type: 'academic', position: [-30, 0, -10], rotation: 0, scale: [1.1, 1.1, 0.9], description: 'General Education and Technology Building', color: '#CD853F',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'get1', name: 'AVR 1', type: 'seminar', capacity: 40}, {id: 'get2', name: 'AVR 2', type: 'seminar', capacity: 40}, {id: 'get3', name: 'Room 101', type: 'classroom', capacity: 45}] },
      { name: '2nd Floor', rooms: [{id: 'get4', name: 'Room 201', type: 'classroom', capacity: 45}, {id: 'get5', name: 'Room 202', type: 'classroom', capacity: 40}, {id: 'get6', name: 'Faculty Room', type: 'office', capacity: 12}] },
      { name: '3rd Floor', rooms: [{id: 'get7', name: 'Room 301', type: 'classroom', capacity: 40}, {id: 'get8', name: 'GE Faculty', type: 'office', capacity: 10}, {id: 'get9', name: 'Research Office', type: 'office', capacity: 6}] },
    ]
  },
  { id: 9, name: 'CHE Building', type: 'academic', position: [30, 0, -10], rotation: 0, scale: [1, 1, 0.9], description: 'College of Hotel Management and Entrepreneurship', color: '#CD853F',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'che1', name: 'Baking Laboratory', type: 'laboratory', capacity: 25}, {id: 'che2', name: 'Kitchen Lab', type: 'kitchen', capacity: 20}, {id: 'che3', name: 'Room 101', type: 'classroom', capacity: 40}] },
      { name: '2nd Floor', rooms: [{id: 'che4', name: 'Cagliari Hall', type: 'classroom', capacity: 50}, {id: 'che5', name: 'Room 201', type: 'classroom', capacity: 35}, {id: 'che6', name: 'Faculty Room', type: 'office', capacity: 8}] },
      { name: '3rd Floor', rooms: [{id: 'che7', name: 'Room 301', type: 'classroom', capacity: 35}, {id: 'che8', name: 'Dean\'s Office', type: 'office', capacity: 5}] },
    ]
  },
  { id: 10, name: 'Science Building', type: 'academic', position: [35, 0, 5], rotation: 0, scale: [1.2, 1.3, 1], description: 'Science and Laboratory Building', color: '#CD853F',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'sci1', name: 'Physics Lab 1', type: 'laboratory', capacity: 30}, {id: 'sci2', name: 'Physics Lab 2', type: 'laboratory', capacity: 30}, {id: 'sci3', name: 'Physics Prep Room', type: 'storage', capacity: 8}] },
      { name: '2nd Floor', rooms: [{id: 'sci4', name: 'Chemistry Lab 1', type: 'laboratory', capacity: 30}, {id: 'sci5', name: 'Chemistry Lab 2', type: 'laboratory', capacity: 30}, {id: 'sci6', name: 'Chemical Storage', type: 'storage', capacity: 5}] },
      { name: '3rd Floor', rooms: [{id: 'sci7', name: 'Biology Lab 1', type: 'laboratory', capacity: 30}, {id: 'sci8', name: 'Biology Lab 2', type: 'laboratory', capacity: 30}, {id: 'sci9', name: 'Research Lab', type: 'laboratory', capacity: 15}] },
    ]
  },
  { id: 11, name: 'Chapel', type: 'facility', position: [-10, 0, 30], rotation: 0, scale: [0.8, 1.4, 1], description: 'School Chapel and Prayer Room', color: '#F5F5DC',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'ch1', name: 'Main Chapel', type: 'auditorium', capacity: 150}, {id: 'ch2', name: 'Altar', type: 'lounge', capacity: 10}, {id: 'ch3', name: 'Choir Room', type: 'lounge', capacity: 20}] },
    ]
  },
  { id: 12, name: 'CCS Building', type: 'academic', position: [-35, 0, 5], rotation: 0, scale: [1, 1.2, 0.9], description: 'College of Computer Studies', color: '#2563EB',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'ccs1', name: 'IT Office', type: 'office', capacity: 8}, {id: 'ccs2', name: 'Programming Lab 1', type: 'computer', capacity: 35}, {id: 'ccs3', name: 'Programming Lab 2', type: 'computer', capacity: 35}, {id: 'ccs4', name: 'Server Room', type: 'server', capacity: 5}] },
      { name: '1st Floor', rooms: [{id: 'ccs5', name: 'Engineering Lab', type: 'laboratory', capacity: 30}, {id: 'ccs6', name: 'Multimedia Lab', type: 'computer', capacity: 30}, {id: 'ccs7', name: 'Lecture Room', type: 'classroom', capacity: 50}, {id: 'ccs8', name: 'Dean\'s Office', type: 'office', capacity: 6}] },
    ]
  },
  { id: 13, name: 'Dormitory A', type: 'residential', position: [40, 0, -20], rotation: 0, scale: [1.2, 1.5, 0.9], description: 'Student Housing - Male', color: '#4682B4',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'd1a1', name: 'Lobby', type: 'lobby', capacity: 20}, {id: 'd1a2', name: 'Dorm Manager', type: 'office', capacity: 4}, {id: 'd1a3', name: 'Common Room', type: 'lounge', capacity: 30}] },
      { name: '2nd Floor', rooms: [{id: 'd1a4', name: 'Room 201', type: 'dorm', capacity: 4}, {id: 'd1a5', name: 'Room 202', type: 'dorm', capacity: 4}, {id: 'd1a6', name: 'Room 203', type: 'dorm', capacity: 4}, {id: 'd1a7', name: 'Room 204', type: 'dorm', capacity: 4}, {id: 'd1a8', name: 'Bathroom M', type: 'bath', capacity: 10}] },
      { name: '3rd Floor', rooms: [{id: 'd1a9', name: 'Room 301', type: 'dorm', capacity: 4}, {id: 'd1a10', name: 'Room 302', type: 'dorm', capacity: 4}, {id: 'd1a11', name: 'Room 303', type: 'dorm', capacity: 4}, {id: 'd1a12', name: 'Room 304', type: 'dorm', capacity: 4}, {id: 'd1a13', name: 'Bathroom M', type: 'bath', capacity: 10}] },
    ]
  },
  { id: 14, name: 'Dormitory B', type: 'residential', position: [50, 0, -20], rotation: 0, scale: [1.2, 1.5, 0.9], description: 'Student Housing - Female', color: '#5F9EA0',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'd2b1', name: 'Lobby', type: 'lobby', capacity: 20}, {id: 'd2b2', name: 'Dorm Manager', type: 'office', capacity: 4}, {id: 'd2b3', name: 'Common Room', type: 'lounge', capacity: 30}] },
      { name: '2nd Floor', rooms: [{id: 'd2b4', name: 'Room 201', type: 'dorm', capacity: 4}, {id: 'd2b5', name: 'Room 202', type: 'dorm', capacity: 4}, {id: 'd2b6', name: 'Room 203', type: 'dorm', capacity: 4}, {id: 'd2b7', name: 'Room 204', type: 'dorm', capacity: 4}, {id: 'd2b8', name: 'Bathroom F', type: 'bath', capacity: 10}] },
      { name: '3rd Floor', rooms: [{id: 'd2b9', name: 'Room 301', type: 'dorm', capacity: 4}, {id: 'd2b10', name: 'Room 302', type: 'dorm', capacity: 4}, {id: 'd2b11', name: 'Room 303', type: 'dorm', capacity: 4}, {id: 'd2b12', name: 'Room 304', type: 'dorm', capacity: 4}, {id: 'd2b13', name: 'Bathroom F', type: 'bath', capacity: 10}] },
    ]
  },
  { id: 15, name: 'Main Gate', type: 'facility', position: [0, 0, 40], rotation: 0, scale: [3, 0.8, 0.5], description: 'Main Campus Entrance Gate', color: '#4A4A4A',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'gate1', name: 'Main Gate', type: 'security', capacity: 6}, {id: 'gate2', name: 'Guard Room', type: 'security', capacity: 4}] },
    ]
  },
  { id: 16, name: 'Flagpole Plaza', type: 'facility', position: [0, 0, 25], rotation: 0, scale: [0.6, 0.4, 0.6], description: 'Central Flagpole and Plaza', color: '#808080',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'flag1', name: 'Plaza', type: 'lobby', capacity: 100}] },
    ]
  },
  { id: 17, name: 'Basketball Court', type: 'facility', position: [-40, 0, 25], rotation: 0, scale: [1.5, 0.35, 1.2], description: 'Outdoor Basketball Court', color: '#8B4513',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'bb1', name: 'Court Area', type: 'gym', capacity: 30}, {id: 'bb2', name: 'Bleachers', type: 'seating', capacity: 100}] },
    ]
  },
  { id: 18, name: 'Parking Area', type: 'facility', position: [35, 0, 30], rotation: 0, scale: [2.5, 0.25, 1], description: 'Main Parking Lot', color: '#696969',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'park1', name: 'Parking Space', type: 'lobby', capacity: 80}] },
    ]
  },
  { id: 19, name: 'Alumni Building', type: 'facility', position: [-35, 0, 25], rotation: 0, scale: [0.8, 0.9, 0.8], description: 'Alumni Association Building', color: '#D2691E',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'alum1', name: 'Alumni Office', type: 'office', capacity: 10}, {id: 'alum2', name: 'Meeting Hall', type: 'meeting', capacity: 50}] },
    ]
  },
  { id: 20, name: 'Swimming Pool', type: 'facility', position: [50, 0, 10], rotation: 0, scale: [2, 0.3, 1.5], description: 'Olympic size swimming pool', color: '#06B6D4',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'pool1', name: 'Pool Area', type: 'gym', capacity: 100}] },
    ]
  },
  { id: 21, name: 'CTE Building', type: 'academic', position: [0, 0, -35], rotation: 0, scale: [1.3, 1.2, 1], description: 'College of Teacher Education', color: '#CD853F',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'cte1', name: 'Dean\'s Office', type: 'office', capacity: 6}, {id: 'cte2', name: 'Faculty Room', type: 'office', capacity: 15}, {id: 'cte3', name: 'Room 101', type: 'classroom', capacity: 45}] },
      { name: '2nd Floor', rooms: [{id: 'cte4', name: 'Room 201', type: 'classroom', capacity: 40}, {id: 'cte5', name: 'Room 202', type: 'classroom', capacity: 40}, {id: 'cte6', name: 'Practice Teaching Room', type: 'laboratory', capacity: 30}] },
    ]
  },
  { id: 22, name: 'Grand Auditorium', type: 'facility', position: [20, 0, 30], rotation: 0, scale: [1.8, 1.3, 1.5], description: 'Events hall, concerts, assemblies', color: '#65A30D',
    floors: [
      { name: 'Ground Floor', rooms: [{id: 'aud1', name: 'Main Stage', type: 'stage', capacity: 50}, {id: 'aud2', name: 'Audience Seating', type: 'auditorium', capacity: 500}, {id: 'aud3', name: 'Control Room', type: 'technical', capacity: 5}] },
      { name: '1st Floor', rooms: [{id: 'aud4', name: 'VIP Lounge', type: 'lounge', capacity: 30}, {id: 'aud5', name: 'Green Room', type: 'lounge', capacity: 15}, {id: 'aud6', name: 'Storage', type: 'storage', capacity: 10}] },
    ]
  },
]

const defaultPaths = [
  { id: 1, name: 'Main Entrance Road', type: 'highway', points: [[-60, 0, 40], [60, 0, 40]], width: 14, color: '#1F2937' },
  { id: 2, name: 'Central Horizontal', type: 'highway', points: [[-60, 0, 0], [60, 0, 0]], width: 12, color: '#1F2937' },
  { id: 3, name: 'Back Horizontal Road', type: 'road', points: [[-60, 0, -35], [60, 0, -35]], width: 10, color: '#374151' },
  { id: 4, name: 'Far Back Road', type: 'road', points: [[-60, 0, -50], [60, 0, -50]], width: 8, color: '#374151' },
  { id: 5, name: 'West Vertical Main', type: 'highway', points: [[-45, 0, -55], [-45, 0, 45]], width: 12, color: '#1F2937' },
  { id: 6, name: 'West Secondary', type: 'road', points: [[-55, 0, -55], [-55, 0, 45]], width: 8, color: '#374151' },
  { id: 7, name: 'East Vertical Main', type: 'highway', points: [[45, 0, -55], [45, 0, 45]], width: 12, color: '#1F2937' },
  { id: 8, name: 'East Secondary', type: 'road', points: [[55, 0, -55], [55, 0, 45]], width: 8, color: '#374151' },
  { id: 9, name: 'Main Gate to Central', type: 'path', points: [[0, 0, 40], [0, 0, 28]], width: 6, color: '#9CA3AF' },
  { id: 10, name: 'Gate to West Road', type: 'path', points: [[0, 0, 40], [-30, 0, 40], [-45, 0, 40]], width: 6, color: '#9CA3AF' },
  { id: 11, name: 'Gate to East Road', type: 'path', points: [[0, 0, 40], [30, 0, 40], [45, 0, 40]], width: 6, color: '#9CA3AF' },
  { id: 12, name: 'Flagpole Plaza Path', type: 'path', points: [[0, 0, 28], [0, 0, 22]], width: 8, color: '#9CA3AF' },
  { id: 13, name: 'Administration Entrance', type: 'path', points: [[0, 0, 15], [0, 0, 20]], width: 6, color: '#9CA3AF' },
  { id: 14, name: 'Admin to West Area', type: 'path', points: [[-5, 0, 20], [-15, 0, 20], [-25, 0, 18]], width: 5, color: '#9CA3AF' },
  { id: 15, name: 'Admin to East Area', type: 'path', points: [[5, 0, 20], [15, 0, 20], [25, 0, 15]], width: 5, color: '#9CA3AF' },
  { id: 16, name: 'West Road to DPT', type: 'path', points: [[-45, 0, -10], [-30, 0, -10], [-20, 0, -15], [-15, 0, -20]], width: 5, color: '#9CA3AF' },
  { id: 17, name: 'DPT to Library', type: 'path', points: [[-8, 0, -15], [-3, 0, -10], [0, 0, -5]], width: 5, color: '#9CA3AF' },
  { id: 18, name: 'Central to BE Building', type: 'path', points: [[0, 0, 0], [10, 0, -10], [15, 0, -20]], width: 5, color: '#9CA3AF' },
  { id: 19, name: 'West Road to GET', type: 'path', points: [[-45, 0, -10], [-38, 0, -10], [-30, 0, -10]], width: 5, color: '#9CA3AF' },
  { id: 20, name: 'West Road to CCS', type: 'path', points: [[-45, 0, 5], [-40, 0, 5], [-35, 0, 5]], width: 5, color: '#9CA3AF' },
  { id: 21, name: 'CCS to Alumni', type: 'path', points: [[-35, 0, 5], [-35, 0, 15], [-35, 0, 25]], width: 5, color: '#9CA3AF' },
  { id: 22, name: 'Gym Access Road', type: 'path', points: [[-45, 0, 15], [-35, 0, 15], [-25, 0, 15]], width: 6, color: '#9CA3AF' },
  { id: 23, name: 'Gym to Student Center', type: 'path', points: [[-25, 0, 15], [-20, 0, 12]], width: 5, color: '#9CA3AF' },
  { id: 24, name: 'Student Center to Chapel', type: 'path', points: [[-20, 0, 10], [-15, 0, 15], [-10, 0, 25], [-10, 0, 30]], width: 5, color: '#9CA3AF' },
  { id: 25, name: 'Central to Cafeteria', type: 'path', points: [[10, 0, 5], [15, 0, 8], [20, 0, 10]], width: 6, color: '#9CA3AF' },
  { id: 26, name: 'East Road to Science', type: 'path', points: [[45, 0, 0], [40, 0, 0], [35, 0, 5]], width: 5, color: '#9CA3AF' },
  { id: 27, name: 'Science to CHE', type: 'path', points: [[35, 0, 5], [32, 0, -5], [30, 0, -10]], width: 5, color: '#9CA3AF' },
  { id: 28, name: 'East Road to Dormitory A', type: 'path', points: [[45, 0, -20], [42, 0, -20], [40, 0, -20]], width: 6, color: '#9CA3AF' },
  { id: 29, name: 'Dorm A to B', type: 'path', points: [[40, 0, -20], [45, 0, -20], [50, 0, -20]], width: 6, color: '#9CA3AF' },
  { id: 30, name: 'Dorm Access to Swimming', type: 'path', points: [[45, 0, -15], [48, 0, -10], [50, 0, 10]], width: 5, color: '#9CA3AF' },
  { id: 31, name: 'Back Area CTE', type: 'path', points: [[0, 0, -25], [0, 0, -30], [0, 0, -35]], width: 5, color: '#9CA3AF' },
  { id: 32, name: 'Central to CTE', type: 'path', points: [[0, 0, -10], [0, 0, -20]], width: 5, color: '#9CA3AF' },
  { id: 33, name: 'West Road to Alumni', type: 'path', points: [[-45, 0, 25], [-40, 0, 25], [-35, 0, 25]], width: 5, color: '#9CA3AF' },
  { id: 34, name: 'Parking Access', type: 'path', points: [[45, 0, 30], [40, 0, 30], [35, 0, 30]], width: 6, color: '#9CA3AF' },
  { id: 35, name: 'Parking to Auditorium', type: 'path', points: [[35, 0, 28], [25, 0, 28], [20, 0, 30]], width: 5, color: '#9CA3AF' },
  { id: 36, name: 'Basketball Court Path', type: 'path', points: [[-45, 0, 25], [-42, 0, 25], [-40, 0, 25]], width: 5, color: '#9CA3AF' },
  { id: 37, name: 'Auditorium Main Path', type: 'path', points: [[20, 0, 25], [18, 0, 28]], width: 6, color: '#9CA3AF' },
  { id: 38, name: 'West Inner Loop', type: 'path', points: [[-30, 0, 0], [-25, 0, -5], [-20, 0, 0], [-25, 0, 5], [-30, 0, 0]], width: 4, color: '#9CA3AF' },
  { id: 39, name: 'East Inner Loop', type: 'path', points: [[30, 0, 0], [25, 0, -5], [20, 0, 0], [25, 0, 5], [30, 0, 0]], width: 4, color: '#9CA3AF' },
  { id: 40, name: 'Cross Central West', type: 'path', points: [[-20, 0, -5], [-10, 0, -5], [0, 0, -5]], width: 4, color: '#9CA3AF' },
  { id: 41, name: 'Cross Central East', type: 'path', points: [[0, 0, 5], [10, 0, 5], [20, 0, 5]], width: 4, color: '#9CA3AF' },
  { id: 42, name: 'Library to West', type: 'path', points: [[-5, 0, 0], [-10, 0, 0], [-15, 0, 0]], width: 4, color: '#9CA3AF' },
  { id: 43, name: 'Library to East', type: 'path', points: [[5, 0, 0], [10, 0, 0], [15, 0, 0]], width: 4, color: '#9CA3AF' },
  
  { id: 44, name: 'Main Gate Loop', type: 'path', points: [[-10, 0, 40], [-20, 0, 42], [0, 0, 45], [20, 0, 42], [10, 0, 40]], width: 5, color: '#9CA3AF' },
  { id: 45, name: 'DPT to GET', type: 'path', points: [[-15, 0, -20], [-22, 0, -15], [-30, 0, -10]], width: 5, color: '#9CA3AF' },
  { id: 46, name: 'BE to CHE', type: 'path', points: [[15, 0, -20], [22, 0, -15], [30, 0, -10]], width: 5, color: '#9CA3AF' },
  { id: 47, name: 'BE to Science', type: 'path', points: [[15, 0, -20], [25, 0, -10], [35, 0, 5]], width: 5, color: '#9CA3AF' },
  { id: 48, name: 'Administration to Chapel', type: 'path', points: [[0, 0, 20], [-5, 0, 25], [-10, 0, 30]], width: 5, color: '#9CA3AF' },
  { id: 49, name: 'Administration to Gym', type: 'path', points: [[0, 0, 20], [-10, 0, 18], [-25, 0, 15]], width: 5, color: '#9CA3AF' },
  { id: 50, name: 'Student Center Loop', type: 'path', points: [[-20, 0, 10], [-18, 0, 5], [-22, 0, 0], [-25, 0, 5], [-22, 0, 12]], width: 4, color: '#9CA3AF' },
  { id: 51, name: 'Cafeteria Loop', type: 'path', points: [[20, 0, 10], [22, 0, 5], [18, 0, 0], [25, 0, 5], [22, 0, 12]], width: 4, color: '#9CA3AF' },
  { id: 52, name: 'LIC to Central Plaza', type: 'path', points: [[0, 0, 0], [0, 0, 8], [0, 0, 15]], width: 6, color: '#9CA3AF' },
  { id: 53, name: 'CTE Loop', type: 'path', points: [[0, 0, -35], [5, 0, -32], [0, 0, -30], [-5, 0, -32]], width: 4, color: '#9CA3AF' },
  { id: 54, name: 'Dorm A Loop', type: 'path', points: [[40, 0, -20], [38, 0, -25], [42, 0, -28], [48, 0, -22], [42, 0, -18]], width: 4, color: '#9CA3AF' },
  { id: 55, name: 'Dorm B Loop', type: 'path', points: [[50, 0, -20], [48, 0, -25], [52, 0, -28], [55, 0, -22], [52, 0, -18]], width: 4, color: '#9CA3AF' },
  { id: 56, name: 'Alumni to Gym', type: 'path', points: [[-35, 0, 25], [-30, 0, 20], [-25, 0, 15]], width: 5, color: '#9CA3AF' },
  { id: 57, name: 'Pool to Auditorium', type: 'path', points: [[50, 0, 10], [35, 0, 15], [25, 0, 22], [20, 0, 30]], width: 5, color: '#9CA3AF' },
  { id: 58, name: 'Parking to Pool', type: 'path', points: [[35, 0, 30], [42, 0, 22], [50, 0, 15]], width: 5, color: '#9CA3AF' },
  { id: 59, name: 'West Gate Access', type: 'path', points: [[-55, 0, 40], [-55, 0, 25], [-55, 0, 10], [-55, 0, -10], [-55, 0, -30], [-55, 0, -50]], width: 6, color: '#9CA3AF' },
  { id: 60, name: 'East Gate Access', type: 'path', points: [[55, 0, 40], [55, 0, 25], [55, 0, 10], [55, 0, -10], [55, 0, -30], [55, 0, -50]], width: 6, color: '#9CA3AF' },
  { id: 61, name: 'Front Walkway', type: 'path', points: [[-55, 0, 40], [-45, 0, 40], [-30, 0, 40], [-15, 0, 40], [0, 0, 40], [15, 0, 40], [30, 0, 40], [45, 0, 40], [55, 0, 40]], width: 5, color: '#D1D5DB' },
  { id: 62, name: 'Back Walkway', type: 'path', points: [[-55, 0, -50], [-45, 0, -50], [-30, 0, -50], [-15, 0, -50], [0, 0, -50], [15, 0, -50], [30, 0, -50], [45, 0, -50], [55, 0, -50]], width: 5, color: '#D1D5DB' },
  { id: 63, name: 'Central Green Link', type: 'path', points: [[-30, 0, -5], [-15, 0, -10], [0, 0, -12], [15, 0, -10], [30, 0, -5]], width: 4, color: '#9CA3AF' },
  { id: 64, name: 'Library Walkway North', type: 'path', points: [[0, 0, -5], [0, 0, -12], [0, 0, -20], [0, 0, -30], [0, 0, -40]], width: 5, color: '#9CA3AF' },
  { id: 65, name: 'Library Walkway South', type: 'path', points: [[0, 0, 5], [0, 0, 12], [0, 0, 20], [0, 0, 30], [0, 0, 35]], width: 5, color: '#9CA3AF' },
  { id: 66, name: 'GET to CCS', type: 'path', points: [[-30, 0, -10], [-32, 0, -2], [-35, 0, 5]], width: 5, color: '#9CA3AF' },
  { id: 67, name: 'Science South Link', type: 'path', points: [[35, 0, 5], [30, 0, 8], [25, 0, 15], [20, 0, 25]], width: 5, color: '#9CA3AF' },
  { id: 68, name: 'Chapel to Main Gate', type: 'path', points: [[-10, 0, 30], [-5, 0, 35], [0, 0, 40]], width: 5, color: '#9CA3AF' },
  { id: 69, name: 'Grand Staircase Path', type: 'path', points: [[0, 0, 15], [-5, 0, 12], [-10, 0, 5], [-15, 0, -5], [-20, 0, -15], [-25, 0, -20]], width: 4, color: '#9CA3AF' },
  { id: 70, name: 'East Staircase Path', type: 'path', points: [[0, 0, 15], [5, 0, 12], [10, 0, 5], [15, 0, -5], [20, 0, -15], [25, 0, -20]], width: 4, color: '#9CA3AF' },
]

export const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      selectedBuilding: null,
      selectedRoom: null,
      viewMode: 'outdoor',
      firstPersonMode: false,
      playerPosition: [0, 1.7, 0],
      playerRotation: 0,
      adminMode: false,
      editingBuilding: null,
      navigationPath: [],
      markers: [],
      paths: [],
      currentFloor: 0,
      savedMaps: [],
      currentMapName: 'Campus',
      showDecorations: false,
      lastSavedMap: null,
      history: [],
      historyIndex: -1,

      _saveToHistory: () => set((state) => {
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push({ markers: state.markers, paths: state.paths })
        if (newHistory.length > 50) newHistory.shift()
        return { history: newHistory, historyIndex: newHistory.length - 1 }
      }),

      undo: () => set((state) => {
        if (state.historyIndex <= 0) return {}
        const newIndex = state.historyIndex - 1
        const prevState = state.history[newIndex]
        return { 
          markers: prevState.markers, 
          paths: prevState.paths,
          historyIndex: newIndex 
        }
      }),

      redo: () => set((state) => {
        if (state.historyIndex >= state.history.length - 1) return {}
        const newIndex = state.historyIndex + 1
        const nextState = state.history[newIndex]
        return { 
          markers: nextState.markers, 
          paths: nextState.paths,
          historyIndex: newIndex 
        }
      }),

      canUndo: () => {
        const state = get()
        return state.historyIndex > 0
      },

      canRedo: () => {
        const state = get()
        return state.historyIndex < state.history.length - 1
      },

      setUser: (user) => set({ user }),
      setSelectedBuilding: (building) => set({ selectedBuilding: building, selectedRoom: null, currentFloor: 0 }),
      setSelectedRoom: (room) => set({ selectedRoom: room }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFirstPersonMode: (mode) => set({ firstPersonMode: mode }),
      setPlayerPosition: (pos) => set({ playerPosition: pos }),
      setPlayerRotation: (rot) => set({ playerRotation: rot }),
      setAdminMode: (mode) => set({ adminMode: mode }),
      setEditingBuilding: (building) => set({ editingBuilding: building }),
      setCurrentFloor: (floor) => set({ currentFloor: floor }),
      setShowDecorations: (show) => set({ showDecorations: show }),
      
      setNavigationPath: (path) => set({ navigationPath: path }),
      clearNavigation: () => set({ navigationPath: [] }),

      updateBuildingPosition: (id, position) => set((state) => ({
        markers: state.markers.map(b => b.id === id ? { ...b, position } : b)
      })),

      updateBuildingRotation: (id, rotation) => set((state) => ({
        markers: state.markers.map(b => b.id === id ? { ...b, rotation } : b)
      })),

      updateBuildingScale: (id, scale) => set((state) => ({
        markers: state.markers.map(b => b.id === id ? { ...b, scale } : b)
      })),

      updateBuilding: (id, updates) => set((state) => {
        const newMarkers = state.markers.map(b => b.id === id ? { ...b, ...updates } : b)
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push({ markers: newMarkers, paths: state.paths })
        if (newHistory.length > 50) newHistory.shift()
        return { 
          markers: newMarkers,
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
      }),

      toggleBuildingLock: (id) => {
        set((state) => {
          const newMarkers = state.markers.map(b => b.id === id ? { ...b, locked: !b.locked } : b)
          try {
            localStorage.setItem('navly_markers', JSON.stringify(newMarkers))
          } catch (e) {}
          return { markers: newMarkers }
        })
      },

      addBuilding: (building) => set((state) => {
        const newMarkers = [...state.markers, { 
          ...building, 
          id: Date.now(),
          position: building.position || [0, 0, 0],
          rotation: 0,
          rotationX: 0,
          rotationZ: 0,
          scale: [1, 1, 1],
          locked: false
        }]
        try {
          localStorage.setItem('navly_markers', JSON.stringify(newMarkers))
        } catch (e) {}
        const newHistory = state.history ? state.history.slice(0, state.historyIndex + 1) : []
        newHistory.push({ markers: newMarkers, paths: state.paths })
        if (newHistory.length > 50) newHistory.shift()
        return { 
          markers: newMarkers,
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
      }),

      deleteBuilding: (id) => set((state) => {
        const newMarkers = state.markers.filter(b => b.id !== id)
        try {
          localStorage.setItem('navly_markers', JSON.stringify(newMarkers))
        } catch (e) {}
        const newHistory = state.history ? state.history.slice(0, state.historyIndex + 1) : []
        newHistory.push({ markers: newMarkers, paths: state.paths })
        if (newHistory.length > 50) newHistory.shift()
        return { 
          markers: newMarkers,
          selectedBuilding: state.selectedBuilding?.id === id ? null : state.selectedBuilding,
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
      }),

      addRoom: (buildingId, floorIndex, room) => set((state) => ({
        markers: state.markers.map(b => {
          if (b.id === buildingId) {
            const floors = [...b.floors]
            floors[floorIndex] = {
              ...floors[floorIndex],
              rooms: [...floors[floorIndex].rooms, { ...room, id: `r${Date.now()}` }]
            }
            return { ...b, floors }
          }
          return b
        })
      })),

      deleteRoom: (buildingId, floorIndex, roomId) => set((state) => ({
        markers: state.markers.map(b => {
          if (b.id === buildingId) {
            const floors = [...b.floors]
            floors[floorIndex] = {
              ...floors[floorIndex],
              rooms: floors[floorIndex].rooms.filter(r => r.id !== roomId)
            }
            return { ...b, floors }
          }
          return b
        })
      })),

      updateRoom: (buildingId, floorIndex, roomId, updates) => set((state) => ({
        markers: state.markers.map(b => {
          if (b.id === buildingId) {
            const floors = [...b.floors]
            floors[floorIndex] = {
              ...floors[floorIndex],
              rooms: floors[floorIndex].rooms.map(r => r.id === roomId ? { ...r, ...updates } : r)
            }
            return { ...b, floors }
          }
          return b
        })
      })),

      addPath: (path) => set((state) => ({
        paths: [...state.paths, { ...path, id: Date.now() }]
      })),

      updatePath: (id, updates) => set((state) => ({
        paths: state.paths.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deletePath: (id) => set((state) => ({
        paths: state.paths.filter(p => p.id !== id),
        selectedPath: state.selectedPath?.id === id ? null : state.selectedPath
      })),

      updatePathPoint: (pathId, pointIndex, newPosition) => set((state) => ({
        paths: state.paths.map(p => {
          if (p.id === pathId) {
            const newPoints = [...p.points]
            newPoints[pointIndex] = newPosition
            return { ...p, points: newPoints }
          }
          return p
        })
      })),

      addPathPoint: (pathId, position) => set((state) => ({
        paths: state.paths.map(p => {
          if (p.id === pathId) {
            return { ...p, points: [...p.points, position] }
          }
          return p
        })
      })),

      setSelectedPath: (path) => set({ selectedPath: path }),

      saveMap: (name) => {
        const state = get()
        const mapData = {
          name,
          buildings: state.markers,
          paths: state.paths,
          savedAt: new Date().toISOString()
        }
        const existingIndex = (state.savedMaps || []).findIndex(m => m.name === name)
        let savedMaps
        if (existingIndex >= 0) {
          savedMaps = [...(state.savedMaps || [])]
          savedMaps[existingIndex] = mapData
        } else {
          savedMaps = [...(state.savedMaps || []), mapData]
        }
        set({ savedMaps, currentMapName: name, markers: state.markers, paths: state.paths, lastSavedMap: mapData })
        return mapData
      },

      loadMap: (mapData) => {
        set({ 
          markers: mapData.buildings, 
          paths: mapData.paths,
          currentMapName: mapData.name,
          lastSavedMap: mapData,
          showDecorations: false
        })
      },

      deleteSavedMap: (index) => set((state) => {
        const mapToDelete = state.savedMaps[index]
        const isCurrentMap = state.currentMapName === mapToDelete?.name
        return {
          savedMaps: state.savedMaps.filter((_, i) => i !== index),
          ...(isCurrentMap ? { lastSavedMap: null, markers: [], paths: [], currentMapName: 'New Map' } : {})
        }
      }),

      resetToDefault: () => set({
        markers: [...defaultBuildings],
        paths: [...defaultPaths],
        currentMapName: 'Campus',
        showDecorations: false,
        lastSavedMap: {
          name: 'Campus',
          buildings: [...defaultBuildings],
          paths: [...defaultPaths],
          savedAt: new Date().toISOString()
        }
      }),

      loadUMMatinaCampus: () => {
        const state = get()
        const mapData = {
          name: 'Campus',
          buildings: [...defaultBuildings],
          paths: [...defaultPaths],
          savedAt: new Date().toISOString()
        }
        const existingIndex = (state.savedMaps || []).findIndex(m => m.name === 'Campus')
        let savedMaps
        if (existingIndex >= 0) {
          savedMaps = [...(state.savedMaps || [])]
          savedMaps[existingIndex] = mapData
        } else {
          savedMaps = [...(state.savedMaps || []), mapData]
        }
        set({ 
          markers: [...defaultBuildings], 
          paths: [...defaultPaths],
          currentMapName: 'Campus',
          lastSavedMap: mapData,
          savedMaps,
          showDecorations: false
        })
      },

      clearMap: () => {
        try {
          localStorage.removeItem('navly_markers')
          localStorage.removeItem('navly_paths')
        } catch (e) {}
        set({
          markers: [],
          paths: [],
          currentMapName: 'New Map',
          showDecorations: false,
          lastSavedMap: null
        })
      },

      loadFromLocalStorage: () => {
        try {
          const savedMarkers = localStorage.getItem('navly_markers')
          const savedPaths = localStorage.getItem('navly_paths')
          set({
            markers: savedMarkers ? JSON.parse(savedMarkers) : [],
            paths: savedPaths ? JSON.parse(savedPaths) : []
          })
        } catch (e) {
          console.error('Failed to load from localStorage', e)
        }
      },

      loadLastSaved: () => {
        const state = get()
        if (state.lastSavedMap) {
          set({
            markers: state.lastSavedMap.buildings,
            paths: state.lastSavedMap.paths,
            currentMapName: state.lastSavedMap.name
          })
        }
      },

      events: [
        { id: 1, title: 'Science Fair 2026', building: 'Science Hall', date: '2026-03-15', time: '09:00 AM', description: 'Annual science exhibition featuring student projects' },
        { id: 2, title: 'Career Day', building: 'Auditorium', date: '2026-03-20', time: '10:00 AM', description: 'Industry professionals sharing career opportunities' },
        { id: 3, title: 'Tech Workshop', building: 'Computer Lab', date: '2026-03-22', time: '02:00 PM', description: 'Web development bootcamp for students' },
      ],
      addEvent: (event) => set((state) => ({ events: [...state.events, { ...event, id: Date.now() }] })),
      deleteEvent: (id) => set((state) => ({ events: state.events.filter(e => e.id !== id) })),

      semesters: [
        { id: 1, name: 'First Semester 2025-2026', startDate: '2025-08-01', endDate: '2025-12-15', status: 'completed' },
        { id: 2, name: 'Second Semester 2025-2026', startDate: '2026-01-15', endDate: '2026-05-30', status: 'active' },
        { id: 3, name: 'Summer Term 2026', startDate: '2026-06-15', endDate: '2026-08-15', status: 'upcoming' },
      ],
      addSemester: (semester) => set((state) => ({ semesters: [...state.semesters, { ...semester, id: Date.now() }] })),
      updateSemester: (id, updates) => set((state) => ({ semesters: state.semesters.map(s => s.id === id ? { ...s, ...updates } : s) })),
      deleteSemester: (id) => set((state) => ({ semesters: state.semesters.filter(s => s.id !== id) })),

      programs: [
        { id: 1, name: 'Bachelor of Elementary Education', code: 'BEEd', dean: '', description: 'Elementary teacher education program (4 years)', category: 'Teacher Education' },
        { id: 2, name: 'Bachelor of Secondary Education - English', code: 'BSEd-ENG', dean: '', description: 'Secondary education major in English (4 years)', category: 'Teacher Education' },
        { id: 3, name: 'Bachelor of Secondary Education - Mathematics', code: 'BSEd-MATH', dean: '', description: 'Secondary education major in Mathematics (4 years)', category: 'Teacher Education' },
        { id: 4, name: 'Bachelor of Secondary Education - Science', code: 'BSEd-SCI', dean: '', description: 'Secondary education major in Science (4 years)', category: 'Teacher Education' },
        { id: 5, name: 'Bachelor of Secondary Education - Social Studies', code: 'BSEd-SS', dean: '', description: 'Secondary education major in Social Studies (4 years)', category: 'Teacher Education' },
        { id: 6, name: 'Bachelor of Secondary Education - Values Education', code: 'BSEd-VE', dean: '', description: 'Secondary education major in Values Education (4 years)', category: 'Teacher Education' },
        { id: 7, name: 'Bachelor of Secondary Education - Filipino', code: 'BSEd-FIL', dean: '', description: 'Secondary education major in Filipino (4 years)', category: 'Teacher Education' },
        { id: 8, name: 'Bachelor of Physical Education', code: 'BPE', dean: '', description: 'Physical education and sports management (4 years)', category: 'Teacher Education' },
        { id: 9, name: 'BS in Accountancy', code: 'BSA', dean: '', description: 'Accountancy program (5 years)', category: 'Business' },
        { id: 10, name: 'BS in Management Accounting', code: 'BSMA', dean: '', description: 'Management accounting program (4 years)', category: 'Business' },
        { id: 11, name: 'BS in Accounting Information System', code: 'BSAIS', dean: '', description: 'Accounting with IT integration (4 years)', category: 'Business' },
        { id: 12, name: 'BS in Business Administration - Financial Management', code: 'BSBA-FM', dean: '', description: 'Business administration major in Financial Management (4 years)', category: 'Business' },
        { id: 13, name: 'BS in Business Administration - Human Resource Management', code: 'BSBA-HRM', dean: '', description: 'Business administration major in HRM (4 years)', category: 'Business' },
        { id: 14, name: 'BS in Business Administration - Marketing Management', code: 'BSBA-MM', dean: '', description: 'Business administration major in Marketing (4 years)', category: 'Business' },
        { id: 15, name: 'BS in Tourism Management', code: 'BSTM', dean: '', description: 'Tourism and hospitality management (4 years)', category: 'Hospitality' },
        { id: 16, name: 'BS in Criminology', code: 'BSCrim', dean: '', description: 'Criminology and law enforcement (4 years)', category: 'Criminal Justice' },
        { id: 17, name: 'BS in Computer Engineering', code: 'BSCpE', dean: '', description: 'Computer engineering (5 years)', category: 'Engineering' },
        { id: 18, name: 'BS in Information Technology', code: 'BSIT', dean: '', description: 'Information technology (4 years)', category: 'Computing' },
        { id: 19, name: 'BS in Psychology', code: 'BS Psych', dean: '', description: 'Psychology program (4 years)', category: 'Arts & Sciences' },
        { id: 20, name: 'Bachelor of Arts in Political Science', code: 'AB PolSci', dean: '', description: 'Political science arts program (4 years)', category: 'Arts & Sciences' },
        { id: 21, name: 'Bachelor of Arts in Communication', code: 'AB Comm', dean: '', description: 'Communication arts program (4 years)', category: 'Arts & Sciences' },
        { id: 22, name: 'BS in Social Work', code: 'BS SW', dean: '', description: 'Social work program (4 years)', category: 'Arts & Sciences' },
      ],
      addProgram: (program) => set((state) => ({ programs: [...state.programs, { ...program, id: Date.now() }] })),
      updateProgram: (id, updates) => set((state) => ({ programs: state.programs.map(p => p.id === id ? { ...p, ...updates } : p) })),
      deleteProgram: (id) => set((state) => ({ programs: state.programs.filter(p => p.id !== id) })),

      departments: [
        { id: 1, name: 'Elementary Education Department', code: 'ELED', head: '', description: 'Bachelor of Elementary Education (BEEd) - prepares teachers for elementary level' },
        { id: 2, name: 'Secondary Education Department', code: 'SEDED', head: '', description: 'Bachelor of Secondary Education (BSEd) - majors in English, Math, Science, Filipino, Social Studies, Values Education' },
        { id: 3, name: 'Accountancy Department', code: 'ACCT', head: '', description: 'Bachelor of Science in Accountancy (BSA)' },
        { id: 4, name: 'Management Accounting Department', code: 'MACT', head: '', description: 'Bachelor of Science in Management Accounting (BSMA)' },
        { id: 5, name: 'Business Administration Department', code: 'BUS', head: '', description: 'Bachelor of Science in Business Administration (BSBA) - Marketing, HRM, Financial Management' },
        { id: 6, name: 'Information Technology Department', code: 'IT', head: '', description: 'Bachelor of Science in Information Technology (BSIT)' },
        { id: 7, name: 'Computer Science Department', code: 'CS', head: '', description: 'Bachelor of Science in Computer Science (BSCS) - Cybersecurity and AI specializations' },
        { id: 8, name: 'Criminology Department', code: 'CRM', head: '', description: 'Bachelor of Science in Criminology (BSCrim)' },
        { id: 9, name: 'Political Science Department', code: 'POL', head: '', description: 'Bachelor of Arts in Political Science (AB PolSci)' },
        { id: 10, name: 'Psychology Department', code: 'PSY', head: '', description: 'Bachelor of Science in Psychology (BS Psych)' },
        { id: 11, name: 'Tourism Management Department', code: 'TM', head: '', description: 'Bachelor of Science in Tourism Management (BSTM)' },
      ],
      addDepartment: (dept) => set((state) => ({ departments: [...state.departments, { ...dept, id: Date.now() }] })),
      updateDepartment: (id, updates) => set((state) => ({ departments: state.departments.map(d => d.id === id ? { ...d, ...updates } : d) })),
      deleteDepartment: (id) => set((state) => ({ departments: state.departments.filter(d => d.id !== id) })),

      courses: defaultCourses,
      addCourse: (course) => set((state) => ({ courses: [...state.courses, { ...course, id: Date.now(), enrolled: 0 }] })),
      updateCourse: (id, updates) => set((state) => ({ courses: state.courses.map(c => c.id === id ? { ...c, ...updates } : c) })),
      deleteCourse: (id) => set((state) => ({ courses: state.courses.filter(c => c.id !== id) })),

      rooms: [
        { id: 1, name: 'Room 101', building: 'Main Building', floor: 1, capacity: 40, type: 'classroom' },
        { id: 2, name: 'Room 102', building: 'Main Building', floor: 1, capacity: 30, type: 'classroom' },
        { id: 3, name: 'Room 103', building: 'Main Building', floor: 1, capacity: 35, type: 'classroom' },
        { id: 4, name: 'Room 104', building: 'Main Building', floor: 1, capacity: 35, type: 'classroom' },
        { id: 5, name: 'Room 105', building: 'Main Building', floor: 1, capacity: 30, type: 'classroom' },
        { id: 6, name: 'Room 201', building: 'Main Building', floor: 2, capacity: 40, type: 'classroom' },
        { id: 7, name: 'Room 202', building: 'Main Building', floor: 2, capacity: 35, type: 'classroom' },
        { id: 8, name: 'Room 301', building: 'Main Building', floor: 3, capacity: 30, type: 'classroom' },
        { id: 9, name: 'Lecture Hall A', building: 'Main Building', floor: 2, capacity: 80, type: 'lecture' },
        { id: 10, name: 'Lecture Hall B', building: 'Main Building', floor: 2, capacity: 60, type: 'lecture' },
        { id: 11, name: 'Lab 1', building: 'Computer Lab', floor: 1, capacity: 30, type: 'laboratory' },
        { id: 12, name: 'Lab 2', building: 'Computer Lab', floor: 1, capacity: 30, type: 'laboratory' },
        { id: 13, name: 'Science Lab 1', building: 'Science Hall', floor: 1, capacity: 25, type: 'laboratory' },
        { id: 14, name: 'Science Lab 2', building: 'Science Hall', floor: 1, capacity: 25, type: 'laboratory' },
        { id: 15, name: 'Main Court', building: 'Gymnasium', floor: 1, capacity: 500, type: 'gym' },
      ],
      addAcademicRoom: (room) => set((state) => ({ rooms: [...state.rooms, { ...room, id: Date.now() }] })),
      updateAcademicRoom: (id, updates) => set((state) => ({ rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r) })),
      deleteAcademicRoom: (id) => set((state) => ({ rooms: state.rooms.filter(r => r.id !== id) })),

      schedules: [
        { id: 1, course: 'BEEd-101', room: 'Room 101', day: 'Monday', startTime: '08:00', endTime: '10:30', semester: 1, instructor: 'Prof. John Smith' },
        { id: 2, course: 'BEEd-102', room: 'Room 102', day: 'Tuesday', startTime: '10:00', endTime: '12:30', semester: 1, instructor: 'Prof. John Smith' },
        { id: 3, course: 'BEEd-107', room: 'Lecture Hall A', day: 'Wednesday', startTime: '13:00', endTime: '15:30', semester: 2, instructor: 'Prof. Sarah Johnson' },
        { id: 4, course: 'BEEd-108', room: 'Lab 1', day: 'Thursday', startTime: '09:00', endTime: '11:30', semester: 2, instructor: 'Prof. Sarah Johnson' },
        { id: 5, course: 'BSEd-ENG-101', room: 'Room 103', day: 'Monday', startTime: '11:00', endTime: '12:30', semester: 1, instructor: 'Prof. Michael Davis' },
        { id: 6, course: 'BSEd-ENG-102', room: 'Room 104', day: 'Wednesday', startTime: '11:00', endTime: '12:30', semester: 1, instructor: 'Prof. Michael Davis' },
        { id: 7, course: 'BSEd-ENG-107', room: 'Room 201', day: 'Tuesday', startTime: '08:00', endTime: '10:30', semester: 2, instructor: 'Dr. Emily Brown' },
        { id: 8, course: 'BSEd-ENG-108', room: 'Room 202', day: 'Thursday', startTime: '08:00', endTime: '10:30', semester: 2, instructor: 'Dr. Emily Brown' },
        { id: 9, course: 'CS 101', room: 'Room 101', day: 'Monday', startTime: '08:00', endTime: '10:30', semester: 2, instructor: 'Prof. John Smith' },
        { id: 10, course: 'CS 102', room: 'Room 102', day: 'Tuesday', startTime: '10:00', endTime: '12:30', semester: 2, instructor: 'Prof. John Smith' },
        { id: 11, course: 'CS 201', room: 'Lecture Hall A', day: 'Wednesday', startTime: '13:00', endTime: '15:30', semester: 2, instructor: 'Prof. Sarah Johnson' },
        { id: 12, course: 'CS 202', room: 'Lab 1', day: 'Thursday', startTime: '09:00', endTime: '11:30', semester: 2, instructor: 'Prof. Sarah Johnson' },
        { id: 13, course: 'CS 301', room: 'Lecture Hall B', day: 'Friday', startTime: '14:00', endTime: '16:30', semester: 2, instructor: 'Prof. Sarah Johnson' },
        { id: 14, course: 'MATH 101', room: 'Room 201', day: 'Monday', startTime: '11:00', endTime: '12:30', semester: 2, instructor: 'Prof. Michael Davis' },
        { id: 15, course: 'MATH 102', room: 'Room 201', day: 'Wednesday', startTime: '11:00', endTime: '12:30', semester: 2, instructor: 'Prof. Michael Davis' },
        { id: 16, course: 'ENG 101', room: 'Room 102', day: 'Tuesday', startTime: '08:00', endTime: '10:30', semester: 2, instructor: 'Dr. Emily Brown' },
        { id: 17, course: 'ENG 102', room: 'Room 103', day: 'Thursday', startTime: '08:00', endTime: '10:30', semester: 2, instructor: 'Dr. Emily Brown' },
        { id: 18, course: 'PHYS 101', room: 'Science Lab 1', day: 'Monday', startTime: '14:00', endTime: '17:00', semester: 2, instructor: 'Dr. Robert Lee' },
        { id: 19, course: 'BUS 101', room: 'Room 301', day: 'Tuesday', startTime: '13:00', endTime: '15:30', semester: 2, instructor: 'Prof. Amanda White' },
        { id: 20, course: 'ART 101', room: 'Room 105', day: 'Friday', startTime: '09:00', endTime: '12:00', semester: 2, instructor: 'Prof. Lisa Garcia' },
        { id: 21, course: 'PE 101', room: 'Main Court', day: 'Wednesday', startTime: '15:00', endTime: '17:00', semester: 2, instructor: 'Coach Mark Thompson' },
      ],
      addSchedule: (schedule) => set((state) => ({ schedules: [...state.schedules, { ...schedule, id: Date.now() }] })),
      updateSchedule: (id, updates) => set((state) => ({ schedules: state.schedules.map(s => s.id === id ? { ...s, ...updates } : s) })),
      deleteSchedule: (id) => set((state) => ({ schedules: state.schedules.filter(s => s.id !== id) })),

      students: [
        { id: 1, studentId: '2024-0001', name: 'John Doe', email: 'student@navly.edu', year: 1, department: 'CS', status: 'active', enrolledCourses: [1, 2], assignedRoom: 'Room 101', building: 'Main Building' },
        { id: 2, studentId: '2024-0002', name: 'Jane Smith', email: 'jane.smith@navly.edu', year: 2, department: 'ENG', status: 'active', enrolledCourses: [11, 12], assignedRoom: 'Room 102', building: 'Main Building' },
        { id: 3, studentId: '2024-0003', name: 'Bob Wilson', email: 'bob.wilson@navly.edu', year: 1, department: 'BUS', status: 'active', enrolledCourses: [15, 16], assignedRoom: 'Room 103', building: 'Main Building' },
        { id: 4, studentId: '2024-0004', name: 'Alice Brown', email: 'alice.b@navly.edu', year: 3, department: 'CS', status: 'active', enrolledCourses: [1, 2, 5], assignedRoom: 'Room 104', building: 'Main Building' },
        { id: 5, studentId: '2024-0005', name: 'Charlie Davis', email: 'charlie.d@navly.edu', year: 2, department: 'MATH', status: 'active', enrolledCourses: [8, 9, 10], assignedRoom: 'Room 105', building: 'Main Building' },
        { id: 6, studentId: '2024-0006', name: 'Diana Martinez', email: 'diana.m@navly.edu', year: 1, department: 'PHYS', status: 'active', enrolledCourses: [13, 14], assignedRoom: 'Room 106', building: 'Main Building' },
      ],
      addStudent: (student) => set((state) => ({ students: [...state.students, { ...student, id: Date.now() }] })),
      updateStudent: (id, updates) => set((state) => ({ students: state.students.map(s => s.id === id ? { ...s, ...updates } : s) })),
      deleteStudent: (id) => set((state) => ({ students: state.students.filter(s => s.id !== id) })),
      enrollCourse: (studentId, courseId) => set((state) => {
        const student = state.students.find(s => s.id === studentId)
        const course = state.courses.find(c => c.id === courseId)
        const schedules = state.schedules.filter(s => s.course === course?.code)
        
        let assignedRoom = student?.assignedRoom
        let building = student?.building
        
        if (schedules.length > 0 && schedules[0].room) {
          assignedRoom = schedules[0].room
          for (const b of state.markers) {
            for (const floor of b.floors || []) {
              const room = floor.rooms?.find(r => r.name === schedules[0].room)
              if (room) {
                building = b.name
                break
              }
            }
          }
        }
        
        return {
          students: state.students.map(s => s.id === studentId ? { 
            ...s, 
            enrolledCourses: [...(s.enrolledCourses || []), courseId],
            assignedRoom: assignedRoom || s.assignedRoom,
            building: building || s.building
          } : s)
        }
      }),
      dropCourse: (studentId, courseId) => set((state) => ({
        students: state.students.map(s => s.id === studentId ? { ...s, enrolledCourses: (s.enrolledCourses || []).filter(c => c !== courseId) } : s)
      })),
      assignRoomToStudent: (studentId, room, building) => set((state) => ({
        students: state.students.map(s => s.id === studentId ? { ...s, assignedRoom: room, building: building } : s)
      })),
      autoAssignRooms: () => set((state) => {
        const updatedStudents = state.students.map(student => {
          if (!student.enrolledCourses || student.enrolledCourses.length === 0) return student
          
          const firstCourse = state.courses.find(c => c.id === student.enrolledCourses[0])
          if (!firstCourse) return student
          
          const schedule = state.schedules.find(s => s.course === firstCourse.code)
          if (!schedule || !schedule.room) return student
          
          let roomBuilding = 'Main Building'
          for (const b of state.markers) {
            for (const floor of b.floors || []) {
              const room = floor.rooms?.find(r => r.name === schedule.room)
              if (room) {
                roomBuilding = b.name
                break
              }
            }
          }
          
          return { ...student, assignedRoom: schedule.room, building: roomBuilding }
        })
        return { students: updatedStudents }
      }),

      instructors: [
        { id: 1, name: 'Prof. John Smith', email: 'john.smith@navly.edu', department: 'CS', specialties: ['CS 101', 'CS 102', 'CS 201'], office: 'Main Building Room 301', phone: '555-0101', assignedRoom: 'Lecture Hall A', building: 'Main Building' },
        { id: 2, name: 'Prof. Sarah Johnson', email: 'sarah.johnson@navly.edu', department: 'CS', specialties: ['CS 201', 'CS 202', 'CS 301'], office: 'Main Building Room 302', phone: '555-0102', assignedRoom: 'Lecture Hall B', building: 'Main Building' },
        { id: 3, name: 'Prof. Michael Davis', email: 'michael.davis@navly.edu', department: 'MATH', specialties: ['MATH 101', 'MATH 102', 'MATH 201'], office: 'Main Building Room 201', phone: '555-0103', assignedRoom: 'Room 201', building: 'Main Building' },
        { id: 4, name: 'Dr. Emily Brown', email: 'emily.brown@navly.edu', department: 'ENG', specialties: ['ENG 101', 'ENG 102'], office: 'Main Building Room 102', phone: '555-0104', assignedRoom: 'Room 102', building: 'Main Building' },
        { id: 5, name: 'Dr. Robert Lee', email: 'robert.lee@navly.edu', department: 'PHYS', specialties: ['PHYS 101', 'PHYS 102'], office: 'Science Hall Room 201', phone: '555-0105', assignedRoom: 'Science Lab 1', building: 'Science Hall' },
        { id: 6, name: 'Prof. Amanda White', email: 'amanda.white@navly.edu', department: 'BUS', specialties: ['BUS 101', 'BUS 201'], office: 'Main Building Room 401', phone: '555-0106', assignedRoom: 'Room 301', building: 'Main Building' },
        { id: 7, name: 'Prof. David Wilson', email: 'david.wilson@navly.edu', department: 'CS', specialties: ['CS 301', 'CS 302', 'CS 401'], office: 'Computer Lab Room 201', phone: '555-0107', assignedRoom: 'Lab 1', building: 'Computer Lab' },
        { id: 8, name: 'Prof. Lisa Garcia', email: 'lisa.garcia@navly.edu', department: 'ART', specialties: ['ART 101'], office: 'Main Building Room 105', phone: '555-0108', assignedRoom: 'Room 105', building: 'Main Building' },
        { id: 9, name: 'Coach Mark Thompson', email: 'mark.thompson@navly.edu', department: 'PE', specialties: ['PE 101'], office: 'Gymnasium Room 101', phone: '555-0109', assignedRoom: 'Main Court', building: 'Gymnasium' },
      ],
      addInstructor: (instructor) => set((state) => ({ instructors: [...state.instructors, { ...instructor, id: Date.now() }] })),
      updateInstructor: (id, updates) => set((state) => ({ instructors: state.instructors.map(i => i.id === id ? { ...i, ...updates } : i) })),
      deleteInstructor: (id) => set((state) => ({ instructors: state.instructors.filter(i => i.id !== id) })),
      getInstructorBySpecialty: (courseCode) => {
        const state = get()
        return state.instructors.find(i => i.specialties?.includes(courseCode))
      },
      assignRoomToInstructor: (instructorId, room, building) => set((state) => ({
        instructors: state.instructors.map(i => i.id === instructorId ? { ...i, assignedRoom: room, building: building } : i)
      })),
      autoAssignInstructorRooms: () => set((state) => {
        const updatedInstructors = state.instructors.map(instructor => {
          if (!instructor.specialties || instructor.specialties.length === 0) return instructor
          
          const firstSpecialty = instructor.specialties[0]
          const schedule = state.schedules.find(s => s.course === firstSpecialty)
          
          if (!schedule || !schedule.room) return instructor
          
          let roomBuilding = 'Main Building'
          for (const b of state.markers) {
            for (const floor of b.floors || []) {
              const room = floor.rooms?.find(r => r.name === schedule.room)
              if (room) {
                roomBuilding = b.name
                break
              }
            }
          }
          
          return { ...instructor, assignedRoom: schedule.room, building: roomBuilding }
        })
        return { instructors: updatedInstructors }
      }),

      accounts: [
        { id: 1, email: 'admin@navly.edu', password: 'admin123', name: 'Administrator', role: 'admin', createdAt: '2025-01-01' },
        { id: 2, email: 'john.smith@navly.edu', password: 'instructor123', name: 'Prof. John Smith', role: 'instructor', department: 'CS', createdAt: '2025-01-01' },
        { id: 3, email: 'student@navly.edu', password: 'student123', name: 'John Doe', role: 'user', studentId: '2024-0001', department: 'CS', createdAt: '2025-01-01' },
        { id: 4, email: 'sarah.johnson@navly.edu', password: 'instructor123', name: 'Prof. Sarah Johnson', role: 'instructor', department: 'CS', createdAt: '2025-01-01' },
        { id: 5, email: 'michael.davis@navly.edu', password: 'instructor123', name: 'Prof. Michael Davis', role: 'instructor', department: 'MATH', createdAt: '2025-01-01' },
      ],
      addAccount: (account) => set((state) => {
        const existingCount = state.accounts ? state.accounts.length : 0
        const year = new Date().getFullYear() % 100
        
        let newAccount = { ...account, id: Date.now(), createdAt: new Date().toISOString() }
        
        if (account.role === 'user') {
          newAccount.studentId = account.studentId || `${year}${String(existingCount + 1).padStart(3, '0')}`
        } else if (account.role === 'instructor') {
          newAccount.teacherId = account.teacherId || `T${String(existingCount + 1).padStart(4, '0')}`
        }
        
        const updates = { accounts: [...(state.accounts || []), newAccount] }
        
        if (account.role === 'user') {
          const userYear = account.year || 1
          const courseCode = account.course || ''
          
          const enrolledCourseIds = state.courses
            .filter(c => {
              const coursePrefix = courseCode.split('-')[0]
              return c.code.startsWith(coursePrefix) && c.year === userYear
            })
            .map(c => c.id)
          
          const studentData = {
            name: account.name,
            email: account.email,
            studentId: newAccount.studentId,
            year: userYear,
            department: account.department,
            course: courseCode,
            major: account.major || '',
            college: account.college || '',
            studentType: account.studentType || 'new',
            status: 'active',
            enrolledCourses: enrolledCourseIds,
            personalInfo: account.personalInfo || {},
            contactInfo: account.contactInfo || {}
          }
          updates.students = [...(state.students || []), { ...studentData, id: Date.now() }]
        } else if (account.role === 'instructor') {
          const deptCode = account.department || ''
          const instructorSpecialties = state.courses
            .filter(c => c.department === deptCode && c.category === 'Major')
            .slice(0, 5)
            .map(c => c.code)
          
          const instructorData = {
            name: account.name,
            email: account.email,
            teacherId: newAccount.teacherId,
            department: deptCode,
            position: account.position || 'Ms',
            office: account.office || '',
            specialties: instructorSpecialties,
            assignedRoom: '',
            building: '',
            personalInfo: account.personalInfo || {},
            contactInfo: account.contactInfo || {}
          }
          updates.instructors = [...(state.instructors || []), { ...instructorData, id: Date.now() }]
        }
        
        return updates
      }),
      login: (email, password, role, loginData = {}) => {
        const state = get()
        
        if (role === 'admin') {
          const account = state.accounts?.find(a => a.email === email && a.password === password && a.role === 'admin')
          if (account) return account
          
          const adminFromAccounts = state.accounts?.find(a => a.role === 'admin')
          if (adminFromAccounts) return adminFromAccounts
          return null
        }
        
        if (role === 'user') {
          let account = state.students?.find(s => String(s.studentId) === String(email))
          if (account) {
            return { ...account, role: 'user' }
          }
          
          account = state.accounts?.find(a => 
            String(a.studentId) === String(email) && 
            a.role === 'user'
          )
          if (account) {
            const studentData = state.students?.find(s => s.studentId === account.studentId)
            return { ...account, ...studentData, role: 'user' }
          }
          
          return null
        }
        
        if (role === 'instructor') {
          let account = state.accounts?.find(a => 
            a.teacherId === email && 
            a.role === 'instructor'
          )
          if (account) return account
          
          account = state.instructors?.find(i => i.teacherId === email)
          if (account) {
            return { ...account, role: 'instructor' }
          }
          return null
        }
        
        return null
      },
      getAccountByEmail: (email) => {
        const state = get()
        return state.accounts.find(a => a.email === email)
      },
      initializeAccounts: () => {
        const state = get()
        const hasAccounts = state.accounts && state.accounts.length > 0
        
        if (!hasAccounts) {
          const newAccounts = [
            { id: 1, email: 'admin@navly.edu', password: 'admin123', name: 'Administrator', role: 'admin', createdAt: '2025-01-01' },
            { id: 2, teacherId: 'T0001', password: 'teacher123', name: 'Ms. Sarah Johnson', role: 'instructor', department: 'EDUC', position: 'Ms', createdAt: '2025-01-01' },
            { id: 3, teacherId: 'T0002', password: 'teacher123', name: 'Ms. Michael Davis', role: 'instructor', department: 'BUS', position: 'Ms', createdAt: '2025-01-01' },
            { id: 4, studentId: '24001', password: 'student123', name: 'John Doe', role: 'user', course: 'BEEd', department: 'Education', year: 1, studentType: 'new', createdAt: '2025-01-01', enrolledCourses: [1, 2, 7, 8] },
            { id: 5, studentId: '24002', password: 'student123', name: 'Jane Smith', role: 'user', course: 'BSEd-ENG', department: 'Education', year: 2, studentType: 'new', createdAt: '2025-01-01', enrolledCourses: [32, 33, 38, 39] },
          ]
          const newStudents = [
            { id: 1, studentId: '24001', name: 'John Doe', email: 'student@navly.edu', year: 1, department: 'Education', course: 'BEEd', status: 'active', enrolledCourses: [1, 2, 7, 8] },
            { id: 2, studentId: '24002', name: 'Jane Smith', email: 'jane.smith@navly.edu', year: 2, department: 'Education', course: 'BSEd-ENG', status: 'active', enrolledCourses: [32, 33, 38, 39] },
          ]
          set({ 
            accounts: newAccounts,
            students: newStudents
          })
        }
      },
    }),
    {
      name: 'um-digos-campus-v2',
      partialize: (state) => ({ 
        markers: state.markers, 
        paths: state.paths, 
        savedMaps: state.savedMaps,
        currentMapName: state.currentMapName,
        accounts: state.accounts,
        students: state.students,
        instructors: state.instructors,
        showDecorations: false,
        lastSavedMap: state.lastSavedMap
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always start fresh — no lingering navigation paths or UI state
          state.showDecorations = false
          state.navigationPath = []
          state.adminMode = false
          state.viewMode = 'outdoor'
          state.selectedBuilding = null
          state.selectedRoom = null
          state.editingBuilding = null
        }
      },
    }
  )
)
