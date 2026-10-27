import { getOverallStatus } from './thresholds';

export type DeviceStatus = 'connected' | 'disconnected' | 'low_battery';
export type PatientStatus = 'stable' | 'attention' | 'critical' | 'offline';

export interface VitalHistory {
  time: string;
  heartRate: number;
  spo2: number;
  systolicBP: number;
  diastolicBP: number;
  temperature: number;
}

export interface Alert {
  id: string;
  patientId: string;
  type: 'critical' | 'high' | 'medium';
  message: string;
  detail: string;
  time: string;
  acknowledged: boolean;
  resolved: boolean;
  assignedTo?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  type: 'alert' | 'medication' | 'device' | 'vitals' | 'note';
  message: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  room: string;
  avatar: string;
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  spo2: number;
  temperature: number;
  status: PatientStatus;
  deviceStatus: DeviceStatus;
  battery: number;
  signal: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  lastUpdated: string;
  deviceId: string;
  lastSync: string;
  history: VitalHistory[];
  timeline: TimelineEvent[];
  alerts: Alert[];
  diagnosis: string;
  admittedDate: string;
  doctor: string;
}

function generateHistory(baseHR: number, baseSpo2: number, baseSys: number, baseDia: number, baseTemp: number): VitalHistory[] {
  const now = Date.now();
  return Array.from({ length: 48 }, (_, i) => {
    const t = new Date(now - (47 - i) * 30 * 60 * 1000);
    const phase = i / 4;
    const hrWave = Math.sin(phase) * 6;
    const spo2Wave = Math.cos(phase * 1.2) * 1.5;
    const sysWave = Math.sin(phase * 0.9) * 8;
    const diaWave = Math.cos(phase * 1.4) * 5;
    const tempWave = Math.sin(phase * 0.7) * 0.2;

    return {
      time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      heartRate: Math.round(baseHR + hrWave),
      spo2: Math.min(100, Math.max(88, Math.round(baseSpo2 + spo2Wave))),
      systolicBP: Math.round(baseSys + sysWave),
      diastolicBP: Math.round(baseDia + diaWave),
      temperature: parseFloat((baseTemp + tempWave).toFixed(1)),
    };
  });
}

export const PATIENTS_DATA: Patient[] = [
  {
    id: 'PC-20481', name: 'Emma Wilson', age: 54, gender: 'F', room: '204',
    avatar: 'EW', heartRate: 72, systolicBP: 118, diastolicBP: 76, spo2: 98, temperature: 36.7,
    status: 'stable', deviceStatus: 'connected', battery: 84, signal: 'Excellent',
    lastUpdated: '2s ago', deviceId: 'PC-WB-8821', lastSync: '2 seconds ago',
    diagnosis: 'Post-operative cardiac monitoring', admittedDate: '2026-09-02', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(72, 98, 118, 76, 36.7),
    timeline: [
      { id: 't1', time: '12:42 PM', type: 'vitals', message: 'Morning vitals recorded — all within normal range' },
      { id: 't2', time: '11:15 AM', type: 'medication', message: 'Metoprolol 25mg administered' },
      { id: 't3', time: '09:02 AM', type: 'device', message: 'PulseCare Band reconnected after charge' },
      { id: 't4', time: '08:30 AM', type: 'vitals', message: 'Morning vitals received from wearable' },
      { id: 't5', time: '07:45 AM', type: 'note', message: 'Patient reports feeling well, no complaints' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20482', name: 'James Carter', age: 67, gender: 'M', room: '211',
    avatar: 'JC', heartRate: 104, systolicBP: 142, diastolicBP: 91, spo2: 94, temperature: 37.1,
    status: 'attention', deviceStatus: 'connected', battery: 61, signal: 'Good',
    lastUpdated: '5s ago', deviceId: 'PC-WB-8834', lastSync: '5 seconds ago',
    diagnosis: 'Hypertensive crisis monitoring', admittedDate: '2026-09-05', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(104, 94, 142, 91, 37.1),
    timeline: [
      { id: 't1', time: '12:38 PM', type: 'alert', message: 'Heart rate elevated to 104 BPM — flagged for attention' },
      { id: 't2', time: '11:50 AM', type: 'medication', message: 'Amlodipine 5mg administered' },
      { id: 't3', time: '10:20 AM', type: 'vitals', message: 'Blood pressure elevated: 142/91 mmHg' },
      { id: 't4', time: '09:10 AM', type: 'device', message: 'Device connected, monitoring started' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20483', name: 'Olivia Brown', age: 72, gender: 'F', room: '319',
    avatar: 'OB', heartRate: 126, systolicBP: 156, diastolicBP: 98, spo2: 89, temperature: 38.2,
    status: 'critical', deviceStatus: 'connected', battery: 42, signal: 'Good',
    lastUpdated: '3s ago', deviceId: 'PC-WB-9102', lastSync: '3 seconds ago',
    diagnosis: 'Respiratory distress, COPD exacerbation', admittedDate: '2026-09-06', doctor: 'Dr. Marcus Reid',
    history: generateHistory(126, 89, 156, 98, 38.2),
    timeline: [
      { id: 't1', time: '12:42 PM', type: 'alert', message: 'SpO₂ critically low — 89%, alert sent to Dr. Reid' },
      { id: 't2', time: '12:38 PM', type: 'alert', message: 'Heart rate increased to 126 BPM' },
      { id: 't3', time: '12:20 PM', type: 'medication', message: 'Salbutamol nebulizer administered' },
      { id: 't4', time: '11:00 AM', type: 'vitals', message: 'Oxygen saturation declining trend noted' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20484', name: 'Michael Davis', age: 45, gender: 'M', room: '108',
    avatar: 'MD', heartRate: 68, systolicBP: 112, diastolicBP: 72, spo2: 99, temperature: 36.5,
    status: 'stable', deviceStatus: 'connected', battery: 91, signal: 'Excellent',
    lastUpdated: '1s ago', deviceId: 'PC-WB-8805', lastSync: '1 second ago',
    diagnosis: 'Routine post-surgical monitoring', admittedDate: '2026-09-04', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(68, 99, 112, 72, 36.5),
    timeline: [
      { id: 't1', time: '12:00 PM', type: 'vitals', message: 'All vitals stable, trending positively' },
      { id: 't2', time: '10:30 AM', type: 'medication', message: 'Pain management — Acetaminophen 500mg' },
      { id: 't3', time: '08:00 AM', type: 'device', message: 'Device connected, monitoring active' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20485', name: 'Sophia Martinez', age: 38, gender: 'F', room: '215',
    avatar: 'SM', heartRate: 88, systolicBP: 124, diastolicBP: 80, spo2: 97, temperature: 36.9,
    status: 'stable', deviceStatus: 'connected', battery: 73, signal: 'Excellent',
    lastUpdated: '4s ago', deviceId: 'PC-WB-8912', lastSync: '4 seconds ago',
    diagnosis: 'Cardiac arrhythmia observation', admittedDate: '2026-09-03', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(88, 97, 124, 80, 36.9),
    timeline: [
      { id: 't1', time: '11:45 AM', type: 'vitals', message: 'Rhythm stable, no arrhythmia detected' },
      { id: 't2', time: '09:15 AM', type: 'note', message: 'ECG reviewed — sinus rhythm confirmed' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20486', name: 'Robert Chen', age: 61, gender: 'M', room: '302',
    avatar: 'RC', heartRate: 79, systolicBP: 138, diastolicBP: 87, spo2: 96, temperature: 37.2,
    status: 'attention', deviceStatus: 'connected', battery: 55, signal: 'Good',
    lastUpdated: '8s ago', deviceId: 'PC-WB-8867', lastSync: '8 seconds ago',
    diagnosis: 'Diabetic ketoacidosis recovery', admittedDate: '2026-09-01', doctor: 'Dr. Marcus Reid',
    history: generateHistory(79, 96, 138, 87, 37.2),
    timeline: [
      { id: 't1', time: '12:10 PM', type: 'vitals', message: 'Blood pressure slightly elevated — monitoring' },
      { id: 't2', time: '10:00 AM', type: 'medication', message: 'Insulin drip adjusted' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20487', name: 'Anna Thompson', age: 29, gender: 'F', room: '112',
    avatar: 'AT', heartRate: 74, systolicBP: 110, diastolicBP: 68, spo2: 99, temperature: 36.6,
    status: 'stable', deviceStatus: 'connected', battery: 88, signal: 'Excellent',
    lastUpdated: '2s ago', deviceId: 'PC-WB-8921', lastSync: '2 seconds ago',
    diagnosis: 'Post-partum monitoring', admittedDate: '2026-09-06', doctor: 'Dr. Lisa Park',
    history: generateHistory(74, 99, 110, 68, 36.6),
    timeline: [
      { id: 't1', time: '12:30 PM', type: 'vitals', message: 'Vitals excellent, recovery progressing well' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20488', name: 'David Kim', age: 55, gender: 'M', room: '224',
    avatar: 'DK', heartRate: 92, systolicBP: 145, diastolicBP: 93, spo2: 95, temperature: 37.4,
    status: 'attention', deviceStatus: 'connected', battery: 67, signal: 'Good',
    lastUpdated: '6s ago', deviceId: 'PC-WB-8878', lastSync: '6 seconds ago',
    diagnosis: 'Atrial fibrillation management', admittedDate: '2026-09-04', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(92, 95, 145, 93, 37.4),
    timeline: [
      { id: 't1', time: '12:15 PM', type: 'alert', message: 'Irregular rhythm detected — cardiologist notified' },
      { id: 't2', time: '11:00 AM', type: 'medication', message: 'Digoxin administered' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20489', name: 'Maria Garcia', age: 48, gender: 'F', room: '316',
    avatar: 'MG', heartRate: 65, systolicBP: 115, diastolicBP: 74, spo2: 98, temperature: 36.8,
    status: 'stable', deviceStatus: 'connected', battery: 79, signal: 'Excellent',
    lastUpdated: '3s ago', deviceId: 'PC-WB-8893', lastSync: '3 seconds ago',
    diagnosis: 'Pneumonia recovery', admittedDate: '2026-09-02', doctor: 'Dr. Marcus Reid',
    history: generateHistory(65, 98, 115, 74, 36.8),
    timeline: [
      { id: 't1', time: '12:00 PM', type: 'vitals', message: 'SpO₂ improving — antibiotic therapy effective' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20490', name: 'Thomas Lee', age: 78, gender: 'M', room: '401',
    avatar: 'TL', heartRate: 58, systolicBP: 128, diastolicBP: 82, spo2: 96, temperature: 36.4,
    status: 'stable', deviceStatus: 'low_battery', battery: 18, signal: 'Fair',
    lastUpdated: '15s ago', deviceId: 'PC-WB-8756', lastSync: '15 seconds ago',
    diagnosis: 'CHF monitoring', admittedDate: '2026-09-01', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(58, 96, 128, 82, 36.4),
    timeline: [
      { id: 't1', time: '11:30 AM', type: 'device', message: 'Device battery low — nurse notified' },
    ],
    alerts: [],
  },
  {
    id: 'PC-20491', name: 'Patricia Williams', age: 63, gender: 'F', room: '209',
    avatar: 'PW', heartRate: 81, systolicBP: 132, diastolicBP: 85, spo2: 97, temperature: 37.0,
    status: 'stable', deviceStatus: 'connected', battery: 62, signal: 'Good',
    lastUpdated: '4s ago', deviceId: 'PC-WB-8901', lastSync: '4 seconds ago',
    diagnosis: 'Type 2 diabetes complications', admittedDate: '2026-09-03', doctor: 'Dr. Lisa Park',
    history: generateHistory(81, 97, 132, 85, 37.0),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20492', name: 'Charles Johnson', age: 70, gender: 'M', room: '315',
    avatar: 'CJ', heartRate: 77, systolicBP: 119, diastolicBP: 76, spo2: 98, temperature: 36.6,
    status: 'stable', deviceStatus: 'connected', battery: 85, signal: 'Excellent',
    lastUpdated: '2s ago', deviceId: 'PC-WB-8934', lastSync: '2 seconds ago',
    diagnosis: 'Post-CABG recovery', admittedDate: '2026-09-05', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(77, 98, 119, 76, 36.6),
    timeline: [],
    alerts: [],
  },
  // Additional patients to reach 20+
  {
    id: 'PC-20493', name: 'Linda Anderson', age: 52, gender: 'F', room: '117',
    avatar: 'LA', heartRate: 83, systolicBP: 126, diastolicBP: 81, spo2: 97, temperature: 36.8,
    status: 'stable', deviceStatus: 'connected', battery: 71, signal: 'Good',
    lastUpdated: '5s ago', deviceId: 'PC-WB-8945', lastSync: '5 seconds ago',
    diagnosis: 'Kidney stone post-op', admittedDate: '2026-09-06', doctor: 'Dr. Marcus Reid',
    history: generateHistory(83, 97, 126, 81, 36.8),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20494', name: 'Kevin White', age: 41, gender: 'M', room: '206',
    avatar: 'KW', heartRate: 71, systolicBP: 116, diastolicBP: 74, spo2: 99, temperature: 36.5,
    status: 'stable', deviceStatus: 'connected', battery: 94, signal: 'Excellent',
    lastUpdated: '1s ago', deviceId: 'PC-WB-8956', lastSync: '1 second ago',
    diagnosis: 'Appendectomy recovery', admittedDate: '2026-09-06', doctor: 'Dr. Lisa Park',
    history: generateHistory(71, 99, 116, 74, 36.5),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20495', name: 'Helen Turner', age: 58, gender: 'F', room: '322',
    avatar: 'HT', heartRate: 96, systolicBP: 148, diastolicBP: 94, spo2: 93, temperature: 37.6,
    status: 'attention', deviceStatus: 'connected', battery: 48, signal: 'Good',
    lastUpdated: '7s ago', deviceId: 'PC-WB-8967', lastSync: '7 seconds ago',
    diagnosis: 'Pulmonary embolism', admittedDate: '2026-09-04', doctor: 'Dr. Marcus Reid',
    history: generateHistory(96, 93, 148, 94, 37.6),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20496', name: 'George Hall', age: 82, gender: 'M', room: '408',
    avatar: 'GH', heartRate: 62, systolicBP: 124, diastolicBP: 78, spo2: 96, temperature: 36.3,
    status: 'stable', deviceStatus: 'connected', battery: 57, signal: 'Good',
    lastUpdated: '9s ago', deviceId: 'PC-WB-8978', lastSync: '9 seconds ago',
    diagnosis: 'Hip replacement recovery', admittedDate: '2026-09-03', doctor: 'Dr. Lisa Park',
    history: generateHistory(62, 96, 124, 78, 36.3),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20497', name: 'Sandra Young', age: 44, gender: 'F', room: '113',
    avatar: 'SY', heartRate: 78, systolicBP: 121, diastolicBP: 79, spo2: 98, temperature: 36.7,
    status: 'stable', deviceStatus: 'connected', battery: 82, signal: 'Excellent',
    lastUpdated: '3s ago', deviceId: 'PC-WB-8989', lastSync: '3 seconds ago',
    diagnosis: 'Migraine management', admittedDate: '2026-09-07', doctor: 'Dr. Sarah Mitchell',
    history: generateHistory(78, 98, 121, 79, 36.7),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20498', name: 'Frank Harris', age: 66, gender: 'M', room: '307',
    avatar: 'FH', heartRate: 84, systolicBP: 136, diastolicBP: 88, spo2: 95, temperature: 37.3,
    status: 'attention', deviceStatus: 'connected', battery: 53, signal: 'Fair',
    lastUpdated: '11s ago', deviceId: 'PC-WB-9001', lastSync: '11 seconds ago',
    diagnosis: 'Stroke recovery monitoring', admittedDate: '2026-09-02', doctor: 'Dr. Marcus Reid',
    history: generateHistory(84, 95, 136, 88, 37.3),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20499', name: 'Nancy Clark', age: 35, gender: 'F', room: '201',
    avatar: 'NC', heartRate: 69, systolicBP: 108, diastolicBP: 67, spo2: 99, temperature: 36.4,
    status: 'stable', deviceStatus: 'connected', battery: 90, signal: 'Excellent',
    lastUpdated: '2s ago', deviceId: 'PC-WB-9012', lastSync: '2 seconds ago',
    diagnosis: 'Thyroid surgery recovery', admittedDate: '2026-09-06', doctor: 'Dr. Lisa Park',
    history: generateHistory(69, 99, 108, 67, 36.4),
    timeline: [],
    alerts: [],
  },
  {
    id: 'PC-20500', name: 'Paul Wright', age: 59, gender: 'M', room: '414',
    avatar: 'PW2', heartRate: 75, systolicBP: 129, diastolicBP: 83, spo2: 97, temperature: 36.9,
    status: 'stable', deviceStatus: 'disconnected', battery: 0, signal: 'Poor',
    lastUpdated: '3m ago', deviceId: 'PC-WB-9023', lastSync: '3 minutes ago',
    diagnosis: 'COPD management', admittedDate: '2026-09-01', doctor: 'Dr. Marcus Reid',
    history: generateHistory(75, 97, 129, 83, 36.9),
    timeline: [],
    alerts: [],
  },
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-001', patientId: 'PC-20483', type: 'critical',
    message: "SpO₂ dropped below safe threshold",
    detail: "Olivia Brown — SpO₂: 89% (threshold: 95%)",
    time: '12:42 PM', acknowledged: false, resolved: false, assignedTo: 'Dr. Marcus Reid',
  },
  {
    id: 'ALT-002', patientId: 'PC-20483', type: 'critical',
    message: "Heart rate critically elevated",
    detail: "Olivia Brown — Heart Rate: 126 BPM (threshold: 100 BPM)",
    time: '12:38 PM', acknowledged: false, resolved: false,
  },
  {
    id: 'ALT-003', patientId: 'PC-20482', type: 'high',
    message: "Heart rate elevated",
    detail: "James Carter — Heart Rate: 104 BPM",
    time: '12:35 PM', acknowledged: false, resolved: false,
  },
  {
    id: 'ALT-004', patientId: 'PC-20482', type: 'high',
    message: "Blood pressure elevated",
    detail: "James Carter — BP: 142/91 mmHg",
    time: '12:30 PM', acknowledged: true, resolved: false,
  },
  {
    id: 'ALT-005', patientId: 'PC-20488', type: 'high',
    message: "Irregular heart rhythm detected",
    detail: "David Kim — Possible atrial fibrillation",
    time: '12:15 PM', acknowledged: false, resolved: false,
  },
  {
    id: 'ALT-006', patientId: 'PC-20495', type: 'high',
    message: "SpO₂ below recommended level",
    detail: "Helen Turner — SpO₂: 93%",
    time: '12:10 PM', acknowledged: true, resolved: false,
  },
  {
    id: 'ALT-007', patientId: 'PC-20490', type: 'medium',
    message: "Wearable battery critically low",
    detail: "Thomas Lee — Battery: 18%",
    time: '11:30 AM', acknowledged: false, resolved: false,
  },
  {
    id: 'ALT-008', patientId: 'PC-20500', type: 'medium',
    message: "Device disconnected",
    detail: "Paul Wright — No signal for 3 minutes",
    time: '11:15 AM', acknowledged: false, resolved: false,
  },
  // Resolved
  {
    id: 'ALT-009', patientId: 'PC-20481', type: 'high',
    message: "Heart rate briefly elevated",
    detail: "Emma Wilson — Heart Rate: 108 BPM (normalized)",
    time: '08:20 AM', acknowledged: true, resolved: true,
  },
  {
    id: 'ALT-010', patientId: 'PC-20484', type: 'medium',
    message: "Temperature slightly elevated post-surgery",
    detail: "Michael Davis — Temp: 37.8°C (normalized)",
    time: '07:45 AM', acknowledged: true, resolved: true,
  },
];
