import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { useOnlineStatus } from './useOnlineStatus';
import { toast } from 'sonner';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
}

export const useSync = () => {
  const isOnline = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
  });

  const updatePendingCount = useCallback(async () => {
    const pendingEmployees = await db.employees.where('is_synced').equals(0).count();
    const pendingAttendance = await db.attendance.where('is_synced').equals(0).count();
    setSyncState(prev => ({ ...prev, pendingCount: pendingEmployees + pendingAttendance }));
  }, []);

  const syncEmployees = async () => {
    const unsyncedEmployees = await db.employees.where('is_synced').equals(0).toArray();
    
    for (const employee of unsyncedEmployees) {
      try {
        const { data, error } = await supabase
          .from('employees')
          .upsert({
            emp_id: employee.emp_id,
            name: employee.name,
            department: employee.department,
            designation: employee.designation,
            created_at: employee.created_at,
            updated_at: employee.updated_at,
          }, { onConflict: 'emp_id' })
          .select()
          .single();

        if (error) throw error;

        await db.employees.update(employee.id!, {
          is_synced: true,
          cloud_id: data.id,
        });
      } catch (error) {
        console.error('Error syncing employee:', error);
      }
    }
  };

  const syncAttendance = async () => {
    const unsyncedAttendance = await db.attendance.where('is_synced').equals(0).toArray();
    
    for (const record of unsyncedAttendance) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .upsert({
            emp_id: record.emp_id,
            login_time: record.login_time,
            logout_time: record.logout_time,
            working_minutes: record.working_minutes,
            attendance_date: record.attendance_date,
            device_id: record.device_id,
            synced_at: new Date().toISOString(),
          }, { onConflict: 'emp_id,attendance_date' })
          .select()
          .single();

        if (error) throw error;

        await db.attendance.update(record.id!, {
          is_synced: true,
          cloud_id: data.id,
        });
      } catch (error) {
        console.error('Error syncing attendance:', error);
      }
    }
  };

  const pullFromCloud = async () => {
    // Pull employees from cloud
    const { data: cloudEmployees } = await supabase.from('employees').select('*');
    if (cloudEmployees) {
      for (const emp of cloudEmployees) {
        const existing = await db.employees.where('emp_id').equals(emp.emp_id).first();
        if (!existing) {
          await db.employees.add({
            emp_id: emp.emp_id,
            name: emp.name,
            department: emp.department,
            designation: emp.designation || undefined,
            created_at: emp.created_at,
            updated_at: emp.updated_at,
            is_synced: true,
            cloud_id: emp.id,
          });
        }
      }
    }

    // Pull attendance from cloud
    const { data: cloudAttendance } = await supabase.from('attendance').select('*');
    if (cloudAttendance) {
      for (const att of cloudAttendance) {
        const existing = await db.attendance
          .where('[emp_id+attendance_date]')
          .equals([att.emp_id, att.attendance_date])
          .first();
        if (!existing) {
          await db.attendance.add({
            emp_id: att.emp_id,
            login_time: att.login_time,
            logout_time: att.logout_time || undefined,
            working_minutes: att.working_minutes || undefined,
            attendance_date: att.attendance_date,
            device_id: att.device_id || 'cloud',
            is_synced: true,
            updated_at: att.updated_at,
            cloud_id: att.id,
          });
        }
      }
    }
  };

  const sync = useCallback(async () => {
    if (!isOnline || syncState.isSyncing) return;

    setSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      await syncEmployees();
      await syncAttendance();
      await pullFromCloud();
      await updatePendingCount();

      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
      }));

      await db.syncLogs.add({
        sync_type: 'attendance',
        status: 'success',
        message: 'Sync completed successfully',
        synced_at: new Date().toISOString(),
        records_synced: 0,
      });

      toast.success('Sync completed successfully');
    } catch (error) {
      setSyncState(prev => ({ ...prev, isSyncing: false }));
      toast.error('Sync failed. Will retry when online.');
      console.error('Sync error:', error);
    }
  }, [isOnline, syncState.isSyncing, updatePendingCount]);

  return {
    ...syncState,
    isOnline,
    sync,
    updatePendingCount,
  };
};
