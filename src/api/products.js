import api from './axios'

export const getCompanyProducts    = (companyId, params = {}) => api.get(`/companies/${companyId}/products`, { params })
export const createCompanyProduct  = (companyId, data)        => api.post(`/companies/${companyId}/products`, data)
export const updateCompanyProduct  = (companyId, productId, data) => api.put(`/companies/${companyId}/products/${productId}`, data)
export const deleteCompanyProduct  = (companyId, productId)   => api.delete(`/companies/${companyId}/products/${productId}`)
