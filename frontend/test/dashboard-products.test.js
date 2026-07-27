import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortProducts } from '../src/utils/dashboardProducts.js';

const PRODUCTS = [
  {
    id: 'a',
    name: 'Gorra Clásica',
    description: 'Gorra roja de algodón',
    category_id: 'gorras',
    price: 250,
    created_at: '2026-07-20T12:00:00.000Z',
  },
  {
    id: 'b',
    name: 'Blusa Verde',
    description: 'Corte casual',
    category_id: 'blusas',
    price: 180,
    created_at: '2026-07-25T12:00:00.000Z',
  },
  {
    id: 'c',
    name: 'Calzado Urbano',
    description: 'Tenis ligeros',
    category_id: 'calzado',
    price: 620,
    created_at: '2026-07-22T12:00:00.000Z',
  },
];

test('busca localmente por nombre o descripción', () => {
  assert.deepEqual(
    filterAndSortProducts({ products: PRODUCTS, searchQuery: 'algodón' }).map(
      (product) => product.id
    ),
    ['a']
  );
});

test('filtra por categoría sin alterar los productos originales', () => {
  const result = filterAndSortProducts({
    products: PRODUCTS,
    categoryFilter: 'blusas',
  });
  assert.deepEqual(result.map((product) => product.id), ['b']);
  assert.deepEqual(PRODUCTS.map((product) => product.id), ['a', 'b', 'c']);
});

test('ordena por fecha, precio y nombre usando datos disponibles', () => {
  assert.deepEqual(
    filterAndSortProducts({ products: PRODUCTS, sortOrder: 'recent' }).map(
      (product) => product.id
    ),
    ['b', 'c', 'a']
  );
  assert.deepEqual(
    filterAndSortProducts({ products: PRODUCTS, sortOrder: 'oldest' }).map(
      (product) => product.id
    ),
    ['a', 'c', 'b']
  );
  assert.deepEqual(
    filterAndSortProducts({ products: PRODUCTS, sortOrder: 'price-low' }).map(
      (product) => product.id
    ),
    ['b', 'a', 'c']
  );
  assert.deepEqual(
    filterAndSortProducts({ products: PRODUCTS, sortOrder: 'price-high' }).map(
      (product) => product.id
    ),
    ['c', 'a', 'b']
  );
  assert.deepEqual(
    filterAndSortProducts({ products: PRODUCTS, sortOrder: 'name' }).map(
      (product) => product.id
    ),
    ['b', 'c', 'a']
  );
});

test('mantiene el orden recibido cuando no existe fecha para ordenar', () => {
  const products = PRODUCTS.map(({ created_at, ...product }) => product);
  assert.deepEqual(
    filterAndSortProducts({ products, sortOrder: 'recent' }).map(
      (product) => product.id
    ),
    ['a', 'b', 'c']
  );
});
