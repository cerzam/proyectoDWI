const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida el body para crear un producto. Devuelve { valid, errors, data }. */
export function validateCreateProduct(body = {}) {
  const errors = [];
  const { catalog_id, name, price, stock_inicial, description, category_id, image_url } = body;

  if (!catalog_id || !UUID_RE.test(catalog_id)) {
    errors.push('catalog_id es requerido y debe ser un UUID válido');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name es requerido');
  }
  const priceNum = Number(price);
  if (price === undefined || price === null || Number.isNaN(priceNum) || priceNum < 0) {
    errors.push('price es requerido y debe ser un número >= 0');
  }

  let stock = 0;
  if (stock_inicial !== undefined && stock_inicial !== null && stock_inicial !== '') {
    stock = Number(stock_inicial);
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push('stock_inicial debe ser un entero >= 0');
    }
  }

  if (category_id && !UUID_RE.test(category_id)) {
    errors.push('category_id debe ser un UUID válido');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      catalog_id,
      name: typeof name === 'string' ? name.trim() : name,
      price: priceNum,
      stock_inicial: stock,
      description: description ?? null,
      category_id: category_id || null,
      image_url: image_url || null,
    },
  };
}

/** Valida el body para actualizar un producto (sin stock). */
export function validateUpdateProduct(body = {}) {
  const errors = [];
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name no puede estar vacío');
    } else {
      data.name = body.name.trim();
    }
  }
  if (body.price !== undefined) {
    const priceNum = Number(body.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      errors.push('price debe ser un número >= 0');
    } else {
      data.price = priceNum;
    }
  }
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.category_id !== undefined) {
    if (body.category_id && !UUID_RE.test(body.category_id)) {
      errors.push('category_id debe ser un UUID válido');
    } else {
      data.category_id = body.category_id || null;
    }
  }
  if (body.image_url !== undefined) data.image_url = body.image_url || null;
  if (body.is_visible !== undefined) data.is_visible = Boolean(body.is_visible);
  if (body.position !== undefined) {
    const pos = Number(body.position);
    if (!Number.isInteger(pos)) errors.push('position debe ser un entero');
    else data.position = pos;
  }

  // Nunca permitir actualizar stock directamente
  delete data.stock;

  return { valid: errors.length === 0, errors, data };
}
