import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Keyboard, CheckCircle2, LogIn, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRScanner } from '@/components/QRScanner';
import { AdminLogin } from '@/components/AdminLogin';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/lib/utils';

interface AttendanceResult {
  action: 'login' | 'logout';
  employee: { name: string; emp_id: string; department: string };
  workingMinutes?: number;
}

export const AttendancePage: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [empId, setEmpId] = useState('');
  const [lastResult, setLastResult] = useState<AttendanceResult | null>(null);
  
  const { recordAttendance, isProcessing } = useAttendance();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleScan = async (scannedId: string) => {
    setShowScanner(false);
    const result = await recordAttendance(scannedId);
    if (result) {
      setLastResult({ ...result, employee: result.employee });
      setTimeout(() => setLastResult(null), 5000);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId.trim()) return;
    
    const result = await recordAttendance(empId.trim());
    if (result) {
      setLastResult({ ...result, employee: result.employee });
      setEmpId('');
      setShowManualEntry(false);
      setTimeout(() => setLastResult(null), 5000);
    }
  };

  const handleAdminSuccess = () => {
    setShowAdminLogin(false);
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center py-8">
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={cn(
              'mb-8 w-full max-w-md rounded-2xl p-6 shadow-lg',
              lastResult.action === 'login' ? 'bg-success/10' : 'bg-info/10'
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl',
                lastResult.action === 'login' ? 'bg-success' : 'bg-info'
              )}>
                {lastResult.action === 'login' ? (
                  <LogIn className="h-7 w-7 text-success-foreground" />
                ) : (
                  <LogOut className="h-7 w-7 text-info-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  'text-lg font-semibold',
                  lastResult.action === 'login' ? 'text-success' : 'text-info'
                )}>
                  {lastResult.action === 'login' ? 'Logged In' : 'Logged Out'}
                </p>
                <p className="font-medium text-foreground">{lastResult.employee.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lastResult.employee.department} • {lastResult.employee.emp_id}
                </p>
              </div>
              <CheckCircle2 className={cn(
                'h-8 w-8',
                lastResult.action === 'login' ? 'text-success' : 'text-info'
              )} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Employee Attendance</h2>
          <p className="mt-2 text-muted-foreground">Scan QR code or enter Employee ID</p>
        </div>

        {/* Main QR Scan Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowScanner(true)}
          className="qr-scan-button mx-auto"
          disabled={isProcessing}
        >
          <div className="flex flex-col items-center gap-3 text-primary-foreground">
            <QrCode className="h-16 w-16" />
            <span className="text-lg font-semibold">Scan QR Code</span>
          </div>
        </motion.button>

        {/* Manual Entry Toggle */}
        <div className="space-y-4">
          {!showManualEntry ? (
            <Button
              variant="outline"
              onClick={() => setShowManualEntry(true)}
              className="w-full gap-2"
            >
              <Keyboard className="h-5 w-5" />
              Enter Employee ID Manually
            </Button>
          ) : (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleManualSubmit}
              className="space-y-3"
            >
              <Input
                type="text"
                placeholder="Enter Employee ID"
                value={empId}
                onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                className="text-center text-lg"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowManualEntry(false);
                    setEmpId('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isProcessing || !empId.trim()}>
                  {isProcessing ? 'Processing...' : 'Submit'}
                </Button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Admin Access */}
        {!isAdmin && (
          <Button
            variant="ghost"
            onClick={() => setShowAdminLogin(true)}
            className="gap-2 text-muted-foreground"
          >
            <Shield className="h-4 w-4" />
            Admin Access
          </Button>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}
        {showAdminLogin && (
          <AdminLogin onSuccess={handleAdminSuccess} onCancel={() => setShowAdminLogin(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
