import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import theme from '../styles/theme';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserRole, isUserActive } from '../services/userService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje('');
    setLoading(true);

    try {
      // Autenticación con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Usuario autenticado:', user.email);

      // Verificar si el usuario está habilitado
      const userActive = await isUserActive(user.uid);
      if (!userActive) {
        // Cerrar sesión si el usuario está inhabilitado
        await auth.signOut();
        setMensaje('Tu cuenta ha sido inhabilitada. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Obtener el rol del usuario desde Firestore
      const userRole = await getUserRole(user.uid);
      console.log('Rol del usuario:', userRole);

      // Redirigir según el rol del usuario
      if (userRole === 'Admin') {
        navigate('/dashboard/admin');
      } else if (userRole === 'User') {
        navigate('/dashboard/user');
      } else {
        // Si el usuario no tiene rol asignado o es desconocido
        setMensaje('Usuario sin rol asignado. Contacta al administrador.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error de autenticación:', error);
      setLoading(false);

      // Mensajes de error en español según el código de error
      let errorMessage = 'Error al iniciar sesión. Intenta de nuevo.';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'El correo electrónico no es válido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este correo electrónico.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Contraseña incorrecta.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
          break;
        default:
          errorMessage = 'Error al iniciar sesión. Intenta de nuevo.';
      }

      setMensaje(errorMessage);
    }
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
              type="email"
              placeholder="Correo electrónico"
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
              disabled={loading}
              onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
              onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
              style={{
                backgroundColor: loading ? '#ccc' : theme.colors.primary.main,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Cargando...' : 'Entrar'}
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
