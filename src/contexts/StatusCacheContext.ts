import { createContext, MutableRefObject } from 'react';

export type WorkStatus = 'H' | 'O' | 'L' | 'T' | 'S' | '';

export const StatusCacheContext = createContext<MutableRefObject<Map<string, { status: WorkStatus; timestamp: number }>> | null>(null);