// src/api/auth.js
import client from './client'

export const authApi = {
  login:          (data)   => client.post('/auth/login', data),
  me:             ()       => client.get('/auth/me'),
  changePassword: (data)   => client.put('/auth/change-password', data),
}
