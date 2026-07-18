import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Modal, Text, useToast } from '@nimbus-ds/components';

export interface ColorDropperProps {
  open: boolean;
  imageSrc: string;
  productName: string;
  onDismiss: () => void;
  onPickColor?: (hex: string) => void;
}

interface PickedColor {
  hex: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const ZOOM = 8;
const LENS_SIZE = 200;

const ColorDropper: React.FC<ColorDropperProps> = ({ open, imageSrc, productName, onDismiss, onPickColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const lensCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);
  const lensPosRef = useRef<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const [pickedColors, setPickedColors] = useState<PickedColor[]>([]);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const [corsError, setCorsError] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (open) {
      setPickedColors([]);
      setHoverColor(null);
      setHoverPos(null);
      setCanvasReady(false);
      setCorsError(false);
      lensPosRef.current = { x: 0, y: 0, visible: false };
      if (lensCanvasRef.current) lensCanvasRef.current.style.display = 'none';
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open || !canvasRef.current || !containerRef.current) return;

    let cancelled = false;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = containerRef.current.clientWidth;

    const drawImage = (image: HTMLImageElement) => {
      if (cancelled) return;
      const aspectRatio = image.width / image.height;
      const width = Math.min(containerWidth || 600, image.width);
      const height = width / aspectRatio;

      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.drawImage(image, 0, 0, width, height);
      setCanvasReady(true);
    };

    const img = new Image();
    img.onload = () => drawImage(img);
    img.onerror = () => {
      if (cancelled) return;
      setCorsError(true);
      setCanvasReady(true);
    };
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    return () => {
      cancelled = true;
    };
  }, [open, imageSrc]);

  useEffect(() => {
    const lensCanvas = lensCanvasRef.current;
    if (lensCanvas) {
      lensCanvas.width = LENS_SIZE;
      lensCanvas.height = LENS_SIZE;
      const ctx = lensCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        lensCtxRef.current = ctx;
      }
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const drawLens = useCallback(() => {
    const lensCanvas = lensCanvasRef.current;
    const ctx = lensCtxRef.current;
    const mainCanvas = canvasRef.current;

    if (!lensCanvas || !ctx || !mainCanvas) {
      rafRef.current = null;
      return;
    }

    const pos = lensPosRef.current;

    ctx.clearRect(0, 0, LENS_SIZE, LENS_SIZE);

    if (!pos.visible) {
      lensCanvas.style.display = 'none';
      rafRef.current = null;
      return;
    }

    lensCanvas.style.display = 'block';

    const srcSize = LENS_SIZE / ZOOM;
    const srcX = Math.max(0, Math.min(pos.x - srcSize / 2, mainCanvas.width - srcSize));
    const srcY = Math.max(0, Math.min(pos.y - srcSize / 2, mainCanvas.height - srcSize));

    ctx.save();
    ctx.beginPath();
    ctx.arc(LENS_SIZE / 2, LENS_SIZE / 2, LENS_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(mainCanvas, srcX, srcY, srcSize, srcSize, 0, 0, LENS_SIZE, LENS_SIZE);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(LENS_SIZE / 2, LENS_SIZE / 2, LENS_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    rafRef.current = requestAnimationFrame(drawLens);
  }, []);

  const readPixelColor = useCallback((clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(clientX - rect.left);
    const y = Math.round(clientY - rect.top);

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return null;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1);
      return rgbToHex(pixel.data[0], pixel.data[1], pixel.data[2]);
    } catch {
      return null;
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (corsError) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const hex = readPixelColor(e.clientX, e.clientY);
    setHoverColor(hex);
    setHoverPos(hex ? { x, y } : null);

    const lensCanvas = lensCanvasRef.current;
    if (!lensCanvas) return;

    lensPosRef.current = { x, y, visible: true };

    const gap = 12;
    let lensLeft = x + gap;
    let lensTop = y - LENS_SIZE - gap;
    const containerWidth = container.clientWidth;
    if (lensLeft + LENS_SIZE > containerWidth) lensLeft = x - LENS_SIZE - gap;
    if (lensTop < 0) lensTop = y + gap;
    lensLeft = Math.max(2, Math.min(lensLeft, containerWidth - LENS_SIZE - 2));
    lensTop = Math.max(2, lensTop);

    lensCanvas.style.left = `${lensLeft}px`;
    lensCanvas.style.top = `${lensTop}px`;

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(drawLens);
    }
  }, [readPixelColor, corsError, drawLens]);

  const handleMouseLeave = useCallback(() => {
    setHoverColor(null);
    setHoverPos(null);
    lensPosRef.current = { x: 0, y: 0, visible: false };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(drawLens);
    }
  }, [drawLens]);

  const handleCanvasClick = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (corsError) {
      addToast({
        type: 'danger',
        text: 'Imagem não permite leitura de cores (sem permissão CORS)',
        duration: 4000,
        id: 'dropper-cors-error',
      });
      return;
    }

    const hex = readPixelColor(e.clientX, e.clientY);
    if (!hex) return;

    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = hex;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    addToast({
      type: 'success',
      text: `Copiado: ${hex}`,
      duration: 4000,
      id: `copy-${hex}`,
    });

    setPickedColors((prev) => [{ hex }, ...prev].slice(0, 12));
    onPickColor?.(hex);
  }, [addToast, onPickColor, readPixelColor, corsError]);

  return (
    <Modal open={open} onDismiss={onDismiss} maxWidth="800px" padding="none">
      <Modal.Header title={`Seletor de cor — ${productName}`} />
      <Modal.Body padding="none">
        <Box position="relative" width="100%">
          <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            {!canvasReady && (
              <Box display="flex" justifyContent="center" padding="8">
                <Text>Carregando imagem...</Text>
              </Box>
            )}
            {corsError && (
              <Box display="flex" justifyContent="center" padding="8" flexDirection="column" gap="2" alignItems="center">
                <Text color="danger-textLow">Não foi possível carregar a imagem com permissão de leitura.</Text>
                <Text fontSize="caption" color="neutral-textLow">
                  As imagens deste produto não permitem extração de cores.
                </Text>
              </Box>
            )}
            <canvas
              ref={canvasRef}
              style={{
                display: canvasReady && !corsError ? 'block' : 'none',
                cursor: 'crosshair',
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleCanvasClick}
            />
            <canvas
              ref={lensCanvasRef}
              style={{
                display: 'none',
                position: 'absolute',
                width: `${LENS_SIZE}px`,
                height: `${LENS_SIZE}px`,
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            />
          </div>

          {hoverColor && hoverPos && (
            <Box
              display="flex"
              alignItems="center"
              gap="2"
              padding="2"
              style={{
                position: 'absolute',
                left: hoverPos.x + 16,
                top: Math.max(hoverPos.y - 20, 4),
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              <Box
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: hoverColor,
                  border: '2px solid #e5e7eb',
                  flexShrink: 0,
                }}
              />
              <Text fontSize="caption" fontWeight="bold" style={{ fontFamily: 'monospace' }}>
                {hoverColor}
              </Text>
            </Box>
          )}
        </Box>

        {pickedColors.length > 0 && (
          <Box display="flex" flexDirection="column" gap="2" padding="4">
            <Text fontWeight="bold" fontSize="caption">
              Cores extraídas ({pickedColors.length})
            </Text>
            <Box display="flex" gap="2" flexWrap="wrap">
              {pickedColors.map((color, index) => (
                <Box
                  key={`${color.hex}-${index}`}
                  display="flex"
                  gap="1"
                  alignItems="center"
                  style={{
                    backgroundColor: color.hex,
                    borderRadius: '6px',
                    padding: '2px 8px',
                    border: '1px solid #d1d5db',
                  }}
                >
                  <Text
                    fontSize="caption"
                    fontWeight="bold"
                    style={{ fontFamily: 'monospace', color: isLight(color.hex) ? '#374151' : '#ffffff' }}
                  >
                    {color.hex}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" onClick={onDismiss}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ColorDropper;
