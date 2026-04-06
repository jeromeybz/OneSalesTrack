// src/api/discounts.js
import client from './client'

export const discountsApi = {
  list:             ()         => client.get('/discounts'),
  listActive:       ()         => client.get('/discounts/all-active'),
  getByProduct:     (productId)=> client.get(`/discounts/product/${productId}`),
  create:           (data)     => client.post('/discounts', data),
  update:           (id, data) => client.put(`/discounts/${id}`, data),
  toggle:           (id)       => client.patch(`/discounts/${id}/toggle`),
  delete:           (id)       => client.delete(`/discounts/${id}`),
}
