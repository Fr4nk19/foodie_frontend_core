import api from './axios'

// ─── Catálogo MH: Tipo de Establecimiento (super admin) ───────────────────────

export const getTiposEstablecimiento = (params) =>
  api.get('/catalog/tipo-establecimiento', { params })

export const createTipoEstablecimiento = (data) =>
  api.post('/catalog/tipo-establecimiento', data)

export const updateTipoEstablecimiento = (id, data) =>
  api.put(`/catalog/tipo-establecimiento/${id}`, data)

export const deleteTipoEstablecimiento = (id) =>
  api.delete(`/catalog/tipo-establecimiento/${id}`)
