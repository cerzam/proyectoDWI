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

Si la base de datos ya existe, ejecuta en orden las migraciones de
`supabase/migrations/`. Para habilitar la administración de cuentas ejecuta
`202607230001_add_admin_account_management.sql`. La migración conserva todos los
usuarios existentes con los valores predeterminados `role = 'user'` y
`status = 'active'`; nunca crea ni promueve automáticamente un administrador.

> **Nota de seguridad:** el backend usa la `SERVICE_ROLE_KEY`, que **omite RLS**.
> Por eso cada endpoint protegido valida que el recurso pertenezca al usuario
> autenticado (`req.user.id`) y responde **403** si no es así.

## Cómo acceder al panel administrativo

No existe un login administrativo separado. El administrador inicia sesión desde
el formulario normal y el backend obtiene su rol de `public.users` en cada
petición protegida.

### 1. Localizar el UUID

En Supabase abre **Authentication → Users**, localiza la cuenta y copia el valor
de la columna **User UID**. También puede consultarse en SQL Editor:

```sql
SELECT id, email
FROM auth.users
ORDER BY created_at DESC;
```

### 2. Convertir manualmente la primera cuenta en admin

La opción recomendada es actualizar por UUID:

```sql
UPDATE public.users
SET role = 'admin'
WHERE id = 'REEMPLAZA-AQUI-EL-UUID'
  AND status = 'active'
RETURNING id, email, role, status;
```

Como alternativa, puede localizarse de forma segura por el correo de
`auth.users`:

```sql
UPDATE public.users AS profile
SET role = 'admin'
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND lower(auth_user.email) = lower('admin@ejemplo.com')
  AND profile.status = 'active'
RETURNING profile.id, profile.email, profile.role, profile.status;
```

Comprueba que la consulta devuelve exactamente una fila. El primer administrador
no puede crearse desde el frontend ni mediante un endpoint público.

### 3. Renovar la sesión

Después del `UPDATE`, cierra la sesión de CataLog y vuelve a iniciar sesión. El
perfil se consulta en `/api/auth/me`; el rol no se obtiene de `localStorage`.

### 4. Abrir el panel

- Local: [http://localhost:5173/admin](http://localhost:5173/admin)
- Producción: `{URL_DEL_FRONTEND}/admin` (la URL de Vercel sigue marcada como
  `TBD` en este repositorio).

### 5. Verificar el bloqueo de un usuario normal

Con el token de una cuenta `role = 'user'`:

```bash
curl -i -H "Authorization: Bearer TOKEN_DE_USUARIO" \
  http://localhost:3000/api/admin/users
```

Debe responder `403` con `code = "ADMIN_REQUIRED"`. La misma protección
`verifyJWT` + `requireAdmin` se monta antes de todas las rutas `/api/admin`.

### 6. Verificar la navegación

Al iniciar sesión como admin aparece **Administración** en el Dashboard y `/admin`
es accesible. Para un usuario normal el enlace no se renderiza y la ruta React
regresa al Dashboard; aun si llama directamente a la API, el backend responde
`403`.

## Seguridad y alcance de la gestión de cuentas

- `DELETE /api/admin/users/:id` solo marca `status = 'deleted'`; no elimina
  registros, archivos ni el usuario de Supabase Auth.
- Suspender o eliminar no cambia `catalogs.is_active`. El catálogo público exige
  además que el propietario esté `active`, por lo que reaparece al reactivar la
  cuenta si ya estaba activo.
- Cambio de plan, suspensión, reactivación y eliminación lógica se ejecutan
  mediante RPC transaccionales junto con su registro en `admin_audit_log`.
- Las RPC solo conceden ejecución a `service_role`. La clave
  `SUPABASE_SERVICE_ROLE_KEY` vive exclusivamente en el backend.
- No hay endpoints para cambiar `role`. `plan` y `status` solo se modifican bajo
  `/api/admin` y requieren `requireAdmin`.

### Eliminación permanente pendiente

No se implementa porque PostgreSQL, Supabase Storage y Supabase Auth no comparten
una transacción. Una versión futura deberá usar un trabajo recuperable e
idempotente, registrar cada paso y reintentar fallos. El orden previsto es:
archivos de Storage, `product_images` o referencias de imágenes,
`inventory_movements`, `products`, `categories`, `catalogs`, `public.users` y,
solo al final, Supabase Auth. Nunca debe informar éxito completo si algún paso
falla.

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
