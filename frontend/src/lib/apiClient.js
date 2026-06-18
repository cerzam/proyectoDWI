import { supabase } from './supabaseClient.js';

const API_URL = import.meta.env.VITE_API_URL || '';

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

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) return null;

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const message = payload?.error || `Error ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export default apiClient;
