import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

// Polyfill de WebSocket: Node < 22 no lo trae nativo y supabase-js (realtime)
// lo requiere al inicializar el cliente, aunque aquí no usemos realtime.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. ' +
      'Configúralos en el archivo .env (ver .env.example).'
  );
}

// IMPORTANTE: este cliente usa la SERVICE_ROLE_KEY, por lo que OMITE RLS.
// La seguridad recae 100% en validar la propiedad del recurso en cada endpoint.
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Los inicios de sesión cambian el token de autorización del cliente que los
// ejecuta. Usar un cliente nuevo por solicitud evita que una sesión de usuario
// reemplace las credenciales service_role del cliente administrativo global.
export function createSupabaseSessionClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
