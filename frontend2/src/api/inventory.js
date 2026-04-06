// src/api/inventory.js
import client from './client'

export const inventoryApi = {
  summary:   ()       => client.get('/inventory/summary'),
  movements: (params) => client.get('/inventory/movements', { params }),
  restock:   (data)   => client.post('/inventory/restock', data),
  adjust:    (data)   => client.post('/inventory/adjust', data),
}
