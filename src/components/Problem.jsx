// Problem.jsx
// Responsable: Integrante 2
// Descripción: Sección que expone los 3 problemas principales del emprendedor

const problems = [
  {
    icon: '📵',
    title: 'Sin presencia digital',
    description:
      'Tus productos solo existen si el cliente llega a tu punto de venta. Fuera de ahí, eres invisible para compradores potenciales.',
  },
  {
    icon: '⚠️',
    title: 'Errores de inventario',
    description:
      'Vender algo agotado o no saber cuánto tienes genera pérdidas de dinero y clientes frustrados que no regresan.',
  },
  {
    icon: '⏱️',
    title: 'Gestión ineficiente',
    description:
      'Hojas de cálculo, notas y mensajes de WhatsApp no escalan. Te roban horas que deberías dedicar a vender.',
  },
]

export default function Problem() {
  return (
    <section id="problema" className="bg-gray-50 py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Encabezado */}
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-3">
            El problema
          </p>
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4 leading-snug">
            Cada día sin catálogo digital<br />es una venta perdida
          </h2>
          <p className="text-gray-500 text-lg max-w-xl">
            Los pequeños emprendedores enfrentan barreras reales que frenan su crecimiento.
          </p>
        </div>

        {/* Tarjetas */}
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-sm transition-shadow"
            >
              <div className="text-3xl mb-5">{p.icon}</div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
