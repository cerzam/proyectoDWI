import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { catalogService } from '../services/catalogService.js';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';
import ProductCard from '../components/ProductCard.jsx';
import Toast from '../components/Toast.jsx';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  const loadProducts = useCallback(async (catalogId) => {
    try {
      const data = await productService.getProducts(catalogId);
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadCategories = useCallback(async (catalogId) => {
    try {
      const data = await categoryService.getCategories(catalogId);
      setCategories(data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await catalogService.getCatalog();
      setCatalog(data);
      if (data?.id) {
        await loadProducts(data.id);
        await loadCategories(data.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadCategories]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/c/${catalog.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('No se pudo copiar el enlace');
    }
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}/c/${catalog.slug}`;
    const message = `Mira mi catálogo "${catalog.name}": ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setSavingCategory(true);
    setError('');
    try {
      await categoryService.createCategory({ catalog_id: catalog.id, name, position: 0 });
      setNewCategory('');
      await loadCategories(catalog.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`¿Eliminar categoría ${category.name}?`)) return;
    setError('');
    try {
      await categoryService.deleteCategory(category.id);
      await loadCategories(catalog.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleVisible = async (product) => {
    try {
      await productService.updateProduct(product.id, { is_visible: !product.is_visible });
      await loadProducts(catalog.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await productService.deleteProduct(product.id);
      await loadProducts(catalog.id);
      setToast({ type: 'success', message: 'Producto eliminado correctamente' });
    } catch (err) {
      setError(err.message);
      setToast({ type: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    );
  }

  if (!catalog) {
    return <CreateCatalogForm onCreated={loadCatalog} onLogout={handleLogout} error={error} />;
  }

  return (
    <div className="min-h-screen bg-brand-50/40">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-900">{catalog.name}</h1>
            <p className="text-sm text-gray-500">/c/{catalog.slug}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="rounded-lg border border-brand-400 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              {copied ? '¡Enlace copiado!' : 'Copiar enlace público'}
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="rounded-lg border border-green-500 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
            >
              Compartir por WhatsApp
            </button>
            <button
              onClick={() => navigate('/dashboard/products/new')}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
            >
              Agregar producto
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-serif text-lg font-semibold text-brand-900">Categorías</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500">Sin categorías aún</p>
            ) : (
              categories.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-900"
                >
                  {c.name}
                  <button
                    onClick={() => handleDeleteCategory(c)}
                    aria-label={`Eliminar categoría ${c.name}`}
                    className="text-brand-600 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </span>
              ))
            )}
          </div>

          <form onSubmit={handleAddCategory} className="mt-4 flex flex-wrap gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nueva categoría"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={savingCategory || !newCategory.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
            >
              {savingCategory ? 'Agregando…' : 'Agregar'}
            </button>
          </form>
        </section>

        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-gray-500">Aún no tienes productos.</p>
            <button
              onClick={() => navigate('/dashboard/products/new')}
              className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-900"
            >
              Agregar tu primer producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => navigate(`/dashboard/products/${p.id}/edit`)}
                onInventory={() => navigate(`/dashboard/inventory/${p.id}`)}
                onToggleVisible={() => handleToggleVisible(p)}
                onDelete={() => handleDelete(p)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CreateCatalogForm({ onCreated, onLogout, error }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [toast, setToast] = useState(null);

  const onSubmit = async (values) => {
    setSubmitting(true);
    setServerError('');
    try {
      await catalogService.createCatalog(values);
      setToast({ type: 'success', message: 'Catálogo creado correctamente' });
      window.setTimeout(() => {
        onCreated();
      }, 700);
    } catch (err) {
      setServerError(err.message);
      setToast({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 px-4 py-12">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-brand-900">Crea tu catálogo</h1>
          <button onClick={onLogout} className="text-sm text-gray-500 hover:underline">
            Salir
          </button>
        </div>
        <p className="mb-6 text-gray-500">
          Configura los datos de tu negocio para empezar a publicar productos.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre del negocio
            </label>
            <input
              {...register('name', { required: 'El nombre es requerido' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Enlace personalizado de tu tienda
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">/c/</span>
              <input
                {...register('slug', {
                  required: 'El slug es requerido',
                  onChange: (e) => {
                    const normalized = e.target.value.toLowerCase().replace(/\s+/g, '-');
                    setValue('slug', normalized, { shouldValidate: true });
                  },
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'Solo minúsculas, números y guiones',
                  },
                })}
                placeholder="mi-tienda"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Solo minúsculas, números y guiones. Ej: mi-tienda-2024
            </p>
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Número WhatsApp</label>
            <input
              {...register('whatsapp', { required: 'El WhatsApp es requerido' })}
              placeholder="5215555555555"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Incluye código de país. Ej: 5215536584928
            </p>
            {errors.whatsapp && (
              <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
            )}
          </div>

          {(serverError || error) && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear catálogo'}
          </button>
        </form>
      </div>
    </div>
  );
}
