import { useState } from 'react';
import { imageService } from '../services/imageService.js';

const MAX_IMAGES = 5;

/**
 * Selecciona, sube y administra hasta 5 imágenes por producto.
 * La primera imagen del arreglo es siempre la principal.
 * Props:
 *  - catalogId: requerido para construir el path de subida.
 *  - images: arreglo de URLs actual.
 *  - onChange(images): callback con el arreglo actualizado.
 */
export default function MultiImageUploader({ catalogId, images = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const remaining = MAX_IMAGES - images.length;

  const handleSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setError('');
    if (files.length === 0) return;

    if (files.some((f) => !f.type.startsWith('image/'))) {
      setError('Todos los archivos deben ser imágenes');
      return;
    }
    if (files.length > remaining) {
      setError(
        `No puedes subir más de ${MAX_IMAGES} imágenes por producto. Ya tienes ${images.length}, puedes agregar ${remaining} más.`
      );
      return;
    }
    if (!catalogId) {
      setError('Primero debes tener un catálogo creado');
      return;
    }

    setUploading(true);
    try {
      const newUrls = await imageService.uploadImages(files, catalogId);
      onChange([...images, ...newUrls]);
    } catch (err) {
      setError(err.message || 'Error al subir las imágenes');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleMakeMain = (index) => {
    const target = images[index];
    onChange([target, ...images.filter((_, i) => i !== index)]);
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={url} className="relative h-28 w-28">
              <img
                src={url}
                alt={`Imagen ${index + 1}`}
                className="h-full w-full rounded-lg object-cover ring-1 ring-gray-200"
              />
              {index === 0 ? (
                <span className="absolute left-1 top-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Principal
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMakeMain(index)}
                  className="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-white"
                >
                  Hacer principal
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Eliminar imagen ${index + 1}`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-red-600 hover:bg-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || remaining <= 0}
          onChange={handleSelect}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-600 hover:file:bg-brand-100 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-gray-500">
          {images.length}/{MAX_IMAGES} imágenes
          {uploading && ' — subiendo…'}
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
