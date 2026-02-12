import client from './client';
import type { User } from '@/types';

export const authApi = {
  login: async (
    username: string,
    password: string
  ): Promise<{ token: string; user: User }> => {
    const { data } = await client.post('/auth/login', { username, password });
    return { token: data.token || data.access_token, user: data.user };
  },

  me: async (): Promise<User> => {
    const { data } = await client.get('/auth/me');
    return data;
  },
};
