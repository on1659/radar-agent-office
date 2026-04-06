import { useRef, useEffect, useCallback, useState } from 'react';
import { GameEngine } from './GameEngine';
import type { GameEngineConfig } from './GameEngine';
import { ISO_MAP_W, ISO_MAP_H } from './isoTransform';
import type { AgentStatus } from '@radar/shared';

export interface UseGameEngineResult {
  tileMapRef: React.RefCallback<HTMLCanvasElement>;
  characterRef: React.RefCallback<HTMLCanvasElement>;
  engine: GameEngine | null;
  canvasWidth: number;
  canvasHeight: number;
  getAgentPixelPos: (agentId: string) => { x: number; y: number } | null;
  frameTick: number;
  setViewportSize: (w: number, h: number) => void;
  getCameraOffset: () => { x: number; y: number };
  isCameraDragging: () => boolean;
}

export function useGameEngine(
  agentStatuses: Record<string, AgentStatus>,
  config?: GameEngineConfig,
): UseGameEngineResult {
  const engineRef = useRef<GameEngine | null>(null);
  const tileMapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const characterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [frameTick, setFrameTick] = useState(0);
  const frameCountRef = useRef(0);
  const throttleRef = useRef(0);

  const [viewportSize, setViewportSizeState] = useState({ w: ISO_MAP_W, h: ISO_MAP_H });
  const configRef = useRef(config);
  configRef.current = config;

  const canvasWidth = viewportSize.w;
  const canvasHeight = viewportSize.h;

  const tryInit = useCallback(() => {
    if (engineRef.current) return;
    const tmCanvas = tileMapCanvasRef.current;
    const chCanvas = characterCanvasRef.current;
    if (!tmCanvas || !chCanvas) return;

    const engine = new GameEngine(tmCanvas, chCanvas, configRef.current);
    engineRef.current = engine;

    engine.setViewportSize(ISO_MAP_W, ISO_MAP_H);

    engine.onPositionUpdate = () => {
      frameCountRef.current++;
      if (frameCountRef.current - throttleRef.current >= 3) {
        throttleRef.current = frameCountRef.current;
        setFrameTick(frameCountRef.current);
      }
    };

    engine.start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tileMapRef = useCallback((node: HTMLCanvasElement | null) => {
    tileMapCanvasRef.current = node;
    if (node) tryInit();
  }, [tryInit]);

  const characterRef = useCallback((node: HTMLCanvasElement | null) => {
    characterCanvasRef.current = node;
    if (node) tryInit();
  }, [tryInit]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.updateAllAgentStatuses(agentStatuses);
  }, [agentStatuses]);

  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  const getAgentPixelPos = useCallback((agentId: string) => {
    return engineRef.current?.getCharacterPixelPos(agentId) ?? null;
  }, []);

  const setViewportSize = useCallback((w: number, h: number) => {
    setViewportSizeState({ w, h });
    engineRef.current?.setViewportSize(w, h);
  }, []);

  const getCameraOffset = useCallback(() => {
    const cam = engineRef.current?.getCamera();
    return cam ? { x: cam.x, y: cam.y } : { x: 0, y: 0 };
  }, []);

  const isCameraDragging = useCallback(() => {
    return engineRef.current?.getCamera().isDragging ?? false;
  }, []);

  return {
    tileMapRef, characterRef,
    engine: engineRef.current,
    canvasWidth, canvasHeight,
    getAgentPixelPos, frameTick,
    setViewportSize, getCameraOffset, isCameraDragging,
  };
}
