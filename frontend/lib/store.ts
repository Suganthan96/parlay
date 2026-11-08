'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ParlayLeg } from './types';

export interface TicketLegMeta {
  question: string;
  outcome:  string;
  price:    number;
}

export interface TicketMeta {
  txHash:    string;
  stake:     number;
  timestamp: number;
  legs:      TicketLegMeta[];
}

interface ParlayStore {
  legs:              ParlayLeg[];
  ticketMeta:        Record<string, TicketMeta>;
  cashedOutTickets:  string[];
  addLeg:            (leg: ParlayLeg) => void;
  removeLeg:         (marketId: string) => void;
  clearLegs:         () => void;
  hasMarket:         (marketId: string) => boolean;
  saveTicketMeta:    (ticketId: string, meta: TicketMeta) => void;
  markCashedOut:     (ticketId: string) => void;
  isCashedOut:       (ticketId: string) => boolean;
}

export const useParlayStore = create<ParlayStore>()(
  persist(
    (set, get) => ({
      legs:             [],
      ticketMeta:       {},
      cashedOutTickets: [],
      addLeg: (leg) => {
        const { legs } = get();
        if (legs.length >= 5) return;
        if (legs.some(l => l.marketId === leg.marketId)) return;
        set({ legs: [...legs, leg] });
      },
      removeLeg: (marketId) =>
        set(s => ({ legs: s.legs.filter(l => l.marketId !== marketId) })),
      clearLegs: () => set({ legs: [] }),
      hasMarket: (marketId) => get().legs.some(l => l.marketId === marketId),
      saveTicketMeta: (ticketId, meta) =>
        set(s => ({ ticketMeta: { ...s.ticketMeta, [ticketId]: meta } })),
      markCashedOut: (ticketId) =>
        set(s => ({ cashedOutTickets: [...new Set([...s.cashedOutTickets, ticketId])] })),
      isCashedOut: (ticketId) => get().cashedOutTickets.includes(ticketId),
    }),
    { name: 'parlay-legs' }
  )
);
