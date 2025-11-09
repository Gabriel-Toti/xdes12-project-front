import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_API_URL
});

export { api };

export const authApi = {
  login: async (data: {
    email: string;
    senha: string;
  }) => {
    const response = await api.post(`${apiConfig.endpoints.auth}/login`, data);
    return response.data;
  },
};