import { useState } from 'react';
import { imageService } from '../services/imageService.js';

/**
 * Selecciona, previsualiza y sube una imagen a Supabase Storage.
 * Props:
 *  - catalogId: requerido para construir el path.
 *  - currentUrl: URL inicial (modo edición).
 *  - onUpload(url): callback con la URL pública resultante.
 */
export default function ImageUploader({ catalogId, currentUrl = '', onUpload }) {
  const [preview, setPreview] = useState(currentUrl);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(Boolean(currentUrl));

  const handleSelect = (e) => {
    const selected = e.target.files?.[0];
    setError('');
    setDone(false);
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!catalogId) {
      setError('Primero debes tener un catálogo creado');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const url = await imageService.uploadImage(file, catalogId);
      setPreview(url);
      setDone(true);
      onUpload?.(url);
    } catch (err) {
      setError(err.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <img
          src={preview}
          alt="Vista previa"
          className="h-40 w-40 rounded-lg object-cover ring-1 ring-gray-200"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
          Sin imagen
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleSelect}
        className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-600 hover:file:bg-brand-100"
      />

      {file && !done && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
      )}

      {done && <p className="text-sm text-brand-600">✓ Imagen lista</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
