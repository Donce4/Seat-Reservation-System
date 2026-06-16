'use client';

import { useSeating } from '@/lib/seating-context';
import { EventHeader } from './event-header';
import { ArenaMap } from './arena-map';
import { SectorView } from './sector-view';
import { TicketSummary } from './ticket-summary';
import { BestSeatFinder } from './best-seat-finder';
import { BookingPanel } from './booking-panel';
import { CheckoutForm } from './checkout-form';

export function SeatReservation() {
  const { view, selectedSector, selectedSeats } = useSeating();

  if (view === 'checkout') {
    return (
      <div className="min-h-screen flex flex-col">
        <EventHeader />
        <main className="flex-1 p-6 bg-background">
          <CheckoutForm />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <EventHeader />
      
      <main className="flex-1 p-4 md:p-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_350px] gap-6 items-start">
            {/* Main content - Arena or Sector view */}
            <div>
              {selectedSector ? <SectorView /> : <ArenaMap />}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Show different panels based on state */}
              {selectedSeats.length > 0 ? (
                <BookingPanel />
              ) : (
                <>
                  <BestSeatFinder />
                  <TicketSummary />
                </>
              )}
              
              {/* Always show ticket summary when seats are selected too */}
              {selectedSeats.length > 0 && (
                <TicketSummary />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
