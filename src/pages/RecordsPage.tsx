import React, { useEffect, useState } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db, formatDuration, type LocalAttendance, type LocalEmployee } from '@/lib/db';
import { cn } from '@/lib/utils';

interface AttendanceRecord extends LocalAttendance {
  employeeName?: string;
  employeeDepartment?: string;
}

export const RecordsPage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [_employees, setEmployees] = useState<LocalEmployee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const allEmployees = await db.employees.toArray();
      setEmployees(allEmployees);

      const allRecords = await db.attendance.orderBy('attendance_date').reverse().toArray();
      const enrichedRecords = allRecords.map((record) => {
        const employee = allEmployees.find((e) => e.emp_id === record.emp_id);
        return {
          ...record,
          employeeName: employee?.name,
          employeeDepartment: employee?.department,
        };
      });
      setRecords(enrichedRecords);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.emp_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employeeDepartment?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !dateFilter || record.attendance_date === dateFilter;

    return matchesSearch && matchesDate;
  });

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Attendance Records</h1>
        <p className="page-subtitle">View and filter all attendance entries</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        {dateFilter && (
          <Button variant="ghost" onClick={() => setDateFilter('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Records Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Login</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Logout</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{formatDate(record.attendance_date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{record.employeeName || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{record.emp_id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-foreground">{formatTime(record.login_time)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {record.logout_time ? (
                      <span className="font-mono text-foreground">{formatTime(record.logout_time)}</span>
                    ) : (
                      <span className="text-warning">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {record.working_minutes ? (
                      <span className="font-medium text-foreground">
                        {formatDuration(record.working_minutes)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('sync-badge', record.is_synced ? 'synced' : 'pending')}>
                      {record.is_synced ? 'Synced' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && !isLoading && (
          <div className="py-12 text-center text-muted-foreground">
            No attendance records found
          </div>
        )}
      </div>
    </div>
  );
};
