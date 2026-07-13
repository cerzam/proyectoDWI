const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_REASONS = ['compra', 'venta', 'ajuste', 'devolucion', 'devolución', 'stock_inicial'];

/** Valida el body para crear un movimiento de inventario. */
export function validateCreateMovement(body = {}) {
  const errors = [];
  const { product_id, quantity, reason, notes } = body;

  if (!product_id || !UUID_RE.test(product_id)) {
    errors.push('product_id es requerido y debe ser un UUID válido');
  }

  const qty = Number(quantity);
  if (quantity === undefined || quantity === null || quantity === '' || !Number.isInteger(qty)) {
    errors.push('quantity es requerido y debe ser un entero (positivo=entrada, negativo=salida)');
  } else if (qty === 0) {
    errors.push('La cantidad no puede ser cero. Usa positivo para entrada, negativo para salida.');
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('reason es requerido');
  } else if (!VALID_REASONS.includes(reason.trim())) {
    errors.push(`reason debe ser uno de: ${VALID_REASONS.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      product_id,
      quantity: qty,
      reason: typeof reason === 'string' ? reason.trim() : reason,
      notes: notes ?? null,
    },
  };
}
