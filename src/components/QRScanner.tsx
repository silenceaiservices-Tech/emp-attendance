import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { motion } from 'framer-motion';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();
    let mounted = true;

    const startScanning = async () => {
      try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError('No camera found');
          setIsLoading(false);
          return;
        }

        const selectedDeviceId = devices[0].deviceId;

        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, _err) => {
            if (result && mounted) {
              onScan(result.getText());
              codeReader.reset();
            }
          }
        );

        if (mounted) setIsLoading(false);
      } catch (err) {
        console.error('Scanner error:', err);
        if (mounted) {
          setError('Failed to access camera. Please ensure camera permissions are granted.');
          setIsLoading(false);
        }
      }
    };

    startScanning();

    return () => {
      mounted = false;
      codeReader.reset();
    };
  }, [onScan]);

  return (
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
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Scan QR Code</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative aspect-square w-full bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            style={{ display: isLoading || error ? 'none' : 'block' }}
          />

          {/* Scanner overlay */}
          {!isLoading && !error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-2xl border-4 border-primary/50">
                <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-primary" />
                <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-primary" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-primary" />
                <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 text-center text-sm text-muted-foreground">
          Position the QR code within the frame
        </div>
      </motion.div>
    </motion.div>
  );
};
