import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { QRDesign } from '../types';

interface QRCodeCanvasProps {
  value: string;
  design: QRDesign;
  size?: number;
  className?: string;
}

export const QRCodeCanvas: React.FC<QRCodeCanvasProps> = ({ value, design, size = 200, className }) => {
  const { fgColor, bgColor, logoUrl, logoSize, dotStyle, cornerStyle, frame, frameText, frameColor } = design;
  const [modules, setModules] = useState<boolean[][]>([]);
  const [qrSize, setQrSize] = useState(0);

  useEffect(() => {
    // Generate QR Matrix
    // Note: QRCode.create is synchronous in this library version
    try {
        const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
        const size = qr.modules.size;
        const data = qr.modules.data; // Uint8Array
        const matrix: boolean[][] = [];
        
        for (let i = 0; i < size; i++) {
            const row: boolean[] = [];
            for (let j = 0; j < size; j++) {
            row.push(!!data[i * size + j]);
            }
            matrix.push(row);
        }
        setModules(matrix);
        setQrSize(size);
    } catch (e) {
        console.error("QR Gen Error", e);
    }
  }, [value]);

  // Helper to identify finder patterns (7x7 corners)
  const isFinder = (r: number, c: number) => {
     if (r < 7 && c < 7) return true; // Top-Left
     if (r < 7 && c >= qrSize - 7) return true; // Top-Right
     if (r >= qrSize - 7 && c < 7) return true; // Bottom-Left
     return false;
  };

  const renderModules = () => {
     if (!modules.length) return null;
     const cellSize = size / qrSize;
     const shapes: React.ReactElement[] = [];

     modules.forEach((row, r) => {
        row.forEach((isDark, c) => {
           if (!isDark) return;

           const x = c * cellSize;
           const y = r * cellSize;
           const isFinderPattern = isFinder(r, c);

           // Render Finder Pattern
           if (isFinderPattern) {
               if (cornerStyle === 'rounded') {
                   shapes.push(<circle key={`${r}-${c}`} cx={x + cellSize/2} cy={y + cellSize/2} r={cellSize/2} fill={fgColor} />);
               } else if (cornerStyle === 'dots') {
                   shapes.push(<circle key={`${r}-${c}`} cx={x + cellSize/2} cy={y + cellSize/2} r={cellSize/2.5} fill={fgColor} />);
               } else {
                   // Square
                   shapes.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellSize} height={cellSize} fill={fgColor} />);
               }
               return;
           }

           // Render Data Modules
           if (dotStyle === 'dots') {
               shapes.push(<circle key={`${r}-${c}`} cx={x + cellSize/2} cy={y + cellSize/2} r={cellSize/2.5} fill={fgColor} />);
           } else if (dotStyle === 'rounded') {
               shapes.push(<rect key={`${r}-${c}`} x={x + cellSize * 0.1} y={y + cellSize * 0.1} width={cellSize * 0.8} height={cellSize * 0.8} rx={cellSize * 0.3} fill={fgColor} />);
           } else {
               // Square (Default)
               shapes.push(<rect key={`${r}-${c}`} x={x} y={y} width={cellSize + 0.2} height={cellSize + 0.2} fill={fgColor} />);
           }
        });
     });
     return shapes;
  };

  const QRContent = (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ backgroundColor: bgColor }}>
        {renderModules()}
      </svg>
      {logoUrl && (
        <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full flex items-center justify-center shadow-sm"
            style={{ 
                width: size * logoSize * 1.2, 
                height: size * logoSize * 1.2,
                padding: '4px'
            }}
        >
            <img 
                src={logoUrl} 
                alt="Logo" 
                className="rounded-full object-cover" 
                style={{ width: '100%', height: '100%' }}
            />
        </div>
      )}
    </div>
  );

  if (!frame) {
    return (
      <div className={`relative p-4 bg-white rounded-lg shadow-sm border border-gray-100 ${className}`}>
         {QRContent}
      </div>
    );
  }

  // Frame Styles
  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${className}`} style={{ backgroundColor: frameColor || '#000', borderRadius: '1rem' }}>
       <div className="bg-white p-4 rounded-lg">
          {QRContent}
       </div>
       {frameText && (
         <div className="mt-3 font-bold text-white text-center uppercase tracking-wide text-sm">
           {frameText}
         </div>
       )}
    </div>
  );
};