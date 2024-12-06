import axios from "axios";

const api = axios.create({
  baseURL: "https://api.olamaps.com/v1", // Example Base URL; replace with actual
  headers: {
    Authorization: `Bearer YOUR_API_KEY`, // Add your Ola Maps API Key
  },
});

export const getPlaces = (query) => api.get(`/places/search`, { params: { query } });

export default api;
