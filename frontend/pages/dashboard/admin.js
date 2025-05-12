// frontend/pages/dashboard/admin.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [facturas, setFacturas] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const router = useRouter();
  
  // Registration form states
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    documento: '',
    celular: '',
    username: '',
    rol: 'User'
  });
  const [registerMessage, setRegisterMessage] = useState({ text: '', isError: false });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch all invoices and notifications (admin view)
        const fResponse = await fetch('http://localhost:4000/admin/invoices');
        const nResponse = await fetch('http://localhost:4000/admin/notifications');
        
        if (fResponse.ok && nResponse.ok) {
          setFacturas(await fResponse.json());
          setNotificaciones(await nResponse.json());
        } else {
          console.error('Error fetching data:', 
            fResponse.ok ? '' : 'Invoices fetch failed', 
            nResponse.ok ? '' : 'Notifications fetch failed');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    }

    fetchData();
  }, []);

  // Helper to format any valid date object or string
  function formatDate(dateObj) {
    if (!dateObj) return 'N/A';
    try {
      return new Date(dateObj).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  }

  // Handle input changes for registration form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Success - reset form and show message
        setRegisterMessage({ text: 'Usuario registrado exitosamente', isError: false });
        setRegisterData({
          email: '',
          password: '',
          nombre: '',
          apellido: '',
          documento: '',
          celular: '',
          username: '',
          rol: 'User'
        });
        
        // Automatically hide success message after 3 seconds
        setTimeout(() => {
          setRegisterMessage({ text: '', isError: false });
          setShowRegisterForm(false);
        }, 3000);
      } else {
        // Error
        setRegisterMessage({ text: data.message || 'Error al registrar usuario', isError: true });
      }
    } catch (error) {
      console.error('Error registering user:', error);
      setRegisterMessage({ text: 'Error de conexión', isError: true });
    }
  };

  // Function to export invoices as PDF
  const exportInvoicesToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Facturas', 14, 22);
    
    // Table header
    doc.setFontSize(12);
    doc.text('Número', 20, 30);
    doc.text('Usuario', 60, 30);
    doc.text('Monto', 100, 30);
    doc.text('Estado', 140, 30);
    doc.text('Fecha', 180, 30);
    
    // Table content
    facturas.forEach((factura, index) => {
      const y = 40 + (index * 10);
      doc.text(`#${factura.invoice_number}`, 20, y);
      doc.text(factura.user_name, 60, y);
      doc.text(`$${factura.total_amount}`, 100, y);
      doc.text(factura.invoice_status, 140, y);
      const date = formatDate(factura.issue_date || factura.due_date);
      doc.text(date, 180, y);
    });
    
    doc.save('facturas.pdf');
  };

  // Function to export invoices as Excel
  const exportInvoicesToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(facturas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, 'facturas.xlsx');
  };

  // Function to export notifications as PDF
  const exportNotificationsToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Notificaciones', 14, 22);
    
    // Table header
    doc.setFontSize(12);
    doc.text('Mensaje', 20, 30);
    doc.text('Usuario', 100, 30);
    doc.text('Tipo', 140, 30);
    doc.text('Fecha', 180, 30);
    
    // Table content
    notificaciones.forEach((notif, index) => {
      const y = 40 + (index * 10);
      doc.text(notif.message.substring(0, 50), 20, y);
      doc.text(notif.user_name, 100, y);
      doc.text(notif.type, 140, y);
      const date = formatDate(notif.sent_date);
      doc.text(date, 180, y);
    });
    
    doc.save('notificaciones.pdf');
  };

  // Function to export notifications as Excel
  const exportNotificationsToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(notificaciones);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notificaciones');
    XLSX.writeFile(workbook, 'notificaciones.xlsx');
  };

  // Logout function
  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('id_user');
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <div className="p-8" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: theme.colors.text.primary }}>Dashboard Admin</h1>
        <div className="flex space-x-4">
          <button
            className="px-4 py-2 rounded font-medium"
            style={{ 
              backgroundColor: theme.colors.primary.main,
              color: theme.colors.primary.contrast
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
            onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
            onClick={() => setShowRegisterForm(!showRegisterForm)}
          >
            {showRegisterForm ? 'Cancelar' : 'Registrar Usuario'}
          </button>
          <button
            className="px-4 py-2 rounded font-medium"
            style={{ 
              backgroundColor: theme.colors.status.error,
              color: theme.colors.primary.contrast
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#D32F2F'} // Darker red on hover
            onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.status.error}
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Registration Form */}
      {showRegisterForm && (
        <div className="mb-8 p-6 rounded shadow" style={{ backgroundColor: theme.colors.background.paper }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>Registrar Nuevo Usuario</h2>
          
          {registerMessage.text && (
            <div 
              className="mb-4 p-3 rounded text-center"
              style={{ 
                backgroundColor: registerMessage.isError ? theme.colors.status.error : theme.colors.status.success,
                color: theme.colors.text.white
              }}
            >
              {registerMessage.text}
            </div>
          )}
          
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Nombre</label>
              <input
                type="text"
                name="nombre"
                value={registerData.nombre}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Apellido</label>
              <input
                type="text"
                name="apellido"
                value={registerData.apellido}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Email</label>
              <input
                type="email"
                name="email"
                value={registerData.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Nombre de Usuario</label>
              <input
                type="text"
                name="username"
                value={registerData.username}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Contraseña</label>
              <input
                type="password"
                name="password"
                value={registerData.password}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Documento</label>
              <input
                type="text"
                name="documento"
                value={registerData.documento}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Celular</label>
              <input
                type="text"
                name="celular"
                value={registerData.celular}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.primary }}>Rol</label>
              <select
                name="rol"
                value={registerData.rol}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                style={{ borderColor: theme.colors.border.main }}
                required
              >
                <option value="User">Usuario</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>
            
            <div className="md:col-span-2 mt-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded font-medium"
                style={{ 
                  backgroundColor: theme.colors.secondary.main,
                  color: theme.colors.secondary.contrast
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.hover}
                onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.main}
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>Todas las Facturas</h2>
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: theme.colors.secondary.main,
                color: theme.colors.secondary.contrast
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.hover}
              onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.main}
              onClick={exportInvoicesToExcel}
            >
              Exportar Excel
            </button>
            <button 
              className="px-3 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: theme.colors.primary.main,
                color: theme.colors.primary.contrast
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
              onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
              onClick={exportInvoicesToPDF}
            >
              Exportar PDF
            </button>
          </div>
        </div>
        
        <div className="rounded shadow overflow-hidden" style={{ backgroundColor: theme.colors.background.card }}>
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                <th className="py-3 px-4 text-left">Número</th>
                <th className="py-3 px-4 text-left">Usuario</th>
                <th className="py-3 px-4 text-left">Monto</th>
                <th className="py-3 px-4 text-left">Estado</th>
                <th className="py-3 px-4 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {facturas.length > 0 ? (
                facturas.map((f, index) => (
                  <tr 
                    key={f.id_invoice}
                    style={{ 
                      backgroundColor: index % 2 === 0 
                        ? theme.colors.background.card 
                        : theme.colors.background.default
                    }}
                  >
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>#{f.invoice_number}</td>
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>{f.user_name}</td>
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>${f.total_amount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs" style={{ 
                        backgroundColor: f.invoice_status === 'paid' ? theme.colors.status.success : theme.colors.status.warning,
                        color: theme.colors.text.white 
                      }}>
                        {f.invoice_status}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                      {formatDate(f.issue_date || f.due_date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan="5" 
                    className="py-4 px-4 text-center"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    No hay facturas disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>Todas las Notificaciones</h2>
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: theme.colors.secondary.main,
                color: theme.colors.secondary.contrast
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.hover}
              onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.main}
              onClick={exportNotificationsToExcel}
            >
              Exportar Excel
            </button>
            <button 
              className="px-3 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: theme.colors.primary.main,
                color: theme.colors.primary.contrast
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
              onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
              onClick={exportNotificationsToPDF}
            >
              Exportar PDF
            </button>
          </div>
        </div>
        
        <div className="rounded shadow overflow-hidden" style={{ backgroundColor: theme.colors.background.card }}>
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                <th className="py-3 px-4 text-left">Mensaje</th>
                <th className="py-3 px-4 text-left">Usuario</th>
                <th className="py-3 px-4 text-left">Tipo</th>
                <th className="py-3 px-4 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {notificaciones.length > 0 ? (
                notificaciones.map((n, index) => (
                  <tr 
                    key={n.id_notification}
                    style={{ 
                      backgroundColor: index % 2 === 0 
                        ? theme.colors.background.card 
                        : theme.colors.background.default
                    }}
                  >
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>{n.message}</td>
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>{n.user_name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs" style={{ 
                        backgroundColor: n.type === 'info' 
                          ? theme.colors.status.info 
                          : n.type === 'warning' 
                            ? theme.colors.status.warning 
                            : theme.colors.status.error,
                        color: theme.colors.text.white 
                      }}>
                        {n.type}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                      {formatDate(n.sent_date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan="4" 
                    className="py-4 px-4 text-center"
                    style={{ color: theme.colors.text.secondary }}
                  >
                    No hay notificaciones disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
