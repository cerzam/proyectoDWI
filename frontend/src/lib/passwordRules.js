// Reglas de complejidad de contraseña compartidas en el frontend.
// Debe mantenerse alineado con backend/src/validators/auth.js
export const PASSWORD_MIN_LENGTH = 8;

// 8+ caracteres, al menos una minúscula, una mayúscula, un número y un símbolo.
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_MESSAGE =
  'La contraseña debe tener mínimo 8 caracteres e incluir mayúscula, minúscula, número y símbolo.';

/** Devuelve la lista de requisitos con su estado (para checklist en vivo). */
export function getPasswordChecks(value = '') {
  return [
    { id: 'len', label: 'Mínimo 8 caracteres', ok: value.length >= PASSWORD_MIN_LENGTH },
    { id: 'upper', label: 'Una letra mayúscula', ok: /[A-Z]/.test(value) },
    { id: 'lower', label: 'Una letra minúscula', ok: /[a-z]/.test(value) },
    { id: 'number', label: 'Un número', ok: /\d/.test(value) },
    { id: 'symbol', label: 'Un símbolo especial', ok: /[^A-Za-z0-9]/.test(value) },
  ];
}

/** Reglas listas para usar con react-hook-form: register('password', passwordValidationRules) */
export const passwordValidationRules = {
  required: 'La contraseña es requerida',
  validate: (value) => PASSWORD_REGEX.test(value) || PASSWORD_MESSAGE,
};
