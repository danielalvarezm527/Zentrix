import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import theme from '../styles/theme';
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [isValidCode, setIsValidCode] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Obtener el código oobCode de la URL (Firebase lo envía como 'oobCode')
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('oobCode');

    if (code) {
      setOobCode(code);
      // Verificar que el código sea válido
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setUserEmail(email);
          setIsValidCode(true);
          console.log('Código válido para el email:', email);
        })
        .catch((error) => {
          console.error('Error al verificar código:', error);
          setIsValidCode(false);

          let errorMessage = 'El enlace de restablecimiento no es válido o ha expirado.';
          if (error.code === 'auth/expired-action-code') {
            errorMessage = 'El enlace de restablecimiento ha expirado. Por favor solicita uno nuevo.';
          } else if (error.code === 'auth/invalid-action-code') {
            errorMessage = 'El enlace de restablecimiento no es válido o ya fue usado.';
          }

          setMessage({ text: errorMessage, isError: true });
        });
    } else {
      setIsValidCode(false);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setMessage({ text: 'Las contraseñas no coinciden', isError: true });
      setIsSubmitting(false);
      return;
    }

    // Validar longitud mínima
    if (password.length < 6) {
      setMessage({ text: 'La contraseña debe tener al menos 6 caracteres', isError: true });
      setIsSubmitting(false);
      return;
    }

    try {
      // Confirmar el restablecimiento de contraseña con Firebase
      await confirmPasswordReset(auth, oobCode, password);

      setResetComplete(true);
      setMessage({
        text: '¡Contraseña actualizada exitosamente!',
        isError: false
      });

      console.log('Contraseña restablecida para:', userEmail);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Error al restablecer contraseña:', error);

      let errorMessage = 'Error al restablecer la contraseña. Intenta de nuevo.';

      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = 'El enlace ha expirado. Por favor solicita uno nuevo.';
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'El enlace no es válido o ya fue usado. Por favor solicita uno nuevo.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }

      setMessage({ text: errorMessage, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  // Mostrar loading mientras se valida el código
  if (isValidCode === null) {
    return (
      <div className="background">
        <div className="watermark">Zentrix</div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loginCard">
            <p className="text-center" style={{ color: theme.colors.text.primary }}>
              Verificando enlace de restablecimiento...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si el código no es válido
  if (isValidCode === false) {
    return (
      <div className="background">
        <div className="watermark">Zentrix</div>
        <div className="min-h-screen flex items-center justify-center">
          <div className="loginCard">
            <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.colors.text.primary }}>
              Error de Restablecimiento
            </h2>

            {message.text && (
              <p className="mb-6 text-center" style={{ color: theme.colors.status.error }}>
                {message.text}
              </p>
            )}

            {!message.text && (
              <p className="mb-6 text-center" style={{ color: theme.colors.status.error }}>
                El enlace de restablecimiento no es válido o ha expirado.
              </p>
            )}

            <button
              onClick={goToLogin}
              className="w-full font-bold py-2 px-4 rounded"
              style={{
                backgroundColor: theme.colors.primary.main,
                color: theme.colors.primary.contrast
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
            >
              Volver al Inicio de Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="background">
      <div className="watermark">Zentrix</div>
      <div className="center">
        <div className="loginCard">
          <h2 className="subtitle" style={{ marginBottom: 30, textAlign: 'center', fontWeight: 700 }}>
            Establecer Nueva Contraseña
          </h2>

          {userEmail && (
            <p style={{ textAlign: 'center', marginBottom: 20, color: '#7b8a97', fontSize: '14px' }}>
              Restableciendo contraseña para: <strong>{userEmail}</strong>
            </p>
          )}

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
              <p style={{ textAlign: 'left', marginBottom: 10, color: '#7b8a97', fontSize: '14px' }}>
                Tu contraseña ha sido actualizada con éxito.
              </p>
              <button
                onClick={goToLogin}
                className="font-bold py-2 px-4 rounded mb-4"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast,
                  width: '100%'
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'left' }}>
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
                className="font-bold py-2 px-4 rounded mb-4"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast,
                  opacity: isSubmitting ? 0.7 : 1,
                  width: '100%'
                }}
                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
                onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Establecer Nueva Contraseña'}
              </button>
            </form>
          )}

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm hover:underline" style={{ color: theme.colors.primary.main }}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
