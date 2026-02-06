import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, QrCode, Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeQRCode } from '@/components/EmployeeQRCode';
import { useEmployees } from '@/hooks/useEmployees';
import { type LocalEmployee } from '@/lib/db';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const EmployeesPage: React.FC = () => {
  const { employees, isLoading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<LocalEmployee | null>(null);
  const [selectedQREmployee, setSelectedQREmployee] = useState<LocalEmployee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LocalEmployee | null>(null);

  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    department: '',
    designation: '',
  });

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.emp_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ emp_id: '', name: '', department: '', designation: '' });
    setShowAddForm(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id!, {
        name: formData.name,
        department: formData.department,
        designation: formData.designation || undefined,
      });
    } else {
      await addEmployee({
        emp_id: formData.emp_id.toUpperCase(),
        name: formData.name,
        department: formData.department,
        designation: formData.designation || undefined,
      });
    }
    resetForm();
  };

  const handleEdit = (employee: LocalEmployee) => {
    setEditingEmployee(employee);
    setFormData({
      emp_id: employee.emp_id,
      name: employee.name,
      department: employee.department,
      designation: employee.designation || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteEmployee(deleteConfirm.id!);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage employee records and QR codes</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map((employee) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{employee.name}</h3>
                <p className="text-sm font-mono text-primary">{employee.emp_id}</p>
                <p className="mt-1 text-sm text-muted-foreground">{employee.department}</p>
                {employee.designation && (
                  <p className="text-sm text-muted-foreground">{employee.designation}</p>
                )}
              </div>
              <div className={`sync-badge ${employee.is_synced ? 'synced' : 'pending'}`}>
                {employee.is_synced ? 'Synced' : 'Pending'}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQREmployee(employee)}
                className="flex-1 gap-1"
              >
                <QrCode className="h-4 w-4" />
                QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(employee)}
                className="flex-1 gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(employee)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredEmployees.length === 0 && !isLoading && (
        <div className="py-12 text-center text-muted-foreground">
          {searchQuery ? 'No employees found matching your search' : 'No employees yet. Add your first employee!'}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="input-group">
                  <Label htmlFor="emp_id" className="input-label">Employee ID</Label>
                  <Input
                    id="emp_id"
                    value={formData.emp_id}
                    onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                    placeholder="e.g., EMP001"
                    disabled={!!editingEmployee}
                    required
                  />
                </div>

                <div className="input-group">
                  <Label htmlFor="name" className="input-label">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="input-group">
                  <Label htmlFor="department" className="input-label">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Engineering"
                    required
                  />
                </div>

                <div className="input-group">
                  <Label htmlFor="designation" className="input-label">Designation (Optional)</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="Software Engineer"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingEmployee ? 'Update' : 'Add Employee'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedQREmployee && (
          <EmployeeQRCode
            employee={selectedQREmployee}
            onClose={() => setSelectedQREmployee(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteConfirm?.name}? This will also delete all their attendance records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
