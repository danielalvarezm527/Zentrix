import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import theme from '../styles/theme';
import { Rubik } from 'next/font/google'; 

const rubik = Rubik({ weight: ["700"], subsets: ["latin"] });

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get token from URL query parameter
    if (router.query.token) {
      setToken(router.query.token);
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', isError: true });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.message, isError: false });
        setResetComplete(true);
        // Clear form
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ 
          text: data.message || 'Error al restablecer la contraseña', 
          isError: true 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'Error de conexión con el servidor', 
        isError: true 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    router.push('/login');
  };

  if (!token) {
    return (
      <div className="background">
        <div className="watermark">Zentrix</div>
        <div className="min-h-screen flex items-center justify-center">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.colors.text.primary }}>
            Error de Restablecimiento
          </h2>
          <p className="mb-6 text-center" style={{ color: theme.colors.status.error }}>
            El token de restablecimiento no es válido o ha expirado.
          </p>
          <button
            onClick={goToLogin}
            className="w-full font-bold py-2 px-4 rounded"
            style={{ 
              backgroundColor: theme.colors.primary.main,
              color: theme.colors.primary.contrast
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
            onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
          >
            Volver al Inicio de Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="background">
      <div className="watermark">Zentrix</div>
      <div className="center">
        <div className="loginCard">
          <h2 className={`subtitle ${rubik.className}`} style={{ marginBottom: 30, textAlign:'center' }}>
            Establecer Nueva Contraseña
          </h2>

          {message.text && (
            <div 
              className="mb-4 p-3 rounded text-center"
              style={{ 
                backgroundColor: message.isError ? theme.colors.status.error : theme.colors.status.success,
                color: theme.colors.text.white
              }}
            >
              {message.text}
            </div>
          )}

          {resetComplete ? (
            <div className="text-center">
              <p style={{ textAlign: "left", marginBottom: 10, color: "#7b8a97", fontSize: "14px"}}>
                Tu contraseña ha sido actualizada con éxito.
              </p>
              <button
                onClick={goToLogin}
                className="font-bold py-2 px-4 rounded mb-4 width:100%"
                style={{ 
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast,
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
                onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4" style={{ marginBottom: 0,display:"flex", flexDirection:"column", alignItems:"left" }}>
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: theme.colors.border.main }}
                  required
                  minLength="6"
                />
              </div>

              <div className="mb-6">
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: theme.colors.border.main }}
                  required
                  minLength="6"
                />
              </div>

              <button
                type="submit"
                className="font-bold py-2 px-4 rounded mb-4 width:100%"
                style={{ 
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast,
                  opacity: isSubmitting ? 0.7 : 1
                }}
                onMouseOver={e => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
                onMouseOut={e => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Establecer Nueva Contraseña'}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link 
              href="/login"
              className="text-sm hover:underline" 
              style={{ color: theme.colors.primary.main }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
