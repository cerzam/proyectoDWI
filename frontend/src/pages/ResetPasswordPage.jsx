import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import PasswordInput from '../components/PasswordInput.jsx';
import { getPasswordChecks, passwordValidationRules } from '../lib/passwordRules.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [canReset, setCanReset] = useState(false);
  const [checking, setChecking] = useState(true);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const password = watch('password', '');
  const checks = getPasswordChecks(password);

  useEffect(() => {
    // Supabase procesa el enlace de recuperación y emite PASSWORD_RECOVERY.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setCanReset(true);
        setChecking(false);
      }
    });

    // También cubre el caso en que la sesión de recuperación ya esté establecida.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setCanReset(true);
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async ({ password }) => {
    setSubmitting(true);
    setServerError('');
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setServerError(error.message || 'No se pudo actualizar la contraseña');
      return;
    }
    setSuccess(true);
    // Cierra la sesión de recuperación para forzar un login limpio.
    await supabase.auth.signOut();
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="font-serif text-2xl font-bold text-brand-900">Contraseña actualizada</h1>
          <p className="mt-3 text-gray-600">
            Tu contraseña se cambió correctamente. Ya puedes iniciar sesión con ella.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-900"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="font-serif text-3xl font-bold text-brand-900">Nueva contraseña</h1>
        <p className="mt-1 text-gray-500">Define una contraseña nueva para tu cuenta.</p>

        {!checking && !canReset && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Abre esta página desde el enlace que te enviamos por correo. Si el enlace expiró,
            solicita uno nuevo.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nueva contraseña</label>
            <PasswordInput {...register('password', passwordValidationRules)} />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}

            <ul className="mt-2 space-y-1">
              {checks.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center gap-2 text-xs ${
                    c.ok ? 'text-brand-600' : 'text-gray-400'
                  }`}
                >
                  <span>{c.ok ? '✓' : '○'}</span>
                  {c.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <PasswordInput
              {...register('confirm', {
                required: 'Confirma tu contraseña',
                validate: (v) => v === password || 'Las contraseñas no coinciden',
              })}
            />
            {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>
          )}

          <button
            type="submit"
            disabled={submitting || checking}
            className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {submitting ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
