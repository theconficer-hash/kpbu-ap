import axios from 'axios'

// Lokal: pakai proxy '/api'. Produksi (Vercel): pakai URL backend dari env var.
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })

export const runSimulation = (payload) => api.post('/simulate', payload)
export const getExample = () => api.get('/simulate/example')
export const downloadExcel = (payload) =>
  api.post('/export', payload, { responseType: 'blob' })

export default api
