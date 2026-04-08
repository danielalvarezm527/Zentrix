import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { isUserActive, getUserRole } from '../../services/userService';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('../../firebase', () => ({
  auth: { signOut: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../../services/userService', () => ({
  isUserActive: jest.fn(),
  getUserRole: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login — renderizado', () => {
  it('muestra el título Zentrix', () => {
    renderLogin();
    expect(screen.getAllByText('Zentrix').length).toBeGreaterThan(0);
  });

  it('muestra el input de correo electrónico', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
  });

  it('muestra el input de contraseña', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
  });

  it('muestra el botón "Entrar"', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('muestra el link "¿Olvidaste tu contraseña?"', () => {
    renderLogin();
    expect(screen.getByText(/olvidaste tu contraseña/i)).toBeInTheDocument();
  });
});

describe('Login — autenticación exitosa', () => {
  it('redirige a /dashboard/admin cuando el rol es Admin', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid1', email: 'admin@test.com' } });
    isUserActive.mockResolvedValue(true);
    getUserRole.mockResolvedValue('Admin');

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin');
    });
  });

  it('redirige a /dashboard/user cuando el rol es User', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid2', email: 'user@test.com' } });
    isUserActive.mockResolvedValue(true);
    getUserRole.mockResolvedValue('User');

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user');
    });
  });
});

describe('Login — usuario inactivo', () => {
  it('muestra mensaje de cuenta inhabilitada', async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'uid3', email: 'inactivo@test.com' },
    });
    isUserActive.mockResolvedValue(false);

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'inactivo@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/inhabilitada/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Login — errores de autenticación', () => {
  const testError = async (code, expectedMessage) => {
    signInWithEmailAndPassword.mockRejectedValue({ code });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  };

  it('muestra error de email inválido', async () => {
    await testError('auth/invalid-email', 'El correo electrónico no es válido.');
  });

  it('muestra error de credenciales inválidas', async () => {
    await testError('auth/invalid-credential', 'Credenciales inválidas. Verifica tu correo y contraseña.');
  });

  it('muestra error de demasiados intentos', async () => {
    await testError('auth/too-many-requests', 'Demasiados intentos fallidos. Intenta más tarde.');
  });

  it('muestra mensaje de error sin rol asignado', async () => {
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid4' } });
    isUserActive.mockResolvedValue(true);
    getUserRole.mockResolvedValue(null);

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), {
      target: { value: 'sinrol@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/sin rol asignado/i)).toBeInTheDocument();
    });
  });
});
