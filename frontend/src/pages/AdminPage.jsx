import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { adminService } from '../services/adminService.js';
import Toast from '../components/Toast.jsx';
import ActionButton from '../components/ui/ActionButton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import FormField from '../components/ui/FormField.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';

const STATUS_LABELS = {
  active: 'Activa',
  suspended: 'Suspendida',
  deleted: 'Eliminada',
};

const STATUS_TONES = {
  active: 'success',
  suspended: 'warning',
  deleted: 'danger',
};

export default function AdminPage() {
  const { account } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === 'active').length,
      suspended: users.filter((user) => user.status === 'suspended').length,
      pro: users.filter((user) => user.plan === 'pro').length,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es-MX');
    return users.filter((user) => {
      const matchesTerm =
        !term ||
        [user.full_name, user.email, user.id]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase('es-MX').includes(term));
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesPlan = planFilter === 'all' || user.plan === planFilter;
      return matchesTerm && matchesStatus && matchesPlan;
    });
  }, [planFilter, search, statusFilter, users]);

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
    <div className="ui-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-700">
              Panel interno
            </p>
            <h1 className="ui-page-title mt-1">Administración</h1>
            <p className="mt-1 text-sm text-gray-600">Consulta planes y estado de las cuentas.</p>
          </div>
          <ActionButton
            as={Link}
            to="/dashboard"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Volver al Dashboard
          </ActionButton>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {error && (
          <div role="alert" className="ui-alert-error mb-5">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de usuarios">
          <SummaryCard label="Total" value={summary.total} tone="neutral" />
          <SummaryCard label="Activos" value={summary.active} tone="success" />
          <SummaryCard label="Suspendidos" value={summary.suspended} tone="warning" />
          <SummaryCard label="Plan Pro" value={summary.pro} tone="brand" />
        </section>

        <SectionCard
          title="Usuarios"
          description={`${filteredUsers.length} de ${users.length} cuentas`}
          className="mt-5 sm:mt-6"
        >
          <div className="grid grid-cols-1 gap-3 border-b border-gray-100 pb-5 sm:grid-cols-[minmax(0,1fr)_12rem_10rem]">
            <FormField id="admin-search" label="Buscar">
              <input
                id="admin-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre o correo"
                className="ui-input"
              />
            </FormField>
            <FormField id="admin-status-filter" label="Estado">
              <select
                id="admin-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="ui-input"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
                <option value="deleted">Eliminados</option>
              </select>
            </FormField>
            <FormField id="admin-plan-filter" label="Plan">
              <select
                id="admin-plan-filter"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
                className="ui-input"
              >
                <option value="all">Todos</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </FormField>
          </div>

        {filteredUsers.length > 0 ? (
          <>
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
              {filteredUsers.map((user) => (
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
          {filteredUsers.map((user) => (
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
          </>
        ) : (
          <EmptyState
            compact
            className="mt-5"
            title={users.length === 0 ? 'No hay usuarios registrados' : 'No encontramos resultados'}
            description={
              users.length === 0
                ? 'Las cuentas aparecerán aquí cuando se registren.'
                : 'Ajusta la búsqueda o los filtros para ver otras cuentas.'
            }
            action={
              users.length > 0 ? (
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setPlanFilter('all');
                  }}
                >
                  Limpiar filtros
                </ActionButton>
              ) : null
            }
          />
        )}
        </SectionCard>
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

function SummaryCard({ label, value, tone }) {
  const toneClasses = {
    neutral: 'bg-gray-50 text-gray-700',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-900',
    brand: 'bg-brand-50 text-brand-900',
  };

  return (
    <article className={`rounded-2xl border border-gray-200 p-4 shadow-sm sm:p-5 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </article>
  );
}

function UserIdentity({ user }) {
  const displayName = user.full_name || user.email || 'Usuario';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex min-w-0 items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-serif font-bold text-brand-900"
      >
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{user.full_name || 'Sin nombre'}</p>
        <p className="break-all text-xs text-gray-500">{user.email || user.id}</p>
        {user.suspension_reason && (
          <p className="mt-1 text-xs text-amber-700">Motivo: {user.suspension_reason}</p>
        )}
      </div>
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
        <ActionButton
          type="button"
          disabled={busy || isSelf}
          onClick={onSuspend}
          title={isSelf ? 'No puedes suspender tu propia cuenta' : undefined}
          variant="warning"
          size="sm"
        >
          Suspender
        </ActionButton>
      ) : user.status === 'suspended' ? (
        <ActionButton
          type="button"
          disabled={busy}
          onClick={() => onReactivate(user)}
          variant="secondary"
          size="sm"
          className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
        >
          Reactivar
        </ActionButton>
      ) : null}
      <ActionButton
        type="button"
        disabled={busy || isSelf || isDeleted}
        onClick={onDelete}
        title={isSelf ? 'No puedes eliminar tu propia cuenta' : undefined}
        variant="danger"
        size="sm"
      >
        Eliminar
      </ActionButton>
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
      className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium shadow-sm outline-none disabled:opacity-50"
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
        <StatusBadge tone={STATUS_TONES[user.status]}>
          {STATUS_LABELS[user.status]}
        </StatusBadge>
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
        <StatusBadge tone={STATUS_TONES[user.status]} className="shrink-0">
          {STATUS_LABELS[user.status]}
        </StatusBadge>
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" tabIndex="-1">
        <h2 id="admin-dialog-title" className="font-serif text-2xl font-bold text-brand-900">
          {deleting ? 'Eliminar cuenta' : 'Suspender cuenta'}
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          {deleting
            ? 'La cuenta perderá acceso y su catálogo dejará de mostrarse. Los datos se conservarán para auditoría y recuperación.'
            : `Indica el motivo de suspensión para ${dialog.user.email || dialog.user.id}.`}
        </p>

        {deleting ? (
          <FormField
            id="admin-delete-confirmation"
            label={<>Escribe <strong>{expectedEmail || 'ELIMINAR'}</strong> o <strong>ELIMINAR</strong></>}
            className="mt-5"
          >
            <input
              id="admin-delete-confirmation"
              autoFocus
              value={dialog.value}
              onChange={(event) => onChange(event.target.value)}
              className="ui-input focus:border-red-400 focus:ring-red-100"
            />
          </FormField>
        ) : (
          <FormField id="admin-suspension-reason" label="Motivo" className="mt-5">
            <textarea
              id="admin-suspension-reason"
              autoFocus
              maxLength={500}
              value={dialog.value}
              onChange={(event) => onChange(event.target.value)}
              className="ui-textarea focus:border-amber-400 focus:ring-amber-100"
            />
          </FormField>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <ActionButton
            type="button"
            disabled={busy}
            onClick={onCancel}
            variant="secondary"
          >
            Cancelar
          </ActionButton>
          <ActionButton
            type="button"
            disabled={busy || !confirmationValid}
            loading={busy}
            onClick={onConfirm}
            variant={deleting ? 'solidDanger' : 'solidWarning'}
          >
            {deleting ? 'Eliminar lógicamente' : 'Suspender'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
