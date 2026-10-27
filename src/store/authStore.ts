import { useEffect, useState } from 'react';

export interface DoctorAccount {
  id: string;
  name: string;
  specialty: string;
  email: string;
  password: string;
  initials: string;
}

export const DOCTOR_ACCOUNTS: DoctorAccount[] = [
  { id: 'dr-bhanzi', name: 'Dr. Briola Bhanzi', specialty: 'Cardiology', email: 'briola.bhanzi@pulsecare.demo', password: 'PulseCare123!', initials: 'BB' },
  { id: 'dr-reid', name: 'Dr. Marcus Reid', specialty: 'Pulmonology', email: 'marcus.reid@pulsecare.demo', password: 'PulseCare123!', initials: 'MR' },
  { id: 'dr-park', name: 'Dr. Lisa Park', specialty: 'Internal Medicine', email: 'lisa.park@pulsecare.demo', password: 'PulseCare123!', initials: 'LP' },
];

let currentDoctor: DoctorAccount | null = null;
const storedDoctorId = typeof window !== 'undefined' ? localStorage.getItem('pulsecare-doctor') : null;
if (storedDoctorId) currentDoctor = DOCTOR_ACCOUNTS.find(doctor => doctor.id === storedDoctorId) ?? null;

let subscribers: Array<() => void> = [];

function notify() {
  subscribers.forEach(subscriber => subscriber());
}

export function login(email: string, password: string): boolean {
  const doctor = DOCTOR_ACCOUNTS.find(account => account.email.toLowerCase() === email.trim().toLowerCase() && account.password === password);
  if (!doctor) return false;
  currentDoctor = doctor;
  localStorage.setItem('pulsecare-doctor', doctor.id);
  notify();
  return true;
}

export function logout() {
  currentDoctor = null;
  localStorage.removeItem('pulsecare-doctor');
  notify();
}

export function getCurrentDoctor() {
  return currentDoctor;
}

export function useAuth() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const subscriber = () => setTick(tick => tick + 1);
    subscribers.push(subscriber);
    return () => { subscribers = subscribers.filter(item => item !== subscriber); };
  }, []);
  return { doctor: currentDoctor, isAuthenticated: currentDoctor !== null, login, logout };
}