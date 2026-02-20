import api from './axios'

// ─── Usuarios globales (super_admin) ──────────────────────────────────────────

export const getUsers   = (params) => api.get('/users', { params })
export const getUser    = (id)     => api.get(`/users/${id}`)
export const createUser = (data)   => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id)     => api.delete(`/users/${id}`)

// ─── Usuarios por empresa (company_admin + super_admin) ───────────────────────

export const getCompanyUsers   = (companyId, params) =>
  api.get(`/companies/${companyId}/users`, { params })

export const createCompanyUser = (companyId, data) =>
  api.post(`/companies/${companyId}/users`, data)

export const updateCompanyUser = (companyId, userId, data) =>
  api.put(`/companies/${companyId}/users/${userId}`, data)

export const deleteCompanyUser = (companyId, userId) =>
  api.delete(`/companies/${companyId}/users/${userId}`)
