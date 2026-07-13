// Validación de complejidad de contraseña en el backend.
// Debe mantenerse alineado con frontend/src/lib/passwordRules.js
const PASSWORD_MIN_LENGTH = 8;

/**
 * Valida que la contraseña cumpla las reglas de complejidad.
 * Devuelve { valid, errors } con mensajes claros por cada regla incumplida.
 */
export function validatePassword(password) {
  const errors = [];

  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`mínimo ${PASSWORD_MIN_LENGTH} caracteres`);
  }
  if (!/[A-Z]/.test(password || '')) errors.push('al menos una letra mayúscula');
  if (!/[a-z]/.test(password || '')) errors.push('al menos una letra minúscula');
  if (!/\d/.test(password || '')) errors.push('al menos un número');
  if (!/[^A-Za-z0-9]/.test(password || '')) errors.push('al menos un símbolo especial');

  return { valid: errors.length === 0, errors };
}

/** Construye un mensaje legible a partir de los errores. */
export function buildPasswordError(errors) {
  return `La contraseña no cumple los requisitos: ${errors.join(', ')}.`;
}
