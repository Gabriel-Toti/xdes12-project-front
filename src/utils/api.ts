import axios from "axios";

// Use a NEXT_PUBLIC_ prefixed env var for values that must be available in the browser.
// Non-prefixed NEXT_* env vars are only available on the server and will be undefined in client bundles.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
if (!API_URL && typeof window !== 'undefined') {
  console.warn('Warning: NEXT_PUBLIC_API_URL is not set. Browser API requests may fail or use relative paths.');
}

const api = axios.create({
  // If API_URL is empty, axios will use relative URLs (useful for same-origin proxies).
  baseURL: API_URL || undefined,
  withCredentials: true,
});
console.log('API URL:', API_URL)

export interface Preference {
  name: string;
  value: string;
  weight: number;
}

export { api };

export const user = {
  login: async (data: {
    email: string;
    password: string;
  }) => {
    const response = await api.post(`/login`, data);
    return response.data;
  },
  register: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    gender: string;
    cpf: string;
    birthdate: string;
  }) => {
    const response = await api.post(`/user`, data);
    return response.data;
  },
  update: async (userId: string, data: {
    name?: string;
    phone?: string;
    gender?: string;
    active?: boolean;
    userId?: string;
  }) => {
    data.userId = data.userId || userId;
    const response = await api.put(`/user/${userId}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  }
};

export const preference = {
  create: async (data: {
    preferences: Preference[];
  }) => {
    const response = await api.post(`/preferences`, data);
    return response.data;
  },
  getModel: async () => {
    const response = await api.get(`/preferences/model`);
    return response.data;
  },
  update: async (data: {
    name: string;
    value?: string;
    weight?: number;
  }) => {
    const response = await api.put(`/preferences`, data);
    return response.data;
  },
  delete: async (name: string) => {
    const response = await api.delete(`/preferences/${name}`);
    return response.data;
  }
}