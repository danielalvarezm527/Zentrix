import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import theme from '../styles/theme';
import { Rubik } from 'next/font/google';

const rubik = Rubik({ weight: ["700"], subsets: ["latin"] });

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store user data in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('rol', data.rol);
        localStorage.setItem('id_user', data.id_user);
        localStorage.setItem('email', email);

        // Check for invoice alerts if the user is not an admin
        if (data.rol !== 'Admin') {
          try {
            const alertsRes = await fetch(`http://localhost:4000/invoice-alerts/${data.id_user}`);
            if (alertsRes.ok) {
              const alertsData = await alertsRes.json();
              // Store alerts in localStorage
              localStorage.setItem('invoiceAlerts', JSON.stringify(alertsData));
            }
          } catch (error) {
            console.error('Error fetching invoice alerts:', error);
          }
        }

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
    <div className="background">
      <div className={`watermark ${rubik.className}`}>Zentrix</div>
      <div className="center">
        <div className="loginCard">
        <h1 className={`title ${rubik.className}`}>Zentrix</h1>
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
          <div style={{ fontSize: 13, color: "#18404b", textAlign: "center", marginBottom: 16 }}>
              <Link 
              href="/forgot-password"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            </div>

          <button
            type="submit"
            className="button"
            onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
            onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
          >
            Entrar
          </button>

          {mensaje && (
              <p style={{ marginTop: 12, color: "#EF4444", textAlign: "center" }}>
                {mensaje}
              </p>
            )}
        </form>
      </div>
    </div>
      <div className="footer">
        HOSPITAL PABLO TOBON URIBE
      </div>
    </div>      
  );
}
