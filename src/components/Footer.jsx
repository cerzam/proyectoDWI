// Footer.jsx
// Responsable: Integrante 4
// Descripción: Pie de página con créditos del equipo

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-serif text-xl font-bold text-brand-400">CataLog</span>
        <p className="text-gray-400 text-sm text-center">
          © 2025 CataLog · Proyecto académico — Desarrollo Web Integral · Equipo 2
        </p>
        <p className="text-gray-300 text-xs">Hecho con ❤️ en México</p>
      </div>
    </footer>
  )
}
