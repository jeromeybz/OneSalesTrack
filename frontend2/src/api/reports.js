// src/api/reports.js
import client from './client'

export const reportsApi = {
  monthly: (params) => client.get('/reports/monthly', { params }),
}
