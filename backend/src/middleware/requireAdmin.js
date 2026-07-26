export function requireAdmin(req, res, next) {
  if (!req.account || req.account.role !== 'admin') {
    return res.status(403).json({
      error: 'Se requieren permisos de administrador',
      code: 'ADMIN_REQUIRED',
    });
  }

  return next();
}

export default requireAdmin;
