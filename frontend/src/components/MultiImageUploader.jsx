import { useId, useState } from 'react';
import { imageService } from '../services/imageService.js';
import ActionButton from './ui/ActionButton.jsx';

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
  const inputId = useId();
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
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {images.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200"
            >
              <img
                src={url}
                alt={`${index === 0 ? 'Imagen principal' : 'Imagen'} ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {index === 0 ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-brand-900/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
                  Principal
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleMakeMain(index)}
                  className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-brand-800 shadow-sm hover:bg-white"
                >
                  Hacer principal
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Eliminar imagen ${index + 1}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg font-bold text-red-700 shadow-sm ring-1 ring-black/5 hover:bg-red-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
          uploading || remaining <= 0
            ? 'border-gray-200 bg-gray-50'
            : 'border-brand-200 bg-brand-50/50 hover:border-brand-400 hover:bg-brand-50'
        }`}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || remaining <= 0}
          onChange={handleSelect}
          className="sr-only"
        />
        <div
          aria-hidden="true"
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100"
        >
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-r-transparent" />
          ) : (
            '+'
          )}
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-800">
          {remaining <= 0 ? 'Ya agregaste el máximo de imágenes' : 'Agrega imágenes del producto'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-500">
          Selecciona hasta {remaining} {remaining === 1 ? 'imagen adicional' : 'imágenes adicionales'}.
          La primera será la imagen principal del producto.
        </p>
        {remaining > 0 && (
          <ActionButton
            as="label"
            htmlFor={inputId}
            variant="outline"
            size="sm"
            disabled={uploading}
            className="mt-3 cursor-pointer"
          >
            {uploading ? 'Subiendo imágenes…' : 'Seleccionar imágenes'}
          </ActionButton>
        )}
        <p className="mt-3 text-xs font-medium text-gray-500" aria-live="polite">
          {images.length}/{MAX_IMAGES} imágenes agregadas
        </p>
      </div>

      {error && <p className="ui-error" role="alert">{error}</p>}
    </div>
  );
}
