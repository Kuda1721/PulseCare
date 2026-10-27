import { useState, useEffect, useRef } from 'react';
import { PATIENTS_DATA, INITIAL_ALERTS, Patient, Alert } from '../data/mockData';
import { getOverallStatus } from '../data/thresholds';
import { getCurrentDoctor } from './authStore';

export type DataMode = 'demo' | 'api';

let subscribers: Array<() => void> = [];
let patientsState: Patient[] = JSON.parse(JSON.stringify(PATIENTS_DATA)).map((patient: Patient) => ({
  ...patient,
  doctor: patient.doctor === 'Dr. Sarah Mitchell' ? 'Dr. Briola Bhanzi' : patient.doctor,
}));
let alertsState: Alert[] = JSON.parse(JSON.stringify(INITIAL_ALERTS));
let demoTriggered = false;
let dataMode: DataMode = (typeof window !== 'undefined' ? localStorage.getItem('pulsecare-data-mode') : null) === 'api' ? 'api' : 'demo';

function assignedPatients() {
  const doctor = getCurrentDoctor();
  return doctor ? patientsState.filter(patient => patient.doctor === doctor.name || (doctor.id === 'dr-bhanzi' && patient.doctor === 'Dr. Sarah Mitchell')) : [];
}

function assignedAlerts() {
  const visiblePatientIds = new Set(assignedPatients().map(patient => patient.id));
  return alertsState.filter(alert => visiblePatientIds.has(alert.patientId));
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function notify() {
  subscribers.forEach(fn => fn());
}

function createAlertForPatient(patient: Patient, message: string, detail: string): Alert {
  return {
    id: `ALT-${patient.id}-${Date.now()}`,
    patientId: patient.id,
    type: 'critical',
    message,
    detail,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    acknowledged: false,
    resolved: false,
  };
}

function deterministicDemoStep() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  patientsState = patientsState.map((p, idx) => {
    const phase = (Date.now() / 5000) + idx;
    const hr = clamp(Math.round(p.heartRate + Math.sin(phase) * 5), 40, 180);
    const sys = clamp(Math.round(p.systolicBP + Math.sin(phase * 1.1) * 6), 80, 200);
    const dia = clamp(Math.round(p.diastolicBP + Math.cos(phase * 1.3) * 4), 50, 130);
    const spo2 = clamp(Math.round(p.spo2 + Math.cos(phase * 1.7) * 1.2), 80, 100);
    const temp = clamp(parseFloat((p.temperature + Math.sin(phase * 0.8) * 0.2).toFixed(1)), 34.0, 42.0);
    const statusRaw = getOverallStatus(hr, spo2, temp, sys, dia);
    const status = (statusRaw === 'stable' ? 'stable' : statusRaw === 'attention' ? 'attention' : 'critical') as Patient['status'];
    const newPoint = { time: timeStr, heartRate: hr, spo2, systolicBP: sys, diastolicBP: dia, temperature: temp };
    const history = [...p.history.slice(-47), newPoint];

    return { ...p, heartRate: hr, systolicBP: sys, diastolicBP: dia, spo2, temperature: temp, status, history, lastUpdated: 'just now' };
  });

  const criticalPatient = patientsState.find(p => p.status === 'critical');
  if (criticalPatient && !demoTriggered) {
    demoTriggered = true;
    const msg = `Rule alert: ${criticalPatient.name} has sustained oxygen desaturation`; 
    const detail = `${criticalPatient.name} — SpO₂ ${criticalPatient.spo2}% — clinician review required`;
    alertsState = [createAlertForPatient(criticalPatient, msg, detail), ...alertsState];
  }

  notify();
}

export function setDataMode(nextMode: DataMode) {
  dataMode = nextMode;
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulsecare-data-mode', nextMode);
  }
  if (nextMode === 'demo') {
    demoTriggered = false;
    patientsState = JSON.parse(JSON.stringify(PATIENTS_DATA)).map((patient: Patient) => ({
      ...patient,
      doctor: patient.doctor === 'Dr. Sarah Mitchell' ? 'Dr. Briola Bhanzi' : patient.doctor,
    }));
    alertsState = JSON.parse(JSON.stringify(INITIAL_ALERTS));
  }
  notify();
}

export function getDataMode(): DataMode {
  return dataMode;
}

export async function fetchLiveVitals() {
  if (dataMode !== 'api') return deterministicDemoStep();

  try {
    const response = await fetch('/api/v1/patients/summary');
    if (!response.ok) throw new Error('API unavailable');
    const payload = await response.json();
    if (Array.isArray(payload?.patients)) {
      patientsState = payload.patients;
      if (Array.isArray(payload?.alerts)) alertsState = payload.alerts;
      notify();
      return;
    }
  } catch {
    patientsState = JSON.parse(JSON.stringify(PATIENTS_DATA));
    alertsState = JSON.parse(JSON.stringify(INITIAL_ALERTS));
    notify();
  }
}

export function updateVitals() {
  if (dataMode === 'demo') {
    deterministicDemoStep();
    return;
  }
  void fetchLiveVitals();
}

export function acknowledgeAlert(id: string) {
  alertsState = alertsState.map(a => a.id === id ? { ...a, acknowledged: true } : a);
  notify();
}

export function resolveAlert(id: string) {
  alertsState = alertsState.map(a => a.id === id ? { ...a, resolved: true, acknowledged: true } : a);
  notify();
}

export function addAlert(alert: Alert) {
  alertsState = [alert, ...alertsState];
  notify();
}

export function triggerDemoAlert() {
  if (demoTriggered) return;
  const patient = patientsState.find(p => p.id === 'PC-20483') ?? patientsState[0];
  if (!patient) return;
  demoTriggered = true;
  patientsState = patientsState.map(p =>
    p.id === patient.id ? { ...p, spo2: 89, heartRate: 126, status: 'critical' } : p
  );
  const alert: Alert = {
    id: `ALT-DEMO-${Date.now()}`,
    patientId: patient.id,
    type: 'critical',
    message: 'Rule alert: SpO₂ dropped to 89%',
    detail: `${patient.name} — SpO₂: 89% — immediate clinician review required`,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    acknowledged: false,
    resolved: false,
  };
  alertsState = [alert, ...alertsState];
  notify();
}

export function usePatientStore() {
  const [tick, setTick] = useState(0);
  const refFn = useRef<() => void>(() => setTick(t => t + 1));

  useEffect(() => {
    const fn = refFn.current;
    subscribers.push(fn);
    return () => { subscribers = subscribers.filter(s => s !== fn); };
  }, []);

  return {
    patients: assignedPatients(),
    alerts: assignedAlerts(),
    dataMode,
    getPatient: (id: string) => assignedPatients().find(p => p.id === id),
    acknowledgeAlert,
    resolveAlert,
    setDataMode,
    refresh: updateVitals,
  };
}

export function getVisibleAlerts() {
  return assignedAlerts();
}

export function useRealtimeEngine(onDemoAlert?: () => void) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (dataMode === 'demo') {
        deterministicDemoStep();
        if (demoTriggered) {
          onDemoAlert?.();
        }
      } else {
        void fetchLiveVitals();
      }
    }, 3000);

    const demoTimer = setTimeout(() => {
      triggerDemoAlert();
      onDemoAlert?.();
    }, 18000);

    return () => {
      clearInterval(interval);
      clearTimeout(demoTimer);
    };
  }, []);
}
