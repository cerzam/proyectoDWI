export function getAccountAccessError(status) {
  if (status === 'suspended') {
    return { error: 'Esta cuenta está suspendida', code: 'ACCOUNT_SUSPENDED' };
  }

  if (status === 'deleted') {
    return { error: 'Esta cuenta fue eliminada', code: 'ACCOUNT_DELETED' };
  }

  return null;
}

export default getAccountAccessError;
