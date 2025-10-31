import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import theme from '../styles/theme';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    try {
      // Enviar email de recuperación de contraseña
      await sendPasswordResetEmail(auth, email);

      setEmailSent(true);
      setMessage({
        text: 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña. Por favor revisa tu bandeja de entrada.',
        isError: false
      });

      console.log('Email de recuperación enviado a:', email);
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);

      let errorMessage = 'Error al enviar el correo de recuperación. Intenta de nuevo.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo electrónico.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Por favor intenta más tarde.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }

      setMessage({ text: errorMessage, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="background">
      <div className="watermark">Zentrix</div>
      <div className="center">
        <div className="loginCard">
          <h1 className="subtitle" style={{ marginBottom: 20, fontWeight: 700 }}>
            Recuperar contraseña
          </h1>
          <div className="formCard" style={{ marginBottom: 24, padding: '20px 18px', maxWidth: '270px', gap: '18px' }}>
            <p style={{ textAlign: 'left', marginBottom: 10, color: '#7b8a97', fontSize: '14px' }}>
              Ingresa tu correo electrónico para recuperar tu contraseña
            </p>

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

            {!emailSent && (
              <form onSubmit={handleSubmit} style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{ borderColor: theme.colors.border.main, marginBottom: 28 }}
                  required
                />

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
                  {isSubmitting ? 'Enviando...' : 'Enviar Email de Recuperación'}
                </button>
              </form>
            )}
          </div>

          <div className="text-center">
            <Link to="/login" className="text-sm hover:underline" style={{ color: theme.colors.primary.main }}>
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
