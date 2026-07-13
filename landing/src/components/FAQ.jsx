// FAQ.jsx - Alan
export default function FAQ() {
  const faqs = [
    { q: "¿CataLog tiene algún costo?", a: "Actualmente estamos en fase de acceso anticipado gratuito para los primeros comercios." },
    { q: "¿Necesito saber de programación?", a: "Para nada. Está diseñado para que subas tus productos y cambies precios desde tu celular en 2 minutos." },
    { q: "¿Cómo comparto mi catálogo?", a: "La app te genera un link único para que lo pongas directamente en tu perfil de Instagram o en tus estados de WhatsApp." }
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-serif font-bold text-center text-brand-900 mb-10">Preguntas Frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-1">{faq.q}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}