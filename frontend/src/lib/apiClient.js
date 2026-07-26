import { supabase } from './supabaseClient.js';

const API_URL = import.meta.env.VITE_API_URL || '';
const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión nuevamente.';

async function parseResponse(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

async function handleExpiredSession() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignorar: la sesión ya está inválida
  }

  window.location.assign('/session-expired');
  throw new Error(SESSION_EXPIRED_MESSAGE);
}

async function handleUnavailableAccount(code) {
  const target = code === 'ACCOUNT_SUSPENDED' ? '/account-suspended' : '/account-deleted';

  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // La navegación sigue siendo necesaria aunque Supabase ya haya limpiado la sesión.
  }

  if (window.location.pathname !== target) {
    window.location.assign(target);
  }
}

/**
 * Cliente HTTP con autenticación automática.
 * - Obtiene la sesión de Supabase y adjunta Authorization: Bearer {access_token}.
 * - Hace fetch a VITE_API_URL + path.
 * - Si la respuesta no es ok, lanza Error con el mensaje del backend.
 * - Devuelve el JSON parseado (o null en 204).
 */
export async function apiClient(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const buildHeaders = (accessToken) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  };

  const request = (accessToken) =>
    fetch(`${API_URL}${path}`, { ...options, headers: buildHeaders(accessToken) });

  let response = await request(session?.access_token);

  if (response.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();

    if (!error && data.session?.access_token) {
      response = await request(data.session.access_token);
    } else {
      await handleExpiredSession();
    }
  }

  if (response.status === 401) {
    await handleExpiredSession();
  }

  const payload = await parseResponse(response);

  if (
    response.status === 403 &&
    ['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(payload?.code)
  ) {
    await handleUnavailableAccount(payload.code);
  }

  if (!response.ok) {
    const message = payload?.error || `Error ${response.status}`;
    const requestError = new Error(message);
    requestError.status = response.status;
    if (payload?.code) requestError.code = payload.code;
    if (payload?.details) requestError.details = payload.details;
    throw requestError;
  }

  return payload;
}

export default apiClient;
