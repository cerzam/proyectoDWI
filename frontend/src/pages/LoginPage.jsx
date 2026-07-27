import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import ActionButton from '../components/ui/ActionButton.jsx';
import FormField from '../components/ui/FormField.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';

export default function LoginPage() {
  const { session, account, initialLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur', reValidateMode: 'onBlur' });
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!initialLoading && session && account) return <Navigate to="/dashboard" replace />;

  const onSubmit = async ({ email, password }) => {
    setSubmitting(true);
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitting(false);
      setServerError(error.message || 'No se pudo iniciar sesión');
      return;
    }
    try {
      await refreshProfile({ force: true, reason: 'sign-in' });
      navigate('/dashboard');
    } catch (profileError) {
      if (!['ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED'].includes(profileError.code)) {
        setServerError(profileError.message || 'No se pudo validar el estado de la cuenta');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60 px-4 py-8">
      <SectionCard className="w-full max-w-md shadow-lg sm:p-8" contentClassName="mt-0">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Tu catálogo, en un solo lugar
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-brand-900">CataLog</h1>
          <p className="mt-2 text-sm text-gray-600">Inicia sesión para administrar tu negocio.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <FormField id="login-email" label="Correo electrónico" required error={errors.email?.message}>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              {...register('email', { required: 'El email es requerido' })}
              aria-invalid={Boolean(errors.email)}
              className="ui-input"
            />
          </FormField>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-800">
                Contraseña
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password', { required: 'La contraseña es requerida' })}
            />
            {errors.password && (
              <p className="ui-error" role="alert">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="ui-alert-error" role="alert">{serverError}</div>
          )}

          <ActionButton
            type="submit"
            loading={submitting}
            fullWidth
          >
            Iniciar sesión
          </ActionButton>
        </form>

        <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Regístrate
          </Link>
        </p>
      </SectionCard>
    </main>
  );
}
