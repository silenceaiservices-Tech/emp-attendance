import Dexie, { type Table } from 'dexie';

export interface LocalEmployee {
  id?: number;
  emp_id: string;
  name: string;
  department: string;
  designation?: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
  cloud_id?: string;
}

export interface LocalAttendance {
  id?: number;
  emp_id: string;
  login_time: string;
  logout_time?: string;
  working_minutes?: number;
  attendance_date: string;
  device_id: string;
  is_synced: boolean;
  updated_at: string;
  cloud_id?: string;
}

export interface SyncLog {
  id?: number;
  sync_type: 'employees' | 'attendance';
  status: 'success' | 'failed';
  message: string;
  synced_at: string;
  records_synced: number;
}

class AttendanceDB extends Dexie {
  employees!: Table<LocalEmployee>;
  attendance!: Table<LocalAttendance>;
  syncLogs!: Table<SyncLog>;

  constructor() {
    super('AttendanceDB');
    this.version(1).stores({
      employees: '++id, emp_id, name, department, is_synced, cloud_id',
      attendance: '++id, emp_id, attendance_date, is_synced, cloud_id, [emp_id+attendance_date]',
      syncLogs: '++id, sync_type, synced_at',
    });
  }
}

export const db = new AttendanceDB();

// Generate a unique device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Format duration from minutes
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
};
