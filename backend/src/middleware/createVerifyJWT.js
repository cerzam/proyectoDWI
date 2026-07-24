import { getAccountAccessError } from '../utils/accountAccess.js';

export function createVerifyJWT(supabaseClient) {
  return async function verifyJWT(req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token de autenticación faltante' });
      }

      const {
        data: { user },
        error,
      } = await supabaseClient.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      const { data: account, error: accountError } = await supabaseClient
        .from('users')
        .select('id, email, full_name, role, status, plan')
        .eq('id', user.id)
        .maybeSingle();

      if (accountError) return next(accountError);
      if (!account) {
        return res.status(403).json({
          error: 'No existe un perfil de cuenta para este usuario',
          code: 'ACCOUNT_PROFILE_MISSING',
        });
      }

      const accessError = getAccountAccessError(account.status);
      if (accessError) return res.status(403).json(accessError);

      req.user = { id: user.id };
      req.account = account;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export default createVerifyJWT;
