import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserRole, isUserActive } from '../../services/userService';

// Mock de Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

// Mock del módulo firebase (auth instance)
jest.mock('../../firebase', () => ({
  auth: { signOut: jest.fn().mockResolvedValue(undefined) },
}));

// Mock de userService
jest.mock('../../services/userService', () => ({
  isUserActive: jest.fn(),
  getUserRole: jest.fn(),
}));

const mockNavigate = jest.fn();

// Mock de react-router-dom para controlar useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper para renderizar Login dentro de un Router
const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Renderizado ─────────────────────────────────────────────────────────────

test('CP01 - Renderiza el formulario de login correctamente', () => {
  renderLogin();
  expect(screen.getByPlaceholderText('Correo electrónico')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
});

// ─── Autenticación exitosa ────────────────────────────────────────────────────

test('CP02 - Login exitoso redirige a Admin cuando rol es Admin', async () => {
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid1', email: 'admin@test.com' } });
  isUserActive.mockResolvedValue(true);
  getUserRole.mockResolvedValue('Admin');

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'admin@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin');
  });
});

test('CP03 - Login exitoso redirige a User cuando rol es User', async () => {
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid2', email: 'user@test.com' } });
  isUserActive.mockResolvedValue(true);
  getUserRole.mockResolvedValue('User');

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'user@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/user');
  });
});

// ─── Usuario inactivo ─────────────────────────────────────────────────────────

test('CP04 - Muestra error cuando el usuario está inactivo', async () => {
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid3', email: 'inactive@test.com' } });
  isUserActive.mockResolvedValue(false);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'inactive@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/cuenta ha sido inhabilitada/i)).toBeInTheDocument();
  });
  expect(mockNavigate).not.toHaveBeenCalled();
});

// ─── Sin rol asignado ─────────────────────────────────────────────────────────

test('CP05 - Muestra error cuando el usuario no tiene rol asignado', async () => {
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'uid4', email: 'norole@test.com' } });
  isUserActive.mockResolvedValue(true);
  getUserRole.mockResolvedValue(null);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'norole@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/sin rol asignado/i)).toBeInTheDocument();
  });
});

// ─── Errores de Firebase ──────────────────────────────────────────────────────

test('CP06 - Muestra error por correo inválido (auth/invalid-email)', async () => {
  const error = new Error('Invalid email');
  error.code = 'auth/invalid-email';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'correo-invalido' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/correo electrónico no es válido/i)).toBeInTheDocument();
  });
});

test('CP07 - Muestra error por credenciales inválidas (auth/invalid-credential)', async () => {
  const error = new Error('Invalid credential');
  error.code = 'auth/invalid-credential';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'wrongpass' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
  });
});

test('CP08 - Muestra error por demasiados intentos (auth/too-many-requests)', async () => {
  const error = new Error('Too many requests');
  error.code = 'auth/too-many-requests';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/demasiados intentos/i)).toBeInTheDocument();
  });
});

test('CP09 - Muestra error por contraseña incorrecta (auth/wrong-password)', async () => {
  const error = new Error('Wrong password');
  error.code = 'auth/wrong-password';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: '12345' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/contraseña incorrecta/i)).toBeInTheDocument();
  });
});

test('CP10 - Muestra error por usuario no encontrado (auth/user-not-found)', async () => {
  const error = new Error('User not found');
  error.code = 'auth/user-not-found';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'noexiste@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/no existe una cuenta/i)).toBeInTheDocument();
  });
});

test('CP11 - Muestra error por cuenta deshabilitada en Firebase (auth/user-disabled)', async () => {
  const error = new Error('User disabled');
  error.code = 'auth/user-disabled';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'disabled@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/cuenta ha sido deshabilitada/i)).toBeInTheDocument();
  });
});

test('CP12 - Muestra error genérico para errores desconocidos', async () => {
  const error = new Error('Unknown error');
  error.code = 'auth/unknown-error';
  signInWithEmailAndPassword.mockRejectedValue(error);

  renderLogin();
  fireEvent.change(screen.getByPlaceholderText('Correo electrónico'), { target: { value: 'test@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Contraseña'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

  await waitFor(() => {
    expect(screen.getByText(/error al iniciar sesión/i)).toBeInTheDocument();
  });
});
