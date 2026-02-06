import React, { useEffect, useState } from 'react';
import { Users, Clock, CalendarCheck, RefreshCw, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { db, getTodayDate, formatDuration } from '@/lib/db';
import { useSync } from '@/hooks/useSync';

interface DashboardStats {
  totalEmployees: number;
  todayAttendance: number;
  totalWorkingMinutesToday: number;
  pendingSync: number;
  weeklyAttendance: number;
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayAttendance: 0,
    totalWorkingMinutesToday: 0,
    pendingSync: 0,
    weeklyAttendance: 0,
  });
  const { pendingCount, lastSyncTime } = useSync();

  useEffect(() => {
    const loadStats = async () => {
      const today = getTodayDate();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const employees = await db.employees.count();
      const todayRecords = await db.attendance.where('attendance_date').equals(today).toArray();
      const weeklyRecords = await db.attendance.where('attendance_date').aboveOrEqual(weekAgoStr).count();
      
      const totalMinutes = todayRecords.reduce((sum, r) => sum + (r.working_minutes || 0), 0);
      const pendingEmployees = await db.employees.where('is_synced').equals(0).count();
      const pendingAttendance = await db.attendance.where('is_synced').equals(0).count();

      setStats({
        totalEmployees: employees,
        todayAttendance: todayRecords.length,
        totalWorkingMinutesToday: totalMinutes,
        pendingSync: pendingEmployees + pendingAttendance,
        weeklyAttendance: weeklyRecords,
      });
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Overview of attendance and employee statistics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          description="Registered employees"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={CalendarCheck}
          description={`${Math.round((stats.todayAttendance / Math.max(stats.totalEmployees, 1)) * 100)}% attendance rate`}
        />
        <StatCard
          title="Hours Worked Today"
          value={formatDuration(stats.totalWorkingMinutesToday)}
          icon={Clock}
          description="Total across all employees"
        />
        <StatCard
          title="Pending Sync"
          value={pendingCount}
          icon={RefreshCw}
          description={lastSyncTime ? `Last: ${lastSyncTime.toLocaleTimeString()}` : 'Not synced yet'}
        />
      </div>

      {/* Recent Activity */}
      <div className="card-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Weekly Overview</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.weeklyAttendance}</p>
            <p className="text-sm text-muted-foreground">Attendance records this week</p>
          </div>
        </div>
      </div>
    </div>
  );
};
