// src/utils/format.js

export function formatCurrency(amount) {
  return '₱' + Number(amount).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateOnly(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function stockStatus(product) {
  if (!product.trackStock) return { cls: 'muted',   label: 'Untracked' }
  if (product.stockQuantity <= 0) return { cls: 'danger',  label: 'Out of stock' }
  if (product.stockQuantity <= product.lowStockThreshold) {
    return { cls: 'warning', label: `Low: ${product.stockQuantity}` }
  }
  return { cls: 'success', label: `${product.stockQuantity} in stock` }
}
