export const UNAVAILABLE_ACCOUNT_CODES = ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'];

export function getBackgroundProfileError(error) {
  if (UNAVAILABLE_ACCOUNT_CODES.includes(error?.code)) return '';
  return error?.message || 'No se pudo validar el estado de la cuenta';
}
