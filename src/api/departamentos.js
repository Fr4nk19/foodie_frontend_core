import api from './axios'

// ─── Catálogo MH: Departamentos (super admin) ─────────────────────────────────

export const getDepartamentos = (params) =>
  api.get('/catalog/departamentos', { params })

export const createDepartamento = (data) =>
  api.post('/catalog/departamentos', data)

export const updateDepartamento = (id, data) =>
  api.put(`/catalog/departamentos/${id}`, data)

export const deleteDepartamento = (id) =>
  api.delete(`/catalog/departamentos/${id}`)
