import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="background">
      <div className="watermark">Zentrix</div>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: '#18404b' }}>
          Bienvenido a Zentrix
        </h1>
      </div>
    </div>
  );
}
