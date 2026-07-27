import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogService } from '../services/catalogService.js';
import { categoryService } from '../services/categoryService.js';
import { productService } from '../services/productService.js';
import MultiImageUploader from '../components/MultiImageUploader.jsx';
import Toast from '../components/Toast.jsx';
import { getProductImages } from '../utils/productImage.js';
import ActionButton from '../components/ui/ActionButton.jsx';
import FormField from '../components/ui/FormField.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';

const LIMIT_MESSAGE = 'Has alcanzado el límite de 10 productos de tu plan gratuito.';
const LIMIT_HELP = 'Puedes eliminar un producto existente o solicitar el Plan Pro para registrar más.';

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
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [canCreateProduct, setCanCreateProduct] = useState(true);

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
        setCanCreateProduct(catalog.can_create_product !== false);

        // Cargar categorías del catálogo: GET /api/categories?catalog_id=uuid
        const cats = await categoryService.getCategories(catalog.id);
        if (!active) return;
        setCategories(cats || []);

        if (isEdit) {
          const { product } = await productService.getProduct(id);
          if (!active) return;
          setImages(getProductImages(product));
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
    if (!isEdit && !canCreateProduct) {
      setError(`${LIMIT_MESSAGE} ${LIMIT_HELP}`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        await productService.updateProduct(id, {
          name: values.name,
          description: values.description || null,
          price: Number(values.price),
          category_id: values.category_id || null,
          images,
        });
      } else {
        await productService.createProduct({
          catalog_id: catalogId,
          name: values.name,
          description: values.description || null,
          price: Number(values.price),
          stock_inicial: Number(values.stock_inicial || 0),
          category_id: values.category_id || null,
          images,
        });
      }
      setToast({ type: 'success', message: 'Producto guardado correctamente' });
      window.setTimeout(() => navigate('/dashboard'), 700);
    } catch (err) {
      const message =
        err.code === 'PRODUCT_LIMIT_REACHED'
          ? `${LIMIT_MESSAGE} ${LIMIT_HELP}`
          : err.message;
      if (err.code === 'PRODUCT_LIMIT_REACHED') setCanCreateProduct(false);
      setError(message);
      setToast({ type: 'error', message });
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

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
            {isEdit ? 'Administrar producto' : 'Agregar al catálogo'}
          </p>
          <h1 className="ui-page-title mt-1">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Completa la información que verán tus clientes en el catálogo.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <SectionCard
            title="Información básica"
            description="Presenta el producto con un nombre claro y una descripción útil."
          >
            <div className="space-y-5">
              <FormField
                id="product-name"
                label="Nombre"
                required
                error={errors.name?.message}
              >
              <input
                id="product-name"
                {...register('name', { required: 'El nombre es requerido' })}
                aria-invalid={Boolean(errors.name)}
                className="ui-input"
              />
              </FormField>

              <FormField
                id="product-description"
                label="Descripción"
                help="Explica qué hace especial al producto. Puedes incluir materiales, medidas o detalles de uso."
              >
              <textarea
                id="product-description"
                rows={3}
                {...register('description')}
                className="ui-textarea"
              />
              </FormField>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SectionCard
              title="Precio"
              description="Define el precio que verá el cliente."
              className="h-full"
            >
                <FormField
                  id="product-price"
                  label="Precio"
                  required
                  help="Se mostrará en pesos mexicanos."
                  error={errors.price?.message}
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                      $
                    </span>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('price', {
                    required: 'El precio es requerido',
                    min: { value: 0, message: 'Debe ser >= 0' },
                  })}
                      aria-invalid={Boolean(errors.price)}
                      className="ui-input pl-8"
                />
                  </div>
                </FormField>
            </SectionCard>

            <SectionCard
              title="Categoría"
              description="Organiza el producto dentro del catálogo."
              className="h-full"
            >
                <FormField id="product-category" label="Categoría" help="Opcional. Ayuda a organizar el catálogo público.">
              <select
                id="product-category"
                {...register('category_id')}
                    className="ui-input"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
                </FormField>
            </SectionCard>
          </div>

          {!isEdit && (
            <SectionCard
              title="Inventario inicial"
              description="Define cuántas piezas estarán disponibles al publicar el producto."
            >
              <FormField
                id="product-stock"
                label="Piezas disponibles para vender"
                help="Después podrás registrar entradas y salidas desde el dashboard."
                error={errors.stock_inicial?.message}
              >
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={0}
                  {...register('stock_inicial', {
                    min: { value: 0, message: 'Debe ser >= 0' },
                  })}
                  aria-invalid={Boolean(errors.stock_inicial)}
                  className="ui-input max-w-xs"
                />
              </FormField>
            </SectionCard>
          )}

          <SectionCard
            title="Imágenes"
            description="Agrega hasta cinco imágenes y elige cuál aparecerá primero."
          >
              <MultiImageUploader catalogId={catalogId} images={images} onChange={setImages} />
          </SectionCard>

            {error && (
            <div className="ui-alert-error" role="alert">{error}</div>
            )}

            {!isEdit && !canCreateProduct && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-medium">{LIMIT_MESSAGE}</p>
                <p>{LIMIT_HELP}</p>
              </div>
            )}

          <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:static sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
              <ActionButton
              type="button"
              onClick={() => navigate('/dashboard')}
              variant="secondary"
              disabled={submitting}
              className="sm:min-w-28"
            >
              Cancelar
            </ActionButton>
            <ActionButton
                type="submit"
                disabled={submitting || (!isEdit && !canCreateProduct)}
              loading={submitting}
              className="sm:min-w-32"
              >
              Guardar producto
            </ActionButton>
          </div>
          </form>
      </div>
    </div>
  );
}
