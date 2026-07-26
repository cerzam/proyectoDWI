import { supabase } from '../lib/supabase.js';

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

const RPC_ERRORS = {
  ADMIN_REQUIRED: [403, 'Se requieren permisos de administrador'],
  USER_NOT_FOUND: [404, 'Usuario no encontrado'],
  INVALID_PLAN: [400, 'Plan inválido'],
  INVALID_STATUS: [400, 'Estado inválido'],
  ACCOUNT_DELETED: [409, 'La cuenta ya fue eliminada'],
  CANNOT_SUSPEND_SELF: [409, 'Un administrador no puede suspenderse a sí mismo'],
  CANNOT_DELETE_SELF: [409, 'Un administrador no puede eliminarse a sí mismo'],
  SUSPENSION_REASON_REQUIRED: [400, 'La razón de suspensión es requerida'],
  LAST_ACTIVE_ADMIN: [409, 'No se puede desactivar al último administrador activo'],
};

function mapRpcError(error) {
  const code = Object.keys(RPC_ERRORS).find((candidate) => error?.message?.includes(candidate));
  if (!code) return httpError(500, error?.message || 'Error en la operación administrativa');
  const [status, message] = RPC_ERRORS[code];
  return httpError(status, message, code);
}

async function getUser(id) {
  const { data, error } = await supabase
    .from('users')
    .select(
      'id, email, full_name, role, status, plan, created_at, suspended_at, suspended_by, suspension_reason, deleted_at, deleted_by'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw httpError(500, error.message);
  if (!data) throw httpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
  return data;
}

export const adminService = {
  async listUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, email, full_name, role, status, plan, created_at, suspended_at, suspended_by, suspension_reason, deleted_at, deleted_by'
      )
      .order('created_at', { ascending: false });

    if (error) throw httpError(500, error.message);
    return data || [];
  },

  async changePlan(adminUserId, targetUserId, plan) {
    const { error } = await supabase.rpc('admin_change_user_plan', {
      p_admin_user_id: adminUserId,
      p_target_user_id: targetUserId,
      p_plan: plan,
    });
    if (error) throw mapRpcError(error);
    return getUser(targetUserId);
  },

  async changeStatus(adminUserId, targetUserId, status, reason) {
    const { error } = await supabase.rpc('admin_change_user_status', {
      p_admin_user_id: adminUserId,
      p_target_user_id: targetUserId,
      p_status: status,
      p_reason: reason || null,
    });
    if (error) throw mapRpcError(error);
    return getUser(targetUserId);
  },

  async softDelete(adminUserId, targetUserId) {
    const { error } = await supabase.rpc('admin_soft_delete_user', {
      p_admin_user_id: adminUserId,
      p_target_user_id: targetUserId,
    });
    if (error) throw mapRpcError(error);
    return getUser(targetUserId);
  },
};

export default adminService;
