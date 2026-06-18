import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CTAForm from './CTAForm';

// QA: Simulamos la función global 'fetch' para no hacer peticiones reales a Formspree
global.fetch = vi.fn();

describe('QA: Pruebas del componente CTAForm', () => {
  // Limpiamos las simulaciones antes de cada prueba
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('1. Debe renderizar el input de correo y el botón principal', () => {
    render(<CTAForm />);
    
    const emailInput = screen.getByPlaceholderText('tucorreo@email.com');
    const submitButton = screen.getByRole('button', { name: /¡lo quiero!/i });

    expect(emailInput).toBeDefined();
    expect(submitButton).toBeDefined();
  });

  it('2. Debe mostrar error de validación si se envía el formulario vacío', async () => {
    const user = userEvent.setup();
    render(<CTAForm />);
    
    const submitButton = screen.getByRole('button', { name: /¡lo quiero!/i });
    
    // QA: Simulamos el clic sin escribir nada
    await user.click(submitButton);

    // Esperamos que aparezca el mensaje de error definido en react-hook-form
    const errorMessage = await screen.findByText('El correo es obligatorio');
    expect(errorMessage).toBeDefined();
  });

  it('3. Debe mostrar error si el formato del correo es inválido', async () => {
    const user = userEvent.setup();
    render(<CTAForm />);
    
    const emailInput = screen.getByPlaceholderText('tucorreo@email.com');
    const submitButton = screen.getByRole('button', { name: /¡lo quiero!/i });

    // QA: Simulamos que el usuario escribe un correo mal formateado
    await user.type(emailInput, 'correo-invalido-sin-arroba');
    await user.click(submitButton);

    const errorMessage = await screen.findByText('Ingresa un correo válido');
    expect(errorMessage).toBeDefined();
  });

  it('4. Debe simular un envío exitoso y mostrar el mensaje de confirmación', async () => {
    const user = userEvent.setup();
    
    // QA: Le decimos a nuestra simulación de fetch que responda "ok: true"
    fetch.mockResolvedValueOnce({ ok: true });

    render(<CTAForm />);
    
    const emailInput = screen.getByPlaceholderText('tucorreo@email.com');
    const submitButton = screen.getByRole('button', { name: /¡lo quiero!/i });

    // Escribimos un correo válido y enviamos
    await user.type(emailInput, 'qa@test.com');
    await user.click(submitButton);

    // Verificamos que el formulario desaparece y se muestra el mensaje de éxito
    const successMessage = await screen.findByText('🎉 ¡Ya estás dentro!');
    expect(successMessage).toBeDefined();
  });
});