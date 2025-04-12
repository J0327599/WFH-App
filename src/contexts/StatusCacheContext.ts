import { createContext, MutableRefObject } from 'react';
import { WorkStatus } from '../types';

export const StatusCacheContext = createContext<MutableRefObject<Map<string, { status: WorkStatus; timestamp: number }>> | null>(null);