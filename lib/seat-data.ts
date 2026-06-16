import { Sector, Seat, EventInfo } from './types';

// Generate seats for a sector
function generateSeats(sectorId: number, rows: number, seatsPerRow: number, price: number, bookedPercentage: number = 0.3): Seat[] {
  const seats: Seat[] = [];
  
  for (let row = 1; row <= rows; row++) {
    for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
      const isBooked = Math.random() < bookedPercentage;
      seats.push({
        id: `${sectorId}-${row}-${seatNum}`,
        sectorId,
        row,
        seatNumber: seatNum,
        price,
        status: isBooked ? 'booked' : 'available',
      });
    }
  }
  
  return seats;
}

// Calculate availability level based on available seats percentage
export function getAvailabilityLevel(availableSeats: number, totalSeats: number): 'high' | 'medium' | 'low' {
  const percentage = availableSeats / totalSeats;
  if (percentage > 0.5) return 'high';
  if (percentage > 0.2) return 'medium';
  return 'low';
}

// Initial sectors data matching the design - positions are relative to arena oval
// The court is centered at roughly 35-65% horizontally and 35-65% vertically
export function createInitialSectors(): Sector[] {
  const sectorsConfig = [
    // === TOP SECTION (above court) ===
    // Row 1 - top edge
    { id: 1, name: '101', price: 39, position: { x: 12, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.3 },
    { id: 2, name: '102', price: 39, position: { x: 18, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.5 },
    { id: 3, name: '103', price: 39, position: { x: 24, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.7 },
    { id: 4, name: '104', price: 39, position: { x: 30, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.8 },
    { id: 5, name: '105', price: 39, position: { x: 36, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.2 },
    { id: 6, name: '106', price: 39, position: { x: 42, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.5 },
    { id: 7, name: '107', price: 39, position: { x: 48, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.4 },
    { id: 8, name: '108', price: 39, position: { x: 54, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.6 },
    { id: 9, name: '109', price: 39, position: { x: 60, y: 12, width: 5.5, height: 6 }, rows: 4, seatsPerRow: 6, bookedPct: 0.85 },
    { id: 10, name: '110', price: 39, position: { x: 66, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.3 },
    { id: 11, name: '111', price: 39, position: { x: 72, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.7 },
    { id: 12, name: '112', price: 39, position: { x: 78, y: 12, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.2 },
    
    // Row 2 - second from top
    { id: 13, name: '113', price: 149, position: { x: 8, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.4 },
    { id: 14, name: '114', price: 149, position: { x: 16, y: 20, width: 8, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.6 },
    { id: 15, name: '115', price: 149, position: { x: 26, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.8 },
    { id: 16, name: '116', price: 149, position: { x: 34, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.3 },
    { id: 17, name: '117', price: 149, position: { x: 42, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.5 },
    { id: 18, name: '118', price: 149, position: { x: 50, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.4 },
    { id: 19, name: '119', price: 149, position: { x: 58, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.7 },
    { id: 20, name: '120', price: 149, position: { x: 66, y: 20, width: 6, height: 6 }, rows: 4, seatsPerRow: 6, bookedPct: 0.9 },
    { id: 21, name: '121', price: 149, position: { x: 74, y: 20, width: 8, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.2 },
    { id: 22, name: '122', price: 149, position: { x: 84, y: 20, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.5 },

    // === LEFT SIDE (beside court) ===
    { id: 23, name: '123', price: 39, position: { x: 4, y: 28, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.3 },
    { id: 24, name: '124', price: 39, position: { x: 4, y: 36, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.5 },
    { id: 25, name: '125', price: 39, position: { x: 4, y: 44, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.7 },
    { id: 26, name: '126', price: 39, position: { x: 4, y: 52, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.4 },
    { id: 27, name: '127', price: 39, position: { x: 4, y: 60, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.2 },
    
    // Second left column
    { id: 28, name: '128', price: 72, position: { x: 12, y: 30, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.6 },
    { id: 29, name: '129', price: 72, position: { x: 12, y: 38, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.8 },
    { id: 30, name: '130', price: 72, position: { x: 12, y: 46, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.3 },
    { id: 31, name: '131', price: 72, position: { x: 12, y: 54, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.9 },
    { id: 32, name: '132', price: 72, position: { x: 12, y: 62, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.4 },

    // === RIGHT SIDE (beside court) ===
    { id: 33, name: '133', price: 39, position: { x: 88, y: 28, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.5 },
    { id: 34, name: '134', price: 39, position: { x: 88, y: 36, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.3 },
    { id: 35, name: '135', price: 39, position: { x: 88, y: 44, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.8 },
    { id: 36, name: '136', price: 39, position: { x: 88, y: 52, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.2 },
    { id: 37, name: '137', price: 39, position: { x: 88, y: 60, width: 6, height: 6 }, rows: 6, seatsPerRow: 6, bookedPct: 0.6 },
    
    // Second right column
    { id: 38, name: '138', price: 72, position: { x: 80, y: 30, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.4 },
    { id: 39, name: '139', price: 72, position: { x: 80, y: 38, width: 6, height: 6 }, rows: 4, seatsPerRow: 5, bookedPct: 0.85 },
    { id: 40, name: '140', price: 72, position: { x: 80, y: 46, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.7 },
    { id: 41, name: '141', price: 72, position: { x: 80, y: 54, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.3 },
    { id: 42, name: '142', price: 72, position: { x: 80, y: 62, width: 6, height: 6 }, rows: 5, seatsPerRow: 6, bookedPct: 0.5 },

    // === BOTTOM SECTION (below court) ===
    // Row 1 - first below court
    { id: 43, name: '143', price: 149, position: { x: 8, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.5 },
    { id: 44, name: '144', price: 149, position: { x: 16, y: 70, width: 8, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.3 },
    { id: 45, name: '145', price: 149, position: { x: 26, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.7 },
    { id: 46, name: '146', price: 149, position: { x: 34, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.2 },
    { id: 47, name: '147', price: 149, position: { x: 42, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.8 },
    { id: 48, name: '148', price: 149, position: { x: 50, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.4 },
    { id: 49, name: '149', price: 149, position: { x: 58, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.6 },
    { id: 50, name: '150', price: 149, position: { x: 66, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.3 },
    { id: 51, name: '151', price: 149, position: { x: 74, y: 70, width: 8, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.5 },
    { id: 52, name: '152', price: 149, position: { x: 84, y: 70, width: 6, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.7 },

    // Row 2 - bottom edge
    { id: 53, name: '153', price: 39, position: { x: 12, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.4 },
    { id: 54, name: '154', price: 39, position: { x: 18, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.6 },
    { id: 55, name: '155', price: 39, position: { x: 24, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.8 },
    { id: 56, name: '156', price: 39, position: { x: 30, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.2 },
    { id: 57, name: '157', price: 39, position: { x: 36, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.5 },
    { id: 58, name: '158', price: 39, position: { x: 42, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.3 },
    { id: 59, name: '159', price: 39, position: { x: 48, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 10, bookedPct: 0.4 },
    { id: 60, name: '160', price: 39, position: { x: 54, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.7 },
    { id: 61, name: '161', price: 39, position: { x: 60, y: 78, width: 5.5, height: 6 }, rows: 4, seatsPerRow: 6, bookedPct: 0.9 },
    { id: 62, name: '162', price: 39, position: { x: 66, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.3 },
    { id: 63, name: '163', price: 39, position: { x: 72, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.5 },
    { id: 64, name: '164', price: 39, position: { x: 78, y: 78, width: 5.5, height: 6 }, rows: 5, seatsPerRow: 8, bookedPct: 0.6 },
  ];

  return sectorsConfig.map(config => {
    const seats = generateSeats(config.id, config.rows, config.seatsPerRow, config.price, config.bookedPct);
    const availableSeats = seats.filter(s => s.status === 'available').length;
    
    return {
      id: config.id,
      name: config.name,
      price: config.price,
      totalSeats: seats.length,
      availableSeats,
      position: config.position,
      shape: 'rectangle' as const,
      seats,
    };
  });
}

// Event info
export const eventInfo: EventInfo = {
  id: '1',
  name: 'Krepšinio rungtynės',
  date: '2026-05-08',
  time: '20:00',
  venue: 'Žalgirio Arena',
  description: 'Eurolygos ketvirtfinalis — Žalgiris vs Fenerbahçe',
}

// Ticket summary for sidebar
export interface TicketSummary {
  sectorName: string;
  available: number;
  price: number;
  level: 'high' | 'medium' | 'low';
}

export function getTicketSummaries(sectors: Sector[]): TicketSummary[] {
  // Group by sector name and aggregate
  const grouped = sectors.reduce((acc, sector) => {
    const key = sector.name;
    if (!acc[key]) {
      acc[key] = {
        sectorName: sector.name,
        available: 0,
        price: sector.price,
        totalSeats: 0,
      };
    }
    acc[key].available += sector.availableSeats;
    acc[key].totalSeats += sector.totalSeats;
    return acc;
  }, {} as Record<string, { sectorName: string; available: number; price: number; totalSeats: number }>);

  return Object.values(grouped).map(g => ({
    sectorName: g.sectorName,
    available: g.available,
    price: g.price,
    level: getAvailabilityLevel(g.available, g.totalSeats),
  }));
}