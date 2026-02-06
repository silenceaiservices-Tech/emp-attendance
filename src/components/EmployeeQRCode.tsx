import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type LocalEmployee } from '@/lib/db';

interface EmployeeQRCodeProps {
  employee: LocalEmployee;
  onClose: () => void;
}

export const EmployeeQRCode: React.FC<EmployeeQRCodeProps> = ({ employee, onClose }) => {
  const downloadQRCode = () => {
    const svg = document.getElementById('employee-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${employee.emp_id}_${employee.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Employee QR Code</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-4 shadow-md">
            <QRCodeSVG
              id="employee-qr-code"
              value={employee.emp_id}
              size={200}
              level="H"
              includeMargin
            />
          </div>

          <div className="text-center">
            <p className="font-semibold text-foreground">{employee.name}</p>
            <p className="text-sm text-muted-foreground">{employee.emp_id}</p>
            <p className="text-sm text-muted-foreground">{employee.department}</p>
          </div>

          <Button onClick={downloadQRCode} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
