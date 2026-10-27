export const THRESHOLDS = {
  heartRate: { low: 60, high: 100, critical_low: 45, critical_high: 120 },
  spo2: { low: 95, critical_low: 90 },
  temperature: { low: 36.1, high: 37.5, critical_low: 35.0, critical_high: 38.5 },
  systolicBP: { low: 90, high: 140, critical_high: 160 },
  diastolicBP: { low: 60, high: 90, critical_high: 100 },
};

export type VitalStatus = 'stable' | 'attention' | 'critical';

export function getHeartRateStatus(bpm: number): VitalStatus {
  if (bpm <= THRESHOLDS.heartRate.critical_low || bpm >= THRESHOLDS.heartRate.critical_high) return 'critical';
  if (bpm < THRESHOLDS.heartRate.low || bpm > THRESHOLDS.heartRate.high) return 'attention';
  return 'stable';
}

export function getSpo2Status(spo2: number): VitalStatus {
  if (spo2 < THRESHOLDS.spo2.critical_low) return 'critical';
  if (spo2 < THRESHOLDS.spo2.low) return 'attention';
  return 'stable';
}

export function getTempStatus(temp: number): VitalStatus {
  if (temp < THRESHOLDS.temperature.critical_low || temp > THRESHOLDS.temperature.critical_high) return 'critical';
  if (temp < THRESHOLDS.temperature.low || temp > THRESHOLDS.temperature.high) return 'attention';
  return 'stable';
}

export function getBPStatus(sys: number, dia: number): VitalStatus {
  if (sys >= THRESHOLDS.systolicBP.critical_high || dia >= THRESHOLDS.diastolicBP.critical_high) return 'critical';
  if (sys > THRESHOLDS.systolicBP.high || sys < THRESHOLDS.systolicBP.low || dia > THRESHOLDS.diastolicBP.high) return 'attention';
  return 'stable';
}

export function getOverallStatus(hr: number, spo2: number, temp: number, sys: number, dia: number): VitalStatus {
  const statuses = [getHeartRateStatus(hr), getSpo2Status(spo2), getTempStatus(temp), getBPStatus(sys, dia)];
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('attention')) return 'attention';
  return 'stable';
}
