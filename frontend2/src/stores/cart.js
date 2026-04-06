// src/stores/cart.js
import { defineStore } from 'pinia'
import { transactionsApi } from '@/api/transactions'
import { useDiscountsStore } from '@/stores/discounts'

export const useCartStore = defineStore('cart', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /**
     * @type {Array<{
     *   productId:      number,
     *   name:           string,
     *   unitPrice:      number,
     *   quantity:       number,
     *   totalPrice:     number,   // after discount
     *   originalTotal:  number,   // qty × unitPrice, before discount
     *   discountAmount: number,   // originalTotal - totalPrice
     *   isDiscounted:   boolean,
     *   trackStock:     boolean,
     *   stock:          number,
     * }>}
     */
    items: [],
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** Total unit count across all cart items */
    totalItems: (state) => state.items.reduce((s, i) => s + i.quantity, 0),

    /** Sum of discounted total prices */
    totalAmount: (state) => state.items.reduce((s, i) => s + i.totalPrice, 0),

    /** Total savings from all discounts in this cart */
    totalDiscount: (state) => state.items.reduce((s, i) => s + i.discountAmount, 0),

    /** True when at least one item has a discount applied */
    hasDiscount: (state) => state.items.some((i) => i.isDiscounted),

    /** True when any tracked item has exhausted its stock */
    hasOutOfStock: (state) => state.items.some((i) => i.trackStock && i.stock <= 0),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** How many units of a product are already in the cart */
    cartQty(productId) {
      return this.items.find((i) => i.productId === productId)?.quantity ?? 0
    },

    /** Remaining purchasable stock after subtracting cart qty */
    availableStock(product) {
      if (!product.trackStock) return Infinity
      return product.stockQuantity - this.cartQty(product.id)
    },

    /** Returns true if the product can still be added to the cart */
    canAdd(product) {
      if (!product.trackStock) return true
      return this.availableStock(product) > 0
    },

    /**
     * Calculate price for a given product + quantity, applying discount if applicable.
     * @param {number} quantity
     * @param {number} unitPrice
     * @param {{ minQuantity: number, discountedPrice: number } | null} rule
     */
    _calcPrice(quantity, unitPrice, rule) {
      const originalTotal = quantity * unitPrice

      if (!rule || quantity < rule.minQuantity) {
        return { totalPrice: originalTotal, originalTotal, discountAmount: 0, isDiscounted: false }
      }

      const bundles    = Math.floor(quantity / rule.minQuantity)
      const remainder  = quantity % rule.minQuantity
      const totalPrice = (bundles * rule.discountedPrice) + (remainder * unitPrice)
      const discountAmount = +(originalTotal - totalPrice).toFixed(2)

      return {
        totalPrice:     +totalPrice.toFixed(2),
        originalTotal:  +originalTotal.toFixed(2),
        discountAmount,
        isDiscounted:   discountAmount > 0,
      }
    },

    /**
     * Add one unit of a product to the cart.
     * Automatically applies discount rule if one exists.
     * Returns false if stock is exhausted.
     */
    addItem(product) {
      if (!this.canAdd(product)) return false

      const discounts = useDiscountsStore()
      const rule      = discounts.ruleFor(product.id)

      const existing = this.items.find((i) => i.productId === product.id)

      if (existing) {
        existing.quantity++
        const calc = this._calcPrice(existing.quantity, existing.unitPrice, rule)
        Object.assign(existing, calc)
      } else {
        const calc = this._calcPrice(1, product.price, rule)
        this.items.push({
          productId:  product.id,
          name:       product.name,
          unitPrice:  product.price,
          quantity:   1,
          trackStock: product.trackStock,
          stock:      product.stockQuantity,
          ...calc,
        })
      }
      return true
    },

    /** Remove a product line from the cart */
    removeItem(productId) {
      this.items = this.items.filter((i) => i.productId !== productId)
    },

    /**
     * Increment or decrement a cart item's quantity.
     * Re-applies discount calculation after quantity change.
     */
    updateQuantity(productId, delta, maxStock) {
      const item = this.items.find((i) => i.productId === productId)
      if (!item) return
      const newQty = item.quantity + delta
      if (newQty < 1) return
      if (delta > 0 && item.trackStock && newQty > maxStock) return

      const discounts = useDiscountsStore()
      const rule      = discounts.ruleFor(productId)
      const calc      = this._calcPrice(newQty, item.unitPrice, rule)

      item.quantity = newQty
      Object.assign(item, calc)
    },

    /** Empty the cart */
    clearCart() {
      this.items = []
    },

    /**
     * Submit the cart as a transaction.
     * Backend re-validates discounts independently.
     */
    async checkout(isDelivery = false, deliveryRecipient = null, deliveryNote = null) {
      const { data } = await transactionsApi.create({
        isDelivery,
        deliveryRecipient,
        deliveryNote,
        items: this.items.map((i) => ({
          productId: i.productId,
          quantity:  i.quantity,
        })),
      })
      this.clearCart()
      return data
    },
  },
})
