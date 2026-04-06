// src/api/users.js
import client from './client'

export const usersApi = {
  list:   ()         => client.get('/users'),
  get:    (id)       => client.get(`/users/${id}`),
  create: (data)     => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id)       => client.delete(`/users/${id}`),
}
