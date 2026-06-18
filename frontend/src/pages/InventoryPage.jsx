import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../services/productService.js';

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

export default function InventoryPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch (err) {
      setFormError(err.message);
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
    <div className="min-h-screen bg-brand-50/40 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-brand-600 hover:underline">
          ← Volver al dashboard
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h1 className="font-serif text-2xl font-bold text-brand-900">{product?.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Stock actual</p>
          <p className="text-5xl font-extrabold text-brand-600">{product?.stock ?? 0}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cantidad</label>
              <input
                type="number"
                step="1"
                placeholder="+ entrada / - salida"
                {...register('quantity', {
                  required: 'Requerido',
                  validate: (v) =>
                    (Number.isInteger(Number(v)) && Number(v) !== 0) || 'Entero distinto de 0',
                })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Motivo</label>
              <select
                {...register('reason', { required: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
              <input
                {...register('notes')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="sm:col-span-3">
              {formError && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
              >
                {submitting ? 'Registrando…' : 'Registrar movimiento'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-serif text-lg font-semibold text-brand-900">Historial</h2>
          {movements.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Sin movimientos todavía.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-4 font-medium">Fecha</th>
                    <th className="py-2 pr-4 font-medium">Cantidad</th>
                    <th className="py-2 pr-4 font-medium">Motivo</th>
                    <th className="py-2 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-600">{formatDate(m.created_at)}</td>
                      <td
                        className={`py-2 pr-4 font-semibold ${
                          m.quantity >= 0 ? 'text-brand-600' : 'text-red-600'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="py-2 pr-4 capitalize text-gray-700">{m.reason}</td>
                      <td className="py-2 text-gray-500">{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
