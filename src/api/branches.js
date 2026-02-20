import api from './axios'

export const getCompanyBranches   = (companyId)              => api.get(`/companies/${companyId}/branches`)
export const createCompanyBranch  = (companyId, data)        => api.post(`/companies/${companyId}/branches`, data)
export const updateCompanyBranch  = (companyId, branchId, data) => api.put(`/companies/${companyId}/branches/${branchId}`, data)
export const deleteCompanyBranch  = (companyId, branchId)    => api.delete(`/companies/${companyId}/branches/${branchId}`)
