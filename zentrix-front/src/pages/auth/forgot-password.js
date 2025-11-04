import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; 
import theme from '../styles/theme';
import '@fontsource/rubik/700.css';  

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', isError: false });

    try {
      const res = await fetch('http://localhost:4000/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ 
          text: data.message, 
          isError: false 
        });
        // In a real app, we wouldn't store the token in state
        // This is just for demonstration purposes
        setResetToken(data.token);
      } else {
        setMessage({ 
          text: data.message || 'Error al solicitar el restablecimiento de contraseña', 
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

  const handleReset = () => {
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`);
    }
  };

  return (
    <div className="background">
      <div className="watermark">Zentrix</div>
      <div className="center">
        <div className="loginCard">
        <h1 className={`subtitle ${rubik.className}`} style={{ marginBottom: 20 }}>Recuperar contraseña</h1>
          <div className="formCard" style={{ marginBottom: 24, padding: "20px 18px", maxWidth:"270px", gap:"18px"}}>
            <p style={{ textAlign: "left", marginBottom: 10, color: "#7b8a97", fontSize: "14px"}}>
              Ingresa tu nombre de usuario para recuperar tu contraseña
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

            <form onSubmit={handleSubmit} style={{ marginBottom: 0,display:"flex", flexDirection:"column", alignItems:"center" }} >
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main, marginBottom:28}}
                required
              />
            
            
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
                {isSubmitting ? 'Procesando...' : 'Solicitar Recuperación'}
              </button>            
            </form>
            </div>
            {/* This button would only be shown for demo purposes. In a real app, the user would receive an email */}
            {resetToken && (
              <button
                onClick={handleReset}
                className="w-full font-bold py-2 px-4 rounded mb-4"
                style={{ 
                  backgroundColor: theme.colors.secondary.main,
                  color: theme.colors.secondary.contrast
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.hover}
                onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.main}
              >
                Continuar a Reset de Contraseña
              </button>
            )}

            <div className="text-center">
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
