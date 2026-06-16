'use client';

import { supabase } from './supabase';
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Sector, Seat, CartItem, BestSeatCriteria } from './types';
import { createInitialSectors } from './seat-data';
import { useWasmRecommender, recommendSeatsJS } from './use-wasm-recommender';

interface SeatingState {
  sectors: Sector[];
  selectedSeats: CartItem[];
  selectedSector: Sector | null;
  isLoading: boolean;
  view: 'arena' | 'sector' | 'cart' | 'checkout';
}

interface SeatingContextType extends SeatingState {
  selectSeat: (seat: Seat, sectorName: string) => void;
  deselectSeat: (seatId: string) => void;
  clearSelection: () => void;
  setSelectedSector: (sector: Sector | null) => void;
  setView: (view: SeatingState['view']) => void;
  reserveSeats: (seatIds: string[], email: string, phone: string) => Promise<void>;
  handleFindBestSeats: (criteria: BestSeatCriteria, groupSize?: number) => Promise<void>;
  getTotalPrice: () => number;
  getSeatById: (seatId: string) => Seat | undefined;
  getSectorById: (sectorId: number) => Sector | undefined;
}

const SeatingContext = createContext<SeatingContextType | null>(null);

export function SeatingProvider({ children }: { children: React.ReactNode }) {
  const { findBestSeats, isReady } = useWasmRecommender();

  const [state, setState] = useState<SeatingState>({
    sectors: [],
    selectedSeats: [],
    selectedSector: null,
    isLoading: false,
    view: 'arena',
  });

  // Initialize sectors on mount
  // Atnaujintas pradinio užkrovimo blokas su diagnostika
  useEffect(() => {
    const fetchInitialSeats = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data: dbSeats, error } = await supabase.from('seats').select('id, status');
      
      if (error) {
        console.error('❌ Supabase SELECT klaida:', error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // DIAGNOSTIKA: Pažiūrėkime į naršyklės konsolę (F12)
      console.log("📊 Gauti duomenys iš Supabase:", dbSeats);

      if (!dbSeats || dbSeats.length === 0) {
        console.warn("⚠️ DĖMESIO: Supabase grąžino 0 eilučių! Ar tikrai lentelė užpildyta?");
      }

      const dbStatusMap = new Map(dbSeats.map(seat => [seat.id, seat.status]));
      const baseSectors = createInitialSectors();

      const syncedSectors = baseSectors.map(sector => {
        const syncedSeats = sector.seats.map(seat => {
          const dbStatus = dbStatusMap.get(seat.id);
          
          // Jei ID nesutampa, čia pamatysime problemą
          if (!dbStatus) {
            // console.log(`Nerastas statusas vietai ID: ${seat.id}`);
          }

          return {
            ...seat,
            status: (dbStatus || 'available') as any
          };
        });

        return {
          ...sector,
          seats: syncedSeats,
          availableSeats: syncedSeats.filter(s => s.status === 'available').length
        };
      });

      setState(prev => ({ 
        ...prev, 
        sectors: syncedSectors,
        isLoading: false
      }));
    };

    fetchInitialSeats();
  }, []);

// SUPABASE INTEGRATION HOOK - Real-time seat updates
  const useLiveSeating = useCallback(() => {
    const channel = supabase
      .channel('public:seats')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats' },
        (payload) => {
          const updatedSeat = payload.new;

          setState(prev => {
            const updatedSectors = prev.sectors.map(sector => {
              if (sector.id !== updatedSeat.sector_id) return sector;

              const newSeats = sector.seats.map(s => {
                if (s.id === updatedSeat.id) {
                  if (updatedSeat.status === 'booked') {
                    return { ...s, status: 'booked' as const };
                  }
                  if (s.status !== 'selected') {
                    return { ...s, status: updatedSeat.status as any };
                  }
                }
                return s;
              });

              return {
                ...sector,
                seats: newSeats,
                availableSeats: newSeats.filter(s => s.status === 'available').length,
              };
            });

            const isSelectedSeatBooked = prev.selectedSeats.some(
              item => item.seat.id === updatedSeat.id && updatedSeat.status === 'booked'
            );

            if (isSelectedSeatBooked) {
              alert("Dėmesio! Viena iš jūsų pasirinktų vietų ką tik buvo nupirkta kito vartotojo.");
            }

            return {
              ...prev,
              sectors: updatedSectors,
              selectedSeats: prev.selectedSeats.filter(
                item => !(item.seat.id === updatedSeat.id && updatedSeat.status === 'booked')
              )
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const cleanup = useLiveSeating();
    return cleanup;
  }, [useLiveSeating]);

  const selectSeat = useCallback((seat: Seat, sectorName: string) => {
    if (seat.status !== 'available') return;

    setState(prev => {
      // Check if seat is already selected
      if (prev.selectedSeats.some(item => item.seat.id === seat.id)) {
        return prev;
      }

      // Update seat status in sectors
      const updatedSectors = prev.sectors.map(sector => ({
        ...sector,
        seats: sector.seats.map(s =>
          s.id === seat.id ? { ...s, status: 'selected' as const } : s
        ),
      }));

      // Update selectedSector if it matches
      const updatedSelectedSector = prev.selectedSector
        ? {
            ...prev.selectedSector,
            seats: prev.selectedSector.seats.map(s =>
              s.id === seat.id ? { ...s, status: 'selected' as const } : s
            ),
          }
        : null;

      return {
        ...prev,
        sectors: updatedSectors,
        selectedSector: updatedSelectedSector,
        selectedSeats: [...prev.selectedSeats, { seat: { ...seat, status: 'selected' }, sectorName }],
      };
    });
  }, []);

  const deselectSeat = useCallback((seatId: string) => {
    setState(prev => {
      // Update seat status back to available in sectors
      const updatedSectors = prev.sectors.map(sector => ({
        ...sector,
        seats: sector.seats.map(s =>
          s.id === seatId ? { ...s, status: 'available' as const } : s
        ),
        availableSeats: sector.seats.filter(s => 
          s.id === seatId ? true : s.status === 'available'
        ).length,
      }));

      // Update selectedSector if it matches
      const updatedSelectedSector = prev.selectedSector
        ? {
            ...prev.selectedSector,
            seats: prev.selectedSector.seats.map(s =>
              s.id === seatId ? { ...s, status: 'available' as const } : s
            ),
          }
        : null;

      return {
        ...prev,
        sectors: updatedSectors,
        selectedSector: updatedSelectedSector,
        selectedSeats: prev.selectedSeats.filter(item => item.seat.id !== seatId),
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => {
      const selectedIds = new Set(prev.selectedSeats.map(item => item.seat.id));
      
      const updatedSectors = prev.sectors.map(sector => ({
        ...sector,
        seats: sector.seats.map(s =>
          selectedIds.has(s.id) ? { ...s, status: 'available' as const } : s
        ),
      }));

      const updatedSelectedSector = prev.selectedSector
        ? {
            ...prev.selectedSector,
            seats: prev.selectedSector.seats.map(s =>
              selectedIds.has(s.id) ? { ...s, status: 'available' as const } : s
            ),
          }
        : null;

      return {
        ...prev,
        sectors: updatedSectors,
        selectedSector: updatedSelectedSector,
        selectedSeats: [],
      };
    });
  }, []);

  const setSelectedSector = useCallback((sector: Sector | null) => {
    setState(prev => ({ ...prev, selectedSector: sector, view: sector ? 'sector' : 'arena' }));
  }, []);

  const setView = useCallback((view: SeatingState['view']) => {
    setState(prev => ({ ...prev, view }));
  }, []);

  // SUPABASE INTEGRATION - Reserve Seats
  // SUPABASE INTEGRATION - Reserve Seats (su geresniu klaidų gaudymu)
  // SUPABASE INTEGRATION - Reserve Seats su kontaktais
  const reserveSeats = useCallback(async (seatIds: string[], email: string, phone: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.rpc('reserve_seats', {
        seat_ids: seatIds,
        email: email,
        phone: phone
      });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        selectedSeats: [],
        isLoading: false,
        view: 'arena',
      }));
      
      alert('Sėkmingai rezervavote vietas!');

    } catch (error: any) {
      console.error('Pilna klaidos informacija:', JSON.stringify(error, null, 2));
      alert(`Nepavyko rezervuoti. Klaida: ${error.message || 'Nežinoma klaida.'}`);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleFindBestSeats = useCallback(async (criteria: BestSeatCriteria, groupSize: number = 1) => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Give the WASM module a tick to finish loading if it just became ready
    await new Promise(resolve => setTimeout(resolve, 50));

    setState(prev => {
      let recommendedIds: string[];

      if (isReady()) {
        recommendedIds = findBestSeats(prev.sectors, criteria, groupSize);
      } else {
        // Fallback: pure-JS mirror of the same strategies while WASM loads
        console.warn('[WASM] Module not ready, using JS fallback');
        recommendedIds = recommendSeatsJS(prev.sectors, criteria, groupSize);
      }

      if (recommendedIds.length === 0) {
        return { ...prev, isLoading: false };
      }

      const selectedIds = new Set(recommendedIds);

      const updatedSectors = prev.sectors.map(sector => ({
        ...sector,
        seats: sector.seats.map(s =>
          selectedIds.has(s.id) ? { ...s, status: 'selected' as const } : s
        ),
        availableSeats: sector.seats.filter(s =>
          s.status === 'available' && !selectedIds.has(s.id)
        ).length,
      }));

      const newSelectedSeats = prev.sectors.flatMap(sector =>
        sector.seats
          .filter(s => selectedIds.has(s.id))
          .map(s => ({ seat: { ...s, status: 'selected' as const }, sectorName: sector.name }))
      );

      return {
        ...prev,
        sectors: updatedSectors,
        selectedSeats: [...prev.selectedSeats, ...newSelectedSeats],
        isLoading: false,
      };
    });
  }, [findBestSeats, isReady]);

  const getTotalPrice = useCallback(() => {
    return state.selectedSeats.reduce((total, item) => total + item.seat.price, 0);
  }, [state.selectedSeats]);

  const getSeatById = useCallback((seatId: string) => {
    for (const sector of state.sectors) {
      const seat = sector.seats.find(s => s.id === seatId);
      if (seat) return seat;
    }
    return undefined;
  }, [state.sectors]);

  const getSectorById = useCallback((sectorId: number) => {
    return state.sectors.find(s => s.id === sectorId);
  }, [state.sectors]);

  const value = useMemo(() => ({
    ...state,
    selectSeat,
    deselectSeat,
    clearSelection,
    setSelectedSector,
    setView,
    reserveSeats,
    handleFindBestSeats,
    getTotalPrice,
    getSeatById,
    getSectorById,
  }), [state, selectSeat, deselectSeat, clearSelection, setSelectedSector, setView, reserveSeats, handleFindBestSeats, getTotalPrice, getSeatById, getSectorById]);

  return (
    <SeatingContext.Provider value={value}>
      {children}
    </SeatingContext.Provider>
  );
}

export function useSeating() {
  const context = useContext(SeatingContext);
  if (!context) {
    throw new Error('useSeating must be used within a SeatingProvider');
  }
  return context;
}
