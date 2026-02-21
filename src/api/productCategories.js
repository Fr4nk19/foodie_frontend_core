import api from './axios'

export const getProductCategories    = (companyId, params = {}) => api.get(`/companies/${companyId}/product-categories`, { params })
export const createProductCategory   = (companyId, data)        => api.post(`/companies/${companyId}/product-categories`, data)
export const updateProductCategory   = (companyId, id, data)    => api.put(`/companies/${companyId}/product-categories/${id}`, data)
export const deleteProductCategory   = (companyId, id)          => api.delete(`/companies/${companyId}/product-categories/${id}`)
