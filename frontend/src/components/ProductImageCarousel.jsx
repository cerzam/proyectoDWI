import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { PLACEHOLDER_IMAGE } from '../utils/productImage';

/**
 * Galería/carrusel de imágenes de producto para el catálogo público.
 * - Sin imágenes: placeholder, sin controles.
 * - Una imagen: se muestra sola, sin controles de carrusel.
 * - Dos o más: carrusel con flechas y dots, swipe en móvil.
 */
export default function ProductImageCarousel({ images = [], alt }) {
  const hasMultiple = images.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
        <img src={PLACEHOLDER_IMAGE} alt={alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (!hasMultiple) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200">
        <img
          src={images[0]}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        className="aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-gray-200"
        ref={emblaRef}
      >
        <div className="flex h-full">
          {images.map((src, index) => (
            <div key={index} className="relative h-full min-w-0 flex-[0_0_100%]">
              <img
                src={src}
                alt={`${alt} - imagen ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Imagen anterior"
        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition hover:bg-white"
      >
        <svg className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="none">
          <path d="M12 15l-5-5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Siguiente imagen"
        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition hover:bg-white"
      >
        <svg className="h-4 w-4 text-gray-700" viewBox="0 0 20 20" fill="none">
          <path d="M8 15l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="mt-3 flex justify-center gap-2" aria-label={`Imagen ${selectedIndex + 1} de ${images.length}`}>
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => scrollTo(index)}
            aria-label={`Ir a imagen ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex ? 'w-6 bg-brand-600' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
