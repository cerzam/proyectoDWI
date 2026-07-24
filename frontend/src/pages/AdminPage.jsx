import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { adminService } from '../services/adminService.js';
import Toast from '../components/Toast.jsx';

const STATUS_LABELS = {
  active: 'Activa',
  suspended: 'Suspendida',
  deleted: 'Eliminada',
};

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-800',
  suspended: 'bg-amber-100 text-amber-800',
  deleted: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
  const { account } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminService.listUsers());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const runAction = async (user, action, successMessage) => {
    setBusyId(user.id);
    setError('');
    try {
      await action();
      await loadUsers();
      setToast({ type: 'success', message: successMessage });
      setDialog(null);
    } catch (actionError) {
      setError(actionError.message);
      setToast({ type: 'error', message: actionError.message });
    } finally {
      setBusyId('');
    }
  };

  const handlePlan = async (user, plan) => {
    if (plan === user.plan) return;
    const confirmed = window.confirm(
      `¿Cambiar el plan de ${user.email || user.id} a ${plan.toUpperCase()}?`
    );
    if (!confirmed) return;
    await runAction(
      user,
      () => adminService.changePlan(user.id, plan),
      `Plan actualizado a ${plan.toUpperCase()}`
    );
  };

  const reactivate = async (user) => {
    if (!window.confirm(`¿Reactivar la cuenta ${user.email || user.id}?`)) return;
    await runAction(
      user,
      () => adminService.changeStatus(user.id, 'active'),
      'Cuenta reactivada correctamente'
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50/40">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-900">Administración</h1>
            <p className="text-sm text-gray-500">Planes y estado de cuentas</p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver al Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div role="alert" className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUserId={account.id}
                  busy={busyId === user.id}
                  onPlan={handlePlan}
                  onSuspend={() => setDialog({ type: 'suspend', user, value: '' })}
                  onReactivate={reactivate}
                  onDelete={() => setDialog({ type: 'delete', user, value: '' })}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:hidden">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUserId={account.id}
              busy={busyId === user.id}
              onPlan={handlePlan}
              onSuspend={() => setDialog({ type: 'suspend', user, value: '' })}
              onReactivate={reactivate}
              onDelete={() => setDialog({ type: 'delete', user, value: '' })}
            />
          ))}
        </div>

        {users.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center text-gray-500">
            No hay usuarios registrados.
          </div>
        )}
      </main>

      {dialog && (
        <ConfirmationDialog
          dialog={dialog}
          busy={busyId === dialog.user.id}
          onChange={(value) => setDialog((current) => ({ ...current, value }))}
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            if (dialog.type === 'suspend') {
              return runAction(
                dialog.user,
                () =>
                  adminService.changeStatus(
                    dialog.user.id,
                    'suspended',
                    dialog.value.trim()
                  ),
                'Cuenta suspendida correctamente'
              );
            }
            return runAction(
              dialog.user,
              () => adminService.deleteUser(dialog.user.id),
              'Cuenta eliminada de forma lógica'
            );
          }}
        />
      )}
    </div>
  );
}

function UserIdentity({ user }) {
  return (
    <div>
      <p className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
      <p className="break-all text-xs text-gray-500">{user.email || user.id}</p>
      {user.suspension_reason && (
        <p className="mt-1 text-xs text-amber-700">Motivo: {user.suspension_reason}</p>
      )}
    </div>
  );
}

function UserControls({
  user,
  currentUserId,
  busy,
  onPlan,
  onSuspend,
  onReactivate,
  onDelete,
}) {
  const isSelf = user.id === currentUserId;
  const isDeleted = user.status === 'deleted';

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {user.status === 'active' ? (
        <button
          type="button"
          disabled={busy || isSelf}
          onClick={onSuspend}
          title={isSelf ? 'No puedes suspender tu propia cuenta' : undefined}
          className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Suspender
        </button>
      ) : user.status === 'suspended' ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onReactivate(user)}
          className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"
        >
          Reactivar
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy || isSelf || isDeleted}
        onClick={onDelete}
        title={isSelf ? 'No puedes eliminar tu propia cuenta' : undefined}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Eliminar
      </button>
    </div>
  );
}

function PlanSelect({ user, busy, onPlan }) {
  return (
    <select
      value={user.plan}
      disabled={busy || user.status === 'deleted'}
      onChange={(event) => onPlan(user, event.target.value)}
      aria-label={`Plan de ${user.email || user.id}`}
      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm disabled:opacity-50"
    >
      <option value="free">Free</option>
      <option value="pro">Pro</option>
    </select>
  );
}

function UserRow(props) {
  const { user, busy, onPlan } = props;
  return (
    <tr className={busy ? 'opacity-60' : ''}>
      <td className="px-5 py-4"><UserIdentity user={user} /></td>
      <td className="px-5 py-4 capitalize">{user.role}</td>
      <td className="px-5 py-4">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[user.status]}`}>
          {STATUS_LABELS[user.status]}
        </span>
      </td>
      <td className="px-5 py-4"><PlanSelect user={user} busy={busy} onPlan={onPlan} /></td>
      <td className="px-5 py-4"><UserControls {...props} /></td>
    </tr>
  );
}

function UserCard(props) {
  const { user, busy, onPlan } = props;
  return (
    <article className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 ${busy ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <UserIdentity user={user} />
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[user.status]}`}>
          {STATUS_LABELS[user.status]}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm capitalize text-gray-600">{user.role}</span>
        <PlanSelect user={user} busy={busy} onPlan={onPlan} />
      </div>
      <div className="mt-4"><UserControls {...props} /></div>
    </article>
  );
}

function ConfirmationDialog({ dialog, busy, onChange, onCancel, onConfirm }) {
  const deleting = dialog.type === 'delete';
  const expectedEmail = dialog.user.email || '';
  const confirmationValid = deleting
    ? dialog.value === 'ELIMINAR' || (expectedEmail && dialog.value === expectedEmail)
    : Boolean(dialog.value.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="admin-dialog-title" className="font-serif text-2xl font-bold text-brand-900">
          {deleting ? 'Eliminar cuenta' : 'Suspender cuenta'}
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          {deleting
            ? 'La cuenta perderá acceso y su catálogo dejará de mostrarse. Los datos se conservarán para auditoría y recuperación.'
            : `Indica el motivo de suspensión para ${dialog.user.email || dialog.user.id}.`}
        </p>

        {deleting ? (
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">
              Escribe <strong>{expectedEmail || 'ELIMINAR'}</strong> o <strong>ELIMINAR</strong>
            </label>
            <input
              autoFocus
              value={dialog.value}
              onChange={(event) => onChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
        ) : (
          <div className="mt-5">
            <label className="block text-sm font-medium text-gray-700">Motivo</label>
            <textarea
              autoFocus
              maxLength={500}
              value={dialog.value}
              onChange={(event) => onChange(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || !confirmationValid}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40 ${
              deleting ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {busy ? 'Procesando…' : deleting ? 'Eliminar lógicamente' : 'Suspender'}
          </button>
        </div>
      </div>
    </div>
  );
}
