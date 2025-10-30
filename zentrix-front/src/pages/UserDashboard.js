import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../styles/theme';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

export default function UserDashboard() {
  const [facturas, setFacturas] = useState([]);
  const [filteredFacturas, setFilteredFacturas] = useState([]);
  const [invoiceFilters, setInvoiceFilters] = useState({
    invoiceNumber: '',
    status: '',
    fromDate: '',
    toDate: ''
  });
  const [alerts, setAlerts] = useState({ urgent: [], normal: [] });
  const [showAlerts, setShowAlerts] = useState(true);
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  const [invoiceStatusChartData, setInvoiceStatusChartData] = useState({
    labels: [],
    datasets: []
  });

  const [invoiceTimelineChartData, setInvoiceTimelineChartData] = useState({
    labels: [],
    datasets: []
  });

   useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (storedEmail) setUserName(storedEmail);
  }, []);

  useEffect(() => {
    const id_user = localStorage.getItem('id_user');

    const storedAlerts = localStorage.getItem('invoiceAlerts');
    if (storedAlerts) {
      try {
        setAlerts(JSON.parse(storedAlerts));
      } catch (e) {
        console.error('Error parsing invoice alerts:', e);
      }
    }

    localStorage.removeItem('invoiceAlerts');

    async function fetchData() {
      const f = await fetch(`http://localhost:4000/invoices/${id_user}`);
      setFacturas(await f.json());
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (facturas.length > 0) {
      const filtered = facturas.filter(factura => {
        if (invoiceFilters.invoiceNumber &&
            !factura.invoice_number.toLowerCase().includes(invoiceFilters.invoiceNumber.toLowerCase())) {
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
    if (facturas.length > 0) {
      const statusCounts = facturas.reduce((acc, factura) => {
        const status = factura.invoice_status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusLabels = Object.keys(statusCounts);
      const statusData = Object.values(statusCounts);

      const statusColors = statusLabels.map(status => {
        if (status === 'radicada') return theme.colors.status.success;
        if (status === 'pendiente' || status === 'devuelta') return theme.colors.status.warning;
        if (status === 'vencida') return theme.colors.status.error;
        return theme.colors.primary.light
      });

      setInvoiceStatusChartData({
        labels: statusLabels,
        datasets: [
          {
            data: statusData,
            backgroundColor: statusColors,
            borderColor: statusColors.map(color =>color),
            borderWidth: 2
          },
        ],
      });

      const sortedInvoices = [...facturas].sort((a, b) =>
        new Date(a.issue_date) - new Date(b.issue_date)
      );

      const dates = sortedInvoices.map(invoice => formatDate(invoice.issue_date));
      const amounts = sortedInvoices.map(invoice => invoice.total_amount);

      setInvoiceTimelineChartData({
        labels: dates,
        datasets: [
          {
            label: 'Monto de Factura',
            data: amounts,
            fill: false,
            borderColor: '#e5e7eb',
            backgroundColor: '#e5e7eb',
            pointBackgroundColor: '#e5e7eb',
            pointBorderColor: '#e5e7eb',
            tension: 0.1
          }
        ]
      });
    }
  }, [facturas]);

  function formatDate(dateObj) {
    if (!dateObj) return 'N/A';
    try {
      return new Date(dateObj).toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  }

  function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function getStatusColor(status) {
    if (status === 'radicada') {
      return theme.colors.status.success;
    } else if (status === 'pendiente' || status === 'devuelta') {
      return theme.colors.status.warning;
    } else if (status === 'vencida') {
      return theme.colors.status.error;
    } else {
      return theme.colors.primary.light
    }
  }

  const handleInvoiceFilterChange = (e) => {
    const { name, value } = e.target;
    setInvoiceFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetInvoiceFilters = () => {
    setInvoiceFilters({
      invoiceNumber: '',
      status: '',
      fromDate: '',
      toDate: ''
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('id_user');
    localStorage.removeItem('invoiceAlerts');

    navigate('/login');
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Mis Facturas', 14, 22);

    doc.setFontSize(12);
    doc.text('Número', 15, 30);
    doc.text('Monto', 45, 30);
    doc.text('Estado', 75, 30);
    doc.text('Fecha Emisión', 115, 30);
    doc.text('Fecha Vencimiento', 170, 30);

    facturas.forEach((factura, index) => {
      const y = 40 + (index * 10);
      doc.text(`#${factura.invoice_number}`, 15, y);
      doc.text(`$${formatCurrency(factura.total_amount)}`, 45, y);

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

      doc.text(factura.invoice_status, 75, y);
      doc.setTextColor(0, 0, 0);

      doc.text(formatDate(factura.issue_date), 115, y);
      doc.text(formatDate(factura.due_date), 170, y);
    });

    doc.save('mis_facturas.pdf');
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(facturas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, 'mis_facturas.xlsx');
  };

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
        <div className="dashboard-header flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>Dashboard Usuario</h1>
          <div className="text-base font-medium mb-4" style={{ color: theme.colors.text.primary }}>
            {userName && <>👤 {userName}</>}
          </div>
        </div>

        {showAlerts && (alerts.urgent.length > 0 || alerts.normal.length > 0) && (
          <div className="mb-8 rounded-lg shadow-md overflow-hidden">
            <div className="flex justify-between items-center bg-gray-50 p-4 border-b">
              <h2 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
                Alertas de Facturas ({alerts.urgent.length + alerts.normal.length})
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowAlerts(false)}
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="divide-y">
              {alerts.urgent.map((alert, index) => (
                <div
                  key={`urgent-${index}`}
                  className="p-4 flex items-center"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-3"
                    style={{ backgroundColor: theme.colors.status.error }}
                  ></div>
                  <div>
                    <p className="font-semibold" style={{ color: theme.colors.status.error }}>
                      {alert.message}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      Vencimiento: {formatDate(alert.due_date)}
                    </p>
                  </div>
                </div>
              ))}

              {alerts.normal.map((alert, index) => (
                <div
                  key={`normal-${index}`}
                  className="p-4 flex items-center"
                  style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-3"
                    style={{ backgroundColor: theme.colors.status.warning }}
                  ></div>
                  <div>
                    <p className="font-semibold" style={{ color: theme.colors.status.warning }}>
                      {alert.message}
                    </p>
                    <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                      Vencimiento: {formatDate(alert.due_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
            Mi Dashboard
          </h2>

          <div className="dashboard-cards">
            <div className="dashboard-card chart">
              <h3 className="text-lg font-medium mb-4 text-center" style={{ color: theme.colors.text.primary }}>
                Distribución de Estados de Mis Facturas
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
                Historial de Facturas por Fecha
              </h3>
              <div style={{ height: '300px' }}>
                {invoiceTimelineChartData.labels.length > 0 ? (
                  <Line
                    data={invoiceTimelineChartData}
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

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>Mis Facturas</h2>
            <div className="space-x-4">
              <button
                className="dashboard-btn"
                style={{
                  backgroundColor: theme.colors.secondary.main,
                  color: theme.colors.secondary.contrast
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.hover}
                onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.secondary.main}
                onClick={exportExcel}
              >
                Exportar Excel
              </button>
              <button
                className="dashboard-btn"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color: theme.colors.primary.contrast
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = theme.colors.primary.hover}
                onMouseOut={e => e.currentTarget.style.backgroundColor = theme.colors.primary.main}
                onClick={exportPDF}
              >
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="dashboard-card" style={{ marginBottom: 24 }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium" style={{ color: theme.colors.text.primary }}>Filtros</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="dashboard-table-container" >
            <table className="dashboard-table">
              <thead>
                <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                  <th className="py-3 px-4 text-left">Número</th>
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
                        backgroundColor: index % 2 === 0
                          ? theme.colors.background.card
                          : theme.colors.background.default
                      }}
                    >
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>#{f.invoice_number}</td>
                      <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                        ${formatCurrency(f.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs" style={{
                          backgroundColor: getStatusColor(f.invoice_status),
                          color: theme.colors.text.white
                        }}>
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
                      colSpan="5"
                      className="py-4 px-4 text-center"
                      style={{ color: theme.colors.text.secondary }}
                    >
                      {facturas.length > 0 ? 'No hay resultados para los filtros aplicados' : 'No hay facturas disponibles'}
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
