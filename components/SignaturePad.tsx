import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

interface SignaturePadProps {
  onDraw?: () => void;
  onClear?: () => void;
  width?: number;
  height?: number;
}

const SignaturePad = forwardRef<{ getSignatureData: () => string | null, clear: () => void }, SignaturePadProps>(({ onDraw, onClear, width, height }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (!canvas || !ctx) return;
    
    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = width || parent.clientWidth;
            canvas.height = height || parent.clientHeight;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [width, height]);

  const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    const touch = 'touches' in e ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : ('clientX' in e ? e.clientX : 0);
    const clientY = touch ? touch.clientY : ('clientY' in e ? e.clientY : 0);

    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getEventPosition(e);
    if (!pos) return;

    isDrawing.current = true;
    lastPos.current = pos;
    if(onDraw) onDraw();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getEventPosition(e);
    const ctx = getCanvasContext();
    if (!pos || !lastPos.current || !ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if(onClear) onClear();
    }
  };
  
  useImperativeHandle(ref, () => ({
      getSignatureData: () => {
          const canvas = canvasRef.current;
          if (canvas) {
              return canvas.toDataURL('image/png');
          }
          return null;
      },
      clear: clearCanvas
  }));

  return (
    <div className="relative w-full h-full bg-gray-50 touch-none" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => startDrawing(e)}
        onMouseMove={(e) => draw(e)}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={(e) => startDrawing(e)}
        onTouchMove={(e) => draw(e)}
        onTouchEnd={stopDrawing}
        className="w-full h-full"
      />
    </div>
  );
});

export default SignaturePad;