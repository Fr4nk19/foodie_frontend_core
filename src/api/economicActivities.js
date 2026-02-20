import api from './axios'

// ─── Catálogo MH (super admin) ────────────────────────────────────────────────

export const getCatalogActivities = (params) =>
  api.get('/catalog/economic-activities', { params })

export const createCatalogActivity = (data) =>
  api.post('/catalog/economic-activities', data)

export const updateCatalogActivity = (id, data) =>
  api.put(`/catalog/economic-activities/${id}`, data)

export const deleteCatalogActivity = (id) =>
  api.delete(`/catalog/economic-activities/${id}`)

// ─── Actividades por empresa ──────────────────────────────────────────────────

export const getCompanyActivities = (companyId, params) =>
  api.get(`/companies/${companyId}/economic-activities`, { params })

export const addCompanyActivity = (companyId, data) =>
  api.post(`/companies/${companyId}/economic-activities`, data)

export const updateCompanyActivity = (companyId, activityId, data) =>
  api.patch(`/companies/${companyId}/economic-activities/${activityId}`, data)

export const removeCompanyActivity = (companyId, activityId) =>
  api.delete(`/companies/${companyId}/economic-activities/${activityId}`)
