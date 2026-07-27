import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { catalogService } from '../services/catalogService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';
import ProductCard from '../components/ProductCard.jsx';
import Toast from '../components/Toast.jsx';
import ActionButton from '../components/ui/ActionButton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import FormField from '../components/ui/FormField.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { filterAndSortProducts } from '../utils/dashboardProducts.js';

const LIMIT_MESSAGE = 'Has alcanzado el límite de 10 productos de tu plan gratuito.';
const LIMIT_HELP = 'Puedes eliminar un producto existente o solicitar el Plan Pro para registrar más.';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { account, user } = useAuth();
  const [catalog, setCatalog] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const userMenuRef = useRef(null);
  const userMenuPanelRef = useRef(null);

  const canCreateProduct = catalog?.can_create_product !== false;
  const productCount = catalog?.product_count ?? products.length;
  const productLimit = catalog?.product_limit || 10;
  const planProgress =
    catalog?.plan === 'pro' ? 100 : Math.min(100, Math.round((productCount / productLimit) * 100));
  const availableSpaces =
    catalog?.plan === 'pro' ? null : Math.max(0, productLimit - productCount);
  const visibleProductCount = products.filter((product) => product.is_visible).length;
  const accountLabel = account?.full_name || account?.email || user?.email || 'Usuario';
  const accountEmail = account?.email || user?.email || '';
  const avatarInitial = accountLabel.trim().charAt(0).toUpperCase() || 'U';

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [String(category.id), category.name])),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts({
      products,
      searchQuery,
      categoryFilter,
      sortOrder,
    });
  }, [categoryFilter, products, searchQuery, sortOrder]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        userMenuRef.current?.querySelector('button')?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

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
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/c/${catalog.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setUserMenuOpen(false);
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

  const handleUserMenuKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setUserMenuOpen(true);
      window.requestAnimationFrame(() => {
        userMenuPanelRef.current?.querySelector('[role="menuitem"]')?.focus();
      });
    }
  };

  const handleMenuNavigation = (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      userMenuPanelRef.current?.querySelectorAll('[role="menuitem"]') || []
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement);
    if (event.key === 'Home') items[0].focus();
    else if (event.key === 'End') items[items.length - 1].focus();
    else if (event.key === 'ArrowDown') items[(currentIndex + 1) % items.length].focus();
    else items[(currentIndex - 1 + items.length) % items.length].focus();
  };

  const clearProductFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSortOrder('recent');
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
      await loadCatalog();
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
    return (
      <CreateCatalogForm
        onCreated={loadCatalog}
        onLogout={handleLogout}
        error={error}
        isAdmin={account?.role === 'admin'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8f5]">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <header className="border-b border-gray-200 bg-white/95">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:flex lg:min-h-24 lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start justify-between gap-4 lg:contents">
            <div className="min-w-0 lg:order-1">
              <h1 className="truncate font-serif text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
                {catalog.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="truncate text-sm text-gray-500">/c/{catalog.slug}</p>
                <StatusBadge tone="success" className="shrink-0">
                  Publicado
                </StatusBadge>
              </div>
            </div>

            <div
              ref={userMenuRef}
              className="relative shrink-0 lg:order-3 lg:ml-3 lg:border-l lg:border-gray-200 lg:pl-4"
            >
              <button
                type="button"
                aria-label="Abrir menú de usuario"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((open) => !open)}
                onKeyDown={handleUserMenuKeyDown}
                className="flex items-center gap-2 rounded-xl p-1.5 text-brand-900 transition hover:bg-brand-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 font-serif text-xl font-bold text-brand-800 ring-1 ring-brand-100">
                  {avatarInitial}
                </span>
                <DashboardIcon
                  name="chevron"
                  className={`h-4 w-4 transition ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  ref={userMenuPanelRef}
                  role="menu"
                  aria-label="Menú de usuario"
                  onKeyDown={handleMenuNavigation}
                  className="absolute right-0 z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
                >
                  <div className="border-b border-gray-100 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-gray-900">{accountLabel}</p>
                    {accountEmail && (
                      <p className="mt-0.5 truncate text-xs text-gray-500">{accountEmail}</p>
                    )}
                    <StatusBadge
                      tone={catalog.plan === 'pro' ? 'brand' : 'neutral'}
                      className="mt-2"
                    >
                      Plan {catalog.plan === 'pro' ? 'Pro' : 'Free'}
                    </StatusBadge>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <DashboardIcon name="link" />
                      {copied ? 'Enlace copiado' : 'Copiar enlace público'}
                    </button>
                    {account?.role === 'admin' && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-purple-700 hover:bg-purple-50"
                      >
                        <DashboardIcon name="settings" />
                        Administración
                      </button>
                    )}
                    {catalog.plan !== 'pro' && (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/dashboard/upgrade');
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-brand-700 hover:bg-brand-50"
                      >
                        <DashboardIcon name="sparkle" />
                        Conocer Plan Pro
                      </button>
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <DashboardIcon name="logout" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:order-2 lg:ml-auto lg:mt-0 lg:flex lg:items-center">
            <ActionButton
              as="a"
              href={`/c/${catalog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              className="hidden lg:inline-flex"
            >
              <DashboardIcon name="eye" />
              Ver catálogo
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleShareWhatsApp}
              variant="secondary"
              className="hidden lg:inline-flex"
            >
              <DashboardIcon name="share" />
              Compartir
            </ActionButton>
            <ActionButton
              type="button"
              onClick={() => navigate('/dashboard/products/new')}
              disabled={!canCreateProduct}
              className="col-span-2 lg:col-auto"
            >
              <DashboardIcon name="plus" />
              Agregar producto
            </ActionButton>
            <ActionButton
              as="a"
              href={`/c/${catalog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              className="lg:hidden"
            >
              <DashboardIcon name="eye" />
              Ver catálogo
            </ActionButton>
            <ActionButton
              type="button"
              onClick={handleShareWhatsApp}
              variant="outline"
              className="lg:hidden"
            >
              <DashboardIcon name="share" />
              Compartir
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {error && (
          <div className="ui-alert-error mb-5" role="alert">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <SectionCard className="bg-gradient-to-br from-white to-brand-50/40 lg:col-span-2">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="ui-section-title">
                    {catalog.plan === 'pro' ? 'Plan Pro' : 'Plan gratuito'}
                  </h2>
                  <StatusBadge tone={catalog.plan === 'pro' ? 'brand' : 'neutral'}>
                    {catalog.plan === 'pro' ? 'Pro' : `${productCount}/${productLimit}`}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {catalog.plan === 'pro'
                    ? `${productCount} productos registrados`
                    : `${productCount} de ${productLimit} productos utilizados`}
                </p>
                <div
                  className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-50 ring-1 ring-brand-100"
                  role="progressbar"
                  aria-label="Uso del plan"
                  aria-valuemin={0}
                  aria-valuemax={catalog.plan === 'pro' ? 100 : productLimit}
                  aria-valuenow={catalog.plan === 'pro' ? 100 : productCount}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      !canCreateProduct ? 'bg-amber-500' : 'bg-brand-600'
                    }`}
                    style={{ width: `${planProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-gray-500">
                  {catalog.plan === 'pro'
                    ? 'Sin el límite de productos del plan Free'
                    : `${availableSpaces} ${
                        availableSpaces === 1 ? 'espacio disponible' : 'espacios disponibles'
                      }`}
                </p>
                {!canCreateProduct && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">{LIMIT_MESSAGE}</p>
                    <p className="mt-0.5">{LIMIT_HELP}</p>
                  </div>
                )}
              </div>
              {catalog.plan !== 'pro' && (
                <ActionButton
                  type="button"
                  onClick={() => navigate('/dashboard/upgrade')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Conocer Plan Pro
                </ActionButton>
              )}
            </div>
          </SectionCard>

          <SectionCard className="hidden lg:block">
            <div className="grid h-full grid-cols-3 divide-x divide-gray-100">
              <DashboardMetric icon="box" value={products.length} label="Productos" />
              <DashboardMetric icon="tag" value={categories.length} label="Categorías" />
              <DashboardMetric icon="eye" value={visibleProductCount} label="Visibles" />
            </div>
          </SectionCard>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 lg:hidden" aria-label="Resumen del catálogo">
          <CompactMetric value={products.length} label="Productos" />
          <CompactMetric value={categories.length} label="Categorías" />
          <CompactMetric value={visibleProductCount} label="Visibles" />
        </div>

        <SectionCard className="mt-4 lg:mt-5" contentClassName="mt-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="ui-section-title">Categorías</h2>
                <span className="text-xs font-medium text-brand-700">
                  Gestionar categorías
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500">Aún no tienes categorías.</p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="inline-flex min-h-9 max-w-full items-center overflow-hidden rounded-full bg-brand-50 text-brand-900 ring-1 ring-brand-100"
                    >
                      <span className="min-w-0 truncate px-3 py-1.5 text-sm font-semibold">
                        {category.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        aria-label={`Eliminar categoría ${category.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center border-l border-brand-100 text-lg leading-none text-brand-800 hover:bg-red-50 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form
              onSubmit={handleAddCategory}
              className="flex min-w-0 gap-2 lg:w-full lg:max-w-md"
            >
              <label htmlFor="new-category" className="sr-only">
                Nombre de la nueva categoría
              </label>
              <input
                id="new-category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Agregar categoría"
                className="ui-input min-w-0 flex-1"
              />
              <ActionButton
                type="submit"
                disabled={savingCategory || !newCategory.trim()}
                loading={savingCategory}
                aria-label="Agregar categoría"
                className="w-11 shrink-0 px-0"
              >
                {!savingCategory && <DashboardIcon name="plus" />}
              </ActionButton>
            </form>
          </div>
        </SectionCard>

        {products.length === 0 ? (
          <EmptyState
            className="mt-4 lg:mt-5"
            icon={<span aria-hidden="true">+</span>}
            title="Tu catálogo está listo para recibir productos"
            description="Agrega nombre, precio, inventario e imágenes. Después podrás compartir el enlace público con tus clientes."
            action={
              <ActionButton
                type="button"
                onClick={() => navigate('/dashboard/products/new')}
                disabled={!canCreateProduct}
              >
                Agregar tu primer producto
              </ActionButton>
            }
          />
        ) : (
          <SectionCard
            as="section"
            aria-label="Productos"
            className="mt-4 lg:mt-5"
            contentClassName="mt-0"
          >
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_13rem_12rem_auto]">
              <div className="relative min-[360px]:col-span-2 lg:col-span-1">
                <label htmlFor="product-search" className="sr-only">
                  Buscar productos
                </label>
                <DashboardIcon
                  name="search"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="product-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Buscar productos"
                  className="ui-input pl-11"
                />
              </div>

              <label className="sr-only" htmlFor="product-category-filter-mobile">
                Filtrar por categoría
              </label>
              <select
                id="product-category-filter-mobile"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="ui-input lg:hidden"
              >
                <option value="all">Categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="product-category-filter-desktop">
                Filtrar por categoría
              </label>
              <select
                id="product-category-filter-desktop"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="ui-input hidden lg:block"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="product-sort-order">
                Ordenar productos
              </label>
              <select
                id="product-sort-order"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="ui-input"
              >
                <option value="recent">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="price-low">Precio menor</option>
                <option value="price-high">Precio mayor</option>
                <option value="name">Nombre A-Z</option>
              </select>

              <div className="hidden items-center justify-end gap-2 lg:flex">
                <span className="mr-1 whitespace-nowrap text-xs font-medium text-gray-500">
                  {filteredProducts.length}{' '}
                  {filteredProducts.length === 1 ? 'producto' : 'productos'}
                </span>
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Vista de cuadrícula"
                    aria-pressed={viewMode === 'grid'}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      viewMode === 'grid'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-white'
                    }`}
                  >
                    <DashboardIcon name="grid" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="Vista de lista"
                    aria-pressed={viewMode === 'list'}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                      viewMode === 'list'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-white'
                    }`}
                  >
                    <DashboardIcon name="list" />
                  </button>
                </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <EmptyState
                compact
                className="mt-5"
                title="No encontramos productos"
                description="Ajusta la búsqueda o los filtros para volver a ver productos."
                action={
                  <ActionButton type="button" variant="secondary" onClick={clearProductFilters}>
                    Limpiar filtros
                  </ActionButton>
                }
              />
            ) : (
              <>
                <div
                  className={`mt-5 ${
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'
                      : 'space-y-3'
                  }`}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      dashboardView={viewMode}
                      categoryName={
                        categoryNameById.get(String(product.category_id || '')) || 'Sin categoría'
                      }
                      onEdit={() => navigate(`/dashboard/products/${product.id}/edit`)}
                      onInventory={() => navigate(`/dashboard/inventory/${product.id}`)}
                      onToggleVisible={() => handleToggleVisible(product)}
                      onDelete={() => handleDelete(product)}
                    />
                  ))}
                </div>
                <p className="mt-5 border-t border-gray-100 pt-4 text-center text-xs font-medium text-gray-500">
                  Mostrando {filteredProducts.length} de {products.length}{' '}
                  {products.length === 1 ? 'producto' : 'productos'}
                </p>
              </>
            )}
          </SectionCard>
        )}
      </main>
    </div>
  );
}

function DashboardIcon({ name, className = 'h-4 w-4' }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
      </>
    ),
    chevron: <path d="m7 10 5 5 5-5" />,
    link: (
      <>
        <path d="m10 13.5 4-4" />
        <path d="M7.5 15.5 6 17a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0" />
        <path d="m16.5 8.5 1.5-1.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    sparkle: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Zm7 12 .6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15Z" />,
    logout: (
      <>
        <path d="M10 5H5v14h5" />
        <path d="M14 8l4 4-4 4M18 12H9" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    list: (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <circle cx="4.5" cy="6" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r=".8" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="18" r=".8" fill="currentColor" stroke="none" />
      </>
    ),
    box: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </>
    ),
    tag: <path d="M20 13 13 20 4 11V4h7l9 9ZM8 8h.01" />,
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

function DashboardMetric({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center justify-center px-3 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <DashboardIcon name={icon} className="h-5 w-5" />
      </span>
      <strong className="mt-2 font-serif text-2xl text-brand-900">{value}</strong>
      <span className="mt-0.5 text-xs text-gray-500">{label}</span>
    </div>
  );
}

function CompactMetric({ value, label }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-2 py-2.5 text-center shadow-sm">
      <strong className="block font-serif text-lg text-brand-900">{value}</strong>
      <span className="block truncate text-[10px] font-medium text-gray-500">{label}</span>
    </div>
  );
}

function CreateCatalogForm({ onCreated, onLogout, error, isAdmin }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [toast, setToast] = useState(null);
  const catalogName = watch('name', '');
  const catalogSlug = watch('slug', '');

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
    <div className="ui-page px-4 py-8 sm:py-12">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      <SectionCard className="mx-auto max-w-4xl shadow-lg" contentClassName="mt-0">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
              Primer paso
            </p>
            <h1 className="ui-page-title mt-1">Crea tu catálogo</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => window.location.assign('/admin')}
                className="text-sm font-medium text-purple-700 hover:underline"
              >
                Administración
              </button>
            )}
            <button onClick={onLogout} className="text-sm text-gray-500 hover:underline">
              Salir
            </button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-8">
          <div>
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                1
              </span>
              <div>
                <p className="font-semibold text-brand-900">Configura la información pública</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Define cómo se verá y cómo podrán contactarte desde tu catálogo.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            id="catalog-name"
            label="Nombre del negocio"
            required
            error={errors.name?.message}
          >
            <input
              id="catalog-name"
              {...register('name', { required: 'El nombre es requerido' })}
              aria-invalid={Boolean(errors.name)}
              className="ui-input"
            />
          </FormField>

          <FormField
            id="catalog-slug"
            label="Enlace personalizado de tu tienda"
            required
            help="Usa minúsculas, números y guiones. Ejemplo: mi-tienda-2024"
            error={errors.slug?.message}
          >
            <div className="flex overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                /c/
              </span>
              <input
                id="catalog-slug"
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
                aria-invalid={Boolean(errors.slug)}
                className="h-11 w-full min-w-0 px-3.5 text-base outline-none sm:text-sm"
              />
            </div>
          </FormField>

          <FormField
            id="catalog-whatsapp"
            label="Número de WhatsApp"
            required
            help="Incluye el código de país, solo con números. Ejemplo: 5215536584928"
            error={errors.whatsapp?.message}
          >
            <input
              id="catalog-whatsapp"
              inputMode="tel"
              {...register('whatsapp', { required: 'El WhatsApp es requerido' })}
              placeholder="5215555555555"
              aria-invalid={Boolean(errors.whatsapp)}
              className="ui-input"
            />
          </FormField>

          {(serverError || error) && (
            <div className="ui-alert-error" role="alert">
              {serverError || error}
            </div>
          )}

              <ActionButton
                type="submit"
                loading={submitting}
                fullWidth
              >
                Crear catálogo
              </ActionButton>
            </form>
          </div>

          <aside className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
              Vista previa
            </p>
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 font-serif text-lg font-bold text-brand-900">
                  {(catalogName || 'C').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg font-bold text-brand-900">
                    {catalogName || 'Tu negocio'}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    /c/{catalogSlug || 'tu-enlace'}
                  </p>
                </div>
              </div>
              <StatusBadge tone="success" className="mt-4">
                Listo para publicar
              </StatusBadge>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-600">
              <p className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-brand-600">✓</span>
                El nombre identifica tu tienda.
              </p>
              <p className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-brand-600">✓</span>
                El enlace será fácil de compartir.
              </p>
              <p className="flex gap-2">
                <span aria-hidden="true" className="font-bold text-brand-600">✓</span>
                WhatsApp recibirá las consultas.
              </p>
            </div>
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
