import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './src/routes/auth.js';
import catalogRoutes from './src/routes/catalog.js';
import productRoutes from './src/routes/products.js';
import categoryRoutes from './src/routes/categories.js';
import inventoryRoutes from './src/routes/inventory.js';
import publicRoutes from './src/routes/public.js';
import adminRoutes from './src/routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS: solo se acepta el origen del frontend configurado
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/', (_req, res) => {
  res.json({ name: 'CataLog API', status: 'ok' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Manejador de errores global
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  const payload = { error: err.message || 'Error interno del servidor' };
  if (err.code) payload.code = err.code;
  if (err.details) payload.details = err.details;
  res.status(err.status || 500).json(payload);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`CataLog API escuchando en http://localhost:${PORT}`);
});

export default app;
