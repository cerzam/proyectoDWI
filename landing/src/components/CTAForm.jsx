// CTAForm.jsx
// Responsable: Integrante 4
// Descripción: Sección CTA con formulario funcional conectado a Formspree

import { useState } from 'react'
import { useForm } from 'react-hook-form'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mdajlkzb'

export default function CTAForm() {
  const [submitted, setSubmitted] = useState(false)
  const [count, setCount] = useState(47)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      if (res.ok) {
        setCount((prev) => prev + 1)
        setSubmitted(true)
        reset()
      } else {
        setError('Algo salió mal. Intenta de nuevo.')
      }
    } catch {
      setError('Sin conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="cta" className="bg-brand-900 py-24">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <span className="inline-block bg-white/10 text-brand-100 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
          Acceso anticipado gratuito
        </span>

        <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
          ¿Listo para no perder<br />más ventas?
        </h2>
        <p className="text-brand-100 text-lg mb-10 leading-relaxed">
          Únete a los primeros emprendedores en probar CataLog.<br />
          Sin tarjeta de crédito. Sin compromisos.
        </p>

        {!submitted ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            noValidate
          >
            <div className="flex-1">
              <input
                type="email"
                placeholder="tucorreo@email.com"
                disabled={loading}
                className={`w-full px-4 py-3.5 rounded-lg bg-white/10 border text-white placeholder-white/40 outline-none transition-colors focus:bg-white/15 disabled:opacity-60 ${
                  errors.email
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-white/20 focus:border-brand-100'
                }`}
                {...register('email', {
                  required: 'El correo es obligatorio',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Ingresa un correo válido',
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5 text-left">
                  {errors.email.message}
                </p>
              )}
              {error && (
                <p className="text-red-400 text-xs mt-1.5 text-left">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-100 hover:bg-white text-brand-900 font-bold px-6 py-3.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {loading ? 'Enviando...' : '¡Lo quiero!'}
            </button>
          </form>
        ) : (
          <div className="max-w-md mx-auto bg-white/10 border border-white/20 rounded-xl px-6 py-5">
            <p className="text-white text-lg font-semibold mb-1">🎉 ¡Ya estás dentro!</p>
            <p className="text-brand-100 text-sm">
              Te avisaremos en cuanto abramos el acceso. Comparte con otros emprendedores.
            </p>
          </div>
        )}

        <p className="text-white/30 text-sm mt-5">
          Ya hay{' '}
          <span className="text-brand-100 font-semibold">{count} emprendedores</span>{' '}
          en lista de espera
        </p>
      </div>
    </section>
  )
}
