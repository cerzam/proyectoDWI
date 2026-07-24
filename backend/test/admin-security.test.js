import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getAccountAccessError } from '../src/utils/accountAccess.js';
import { requireAdmin } from '../src/middleware/requireAdmin.js';
import { createVerifyJWT } from '../src/middleware/createVerifyJWT.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(testDir, '..', '..');

test('cuentas activas, incluidos administradores, pasan el control de estado', () => {
  assert.equal(getAccountAccessError('active'), null);
});

test('cuenta suspendida obtiene el código específico', () => {
  assert.deepEqual(getAccountAccessError('suspended'), {
    error: 'Esta cuenta está suspendida',
    code: 'ACCOUNT_SUSPENDED',
  });
});

test('cuenta eliminada obtiene el código específico', () => {
  assert.deepEqual(getAccountAccessError('deleted'), {
    error: 'Esta cuenta fue eliminada',
    code: 'ACCOUNT_DELETED',
  });
});

test('GET /api/auth/me recibe perfil activo o admin y bloquea suspendido/eliminado', async () => {
  const buildClient = (account) => ({
    auth: {
      async getUser() {
        return { data: { user: { id: account.id } }, error: null };
      },
    },
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return { data: account, error: null };
        },
      };
    },
  });

  const execute = async (account) => {
    const req = { headers: { authorization: 'Bearer test-token' } };
    let body;
    let nextCalled = false;
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        body = payload;
        return this;
      },
    };
    await createVerifyJWT(buildClient(account))(req, res, () => {
      nextCalled = true;
    });
    return { req, res, body, nextCalled };
  };

  for (const role of ['user', 'admin']) {
    const result = await execute({
      id: `${role}-id`,
      email: `${role}@example.com`,
      role,
      status: 'active',
      plan: 'free',
    });
    assert.equal(result.nextCalled, true);
    assert.equal(result.req.account.role, role);
  }

  const suspended = await execute({ id: 'suspended-id', status: 'suspended' });
  assert.equal(suspended.res.statusCode, 403);
  assert.equal(suspended.body.code, 'ACCOUNT_SUSPENDED');
  assert.equal(suspended.nextCalled, false);

  const deleted = await execute({ id: 'deleted-id', status: 'deleted' });
  assert.equal(deleted.res.statusCode, 403);
  assert.equal(deleted.body.code, 'ACCOUNT_DELETED');
  assert.equal(deleted.nextCalled, false);
});

test('verifyJWT rechaza un token inválido sin consultar ni aceptar el perfil', async () => {
  let profileQueried = false;
  const client = {
    auth: {
      async getUser() {
        return { data: { user: null }, error: new Error('invalid token') };
      },
    },
    from() {
      profileQueried = true;
      throw new Error('No debe consultar el perfil');
    },
  };
  const req = { headers: { authorization: 'Bearer invalid-token' } };
  let body;
  let nextCalled = false;
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    },
  };

  await createVerifyJWT(client)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(body.error, 'Token inválido');
  assert.equal(profileQueried, false);
  assert.equal(nextCalled, false);
});

test('requireAdmin rechaza un usuario normal y permite un administrador', () => {
  let payload;
  const response = {
    statusCode: 0,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  let nextCalled = false;
  requireAdmin({ account: { role: 'user' } }, response, () => {
    nextCalled = true;
  });
  assert.equal(response.statusCode, 403);
  assert.equal(payload.code, 'ADMIN_REQUIRED');
  assert.equal(nextCalled, false);

  requireAdmin({ account: { role: 'admin' } }, response, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});

test('todas las rutas admin comparten verifyJWT y requireAdmin', async () => {
  const routes = await readFile(path.join(rootDir, 'backend/src/routes/admin.js'), 'utf8');
  assert.match(routes, /router\.use\(verifyJWT,\s*requireAdmin\)/);
  assert.doesNotMatch(routes, /role/);
});

test('las RPC protegen al admin y escriben las cuatro acciones de auditoría', async () => {
  const migration = await readFile(
    path.join(
      rootDir,
      'supabase/migrations/202607230001_add_admin_account_management.sql'
    ),
    'utf8'
  );

  for (const invariant of [
    'CANNOT_SUSPEND_SELF',
    'CANNOT_DELETE_SELF',
    'LAST_ACTIVE_ADMIN',
    "'plan_changed'",
    "'account_suspended'",
    "'account_reactivated'",
    "'account_deleted'",
    'pg_advisory_xact_lock',
  ]) {
    assert.ok(migration.includes(invariant), `Falta la invariante ${invariant}`);
  }

  assert.match(
    migration,
    /REVOKE ALL ON FUNCTION public\.admin_change_user_plan[\s\S]*FROM PUBLIC, anon, authenticated/
  );
  assert.doesNotMatch(migration, /auth\.admin\.deleteUser|storage\.from/);
});

test('el catálogo público exige propietario activo y el frontend no persiste rol o estado', async () => {
  const publicService = await readFile(
    path.join(rootDir, 'backend/src/services/publicService.js'),
    'utf8'
  );
  const authContext = await readFile(
    path.join(rootDir, 'frontend/src/context/AuthContext.jsx'),
    'utf8'
  );

  assert.match(publicService, /\.eq\('owner\.status', 'active'\)/);
  assert.doesNotMatch(authContext, /localStorage|sessionStorage/);
  assert.match(authContext, /apiClient\('\/api\/auth\/me'\)/);
});

test('plan y reactivación se reflejan sin alterar catalogs.is_active', async () => {
  const catalogService = await readFile(
    path.join(rootDir, 'backend/src/services/catalogService.js'),
    'utf8'
  );
  const productService = await readFile(
    path.join(rootDir, 'backend/src/services/productService.js'),
    'utf8'
  );
  const migration = await readFile(
    path.join(
      rootDir,
      'supabase/migrations/202607230001_add_admin_account_management.sql'
    ),
    'utf8'
  );

  assert.match(catalogService, /from\('users'\)\.select\('plan'\)/);
  assert.match(productService, /catalogService\.getAccountQuota\(userId\)/);
  assert.doesNotMatch(migration, /UPDATE\s+public\.catalogs/i);
});
