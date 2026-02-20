import api from './axios'

export const getUnidadesDeMedida     = (params = {}) => api.get('/catalog/unidades-de-medida', { params })
export const createUnidadDeMedida    = (data)         => api.post('/catalog/unidades-de-medida', data)
export const updateUnidadDeMedida    = (id, data)     => api.put(`/catalog/unidades-de-medida/${id}`, data)
export const deleteUnidadDeMedida    = (id)           => api.delete(`/catalog/unidades-de-medida/${id}`)
