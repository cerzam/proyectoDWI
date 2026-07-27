import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService.js';
import Toast from '../components/Toast.jsx';
import ActionButton from '../components/ui/ActionButton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import FormField from '../components/ui/FormField.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';

const REASONS = [
  { value: 'compra', label: 'Compra' },
  { value: 'venta', label: 'Venta' },
  { value: 'ajuste', label: 'Ajuste' },
  { value: 'devolucion', label: 'Devolución' },
];

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getReasonLabel(reason) {
  return REASONS.find((item) => item.value === reason)?.label || reason;
}

function MovementAmount({ quantity }) {
  const isEntry = quantity >= 0;

  return (
    <StatusBadge tone={isEntry ? 'success' : 'danger'}>
      {isEntry ? 'Entrada' : 'Salida'} · {quantity > 0 ? `+${quantity}` : quantity}
    </StatusBadge>
  );
}

export default function InventoryPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { reason: 'compra' } });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { product: p } = await productService.getProduct(productId);
      setProduct(p);
      const history = await productService.getInventory(productId);
      setMovements(history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setFormError('');
    try {
      const { new_stock } = await productService.createMovement({
        product_id: productId,
        quantity: parseInt(values.quantity, 10),
        reason: values.reason,
        notes: values.notes || null,
      });
      setProduct((prev) => ({ ...prev, stock: new_stock }));
      reset({ quantity: '', reason: values.reason, notes: '' });
      const history = await productService.getInventory(productId);
      setMovements(history || []);
      setToast({ type: 'success', message: 'Movimiento registrado correctamente' });
    } catch (err) {
      setFormError(err.message);
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-600 hover:underline">
          ← Volver al dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="ui-page">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-3 inline-flex min-h-10 items-center rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          ← Volver al dashboard
        </button>

        <SectionCard>
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Inventario
              </p>
              <h1 className="ui-page-title mt-1 truncate">{product?.name}</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Registra entradas por compras o salidas por ventas y ajustes.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-50 px-5 py-3 sm:min-w-36 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Stock actual</p>
              <p className="mt-1 text-4xl font-extrabold text-brand-700">{product?.stock ?? 0}</p>
              <StatusBadge
                tone={(product?.stock ?? 0) > 0 ? 'success' : 'warning'}
                className="mt-2"
              >
                {(product?.stock ?? 0) > 0 ? 'Con existencias' : 'Sin existencias'}
              </StatusBadge>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              id="inventory-quantity"
              label="Cantidad"
              required
              help="Usa un número positivo para entrada y negativo para salida."
              error={errors.quantity?.message}
            >
              <input
                id="inventory-quantity"
                type="number"
                step="1"
                placeholder="Ej. 10 o -3"
                {...register('quantity', {
                  required: 'Requerido',
                  validate: (v) =>
                    (Number.isInteger(Number(v)) && Number(v) !== 0) || 'Entero distinto de 0',
                })}
                aria-invalid={Boolean(errors.quantity)}
                className="ui-input"
              />
            </FormField>

            <FormField id="inventory-reason" label="Motivo" required>
              <select
                id="inventory-reason"
                {...register('reason', { required: true })}
                className="ui-input"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="inventory-notes"
              label="Notas"
              help="Opcional. Agrega una referencia breve del movimiento."
              className="sm:col-span-2"
            >
              <input
                id="inventory-notes"
                {...register('notes')}
                className="ui-input"
              />
            </FormField>

            <div className="sm:col-span-2">
              {formError && (
                <div className="ui-alert-error mb-3" role="alert">
                  {formError}
                </div>
              )}
              <ActionButton
                type="submit"
                loading={submitting}
                className="w-full sm:w-auto"
              >
                Registrar movimiento
              </ActionButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard
          title="Historial"
          description="Movimientos registrados para este producto."
          className="mt-5 sm:mt-6"
        >
          {movements.length === 0 ? (
            <EmptyState
              compact
              title="Sin movimientos todavía"
              description="Los cambios de inventario aparecerán aquí cuando registres el primero."
            />
          ) : (
            <>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-3 pr-4 font-semibold">Fecha</th>
                    <th className="py-3 pr-4 font-semibold">Cantidad</th>
                    <th className="py-3 pr-4 font-semibold">Motivo</th>
                    <th className="py-3 font-semibold">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-600">{formatDate(m.created_at)}</td>
                      <td className="py-3 pr-4">
                        <MovementAmount quantity={m.quantity} />
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge tone="neutral">{getReasonLabel(m.reason)}</StatusBadge>
                      </td>
                      <td className="py-3 text-gray-500">{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 sm:hidden">
              {movements.map((m) => (
                <article key={m.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <StatusBadge tone="neutral">{getReasonLabel(m.reason)}</StatusBadge>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(m.created_at)}</p>
                    </div>
                    <MovementAmount quantity={m.quantity} />
                  </div>
                  {m.notes && <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-600">{m.notes}</p>}
                </article>
              ))}
            </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
