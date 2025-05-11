import { useState } from 'react';
import { useRouter } from 'next/router';
import theme from '../styles/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }), // Usa "username" aquí si así lo recibe el back
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('id_user', data.id_user);

        // Redirigir según el rol
        if (data.rol === 'Admin') {
          router.push('/dashboard/admin');
        } else if (data.rol === 'User') {
          router.push('/dashboard/user');
        } else {
          router.push('/dashboard'); // Default
        }
      } else {
        setMensaje(data.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      setMensaje('Error de red o servidor no disponible');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.default }}>
      <form onSubmit={handleLogin} className="p-8 rounded shadow-md w-full max-w-md" style={{ backgroundColor: theme.colors.background.paper }}>
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.colors.text.primary }}>Iniciar Sesión</h2>

        <input
          type="text"
          placeholder="Usuario"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          style={{ borderColor: theme.colors.border.main }}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          style={{ borderColor: theme.colors.border.main }}
          required
        />

        <button
          type="submit"
          className="w-full font-bold py-2 px-4 rounded"
          style={{ 
            backgroundColor: theme.colors.primary.main,
            color: theme.colors.primary.contrast
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
          onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
        >
          Entrar
        </button>

        {mensaje && <p className="mt-4 text-center" style={{ color: theme.colors.status.error }}>{mensaje}</p>}
      </form>
    </div>
  );
}
