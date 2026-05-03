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
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);
  const { fgColor, bgColor, gradientType, gradientColor2, logoUrl, logoSize, dotStyle, cornerStyle, frame, frameText, frameColor } = design;
  const [modules, setModules] = useState<boolean[][]>([]);
  const [qrSize, setQrSize] = useState(0);

  useEffect(() => {
    // Generate QR Matrix
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
      const size = qr.modules.size;
      const data = qr.modules.data;
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

  const isFinder = (r: number, c: number) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= qrSize - 7) return true;
    if (r >= qrSize - 7 && c < 7) return true;
    return false;
  };

  const getFill = () => {
    if (gradientType && gradientType !== 'none' && gradientColor2) {
      return `url(#grad-${uniqueId})`;
    }
    return fgColor;
  };

  const renderModules = () => {
    if (!modules.length) return null;
    const cellSize = size / qrSize;
    const shapes: React.ReactElement[] = [];
    const fill = getFill();

    modules.forEach((row, r) => {
      row.forEach((isDark, c) => {
        if (!isDark) return;

        const x = c * cellSize;
        const y = r * cellSize;
        const isFinderPattern = isFinder(r, c);

        const key = `${r}-${c}`;

        // Finder Pattern
        if (isFinderPattern) {
          if (cornerStyle === 'rounded') {
            shapes.push(<circle key={key} cx={x + cellSize / 2} cy={y + cellSize / 2} r={cellSize / 2} fill={fill} />);
          } else if (cornerStyle === 'dots') {
            shapes.push(<circle key={key} cx={x + cellSize / 2} cy={y + cellSize / 2} r={cellSize / 2.5} fill={fill} />);
          } else {
            shapes.push(<rect key={key} x={x} y={y} width={cellSize} height={cellSize} fill={fill} />);
          }
          return;
        }

        // Data Modules
        if (dotStyle === 'dots') {
          shapes.push(<circle key={key} cx={x + cellSize / 2} cy={y + cellSize / 2} r={cellSize / 2.5} fill={fill} />);
        } else if (dotStyle === 'rounded') {
          shapes.push(<rect key={key} x={x + cellSize * 0.1} y={y + cellSize * 0.1} width={cellSize * 0.8} height={cellSize * 0.8} rx={cellSize * 0.3} fill={fill} />);
        } else {
          shapes.push(<rect key={key} x={x} y={y} width={cellSize + 0.2} height={cellSize + 0.2} fill={fill} />);
        }
      });
    });
    return shapes;
  };

  const QRContent = (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ backgroundColor: bgColor }}>
        <defs>
          {gradientType === 'linear' && (
            <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fgColor} />
              <stop offset="100%" stopColor={gradientColor2 || fgColor} />
            </linearGradient>
          )}
          {gradientType === 'radial' && (
            <radialGradient id={`grad-${uniqueId}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor={fgColor} />
              <stop offset="100%" stopColor={gradientColor2 || fgColor} />
            </radialGradient>
          )}
        </defs>
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
  const frameBg = frameColor || '#000000';
  const frameTextStyle = "font-bold text-white text-center uppercase tracking-wide text-sm";

  if (frame === 'rounded') {
    return (
      <div className={`relative flex flex-col items-center justify-center p-8 ${className}`} style={{ backgroundColor: frameBg, borderRadius: '2rem' }}>
        <div className="bg-white p-4 rounded-xl">
          {QRContent}
        </div>
        {frameText && <div className={`mt-4 ${frameTextStyle}`}>{frameText}</div>}
      </div>
    );
  }

  if (frame === 'bubble') {
    return (
      <div className={`relative flex flex-col items-center justify-center p-8 ${className}`} style={{ backgroundColor: frameBg, borderRadius: '2rem 2rem 2rem 0' }}>
        <div className="bg-white p-4 rounded-xl">
          {QRContent}
        </div>
        {frameText && <div className={`mt-4 ${frameTextStyle}`}>{frameText}</div>}
      </div>
    );
  }

  // Basic Frame
  return (
    <div className={`relative flex flex-col items-center justify-center p-6 ${className}`} style={{ backgroundColor: frameBg, borderRadius: '1rem' }}>
      <div className="bg-white p-4 rounded-lg">
        {QRContent}
      </div>
      {frameText && <div className={`mt-3 ${frameTextStyle}`}>{frameText}</div>}
    </div>
  );
};