import api from './axios'

// ─── Catálogo MH: Municipios (super admin) ────────────────────────────────────

export const getMunicipios = (params) =>
  api.get('/catalog/municipios', { params })

export const createMunicipio = (data) =>
  api.post('/catalog/municipios', data)

export const updateMunicipio = (id, data) =>
  api.put(`/catalog/municipios/${id}`, data)

export const deleteMunicipio = (id) =>
  api.delete(`/catalog/municipios/${id}`)
