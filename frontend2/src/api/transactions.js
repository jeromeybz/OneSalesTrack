// src/api/transactions.js
import client from './client'

export const transactionsApi = {
  create: (data)   => client.post('/transactions', data),
  list:   (params) => client.get('/transactions', { params }),
  get:    (id)     => client.get(`/transactions/${id}`),
}
