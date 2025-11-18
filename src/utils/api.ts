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
  },
  me: async () => {
    const response = await api.get(`/me`);
    return response.data;
  }
};

export const preference = {
  create: async (data: {
    preferences: any[];
  }) => {
    const response = await api.post(`/preference`, data);
    return response.data;
  },
  getModel: async () => {
    const response = await api.get(`/preference/model`);
    return response.data;
  },
  update: async (data: {
    name: string;
    value?: string;
    weight?: number;
  }) => {
    const response = await api.put(`/preference`, data);
    return response.data;
  },
  delete: async (name: string) => {
    const response = await api.delete(`/preference/${name}`);
    return response.data;
  }
}

export const announcement = {
  create: async (data: {
    title: string;
    description?: string;
    average_cost: number;
    boost?: boolean;
    vacancies: number;
    id_property: string;
  }) => {
    const response = await api.post(`/announcement`, data);
    return response.data;
  },
  list: async (propertyId?: string) => {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    const response = await api.get(`/announcement${params}`);
    return response.data;
  },
  listPublic: async () => {
    const response = await api.get(`/announcement/public`);
    return response.data;
  },
  get: async (propertyId: string, number: number) => {
    const response = await api.get(`/announcement/${propertyId}/${number}`);
    return response.data;
  },
  update: async (propertyId: string, number: number, data: {
    title?: string;
    description?: string;
    average_cost?: number;
    boost?: boolean;
    vacancies?: number;
  }) => {
    const response = await api.put(`/announcement/${propertyId}/${number}`, data);
    return response.data;
  },
  delete: async (propertyId: string, number: number) => {
    const response = await api.delete(`/announcement/${propertyId}/${number}`);
    return response.data;
  }
}

export const match = {
  create: async (data: {
    id_property: string;
    number_announcement: number;
  }) => {
    const response = await api.post(`/match`, data);
    return response.data;
  },
  getAll: async (propertyId?: string, numberAnnouncement?: number) => {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (numberAnnouncement !== undefined) params.append('numberAnnouncement', numberAnnouncement.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/match${query}`);
    return response.data;
  },
  get: async (propertyId: string, numberAnnouncement: number) => {
    const response = await api.get(`/match/${propertyId}/${numberAnnouncement}`);
    return response.data;
  },
  update: async (propertyId: string, numberAnnouncement: number, data: {
    accepted?: boolean;
  }) => {
    const response = await api.put(`/match/${propertyId}/${numberAnnouncement}`, data);
    return response.data;
  },
  delete: async (propertyId: string, numberAnnouncement: number) => {
    const response = await api.delete(`/match/${propertyId}/${numberAnnouncement}`);
    return response.data;
  }
}

export const property = {
  create: async (data: {
    name: string;
    type: string;
    address: string;
    total_vacancies: number;
    total_dorms: number;
    total_bathrooms: number;
    garage: boolean;
    external_area: boolean;
    costs: string;
    members: Array<{ id: string }>;
  }) => {
    const response = await api.post(`/property`, data);
    return response.data;
  },
  get: async (id: string) => {
    const response = await api.get(`/property/${id}`);
    return response.data;
  },
  list: async () => {
    const response = await api.get(`/property`);
    return response.data;
  },
  update: async (id: string, data: {
    costs?: string;
    total_vacancies?: number;
  }) => {
    const response = await api.put(`/property/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/property/${id}`);
    return response.data;
  }
}

export const rule = {
  create: async (propertyId: string, data: {
    rules: Array<{ name: string; value: string }>;
  }) => {
    const response = await api.post(`/rule/${propertyId}`, data);
    return response.data;
  },
  get: async (propertyId: string) => {
    const response = await api.get(`/rule/${propertyId}`);
    return response.data;
  },
  update: async (propertyId: string, name: string, data: {
    value: string;
  }) => {
    const response = await api.put(`/rule/${propertyId}/${encodeURIComponent(name)}`, data);
    return response.data;
  },
  delete: async (propertyId: string, name: string) => {
    const response = await api.delete(`/rule/${propertyId}/${encodeURIComponent(name)}`);
    return response.data;
  }
}