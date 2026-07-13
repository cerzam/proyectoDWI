import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogService } from '../services/catalogService.js';
import { categoryService } from '../services/categoryService.js';
import { productService } from '../services/productService.js';
import ImageUploader from '../components/ImageUploader.jsx';
import Toast from '../components/Toast.jsx';

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [catalogId, setCatalogId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const catalog = await catalogService.getCatalog();
        if (!catalog?.id) {
          navigate('/dashboard');
          return;
        }
        if (!active) return;
        setCatalogId(catalog.id);

        // Cargar categorías del catálogo: GET /api/categories?catalog_id=uuid
        const cats = await categoryService.getCategories(catalog.id);
        if (!active) return;
        setCategories(cats || []);

        if (isEdit) {
          const { product } = await productService.getProduct(id);
          if (!active) return;
          setImageUrl(product.image_url || '');
          reset({
            name: product.name,
            description: product.description || '',
            price: product.price,
            category_id: product.category_id || '',
          });
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit, navigate, reset]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        await productService.updateProduct(id, {
          name: values.name,
          description: values.description || null,
          price: Number(values.price),
          category_id: values.category_id || null,
          image_url: imageUrl || null,
        });
      } else {
        await productService.createProduct({
          catalog_id: catalogId,
          name: values.name,
          description: values.description || null,
          price: Number(values.price),
          stock_inicial: Number(values.stock_inicial || 0),
          category_id: values.category_id || null,
          image_url: imageUrl || null,
        });
      }
      setToast({ type: 'success', message: 'Producto guardado correctamente' });
      window.setTimeout(() => navigate('/dashboard'), 700);
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', message: err.message });
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

  return (
    <div className="min-h-screen bg-brand-50/40 px-4 py-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate('/dashboard')} className="mb-4 text-sm text-brand-600 hover:underline">
          ← Volver al dashboard
        </button>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
          <h1 className="font-serif text-2xl font-bold text-brand-900">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre *</label>
              <input
                {...register('name', { required: 'El nombre es requerido' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Precio *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="$0.00"
                  {...register('price', {
                    required: 'El precio es requerido',
                    min: { value: 0, message: 'Debe ser >= 0' },
                  })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
              </div>

              {!isEdit && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Piezas disponibles para vender
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={0}
                    {...register('stock_inicial', {
                      min: { value: 0, message: 'Debe ser >= 0' },
                    })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Indica cuántas piezas tienes disponibles para vender
                  </p>
                  {errors.stock_inicial && (
                    <p className="mt-1 text-sm text-red-600">{errors.stock_inicial.message}</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <select
                {...register('category_id')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Imagen</label>
              <ImageUploader
                catalogId={catalogId}
                currentUrl={imageUrl}
                onUpload={(url) => setImageUrl(url)}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
              >
                {submitting ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
