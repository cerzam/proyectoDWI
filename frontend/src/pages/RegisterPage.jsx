import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const password = watch('password');

  const onSubmit = async ({ full_name, email, password }) => {
    setSubmitting(true);
    setServerError('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    });
    setSubmitting(false);
    if (error) {
      setServerError(error.message || 'No se pudo crear la cuenta');
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="font-serif text-2xl font-bold text-brand-900">¡Cuenta creada!</h1>
          <p className="mt-3 text-gray-600">
            Te enviamos un correo de verificación. Revisa tu bandeja de entrada para confirmar tu
            email antes de iniciar sesión.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-900"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Crear cuenta</h1>
        <p className="mt-1 text-gray-500">Empieza a publicar tu catálogo</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nombre completo</label>
            <input
              {...register('full_name', { required: 'El nombre es requerido' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email', { required: 'El email es requerido' })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: { value: 6, message: 'Mínimo 6 caracteres' },
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              {...register('confirm', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {submitting ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
