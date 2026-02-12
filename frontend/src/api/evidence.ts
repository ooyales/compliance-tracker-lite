import client from './client';
import type { Evidence } from '@/types';

export const evidenceApi = {
  getAll: async (params?: {
    control_id?: string;
    evidence_type?: string;
  }): Promise<Evidence[]> => {
    const { data } = await client.get('/evidence', { params });
    return data;
  },

  create: async (
    evidence: Partial<Evidence>
  ): Promise<Evidence> => {
    const { data } = await client.post('/evidence', evidence);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/evidence/${id}`);
  },

  bulkUpload: async (file: File): Promise<{ created: number; errors: { row: number; message: string }[] }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await client.post('/evidence/bulk', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
