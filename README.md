# CataLog

SaaS para crear y publicar catálogos de productos con control de inventario.
Cada negocio crea su catálogo, agrega productos con stock e imágenes, y comparte
una URL pública (`/c/{slug}`) donde sus clientes ven los productos y contactan por
WhatsApp.

Proyecto desarrollado para la materia DWI.

---

## 🧱 Stack

- **Frontend:** React 18 + Vite + TailwindCSS + React Router v6
- **Backend:** Node.js 20 LTS + Express 4
- **Base de datos:** Supabase (PostgreSQL 15 + Auth + Storage)
- **Auth:** Supabase Auth (JWT)
- **Deploy:** Vercel (frontend) · Render (backend) · Supabase (DB)

---

## 📁 Estructura del repositorio

```
proyectoDWI/
├── landing/        Página de marketing (no se modifica)
├── frontend/       App React del panel + catálogo público
│   └── src/
│       ├── lib/         supabaseClient.js, apiClient.js
│       ├── context/     AuthContext.jsx
│       ├── components/  PrivateRoute, ImageUploader, ProductCard
│       ├── pages/       Login, Register, Dashboard, ProductForm, Inventory, PublicCatalog
│       └── services/    catalogService, productService, categoryService, imageService
├── backend/        API REST (Express)
│   └── src/
│       ├── routes/        auth, catalog, products, categories, inventory, public
│       ├── controllers/   uno por route
│       ├── services/      lógica de negocio + verificación de propiedad
│       ├── middleware/    verifyJWT.js
│       ├── validators/    product, inventory, category
│       └── lib/           supabase.js (cliente con service role)
└── supabase/
    ├── schema.sql  Esquema completo (tablas, triggers, índices, RLS)
    └── seed.sql    Datos de prueba (demo)
```

---

## 🚀 Cómo correr el proyecto

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

### Backend

```bash
cd backend
npm install
npm run dev
```

API en [http://localhost:3000](http://localhost:3000).

---

## 🔐 Variables de entorno

### `frontend/.env` (copia de `.env.example`)

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (Settings → API). |
| `VITE_SUPABASE_ANON_KEY` | Clave pública `anon` de Supabase (segura para el cliente). |
| `VITE_API_URL` | URL base del backend (ej. `http://localhost:3000` en local). |

### `backend/.env` (copia de `.env.example`)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **service role** (Settings → API). ⚠️ Secreta, **omite RLS**. Solo en el backend, nunca en el frontend. |
| `SUPABASE_JWT_SECRET` | JWT secret de Supabase (Settings → API → JWT Settings). Usado para validar tokens. |
| `PORT` | Puerto del servidor (por defecto `3000`). |
| `FRONTEND_URL` | Origen permitido por CORS (URL del frontend). |

---

## 🗄️ Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor → New query**, pega el contenido de
   [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto crea las tablas
   `users`, `catalogs`, `categories`, `products`, `inventory_movements`, sus
   triggers, índices y políticas RLS.
3. Crea el bucket de imágenes manualmente:
   **Storage → New bucket** → nombre **`product-images`** → marca **Public bucket**.
4. (Opcional) Carga los datos demo siguiendo las instrucciones de
   [`supabase/seed.sql`](supabase/seed.sql) (primero crea el usuario demo en
   Authentication, luego ejecuta el seed con su UUID).
5. Copia las claves de **Settings → API** a tus archivos `.env`.

> **Nota de seguridad:** el backend usa la `SERVICE_ROLE_KEY`, que **omite RLS**.
> Por eso cada endpoint protegido valida que el recurso pertenezca al usuario
> autenticado (`req.user.id`) y responde **403** si no es así.

---

## 📦 Reglas de inventario

- El campo `products.stock` **nunca** se escribe directamente.
- Todo cambio de stock se registra en `inventory_movements`; un trigger
  (`trg_update_stock`) actualiza `products.stock` automáticamente.
- Al crear un producto con stock inicial se inserta un movimiento con
  `reason = 'stock_inicial'`.
- El backend valida stock insuficiente antes de insertar y devuelve **400** con
  un mensaje claro.

---

## 🧪 Credenciales demo

| Campo | Valor |
|---|---|
| Email | `demo@catalog.com` |
| Password | `demo1234` |
| Slug del catálogo | `mi-tienda-demo` |
| URL pública | `/c/mi-tienda-demo` |

Incluye 3 productos: stock normal, pocas unidades y uno agotado.

---

## ☁️ Deploy

| Servicio | URL |
|---|---|
| Frontend (Vercel) | _TBD_ |
| Backend (Render) | _TBD_ |
| Supabase (DB) | _TBD_ |
