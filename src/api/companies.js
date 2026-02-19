import api from './axios'

export const getCompanies   = ()     => api.get('/companies')
export const createCompany  = (data) => api.post('/companies', data)
