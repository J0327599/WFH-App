import { createContext, MutableRefObject } from 'react';
import { WorkStatus } from '../types';

export const StatusCacheContext = createContext<MutableRefObject<Map<string, { status: WorkStatus; timestamp: number }>> | null>(null);
113:       console.error('Error updating status:', error);
114:       navigate('/status'); // <<< THIS LINE IS THE PROBLEM
115:     }