'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Sector, BestSeatCriteria } from './types';

// Weight derived from sector price tier – mirrors sectionWeight in C++
function sectionWeight(price: number): number {
  if (price >= 149) return 4;
  if (price >= 72)  return 3;
  if (price >= 39)  return 2;
  return 1;
}

// Pure-JS mirror of the C++ strategies. Used as a fallback when the WASM
// module hasn't finished loading. Must stay in sync with seat_recommender.cpp.
const COURT_CX = 50;
const COURT_CY = 50;

export function recommendSeatsJS(
  sectors: Sector[],
  criteria: BestSeatCriteria,
  count: number,
): string[] {
  type S = { id: string; row: number; col: number; price: number; weight: number; gx: number; gy: number; sectorId: number };
  const all: S[] = [];
  for (const sector of sectors) {
    const sx = sector.position.x + sector.position.width / 2;
    const sy = sector.position.y + sector.position.height / 2;
    for (const seat of sector.seats) {
      if (seat.status !== 'available') continue;
      all.push({
        id: seat.id,
        row: seat.row,
        col: seat.seatNumber,
        price: seat.price,
        weight: sectionWeight(seat.price),
        gx: sx + (seat.seatNumber - 1) * 0.15,
        gy: sy + (seat.row - 1) * 0.15,
        sectorId: sector.id,
      });
    }
  }
  if (all.length === 0) return [];
  const dist = (s: S) => Math.hypot(s.gx - COURT_CX, s.gy - COURT_CY);

  if (criteria === 'centered') {
    return [...all].sort((a, b) => dist(a) - dist(b)).slice(0, count).map(s => s.id);
  }

  if (criteria === 'value') {
    return [...all].sort((a, b) => {
      const sa = a.price > 0 ? a.weight / a.price : 0;
      const sb = b.price > 0 ? b.weight / b.price : 0;
      if (Math.abs(sa - sb) > 1e-9) return sb - sa;
      return dist(a) - dist(b);
    }).slice(0, count).map(s => s.id);
  }

  // group: same sector + same row, consecutive seat numbers
  const groups = new Map<string, S[]>();
  for (const s of all) {
    const k = `${s.sectorId}-${s.row}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(s);
  }
  let bestRun: string[] = [];
  let bestDist = Infinity;
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.col - b.col);
    for (let i = 0; i + count <= arr.length; i++) {
      let consecutive = true;
      for (let k = 1; k < count; k++)
        if (arr[i + k].col !== arr[i + k - 1].col + 1) { consecutive = false; break; }
      if (!consecutive) continue;
      const run = arr.slice(i, i + count);
      const d = run.reduce((acc, s) => acc + dist(s), 0) / count;
      if (d < bestDist) { bestDist = d; bestRun = run.map(s => s.id); }
    }
  }
  if (bestRun.length) return bestRun;
  return [...all].sort((a, b) => dist(a) - dist(b)).slice(0, count).map(s => s.id);
}

interface WASMWrapper {
  clearVenue(): void;
  addSeat(
    id: string,
    localRow: number,
    localCol: number,
    price: number,
    status: boolean,
    weight: number,
    gx: number,
    gy: number,
    sectorId: number,
  ): void;
  suggestSeats(type: string, count: number): string; // returns JSON array of IDs
}

interface SeatModule {
  WASMWrapper: new () => WASMWrapper;
}

declare global {
  interface Window {
    createSeatModule?: () => Promise<SeatModule>;
  }
}

export function useWasmRecommender() {
  const moduleRef = useRef<SeatModule | null>(null);
  const wrapperRef = useRef<WASMWrapper | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const script = document.createElement('script');
    script.src = '/wasm/seat_recommender.js';
    script.async = true;
    script.onload = async () => {
      if (typeof window.createSeatModule === 'function') {
        const mod = await window.createSeatModule();
        moduleRef.current = mod;
        wrapperRef.current = new mod.WASMWrapper();
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  /**
   * Feed all current sectors into the WASM module and run the algorithm.
   * Returns an array of seat IDs recommended by the chosen strategy.
   */
  const findBestSeats = useCallback(
    (sectors: Sector[], criteria: BestSeatCriteria, count: number): string[] => {
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        console.warn('[WASM] Module not loaded yet – falling back to JS');
        return [];
      }

      wrapper.clearVenue();

      for (const sector of sectors) {
        // Global arena position of the sector's centre (0–100 space, same
        // coordinate system as the court centre at 50,50).
        const sx = sector.position.x + sector.position.width / 2;
        const sy = sector.position.y + sector.position.height / 2;

        for (const seat of sector.seats) {
          // Spread seats slightly around the sector centre by their local
          // row/seat so seats in the same sector aren't all identical points.
          const gx = sx + (seat.seatNumber - 1) * 0.15;
          const gy = sy + (seat.row - 1) * 0.15;

          wrapper.addSeat(
            seat.id,
            seat.row,            // local row inside sector
            seat.seatNumber,     // local seat number inside sector
            seat.price,
            seat.status === 'available',
            sectionWeight(seat.price),
            gx,
            gy,
            sector.id,
          );
        }
      }

      const json = wrapper.suggestSeats(criteria, count);
      try {
        return JSON.parse(json) as string[];
      } catch {
        console.error('[WASM] Failed to parse result:', json);
        return [];
      }
    },
    [],
  );

  const isReady = useCallback(() => wrapperRef.current !== null, []);

  return { findBestSeats, isReady };
}
