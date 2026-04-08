import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import { sendPasswordResetEmail } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('../../firebase', () => ({
  auth: {},
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const renderForgotPassword = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>
  );

describe('ForgotPassword — renderizado', () => {
  it('muestra el título "Recuperar contraseña"', () => {
    renderForgotPassword();
    expect(screen.getByText(/Recuperar contraseña/i)).toBeInTheDocument();
  });

  it('muestra el input de correo electrónico', () => {
    renderForgotPassword();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
  });

  it('muestra el botón de envío', () => {
    renderForgotPassword();
    expect(screen.getByRole('button', { name: /Enviar Email/i })).toBeInTheDocument();
  });

  it('muestra el link para volver al login', () => {
    renderForgotPassword();
    expect(screen.getByText(/Volver al inicio de sesión/i)).toBeInTheDocument();
  });
});

describe('ForgotPassword — envío exitoso', () => {
  it('muestra mensaje de éxito y oculta el formulario', async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined);

    renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'usuario@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Email/i }));

    await waitFor(() => {
      expect(screen.getByText(/Se ha enviado un correo electrónico/i)).toBeInTheDocument();
    });

    expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'usuario@test.com');
    expect(screen.queryByRole('button', { name: /Enviar Email/i })).not.toBeInTheDocument();
  });
});

describe('ForgotPassword — errores', () => {
  const testError = async (code, expectedMessage) => {
    sendPasswordResetEmail.mockRejectedValue({ code, message: code });

    renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Email/i }));

    await waitFor(() => {
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  };

  it('muestra error cuando el email no existe', async () => {
    await testError(
      'auth/user-not-found',
      'No existe una cuenta con este correo electrónico.'
    );
  });

  it('muestra error cuando el email es inválido', async () => {
    await testError(
      'auth/invalid-email',
      'El correo electrónico no es válido.'
    );
  });

  it('muestra error de demasiados intentos', async () => {
    await testError(
      'auth/too-many-requests',
      'Demasiados intentos. Por favor intenta más tarde.'
    );
  });
});

describe('ForgotPassword — estado del botón', () => {
  it('deshabilita el botón mientras se envía', async () => {
    let resolve;
    sendPasswordResetEmail.mockReturnValue(new Promise((r) => (resolve = r)));

    renderForgotPassword();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Email/i }));

    expect(screen.getByRole('button', { name: /Enviando/i })).toBeDisabled();

    resolve();
  });
});
