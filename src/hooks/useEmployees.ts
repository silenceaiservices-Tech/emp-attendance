import { useState, useCallback, useEffect } from 'react';
import { db, type LocalEmployee } from '@/lib/db';
import { toast } from 'sonner';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<LocalEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    try {
      const allEmployees = await db.employees.toArray();
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const addEmployee = useCallback(async (employee: Omit<LocalEmployee, 'id' | 'is_synced' | 'created_at' | 'updated_at'>) => {
    try {
      // Check if emp_id already exists
      const existing = await db.employees.where('emp_id').equals(employee.emp_id).first();
      if (existing) {
        toast.error('Employee ID already exists');
        return null;
      }

      const now = new Date().toISOString();
      const id = await db.employees.add({
        ...employee,
        created_at: now,
        updated_at: now,
        is_synced: false,
      });

      await loadEmployees();
      toast.success('Employee added successfully');
      return id;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
      return null;
    }
  }, [loadEmployees]);

  const updateEmployee = useCallback(async (id: number, updates: Partial<LocalEmployee>) => {
    try {
      await db.employees.update(id, {
        ...updates,
        updated_at: new Date().toISOString(),
        is_synced: false,
      });
      await loadEmployees();
      toast.success('Employee updated successfully');
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
    }
  }, [loadEmployees]);

  const deleteEmployee = useCallback(async (id: number) => {
    try {
      const employee = await db.employees.get(id);
      if (employee) {
        // Delete related attendance records
        await db.attendance.where('emp_id').equals(employee.emp_id).delete();
      }
      await db.employees.delete(id);
      await loadEmployees();
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee');
    }
  }, [loadEmployees]);

  const getEmployeeByEmpId = useCallback(async (empId: string) => {
    return await db.employees.where('emp_id').equals(empId).first();
  }, []);

  return {
    employees,
    isLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeByEmpId,
    refreshEmployees: loadEmployees,
  };
};
