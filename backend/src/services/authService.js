import { supabase } from '../lib/supabase.js';

/** Error helper con status HTTP. */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const authService = {
  async register({ email, password, full_name }) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (error) throw httpError(400, error.message);

    // Generar sesión iniciando con la contraseña recién creada
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      // El usuario se creó pero quizá requiere verificación de email
      return { user: data.user, session: null };
    }
    return { user: session.user, session: session.session };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw httpError(401, error.message);
    return { user: data.user, session: data.session };
  },

  async logout(accessToken) {
    if (accessToken) {
      // Invalida la sesión asociada al token
      await supabase.auth.admin.signOut(accessToken).catch(() => {});
    }
    return true;
  },
};
