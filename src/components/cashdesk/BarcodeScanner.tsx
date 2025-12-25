import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState<number>(0);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('BarcodeScanner useEffect - isActive:', isActive);
    
    if (!isActive) {
      stopScanning();
      return;
    }

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      initializeScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanning();
    };
  }, [isActive]);

  const initializeScanner = async () => {
    console.log('🎬 Initializing scanner...');
    try {
      setError('');
      setScanAttempts(0);
      
      // Initialize the code reader
      if (!codeReaderRef.current) {
        console.log('Creating new BrowserMultiFormatReader');
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      // Get available video devices
      console.log('Listing video devices...');
      const videoDevices = await codeReaderRef.current.listVideoInputDevices();
      console.log('Found video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        setError('No camera found. Please connect a camera and try again.');
        return;
      }

      setDevices(videoDevices);
      
      // Use the first device or previously selected device
      const deviceId = selectedDeviceId || videoDevices[0].deviceId;
      console.log('Selected device:', deviceId);
      setSelectedDeviceId(deviceId);
      
      await startScanning(deviceId);
    } catch (err) {
      console.error('❌ Failed to initialize scanner:', err);
      setError('Failed to access camera. Please grant camera permissions.');
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!codeReaderRef.current || !videoRef.current) {
      console.log('CodeReader or video ref not available');
      return;
    }

    try {
      setIsScanning(true);
      setError('');
      scanningRef.current = true;
      console.log('Starting barcode scanner with device:', deviceId);

      // Use decodeFromVideoDevice with continuous scanning
      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          // Only process if still scanning
          if (!scanningRef.current) return;

          // Increment scan attempts counter for debugging
          setScanAttempts(prev => prev + 1);

          if (result) {
            const barcode = result.getText();
            console.log('✅ Barcode detected:', barcode);
            
            // Prevent duplicate scans
            if (barcode === lastScannedCode) {
              console.log('Duplicate barcode, ignoring');
              return;
            }
            
            setLastScannedCode(barcode);
            
            // Play success sound
            try {
              playBeep();
            } catch (audioErr) {
              console.warn('Audio playback failed:', audioErr);
            }
            
            // Call the onScan callback
            onScan(barcode);
            
            // Stop scanning after successful scan
            scanningRef.current = false;
            stopScanning();
            onClose();
          }
          
          if (err && !(err instanceof NotFoundException)) {
            console.warn('Scan error (non-critical):', err.message);
          }
        }
      );
      
      console.log('Scanner initialized successfully');
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setError('Failed to start camera. Please try again.');
      setIsScanning(false);
      scanningRef.current = false;
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner');
    scanningRef.current = false;
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {
        console.warn('Error resetting scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const playBeep = () => {
    try {
      // Create a simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.warn('Could not play beep sound:', err);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    console.log('Switching to camera:', deviceId);
    setSelectedDeviceId(deviceId);
    stopScanning();
    // Small delay to ensure previous stream is stopped
    setTimeout(() => {
      startScanning(deviceId);
    }, 100);
  };

  if (!isActive) return null;

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Barcode Scanner
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stopScanning();
              onClose();
            }}
          >
            <CameraOff className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-green-500 w-64 h-32 rounded-lg animate-pulse" />
            </div>
          )}
          
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <p className="text-white text-center">Initializing camera...</p>
            </div>
          )}
        </div>

        {devices.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Camera:</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="text-sm text-muted-foreground text-center">
          <p>Position the barcode within the frame</p>
          <p className="text-xs mt-1">Supports EAN-13, UPC-A, Code128, QR codes, and more</p>
          {isScanning && (
            <>
              <p className="text-xs mt-2 text-green-600 font-medium">🔍 Scanning active...</p>
              <p className="text-xs text-gray-500">Scan attempts: {scanAttempts}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
