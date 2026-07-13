const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida el body para crear una categoría. */
export function validateCreateCategory(body = {}) {
  const errors = [];
  const { catalog_id, name, position } = body;

  if (!catalog_id || !UUID_RE.test(catalog_id)) {
    errors.push('catalog_id es requerido y debe ser un UUID válido');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name es requerido');
  }

  let pos = 0;
  if (position !== undefined && position !== null && position !== '') {
    pos = Number(position);
    if (!Number.isInteger(pos) || pos < 0) {
      errors.push('position debe ser un entero >= 0');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: {
      catalog_id,
      name: typeof name === 'string' ? name.trim() : name,
      position: pos,
    },
  };
}

/** Valida el body para actualizar una categoría. */
export function validateUpdateCategory(body = {}) {
  const errors = [];
  const data = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      errors.push('name no puede estar vacío');
    } else {
      data.name = body.name.trim();
    }
  }
  if (body.position !== undefined) {
    const pos = Number(body.position);
    if (!Number.isInteger(pos) || pos < 0) errors.push('position debe ser un entero >= 0');
    else data.position = pos;
  }

  return { valid: errors.length === 0, errors, data };
}
