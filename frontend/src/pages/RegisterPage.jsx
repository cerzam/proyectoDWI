import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { apiClient } from '../lib/apiClient.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { getPasswordChecks, passwordValidationRules } from '../lib/passwordRules.js';
import ActionButton from '../components/ui/ActionButton.jsx';
import FormField from '../components/ui/FormField.jsx';
import SectionCard from '../components/ui/SectionCard.jsx';

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onBlur', reValidateMode: 'onBlur' });
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const password = watch('password', '');
  const checks = getPasswordChecks(password);

  const onSubmit = async ({ full_name, email, password }) => {
    setSubmitting(true);
    setServerError('');
    try {
      const result = await apiClient('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      });

      if (result?.session?.access_token && result?.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
      }

      setSuccess(true);
    } catch (error) {
      setServerError(error.message || 'No se pudo crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60 px-4 py-8">
        <SectionCard className="w-full max-w-md text-center shadow-lg sm:p-8" contentClassName="mt-0">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-bold text-brand-700" aria-hidden="true">
            ✓
          </div>
          <h1 className="font-serif text-2xl font-bold text-brand-900">¡Cuenta creada!</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Tu cuenta fue creada correctamente. Te enviamos un correo de bienvenida. Ya puedes
            iniciar sesión.
          </p>
          <ActionButton
            as={Link}
            to="/login"
            className="mt-6"
          >
            Ir a iniciar sesión
          </ActionButton>
        </SectionCard>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100/60 px-4 py-8">
      <SectionCard className="w-full max-w-md shadow-lg sm:p-8" contentClassName="mt-0">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">CataLog</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-brand-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-gray-600">Empieza a publicar tu catálogo.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <FormField
            id="register-name"
            label="Nombre completo"
            required
            error={errors.full_name?.message}
          >
            <input
              id="register-name"
              autoComplete="name"
              {...register('full_name', { required: 'El nombre es requerido' })}
              aria-invalid={Boolean(errors.full_name)}
              className="ui-input"
            />
          </FormField>

          <FormField
            id="register-email"
            label="Correo electrónico"
            required
            error={errors.email?.message}
          >
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              {...register('email', { required: 'El email es requerido' })}
              aria-invalid={Boolean(errors.email)}
              className="ui-input"
            />
          </FormField>

          <div>
            <label htmlFor="register-password" className="ui-label">Contraseña <span className="text-red-600" aria-hidden="true">*</span></label>
            <PasswordInput
              id="register-password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password', passwordValidationRules)}
            />
            {errors.password && (
              <p className="ui-error" role="alert">{errors.password.message}</p>
            )}

            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2" aria-label="Requisitos de contraseña">
              {checks.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                    c.ok ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <span aria-hidden="true">{c.ok ? '✓' : '○'}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          <FormField
            id="register-confirm"
            label="Confirmar contraseña"
            required
            error={errors.confirm?.message}
          >
            <PasswordInput
              id="register-confirm"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirm)}
              {...register('confirm', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
            />
          </FormField>

          {serverError && (
            <div className="ui-alert-error" role="alert">{serverError}</div>
          )}

          <ActionButton
            type="submit"
            loading={submitting}
            fullWidth
          >
            Crear cuenta
          </ActionButton>
        </form>

        <p className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </SectionCard>
    </main>
  );
}
