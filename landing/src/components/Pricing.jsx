export default function Pricing() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-serif font-bold text-brand-900 mb-3">Planes listos para tu negocio</h2>
        <p className="text-gray-500 mb-10 text-sm">Comienza gratis hoy mismo y escala cuando lo necesites.</p>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="border border-gray-200 p-6 rounded-xl text-left flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Plan Base</h3>
              <p className="text-2xl font-black text-gray-900 my-3">$0 <span className="text-xs font-normal text-gray-400">Gratis de por vida</span></p>
              <p className="text-gray-500 text-xs mb-4">Ideal para bazares de Instagram que van empezando.</p>
            </div>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>✓ Catálogo con 20 productos</li>
              <li>✓ Link personalizado</li>
            </ul>
          </div>
          <div className="border-2 border-brand-900 p-6 rounded-xl text-left relative flex flex-col justify-between bg-brand-50/20">
            <span className="absolute -top-2.5 right-4 bg-brand-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">RECOMENDADO</span>
            <div>
              <h3 className="text-lg font-bold text-gray-950">Plan Pro</h3>
              <p className="text-2xl font-black text-brand-900 my-3">$129 <span className="text-xs font-normal text-gray-400">MXN/mes</span></p>
              <p className="text-gray-500 text-xs mb-4">Para tiendas con alto volumen de mensajes y stock variable.</p>
            </div>
            <ul className="text-xs text-gray-600 space-y-2">
              <li>✓ Productos ilimitados</li>
              <li>✓ Control automático de inventario</li>
              <li>✓ Soporte prioritario por WhatsApp</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}