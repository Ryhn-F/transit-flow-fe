import { mulberry32 } from "@/lib/prng";
import type { DetectedObject, SimFrame } from "../types";

export interface PedestrianSim {
  lane: number;
  direction: 1 | -1;
  progress: number;
  speed: number;
}

export interface SimEngineState {
  pedestrians: PedestrianSim[];
  frame: number;
  inTotal: number;
  outTotal: number;
}

export function createEngine(
  cameraId: string,
  laneCount: number,
  seedOffset = 0,
): SimEngineState {
  const rand = mulberry32(
    cameraId.split("").reduce((acc, ch) => acc * 33 + ch.charCodeAt(0), 11) + seedOffset,
  );
  const pedestrians: PedestrianSim[] = [];
  const count = 8 + Math.floor(rand() * 6);
  for (let i = 0; i < count; i++) {
    pedestrians.push({
      lane: Math.floor(rand() * laneCount),
      direction: rand() > 0.5 ? 1 : -1,
      progress: rand(),
      speed: 0.004 + rand() * 0.008,
    });
  }
  return { pedestrians, frame: 0, inTotal: 0, outTotal: 0 };
}

const LANE_YS = [0.25, 0.45, 0.65, 0.85];

export function tickEngine(
  state: SimEngineState,
  laneCount: number,
  spawnEveryFrames = 40,
): SimFrame {
  state.frame += 1;
  const rand = mulberry32(state.frame * 7919 + 13);

  // spawn
  if (state.frame % spawnEveryFrames === 0) {
    state.pedestrians.push({
      lane: Math.floor(rand() * laneCount),
      direction: rand() > 0.5 ? 1 : -1,
      progress: 0,
      speed: 0.004 + rand() * 0.008,
    });
  }

  const pedestrians: DetectedObject[] = [];
  let inCount = 0;
  let outCount = 0;

  for (const p of state.pedestrians) {
    p.progress += p.speed * (p.direction === 1 ? 1 : -1);
    if (p.progress > 1) {
      p.progress = 1;
      outCount += 1;
      continue;
    }
    if (p.progress < 0) {
      p.progress = 0;
      inCount += 1;
      continue;
    }
    pedestrians.push({
      x: p.progress,
      y: LANE_YS[p.lane % LANE_YS.length],
      w: 0.05 + (rand() % 3) * 0.008,
      h: 0.12 + (rand() % 3) * 0.01,
      confidence: 0.82 + Math.floor(rand() * 15) / 100,
    });
  }

  state.pedestrians = state.pedestrians.filter(
    (p) => p.progress > 0 && p.progress < 1,
  );
  state.inTotal += inCount;
  state.outTotal += outCount;

  return { pedestrians, inCount, outCount };
}

export function countersPerMinute(frame: number, cameraId: string): number {
  const rand = mulberry32(cameraId.length * 41 + Math.floor(frame / 60));
  return 22 + Math.floor(rand() * 14);
}
