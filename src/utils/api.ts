import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_API_URL
});

export interface Preference {
  name: string;
  value: string;
  weight: number;
}

export { api };

export const authApi = {
  login: async (data: {
    email: string;
    password: string;
  }) => {
    const response = await api.post(`/login`, data);
    return response.data;
  },
  registerUser: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    gender: string;
    cpf: string;
  }) => {
    const response = await api.post(`/user`, data);
    return response.data;
  },
  updateUser: async (userId: string, data: {
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
  deleteUser: async (id: string) => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  },
  createPreference: async (userId: string, data: {
    preferences: Preference[];
  }) => {
    const response = await api.post(`/preferences/${userId}`, data);
    return response.data;
  },
  getPreferenceModel: async () => {
    const response = await api.get(`/preferences/model`);
    return response.data;
  },
  updatePreference: async (userId: string, data: {
    name: string;
    value?: string;
    weight?: number;
  }) => {
    const response = await api.put(`/preferences/${userId}`, data);
    return response.data;
  },
  deletePreference: async (userId: string) => {
    const response = await api.delete(`/preferences/${userId}`);
    return response.data;
  }
};