// Hero.jsx
// Responsable: Integrante 1
// Descripción: Sección principal con headline, subtítulo y mockup visual

export default function Hero() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="bg-white">
      <div className="max-w-5xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        {/* Texto */}
        <div>
          <span className="inline-block bg-brand-50 text-brand-600 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            Para emprendedores
          </span>
          <h1 className="font-serif text-5xl font-bold leading-tight mb-6 text-gray-900">
            Tu catálogo siempre{' '}
            <em className="text-brand-400 not-italic">disponible,</em>{' '}
            tu inventario bajo control
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8">
            Gestiona y comparte tus productos desde cualquier lugar. Sin hojas
            de cálculo, sin perder ventas, sin caos de inventario.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => scrollTo('cta')}
              className="bg-brand-400 hover:bg-brand-600 text-white font-semibold px-7 py-3.5 rounded-lg transition-colors"
            >
              Solicitar acceso gratuito
            </button>
            <button
              onClick={() => scrollTo('solucion')}
              className="border border-gray-200 hover:border-gray-400 text-gray-700 font-medium px-6 py-3.5 rounded-lg transition-colors"
            >
              Ver cómo funciona
            </button>
          </div>
        </div>

        {/* Mockup */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-brand-400 px-4 py-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
            <span className="text-white/90 text-xs ml-2 font-medium">Mi catálogo — 12 productos</span>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-400 mb-4">Inventario en tiempo real</p>
            {[
              { name: 'Blusa floral M', stock: 14, status: 'Disponible', ok: true },
              { name: 'Pantalón lino beige', stock: 3, status: 'Pocas', ok: false },
              { name: 'Aretes dorados', stock: 28, status: 'Disponible', ok: true },
            ].map((p) => (
              <div key={p.name} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-400 text-sm">
                  📦
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{p.name}</p>
                  <p className="text-xs text-gray-400">Stock: {p.stock} unidades</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  p.ok
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
            <div className="mt-3 bg-brand-50 rounded-lg p-3 flex items-center gap-2">
              <span className="text-brand-400">🔗</span>
              <span className="text-xs text-brand-600 font-medium">catalogo.io/mitienda — listo para compartir</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
