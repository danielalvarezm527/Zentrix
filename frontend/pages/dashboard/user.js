// frontend/pages/dashboard/user.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function UserDashboard() {
  const [facturas, setFacturas] = useState([]);
  const [alerts, setAlerts] = useState({ urgent: [], normal: [] });
  const [showAlerts, setShowAlerts] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const id_user = localStorage.getItem('id_user');

    // Get alerts from localStorage
    const storedAlerts = localStorage.getItem('invoiceAlerts');
    if (storedAlerts) {
      try {
        setAlerts(JSON.parse(storedAlerts));
      } catch (e) {
        console.error('Error parsing invoice alerts:', e);
      }
    }

    // Clear alerts from localStorage so they only show once per login
    localStorage.removeItem('invoiceAlerts');

    async function fetchData() {
      const f = await fetch(`http://localhost:4000/invoices/${id_user}`);
      setFacturas(await f.json());
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

  // Add this helper function to determine status color
  function getStatusColor(status) {
    if (status === 'radicada') {
      return theme.colors.status.success;
    } else if (status === 'pendiente' || status === 'devuelta') {
      return theme.colors.status.warning;
    } else if (status === 'vencida') {
      return theme.colors.status.error;
    } else {
      // Default case
      return theme.colors.text.secondary;
    }
  }

  // Logout function
  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('id_user');
    localStorage.removeItem('invoiceAlerts');

    // Redirect to login page
    router.push('/login');
  };

  // Function to export table as PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text('Mis Facturas', 14, 22);

    // Table header
    doc.setFontSize(12);
    doc.text('Número', 20, 30);
    doc.text('Monto', 60, 30);
    doc.text('Estado', 100, 30);
    doc.text('Fecha', 140, 30);

    // Table content
    facturas.forEach((factura, index) => {
      const y = 40 + (index * 10);
      doc.text(`#${factura.invoice_number}`, 20, y);
      doc.text(`$${factura.total_amount}`, 60, y);

      // Set text color based on status
      const statusColor = getStatusColor(factura.invoice_status);
      if (statusColor === theme.colors.status.success) {
        doc.setTextColor(0, 128, 0); // Green
      } else if (statusColor === theme.colors.status.warning) {
        doc.setTextColor(255, 165, 0); // Orange
      } else if (statusColor === theme.colors.status.error) {
        doc.setTextColor(255, 0, 0); // Red
      } else {
        doc.setTextColor(0, 0, 0); // Black (default)
      }

      doc.text(factura.invoice_status, 100, y);
      doc.setTextColor(0, 0, 0); // Reset to black

      const date = formatDate(factura.issue_date || factura.due_date);
      doc.text(date, 140, y);
    });

    doc.save('mis_facturas.pdf');
  };

  // Function to export table as Excel
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(facturas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, 'mis_facturas.xlsx');
  };

  return (
    <div className="p-8" style={{ backgroundColor: theme.colors.background.default }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: theme.colors.text.primary }}>Dashboard Usuario</h1>
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

      {/* Invoice Alerts Section */}
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

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>Mis Facturas</h2>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 rounded text-sm font-medium"
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
              className="px-3 py-1 rounded text-sm font-medium"
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

        <div className="rounded shadow overflow-hidden" style={{ backgroundColor: theme.colors.background.card }}>
          <table className="min-w-full">
            <thead>
              <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                <th className="py-3 px-4 text-left">Número</th>
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
                    <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>${f.total_amount}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs" style={{ 
                        backgroundColor: getStatusColor(f.invoice_status),
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
                    colSpan="4"
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
    </div>
  );
}
