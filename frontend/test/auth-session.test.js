import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createSingleFlightQueue } from '../src/lib/singleFlightQueue.js';
import { getBackgroundProfileError } from '../src/lib/profileValidationPolicy.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(testDir, '..');

function deferred() {
  let resolve;
  const promise = new Promise((resolver) => {
    resolve = resolver;
  });
  return { promise, resolve };
}

test('eventos simultáneos del mismo token comparten una sola validación', async () => {
  const gate = deferred();
  const calls = [];
  const queue = createSingleFlightQueue(async (job) => {
    calls.push(job.key);
    await gate.promise;
    return job.key;
  });

  const first = queue.enqueue({ key: 'token-a' });
  const second = queue.enqueue({ key: 'token-a' });

  assert.equal(first, second);
  assert.deepEqual(calls, ['token-a']);

  gate.resolve();
  assert.equal(await first, 'token-a');
  assert.deepEqual(calls, ['token-a']);
});

test('si el token cambia conserva únicamente la revalidación más reciente', async () => {
  const gate = deferred();
  const calls = [];
  const queue = createSingleFlightQueue(async (job) => {
    calls.push(job.key);
    if (job.key === 'token-a') await gate.promise;
    return job.key;
  });

  const active = queue.enqueue({ key: 'token-a' });
  queue.enqueue({ key: 'token-b' });
  queue.enqueue({ key: 'token-c' });

  gate.resolve();
  assert.equal(await active, 'token-c');
  assert.deepEqual(calls, ['token-a', 'token-c']);
});

test('solo initialLoading sustituye la interfaz de rutas privadas', async () => {
  const [authContext, privateRoute] = await Promise.all([
    readFile(path.join(frontendDir, 'src/context/AuthContext.jsx'), 'utf8'),
    readFile(path.join(frontendDir, 'src/components/PrivateRoute.jsx'), 'utf8'),
  ]);

  assert.match(authContext, /initialLoading/);
  assert.match(authContext, /profileRefreshing/);
  assert.match(authContext, /visibilitychange/);
  assert.match(authContext, /force: true, reason: 'visibility'/);
  assert.match(authContext, /createSingleFlightQueue/);
  assert.match(privateRoute, /if \(initialLoading\)/);
  assert.doesNotMatch(privateRoute, /if \(profileRefreshing\)/);
  assert.match(privateRoute, /if \(!account && profileError\)/);
});

test('un error de red se reporta sin convertirlo en un bloqueo de cuenta', () => {
  const networkError = new Error('No se pudo conectar con el servidor');
  assert.equal(
    getBackgroundProfileError(networkError),
    'No se pudo conectar con el servidor'
  );
  assert.equal(
    getBackgroundProfileError({ code: 'ACCOUNT_SUSPENDED', message: 'Suspendida' }),
    ''
  );
  assert.equal(
    getBackgroundProfileError({ code: 'ACCOUNT_DELETED', message: 'Eliminada' }),
    ''
  );
});

test('AuthContext limpia listeners y protege las actualizaciones tras desmontarse', async () => {
  const authContext = await readFile(
    path.join(frontendDir, 'src/context/AuthContext.jsx'),
    'utf8'
  );

  assert.match(authContext, /mountedRef\.current = false/);
  assert.match(authContext, /subscription\.unsubscribe\(\)/);
  assert.match(
    authContext,
    /document\.removeEventListener\('visibilitychange', handleVisibilityChange\)/
  );
  assert.match(authContext, /if \(mountedRef\.current\) setInitialLoading\(false\)/);
  assert.match(authContext, /if \(!initial && mountedRef\.current\) setProfileRefreshing\(false\)/);
});
