import React, { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db, formatDuration } from '@/lib/db';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  emp_id: string;
  name: string;
  department: string;
  totalDays: number;
  totalMinutes: number;
  averageMinutesPerDay: number;
}

export const ReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    setIsLoading(true);
    try {
      const employees = await db.employees.toArray();
      const attendance = await db.attendance
        .where('attendance_date')
        .between(startDate, endDate, true, true)
        .toArray();

      const reportMap = new Map<string, ReportData>();

      employees.forEach((emp) => {
        reportMap.set(emp.emp_id, {
          emp_id: emp.emp_id,
          name: emp.name,
          department: emp.department,
          totalDays: 0,
          totalMinutes: 0,
          averageMinutesPerDay: 0,
        });
      });

      attendance.forEach((record) => {
        const data = reportMap.get(record.emp_id);
        if (data) {
          data.totalDays += 1;
          data.totalMinutes += record.working_minutes || 0;
        }
      });

      const report = Array.from(reportMap.values()).map((data) => ({
        ...data,
        averageMinutesPerDay: data.totalDays > 0 ? Math.round(data.totalMinutes / data.totalDays) : 0,
      }));

      setReportData(report.filter((r) => r.totalDays > 0));
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = [
      ['Employee ID', 'Name', 'Department', 'Days Worked', 'Total Hours', 'Avg Hours/Day'],
      ...reportData.map((row) => [
        row.emp_id,
        row.name,
        row.department,
        row.totalDays.toString(),
        formatDuration(row.totalMinutes),
        formatDuration(row.averageMinutesPerDay),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const wsData = [
      ['Employee ID', 'Name', 'Department', 'Days Worked', 'Total Hours', 'Avg Hours/Day'],
      ...reportData.map((row) => [
        row.emp_id,
        row.name,
        row.department,
        row.totalDays,
        formatDuration(row.totalMinutes),
        formatDuration(row.averageMinutesPerDay),
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    XLSX.writeFile(wb, `attendance_report_${startDate}_${endDate}.xlsx`);
    toast.success('Excel exported successfully');
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 32);

    autoTable(doc, {
      head: [['Emp ID', 'Name', 'Department', 'Days', 'Total Hours', 'Avg/Day']],
      body: reportData.map((row) => [
        row.emp_id,
        row.name,
        row.department,
        row.totalDays.toString(),
        formatDuration(row.totalMinutes),
        formatDuration(row.averageMinutesPerDay),
      ]),
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [13, 148, 136] },
    });

    doc.save(`attendance_report_${startDate}_${endDate}.pdf`);
    toast.success('PDF exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and export attendance reports</p>
      </div>

      {/* Date Range Selector */}
      <div className="card-elevated p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Report Parameters</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="input-group">
            <Label htmlFor="start-date" className="input-label">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <Label htmlFor="end-date" className="input-label">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={generateReport} disabled={isLoading} className="w-full gap-2">
              <Calendar className="h-4 w-4" />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      {reportData.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF} className="gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      )}

      {/* Report Table */}
      {reportData.length > 0 && (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Department</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Days Worked</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Total Hours</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Avg/Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportData.map((row) => (
                  <tr key={row.emp_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-sm text-muted-foreground">{row.emp_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.department}</td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">{row.totalDays}</td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">
                      {formatDuration(row.totalMinutes)}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-foreground">
                      {formatDuration(row.averageMinutesPerDay)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData.length === 0 && !isLoading && (
        <div className="card-elevated py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Select a date range and click "Generate Report" to view attendance data
          </p>
        </div>
      )}
    </div>
  );
};
