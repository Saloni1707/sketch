"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import styles from "./Canvas.module.css"

interface CanvasProps extends React.HTMLAttributes<HTMLCanvasElement> {
  width?: number;
  height?: number;
}

export const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({
  width = 0,
  height = 0,
  ...props
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width, height });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  // Combine forwarded ref with local ref
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setSize({
        width: newWidth,
        height: newHeight
      });
      
      // Update canvas dimensions
      if (canvasRef.current) {
        canvasRef.current.width = newWidth;
        canvasRef.current.height = newHeight;
      }
    };

    // Initial setup
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.canvasWrapper}>
      <canvas 
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{ 
          position: 'absolute',
          zIndex: 1,
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
        {...props}
      />
    </div>
  );
});

Canvas.displayName = 'Canvas';