import client from './client';
import type { Control, ControlFamily, AssessmentObjective } from '@/types';

export const controlsApi = {
  getFamilies: async (): Promise<ControlFamily[]> => {
    const { data } = await client.get('/controls/families');
    return data;
  },

  getControls: async (params?: {
    family_id?: string;
    status?: string;
    search?: string;
  }): Promise<Control[]> => {
    const { data } = await client.get('/controls', { params });
    return Array.isArray(data) ? data : data.controls || [];
  },

  getControl: async (id: string): Promise<Control> => {
    const { data } = await client.get(`/controls/${id}`);
    return data;
  },

  updateControl: async (
    id: string,
    updates: Partial<Control>
  ): Promise<Control> => {
    const { data } = await client.put(`/controls/${id}`, updates);
    return data;
  },

  updateObjective: async (
    id: string,
    updates: Partial<AssessmentObjective>
  ): Promise<AssessmentObjective> => {
    const { data } = await client.put(`/controls/objectives/${id}`, updates);
    return data;
  },
};
