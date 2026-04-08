import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home', () => {
  it('muestra el mensaje de bienvenida', () => {
    renderHome();
    expect(screen.getByText('Bienvenido a Zentrix')).toBeInTheDocument();
  });

  it('muestra el watermark de Zentrix', () => {
    renderHome();
    expect(screen.getByText('Zentrix')).toBeInTheDocument();
  });

  it('redirige a /login después de 2 segundos', () => {
    renderHome();

    expect(mockNavigate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('no redirige antes de los 2 segundos', () => {
    renderHome();

    jest.advanceTimersByTime(1999);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
