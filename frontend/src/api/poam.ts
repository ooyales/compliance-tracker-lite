import client from './client';
import type { POAMItem } from '@/types';

export const poamApi = {
  getAll: async (params?: {
    status?: string;
    risk_level?: string;
  }): Promise<POAMItem[]> => {
    const { data } = await client.get('/poam', { params });
    return data;
  },

  create: async (item: Partial<POAMItem>): Promise<POAMItem> => {
    const { data } = await client.post('/poam', item);
    return data;
  },

  update: async (
    id: string,
    updates: Partial<POAMItem>
  ): Promise<POAMItem> => {
    const { data } = await client.put(`/poam/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/poam/${id}`);
  },
};
