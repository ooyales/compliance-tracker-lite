import client from './client';
import type { BoundaryAsset } from '@/types';

export const boundaryApi = {
  getAll: async (): Promise<BoundaryAsset[]> => {
    const { data } = await client.get('/boundary');
    return data;
  },

  create: async (
    asset: Partial<BoundaryAsset>
  ): Promise<BoundaryAsset> => {
    const { data } = await client.post('/boundary', asset);
    return data;
  },

  update: async (
    id: string,
    updates: Partial<BoundaryAsset>
  ): Promise<BoundaryAsset> => {
    const { data } = await client.put(`/boundary/${id}`, updates);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/boundary/${id}`);
  },
};
