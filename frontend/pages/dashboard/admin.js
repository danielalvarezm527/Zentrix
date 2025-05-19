// frontend/pages/dashboard/admin.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { FaHome, FaBell, FaUserPlus, FaSignOutAlt } from "react-icons/fa";
// Import Chart.js components
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

export default function AdminDashboard() {
  const [facturas, setFacturas] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [filteredFacturas, setFilteredFacturas] = useState([]);
  const [filteredNotificaciones, setFilteredNotificaciones] = useState([]);
  const [invoiceFilters, setInvoiceFilters] = useState({
    invoiceNumber: '',
    userName: '',
    status: '',
    fromDate: '',
    toDate: ''
  });
  const [notificationFilters, setNotificationFilters] = useState({
    message: '',
    userName: '',
    type: ''
  });

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

  const router = useRouter();

  // Chart data states
  const [invoiceStatusChartData, setInvoiceStatusChartData] = useState({
    labels: [],
    datasets: []
  });

  const [invoiceAmountChartData, setInvoiceAmountChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const fResponse = await fetch('http://localhost:4000/admin/invoices');
        const nResponse = await fetch('http://localhost:4000/admin/notifications');

        if (fResponse.ok && nResponse.ok) {
          setFacturas(await fResponse.json());
          setNotificaciones(await nResponse.json());
        } else {
          console.error(
            'Error fetching data:',
            fResponse.ok ? '' : 'Invoices fetch failed',
            nResponse.ok ? '' : 'Notifications fetch failed'
          );
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (facturas.length > 0) {
      const filtered = facturas.filter(factura => {
        if (
          invoiceFilters.invoiceNumber &&
          !factura.invoice_number.toLowerCase().includes(invoiceFilters.invoiceNumber.toLowerCase())
        ) {
          return false;
        }

        if (
          invoiceFilters.userName &&
          !factura.user_name.toLowerCase().includes(invoiceFilters.userName.toLowerCase())
        ) {
          return false;
        }

        if (invoiceFilters.status && factura.invoice_status !== invoiceFilters.status) {
          return false;
        }

        if (invoiceFilters.fromDate) {
          const fromDate = new Date(invoiceFilters.fromDate);
          const issueDate = new Date(factura.issue_date);
          if (issueDate < fromDate) {
            return false;
          }
        }

        if (invoiceFilters.toDate) {
          const toDate = new Date(invoiceFilters.toDate);
          const issueDate = new Date(factura.issue_date);
          if (issueDate > toDate) {
            return false;
          }
        }

        return true;
      });

      setFilteredFacturas(filtered);
    }
  }, [facturas, invoiceFilters]);

  useEffect(() => {
    if (notificaciones.length > 0) {
      const filtered = notificaciones.filter(notif => {
        if (
          notificationFilters.message &&
          !notif.message.toLowerCase().includes(notificationFilters.message.toLowerCase())
        ) {
          return false;
        }

        if (
          notificationFilters.userName &&
          !notif.user_name.toLowerCase().includes(notificationFilters.userName.toLowerCase())
        ) {
          return false;
        }

        if (notificationFilters.type && notif.type !== notificationFilters.type) {
          return false;
        }

        return true;
      });

      setFilteredNotificaciones(filtered);
    }
  }, [notificaciones, notificationFilters]);

  // Add a new useEffect to prepare chart data when facturas changes
  useEffect(() => {
    if (facturas.length > 0) {
      // Prepare data for invoice status pie chart
      const statusCounts = facturas.reduce((acc, factura) => {
        const status = factura.invoice_status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusLabels = Object.keys(statusCounts);
      const statusData = Object.values(statusCounts);

      // Colors for each status type
      const statusColors = statusLabels.map(status => {
        if (status === 'radicada') return theme.colors.status.success;
        if (status === 'pendiente' || status === 'devuelta') return theme.colors.status.warning;
        if (status === 'vencida') return theme.colors.status.error;
        return theme.colors.primary.main;
      });

      setInvoiceStatusChartData({
        labels: statusLabels,
        datasets: [
          {
            data: statusData,
            backgroundColor: statusColors,
            borderColor: statusColors.map(color => `${color}88`),
            borderWidth: 1,
          },
        ],
      });

      // Prepare data for invoice amount bar chart (top 5 users by total amount)
      const userTotals = facturas.reduce((acc, factura) => {
        const userName = factura.user_name;
        acc[userName] = (acc[userName] || 0) + Number(factura.total_amount);
        return acc;
      }, {});

      // Sort users by total amount and get top 5
      const sortedUsers = Object.entries(userTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const userLabels = sortedUsers.map(entry => entry[0]);
      const userData = sortedUsers.map(entry => entry[1]);

      setInvoiceAmountChartData({
        labels: userLabels,
        datasets: [
          {
            label: 'Total por Usuario',
            data: userData,
            backgroundColor: theme.colors.primary.main,
            borderColor: theme.colors.primary.dark,
            borderWidth: 1,
          },
        ],
      });
    }
  }, [facturas]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async e => {
    e.preventDefault();

    try {
      const res = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      const data = await res.json();

      if (res.ok) {
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

        setTimeout(() => {
          setRegisterMessage({ text: '', isError: false });
          setShowRegisterForm(false);
        }, 3000);
      } else {
        setRegisterMessage({ text: data.message || 'Error al registrar usuario', isError: true });
      }
    } catch (error) {
      console.error('Error registering user:', error);
      setRegisterMessage({ text: 'Error de conexión', isError: true });
    }
  };

  const handleInvoiceFilterChange = e => {
    const { name, value } = e.target;
    setInvoiceFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationFilterChange = e => {
    const { name, value } = e.target;
    setNotificationFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetInvoiceFilters = () => {
    setInvoiceFilters({
      invoiceNumber: '',
      userName: '',
      status: '',
      fromDate: '',
      toDate: ''
    });
  };

  const resetNotificationFilters = () => {
    setNotificationFilters({
      message: '',
      userName: '',
      type: ''
    });
  };

  const formatDate = dateObj => {
    if (!dateObj) return 'N/A';
    try {
      return new Date(dateObj).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  };

  // Add a helper function to format currency values with thousands separators
  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CO', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  const getStatusColor = status => {
    if (status === 'radicada') {
      return theme.colors.status.success;
    } else if (status === 'pendiente' || status === 'devuelta') {
      return theme.colors.status.warning;
    } else if (status === 'vencida') {
      return theme.colors.status.error;
    } else {
      return theme.colors.text.secondary;
    }
  };

  const exportInvoicesToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Facturas', 14, 22);

    doc.setFontSize(10);
    doc.text('Número', 10, 30);
    doc.text('Usuario', 35, 30);
    doc.text('Monto', 70, 30);
    doc.text('Estado', 95, 30);
    doc.text('Fecha Emisión', 130, 30);
    doc.text('Fecha Vencimiento', 170, 30);

    facturas.forEach((factura, index) => {
      const y = 40 + index * 10;
      doc.text(`#${factura.invoice_number}`, 10, y);
      doc.text(factura.user_name, 35, y);
      doc.text(`$${formatCurrency(factura.total_amount)}`, 70, y);

      const statusColor = getStatusColor(factura.invoice_status);
      if (statusColor === theme.colors.status.success) {
        doc.setTextColor(0, 128, 0);
      } else if (statusColor === theme.colors.status.warning) {
        doc.setTextColor(255, 165, 0);
      } else if (statusColor === theme.colors.status.error) {
        doc.setTextColor(255, 0, 0);
      } else {
        doc.setTextColor(0, 0, 0);
      }

      doc.text(factura.invoice_status, 95, y);
      doc.setTextColor(0, 0, 0);

      doc.text(formatDate(factura.issue_date), 130, y);
      doc.text(formatDate(factura.due_date), 170, y);
    });

    doc.save('facturas.pdf');
  };

  const exportInvoicesToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(facturas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, 'facturas.xlsx');
  };

  const exportNotificationsToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Notificaciones', 14, 22);

    doc.setFontSize(12);
    doc.text('Mensaje', 20, 30);
    doc.text('Usuario', 100, 30);
    doc.text('Tipo', 140, 30);
    doc.text('Fecha', 180, 30);

    notificaciones.forEach((notif, index) => {
      const y = 40 + index * 10;
      doc.text(notif.message.substring(0, 50), 20, y);
      doc.text(notif.user_name, 100, y);
      doc.text(notif.type, 140, y);
      const date = formatDate(notif.sent_date);
      doc.text(date, 180, y);
    });

    doc.save('notificaciones.pdf');
  };

  const exportNotificationsToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(notificaciones);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Notificaciones');
    XLSX.writeFile(workbook, 'notificaciones.xlsx');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('id_user');

    router.push('/login');
  };

console.log('filteredFacturas', filteredFacturas);
console.log('filteredNotificaciones', filteredNotificaciones);

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar fixed top-0 left-0 flex flex-col items-center py-8 h-screen w-20 z-30 bg-[#27aae1]">
        <div className='flex flex-col items-center space-y-8 flex-1 w-full'>
          <button
            className="hover:bg-white/10 p-3 rounded-lg transition"
            title="Menú principal"
            onClick={() => {document.getElementById('notificaciones-section')?.scrollIntoView({ behavior: 'smooth' });}}
          >
            <FaHome size={26} color="#fff" />
          </button>
          <button
            className="hover:bg-white/10 p-3 rounded-lg transition"
            title="Notificaciones"
            onClick={() => {document.getElementById('notificaciones-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <FaBell size={26} color="#fff" />
          </button>
          <button
            className="hover:bg-white/10 p-3 rounded-lg transition"
            title="Registrar usuario"
            onClick={() => setShowRegisterForm(!showRegisterForm)}
          >
            <FaUserPlus size={26} color="#fff" />
          </button>
        </div>
        <button
          className="hover:bg-white/10 p-3 rounded-lg transition"
          title="Cerrar sesión"
          onClick={handleLogout}
        >
          <FaSignOutAlt size={26} color="#fff" />
        </button>
      </aside>
      <main className='dashboard-main ml-20'>
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard Admin</h1>
        </div>

        {showRegisterForm && (
          <div className="dashboard-card" style={{ marginBottom: 32 }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
              Registrar Nuevo Usuario
            </h2>

            {registerMessage.text && (
              <div
                className="mb-4 p-3 rounded text-center"
                style={{
                  backgroundColor: registerMessage.isError
                    ? theme.colors.status.error
                    : theme.colors.status.success,
                  color: theme.colors.text.white
                }}
              >
                {registerMessage.text}
              </div>
            )}

            <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Nombre
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Apellido
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Email
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Nombre de Usuario
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Contraseña
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Documento
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Celular
                </label>
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
                <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                  Rol
                </label>
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

              <div className="md:col-span-2 mt-4 flex justify-end space-x-4"> 
                 <button
                  type="button"
                  className="px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: theme.colors.background.default,
                    color: theme.colors.text.primary,
                    border: `1px solid ${theme.colors.border.main}`
                  }}
                  onClick={() => setShowRegisterForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-medium"
                  style={{
                    backgroundColor: theme.colors.secondary.main,
                    color: theme.colors.secondary.contrast
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.hover)}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.main)}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
            Dashboard Estadístico
          </h2>

          <div className="dashboard-cards">
            <div className="dashboard-card chart">
              <h3 className="text-lg font-medium mb-4 text-center" style={{ color: theme.colors.text.primary }}>
                Distribución de Estados de Facturas
              </h3>
              <div style={{ height: '300px' }}>
                {invoiceStatusChartData.labels.length > 0 ? (
                  <Pie
                    data={invoiceStatusChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ color: theme.colors.text.secondary }}>
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card chart">
              <h3 className="text-lg font-medium mb-4 text-center" style={{ color: theme.colors.text.primary }}>
                Top 5 Usuarios por Monto Total
              </h3>
              <div style={{ height: '300px' }}>
                {invoiceAmountChartData.labels.length > 0 ? (
                  <Bar
                    data={invoiceAmountChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '$' + formatCurrency(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ color: theme.colors.text.secondary }}>
                    No hay datos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
              Todas las Facturas
            </h2>
            <div className='space-x-4' >
              <button
                className="dashboard-btn"
                style={{background: theme.colors.secondary.main, color: theme.colors.secondary.contrast }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.hover)}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.main)}
                onClick={exportInvoicesToExcel}
              >
                Exportar Excel
              </button>
              <button
                className="dashboard-btn"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
                onClick={exportInvoicesToPDF}
              >
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="dashboard-card" style={{ marginBottom: 24 }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium" style={{ color: theme.colors.text.primary }}>
                Filtros
              </h3>
              <button
                className="text-sm px-2 py-1 rounded"
                style={{
                  backgroundColor: theme.colors.background.default,
                  color: theme.colors.text.secondary
                }}
                onClick={resetInvoiceFilters}
              >
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Número de factura
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoiceFilters.invoiceNumber}
                  onChange={handleInvoiceFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                  placeholder="Ej: INV001"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Usuario
                </label>
                <input
                  type="text"
                  name="userName"
                  value={invoiceFilters.userName}
                  onChange={handleInvoiceFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Estado
                </label>
                <select
                  name="status"
                  value={invoiceFilters.status}
                  onChange={handleInvoiceFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                >
                  <option value="">Todos</option>
                  <option value="radicada">Radicada</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="devuelta">Devuelta</option>
                  <option value="vencida">Vencida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Desde
                </label>
                <input
                  type="date"
                  name="fromDate"
                  value={invoiceFilters.fromDate}
                  onChange={handleInvoiceFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Hasta
                </label>
                <input
                  type="date"
                  name="toDate"
                  value={invoiceFilters.toDate}
                  onChange={handleInvoiceFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                />
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                  <th className="py-3 px-4 text-left">Número</th>
                  <th className="py-3 px-4 text-left">Usuario</th>
                  <th className="py-3 px-4 text-left">Monto</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Fecha Emisión</th>
                  <th className="py-3 px-4 text-left">Fecha Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.length > 0 ? (
                  filteredFacturas.map((f, index) => (
                    <tr
                      key={f.id_invoice}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? theme.colors.background.card : theme.colors.background.default
                      }}
                    >
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        #{f.invoice_number}
                      </td>
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        {f.user_name}
                      </td>
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        ${formatCurrency(f.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor: getStatusColor(f.invoice_status),
                            color: theme.colors.text.white
                          }}
                        >
                          {f.invoice_status}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        {formatDate(f.issue_date)}
                      </td>
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        {formatDate(f.due_date)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-4 px-4 text-center"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {facturas.length > 0
                        ? 'No hay resultados para los filtros aplicados'
                        : 'No hay facturas disponibles'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="notificaciones-section">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
              Todas las Notificaciones
            </h2>
            <div className='space-x-4'>
              <button
                className="dashboard-btn"
                style={{
                  backgroundColor: theme.colors.secondary.main,
                  color: theme.colors.secondary.contrast
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.hover)}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.main)}
                onClick={exportNotificationsToExcel}
              >
                Exportar Excel
              </button>
              <button
                className="dashboard-btn"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = theme.colors.primary.hover)}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = theme.colors.primary.main)}
                onClick={exportNotificationsToPDF}
              >
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="dashboard-card" style={{ marginBottom: 24 }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium" style={{ color: theme.colors.text.primary }}>
                Filtros
              </h3>
              <button
                className="text-sm px-2 py-1 rounded"
                style={{
                  backgroundColor: theme.colors.background.default,
                  color: theme.colors.text.secondary
                }}
                onClick={resetNotificationFilters}
              >
                Limpiar filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Mensaje
                </label>
                <input
                  type="text"
                  name="message"
                  value={notificationFilters.message}
                  onChange={handleNotificationFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                  placeholder="Buscar en mensaje"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Usuario
                </label>
                <input
                  type="text"
                  name="userName"
                  value={notificationFilters.userName}
                  onChange={handleNotificationFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: theme.colors.text.secondary }}>
                  Tipo
                </label>
                <select
                  name="type"
                  value={notificationFilters.type}
                  onChange={handleNotificationFilterChange}
                  className="w-full p-2 border rounded text-sm"
                  style={{ borderColor: theme.colors.border.main }}
                >
                  <option value="">Todos</option>
                  <option value="info">Info</option>
                  <option value="alerta">Alerta</option>
                </select>
              </div>
            </div>
          </div>

          <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                  <th className="py-3 px-4 text-left">Mensaje</th>
                  <th className="py-3 px-4 text-left">Usuario</th>
                  <th className="py-3 px-4 text-left">Tipo</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotificaciones.length > 0 ? (
                  filteredNotificaciones.map((n, index) => (
                    <tr
                      key={n.id_notification}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? theme.colors.background.card : theme.colors.background.default
                      }}
                    >
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        {n.message}
                      </td>
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        {n.user_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            backgroundColor:
                              n.type === 'info'
                                ? theme.colors.status.info
                                : n.type === 'warning'
                                ? theme.colors.status.warning
                                : theme.colors.status.error,
                            color: theme.colors.text.white
                          }}
                        >
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
                      {notificaciones.length > 0
                        ? 'No hay resultados para los filtros aplicados'
                        : 'No hay notificaciones disponibles'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
