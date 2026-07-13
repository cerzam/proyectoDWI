// Navbar.jsx
// Responsable: Integrante 1
// Descripción: Barra de navegación con logo y acceso al CTA

export default function Navbar() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <span className="font-serif text-2xl font-bold text-brand-400 tracking-tight">
          CataLog
        </span>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
          <button onClick={() => scrollTo('problema')} className="hover:text-gray-900 transition-colors">
            El problema
          </button>
          <button onClick={() => scrollTo('solucion')} className="hover:text-gray-900 transition-colors">
            Cómo funciona
          </button>
          <button onClick={() => scrollTo('beneficios')} className="hover:text-gray-900 transition-colors">
            Beneficios
          </button>
        </div>

        {/* CTA */}
        <button
          onClick={() => scrollTo('cta')}
          className="bg-brand-400 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Quiero acceso
        </button>
      </div>
    </nav>
  )
}
