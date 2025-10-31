import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import theme from '../styles/theme';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  // TODO: Implementar lógica de autenticación con Firebase
  const handleLogin = async (e) => {
    e.preventDefault();

    // Lógica de autenticación con Firebase se implementará aquí
    setMensaje('Función de login será implementada con Firebase');
  };

  return (
    <div className="background">
      <div className="watermark" style={{ fontWeight: 700 }}>Zentrix</div>
      <div className="center">
        <div className="loginCard">
          <h1 className="title" style={{ fontWeight: 700 }}>Zentrix</h1>
          <form onSubmit={handleLogin} className="formCard">
            <h2 className="loginTitle">Iniciar sesión</h2>
            <input
              type="text"
              placeholder="Usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
            <div style={{ fontSize: 13, color: '#18404b', textAlign: 'center', marginBottom: 16 }}>
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>

            <button
              type="submit"
              className="button"
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
            >
              Entrar
            </button>

            {mensaje && (
              <p style={{ marginTop: 12, color: '#EF4444', textAlign: 'center' }}>{mensaje}</p>
            )}
          </form>
        </div>
      </div>
      <div className="footer">HOSPITAL PABLO TOBON URIBE</div>
    </div>
  );
}
