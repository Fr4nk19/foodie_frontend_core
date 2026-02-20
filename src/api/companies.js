import api from './axios'

export const getCompanies   = (params) => api.get('/companies', { params })
export const createCompany  = (data)   => api.post('/companies', data)
