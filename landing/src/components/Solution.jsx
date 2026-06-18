// Solution.jsx
// Responsable: Integrante 3
// Descripción: Sección "Cómo funciona" con los 3 pasos de la plataforma

const steps = [
  {
    number: '01',
    title: 'Agrega tus productos',
    description:
      'Foto, nombre, precio y stock. Tan simple como llenar un formulario desde tu celular o computadora.',
  },
  {
    number: '02',
    title: 'Comparte tu catálogo',
    description:
      'Tu tienda tiene un link único. Compártelo por WhatsApp, Instagram o donde quieras en segundos.',
  },
  {
    number: '03',
    title: 'Controla tu inventario',
    description:
      'Actualiza stock en tiempo real y recibe alertas cuando un producto esté por agotarse.',
  },
]

export default function Solution() {
  return (
    <section id="solucion" className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Encabezado */}
        <div className="mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-400 mb-3">
            La solución
          </p>
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-4 leading-snug">
            CataLog: tu tienda digital<br />en 3 pasos
          </h2>
          <p className="text-gray-500 text-lg max-w-xl">
            Sin conocimientos técnicos. Sin costo inicial. Lista en minutos.
          </p>
        </div>

        {/* Pasos */}
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Línea conectora entre pasos */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gray-100 -translate-x-1/2 z-0" />
              )}
              <div className="relative z-10">
                <span className="font-serif text-5xl font-bold text-brand-50 leading-none block mb-4">
                  {step.number}
                </span>
                <div className="w-8 h-0.5 bg-brand-400 mb-4" />
                <h3 className="font-semibold text-gray-900 text-base mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
