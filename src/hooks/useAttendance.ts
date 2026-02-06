import { useState, useCallback } from 'react';
import { db, getDeviceId, getTodayDate } from '@/lib/db';
import { toast } from 'sonner';

export const useAttendance = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const recordAttendance = useCallback(async (empId: string): Promise<{ action: 'login' | 'logout'; employee: any } | null> => {
    setIsProcessing(true);
    try {
      // Check if employee exists
      const employee = await db.employees.where('emp_id').equals(empId).first();
      if (!employee) {
        toast.error('Employee not found');
        return null;
      }

      const today = getTodayDate();
      const deviceId = getDeviceId();

      // Check for existing attendance record today
      const existingAttendance = await db.attendance
        .where('[emp_id+attendance_date]')
        .equals([empId, today])
        .first();

      if (existingAttendance) {
        if (existingAttendance.logout_time) {
          toast.error('Already logged out for today');
          return null;
        }

        // Logout
        const now = new Date();
        const loginTime = new Date(existingAttendance.login_time);
        const workingMinutes = Math.floor((now.getTime() - loginTime.getTime()) / 60000);

        await db.attendance.update(existingAttendance.id!, {
          logout_time: now.toISOString(),
          working_minutes: workingMinutes,
          updated_at: now.toISOString(),
          is_synced: false,
        });

        toast.success(`Goodbye, ${employee.name}! Worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m`);
        return { action: 'logout', employee };
      } else {
        // Login
        const now = new Date();
        await db.attendance.add({
          emp_id: empId,
          login_time: now.toISOString(),
          attendance_date: today,
          device_id: deviceId,
          is_synced: false,
          updated_at: now.toISOString(),
        });

        toast.success(`Welcome, ${employee.name}!`);
        return { action: 'login', employee };
      }
    } catch (error) {
      console.error('Attendance error:', error);
      toast.error('Failed to record attendance');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getActiveSession = useCallback(async (empId: string) => {
    const today = getTodayDate();
    const attendance = await db.attendance
      .where('[emp_id+attendance_date]')
      .equals([empId, today])
      .first();
    
    if (attendance && !attendance.logout_time) {
      return attendance;
    }
    return null;
  }, []);

  return {
    recordAttendance,
    getActiveSession,
    isProcessing,
  };
};
