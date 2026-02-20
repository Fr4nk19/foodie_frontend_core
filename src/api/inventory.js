import api from './axios'

export const getBranchInventory    = (companyId, branchId, params = {}) =>
  api.get(`/companies/${companyId}/branches/${branchId}/inventory`, { params })

export const addBranchInventory    = (companyId, branchId, data) =>
  api.post(`/companies/${companyId}/branches/${branchId}/inventory`, data)

export const updateBranchInventory = (companyId, branchId, inventoryId, data) =>
  api.put(`/companies/${companyId}/branches/${branchId}/inventory/${inventoryId}`, data)

export const deleteBranchInventory = (companyId, branchId, inventoryId) =>
  api.delete(`/companies/${companyId}/branches/${branchId}/inventory/${inventoryId}`)
