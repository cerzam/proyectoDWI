// Benefits.jsx
// Responsable: Integrante 3
// Descripción: Sección de beneficios con métricas clave

const benefits = [
  {
    metric: '+40%',
    title: 'Más ventas fuera del local',
    description:
      'Al tener un catálogo compartible, los clientes te compran sin necesidad de visitarte físicamente.',
  },
  {
    metric: '0',
    title: 'Errores de inventario',
    description:
      'El stock se actualiza automáticamente con cada venta registrada. Sin sorpresas ni ventas fantasma.',
  },
  {
    metric: '5 min',
    title: 'Para estar en línea',
    description:
      'En menos de 5 minutos tienes tu catálogo publicado y listo para recibir clientes desde cualquier lugar.',
  },
]

export default function Benefits() {
  return (
    <section id="beneficios" className="bg-gray-50 py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Encabezado */}
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-3">
            Beneficios
          </p>
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4 leading-snug">
            Resultados reales<br />para tu negocio
          </h2>
          <p className="text-gray-500 text-lg max-w-xl">
            Emprendedores que digitalizan su catálogo reportan cambios inmediatos.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-sm transition-shadow"
            >
              <p className="font-serif text-5xl font-bold text-brand-400 leading-none mb-4">
                {b.metric}
              </p>
              <div className="w-8 h-0.5 bg-brand-100 mb-4" />
              <h3 className="font-semibold text-gray-900 text-base mb-2">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
