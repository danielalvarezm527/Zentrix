import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../styles/theme';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { FaHome, FaBell, FaUserPlus, FaSignOutAlt, FaSeedling, FaUsers } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, deleteUser, signOut } from 'firebase/auth';
import { doc, setDoc, query, where, collection, getDocs } from 'firebase/firestore';
import { saveUserData, getAllUsers, updateUser, toggleUserStatus } from '../services/userService';
import { COLLECTIONS } from '../services/constants';
import { seedAllData } from '../utils/seedData';

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
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState({ text: '', isError: false });

  // Estados para gestión de usuarios
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [editMessage, setEditMessage] = useState({ text: '', isError: false });
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();

  const [invoiceStatusChartData, setInvoiceStatusChartData] = useState({
    labels: [],
    datasets: []
  });

  const [invoiceAmountChartData, setInvoiceAmountChartData] = useState({
    labels: [],
    datasets: []
  });

  // Cargar usuarios cuando se active la gestión de usuarios
  useEffect(() => {
    if (showUserManagement) {
      loadUsers();
    }
  }, [showUserManagement]);

  // Cargar facturas y notificaciones desde Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar todos los usuarios primero para hacer el mapping
        const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const usersMap = {};
        usersSnapshot.docs.forEach(doc => {
          const userData = doc.data();
          usersMap[doc.id] = `${userData.nombre} ${userData.apellido}`;
        });
        console.log('Usuarios cargados:', Object.keys(usersMap).length);

        // Cargar facturas y agregar el nombre del usuario
        const invoicesSnapshot = await getDocs(collection(db, COLLECTIONS.INVOICE));
        const invoicesData = invoicesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            id_invoice: doc.id,
            ...data,
            user_name: usersMap[data.user_id] || 'Usuario desconocido'
          };
        });
        setFacturas(invoicesData);
        setFilteredFacturas(invoicesData);
        console.log('Facturas cargadas:', invoicesData.length);

        // Cargar notificaciones y agregar el nombre del usuario
        const notificationsSnapshot = await getDocs(collection(db, COLLECTIONS.NOTIFICATION));
        const notificationsData = notificationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            id_notification: doc.id,
            ...data,
            user_name: usersMap[data.user_id] || 'Usuario desconocido'
          };
        });
        setNotificaciones(notificationsData);
        setFilteredNotificaciones(notificationsData);
        console.log('Notificaciones cargadas:', notificationsData.length);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    loadData();
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

      const userTotals = facturas.reduce((acc, factura) => {
        const userName = factura.user_name;
        acc[userName] = (acc[userName] || 0) + Number(factura.total_amount);
        return acc;
      }, {});

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
    setIsRegistering(true);
    setRegisterMessage({ text: '', isError: false });

    let userCredential = null;

    try {
      // Validar que el username no esté duplicado
      const usernameQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('username', '==', registerData.username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        setRegisterMessage({ text: 'El nombre de usuario ya está en uso', isError: true });
        setIsRegistering(false);
        return;
      }

      // Validar que el documento no esté duplicado
      const documentoQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('documento', '==', registerData.documento)
      );
      const documentoSnapshot = await getDocs(documentoQuery);

      if (!documentoSnapshot.empty) {
        setRegisterMessage({ text: 'El número de documento ya está registrado', isError: true });
        setIsRegistering(false);
        return;
      }

      // Crear usuario en Firebase Authentication
      userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );

      const user = userCredential.user;
      console.log('Usuario registrado en Firebase Auth:', user.uid);

      try {
        // Guardar datos adicionales del usuario en Firestore usando el servicio
        const userData = {
          email: registerData.email,
          nombre: registerData.nombre,
          apellido: registerData.apellido,
          documento: registerData.documento,
          celular: registerData.celular,
          username: registerData.username,
          rol: registerData.rol,
          isActive: true, // Usuario activo por defecto
          createdAt: new Date().toISOString()
        };

        console.log('Intentando guardar en Firestore:', userData);
        await saveUserData(user.uid, userData);
        console.log('Datos guardados exitosamente en Firestore');

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

        setIsRegistering(false);

        setTimeout(() => {
          setRegisterMessage({ text: '', isError: false });
          setShowRegisterForm(false);
        }, 3000);

      } catch (firestoreError) {
        console.error('Error al guardar en Firestore:', firestoreError);

        // ROLLBACK: Eliminar usuario de Firebase Auth si falla Firestore
        try {
          console.log('Ejecutando rollback: eliminando usuario de Firebase Auth...');
          await deleteUser(user);
          console.log('Usuario eliminado de Firebase Auth exitosamente');
          setRegisterMessage({
            text: 'Error al guardar datos del usuario. El registro ha sido cancelado. Verifica las reglas de Firestore.',
            isError: true
          });
        } catch (deleteError) {
          console.error('Error al eliminar usuario durante rollback:', deleteError);
          setRegisterMessage({
            text: 'Error crítico: Usuario creado en Auth pero sin datos en Firestore. Contacta al administrador del sistema.',
            isError: true
          });
        }

        setIsRegistering(false);
      }

    } catch (error) {
      console.error('Error al registrar usuario:', error);
      setIsRegistering(false);
      let errorMessage = 'Error al registrar usuario';

      // Mensajes de error específicos de Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El email ya está en uso';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      setRegisterMessage({ text: errorMessage, isError: true });
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('¿Estás seguro de que deseas generar datos de prueba? Esto creará empresas, facturas y notificaciones dummy.')) {
      return;
    }

    setIsSeeding(true);
    setSeedMessage({ text: '', isError: false });

    try {
      const results = await seedAllData();

      setSeedMessage({
        text: `✅ Datos generados: ${results.companies.length} empresas, ${results.invoices.length} facturas, ${results.notifications.length} notificaciones`,
        isError: false
      });

      // Recargar la página después de 3 segundos para mostrar los nuevos datos
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Error al generar datos:', error);
      setSeedMessage({
        text: `❌ Error al generar datos: ${error.message}`,
        isError: true
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Funciones de gestión de usuarios
  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsuarios(allUsers);
      console.log('Usuarios cargados:', allUsers.length);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleEditUser = (user) => {
    setEditUserData({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      documento: user.documento,
      celular: user.celular,
      username: user.username,
      rol: user.rol
    });
    setShowEditForm(true);
    setEditMessage({ text: '', isError: false });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    setEditMessage({ text: '', isError: false });

    try {
      const { id, ...dataToUpdate } = editUserData;
      await updateUser(id, dataToUpdate);

      setEditMessage({ text: 'Usuario actualizado exitosamente', isError: false });

      // Recargar la lista de usuarios
      await loadUsers();

      setTimeout(() => {
        setShowEditForm(false);
        setEditUserData(null);
        setEditMessage({ text: '', isError: false });
      }, 2000);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      setEditMessage({ text: 'Error al actualizar usuario', isError: true });
    } finally {
      setIsEditing(false);
    }
  };

  const handleToggleStatus = async (uid, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'habilitar' : 'inhabilitar';

    if (!window.confirm(`¿Estás seguro de que deseas ${action} este usuario?`)) {
      return;
    }

    try {
      await toggleUserStatus(uid, newStatus);
      setEditMessage({
        text: `Usuario ${newStatus ? 'habilitado' : 'inhabilitado'} exitosamente`,
        isError: false
      });

      // Recargar la lista de usuarios
      await loadUsers();

      setTimeout(() => {
        setEditMessage({ text: '', isError: false });
      }, 3000);
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      setEditMessage({
        text: 'Error al cambiar estado del usuario',
        isError: true
      });
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('id_user');
      console.log('Sesión cerrada exitosamente');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
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
          <button
            className="hover:bg-white/10 p-3 rounded-lg transition"
            title="Gestionar usuarios"
            onClick={() => {
              setShowUserManagement(!showUserManagement);
              setShowRegisterForm(false);
            }}
          >
            <FaUsers size={26} color="#fff" />
          </button>
          <button
            className="hover:bg-white/10 p-3 rounded-lg transition"
            title="Generar datos de prueba"
            onClick={handleSeedData}
            disabled={isSeeding}
            style={{ opacity: isSeeding ? 0.5 : 1 }}
          >
            <FaSeedling size={26} color="#fff" />
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

        {seedMessage.text && (
          <div
            className="mb-4 p-3 rounded text-center"
            style={{
              backgroundColor: seedMessage.isError
                ? theme.colors.status.error
                : theme.colors.status.success,
              color: theme.colors.text.white,
              marginBottom: 16
            }}
          >
            {seedMessage.text}
          </div>
        )}

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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
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
                  disabled={isRegistering}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-medium"
                  disabled={isRegistering}
                  style={{
                    backgroundColor: isRegistering ? '#ccc' : theme.colors.secondary.main,
                    color: theme.colors.secondary.contrast,
                    cursor: isRegistering ? 'not-allowed' : 'pointer',
                    opacity: isRegistering ? 0.7 : 1
                  }}
                  onMouseOver={e => !isRegistering && (e.currentTarget.style.backgroundColor = theme.colors.secondary.hover)}
                  onMouseOut={e => !isRegistering && (e.currentTarget.style.backgroundColor = theme.colors.secondary.main)}
                >
                  {isRegistering ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showUserManagement && (
          <div className="dashboard-card" style={{ marginBottom: 32 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: theme.colors.text.primary }}>
                Gestión de Usuarios
              </h2>
            </div>

            {editMessage.text && (
              <div
                className="mb-4 p-3 rounded text-center"
                style={{
                  backgroundColor: editMessage.isError
                    ? theme.colors.status.error
                    : theme.colors.status.success,
                  color: theme.colors.text.white
                }}
              >
                {editMessage.text}
              </div>
            )}

            {showEditForm && editUserData ? (
              <div className="mb-6 p-4 border rounded" style={{ borderColor: theme.colors.border.main }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: theme.colors.text.primary }}>
                  Editar Usuario
                </h3>
                <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={editUserData.nombre}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
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
                      value={editUserData.apellido}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
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
                      value={editUserData.email}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
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
                      value={editUserData.username}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
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
                      value={editUserData.documento}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
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
                      value={editUserData.celular}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1" style={{ color: theme.colors.text.primary }}>
                      Rol
                    </label>
                    <select
                      name="rol"
                      value={editUserData.rol}
                      onChange={handleEditInputChange}
                      className="w-full p-2 border rounded"
                      style={{ borderColor: theme.colors.border.main }}
                      disabled={isEditing}
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
                      onClick={() => {
                        setShowEditForm(false);
                        setEditUserData(null);
                      }}
                      disabled={isEditing}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded font-medium"
                      disabled={isEditing}
                      style={{
                        backgroundColor: isEditing ? '#ccc' : theme.colors.secondary.main,
                        color: theme.colors.secondary.contrast,
                        cursor: isEditing ? 'not-allowed' : 'pointer',
                        opacity: isEditing ? 0.7 : 1
                      }}
                      onMouseOver={e => !isEditing && (e.currentTarget.style.backgroundColor = theme.colors.secondary.hover)}
                      onMouseOut={e => !isEditing && (e.currentTarget.style.backgroundColor = theme.colors.secondary.main)}
                    >
                      {isEditing ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr style={{ backgroundColor: theme.colors.background.sidebar, color: theme.colors.text.white }}>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Username</th>
                    <th className="py-3 px-4 text-left">Rol</th>
                    <th className="py-3 px-4 text-left">Estado</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length > 0 ? (
                    usuarios.map((user, index) => (
                      <tr
                        key={user.id}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? theme.colors.background.card : theme.colors.background.default
                        }}
                      >
                        <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                          {user.nombre} {user.apellido}
                        </td>
                        <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                          {user.email}
                        </td>
                        <td className="py-3 px-4" style={{ color: theme.colors.text.primary }}>
                          {user.username}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: user.rol === 'Admin' ? theme.colors.primary.main : theme.colors.status.info,
                              color: theme.colors.text.white
                            }}
                          >
                            {user.rol}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: user.isActive !== false ? theme.colors.status.success : theme.colors.status.error,
                              color: theme.colors.text.white
                            }}
                          >
                            {user.isActive !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: theme.colors.secondary.main,
                                color: theme.colors.secondary.contrast
                              }}
                              onClick={() => handleEditUser(user)}
                              onMouseOver={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.hover)}
                              onMouseOut={e => (e.currentTarget.style.backgroundColor = theme.colors.secondary.main)}
                            >
                              Editar
                            </button>
                            <button
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: user.isActive !== false ? theme.colors.status.error : theme.colors.status.success,
                                color: theme.colors.text.white
                              }}
                              onClick={() => handleToggleStatus(user.id, user.isActive !== false)}
                            >
                              {user.isActive !== false ? 'Inhabilitar' : 'Habilitar'}
                            </button>
                          </div>
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
                        No hay usuarios disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
