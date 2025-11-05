import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../services/constants';

// UIDs de usuarios existentes (tipo User)
const USER_UIDS = [
  'dUxMuUoJS8OAYy7eynw0xLJC4Wz1',
  'oWkWKvujVxRmIoye1gV59oaiQvF2'
];

// IDs de empresas ERP existentes
const ERP_COMPANY_IDS = [
  '4Z95mAB3Rez7EHFfPpzG',
  'pRzwVPoKUDdnKhBkzKEX'
];

/**
 * Genera una fecha aleatoria entre dos fechas
 */
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * Selecciona un elemento aleatorio de un array
 */
const randomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Genera un número aleatorio entre min y max
 */
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Genera datos dummy para empresas ERP
 */
export const generateErpCompanies = async (count = 3) => {
  const companies = [
    {
      company_name: 'Saludcoop EPS',
      nit: '800123456-7',
      email: 'contacto@saludcoop.com.co',
      address: 'Calle 100 #15-20, Bogotá'
    },
    {
      company_name: 'Compensar EPS',
      nit: '800234567-8',
      email: 'servicios@compensar.com',
      address: 'Carrera 7 #32-16, Bogotá'
    },
    {
      company_name: 'Nueva EPS',
      nit: '800345678-9',
      email: 'info@nuevaeps.com.co',
      address: 'Avenida Caracas #45-67, Bogotá'
    },
    {
      company_name: 'Sanitas EPS',
      nit: '800456789-0',
      email: 'atencion@sanitas.com.co',
      address: 'Calle 90 #11-12, Bogotá'
    },
    {
      company_name: 'Sura EPS',
      nit: '800567890-1',
      email: 'clientes@sura.com.co',
      address: 'Carrera 43A #1-50, Medellín'
    }
  ];

  const createdCompanies = [];

  for (let i = 0; i < Math.min(count, companies.length); i++) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ERPCOMPANY), companies[i]);
      createdCompanies.push({ id: docRef.id, ...companies[i] });
      console.log(`Empresa ERP creada: ${companies[i].company_name} (${docRef.id})`);
    } catch (error) {
      console.error('Error al crear empresa:', error);
    }
  }

  return createdCompanies;
};

/**
 * Genera datos dummy para facturas
 */
export const generateInvoices = async (count = 20) => {
  const statuses = ['radicada', 'pendiente', 'devuelta', 'vencida'];
  const createdInvoices = [];

  for (let i = 0; i < count; i++) {
    const userId = randomElement(USER_UIDS);
    const erpCompanyId = randomElement(ERP_COMPANY_IDS);

    const today = new Date();
    let issueDate;
    let dueDate;
    let status;

    // Distribuir facturas según el plazo de radicación de 22 días:
    // 30% radicadas (ya procesadas)
    // 35% pendientes normales (vencen en 8-22 días) - Notificaciones info
    // 25% pendientes críticas (vencen en 1-7 días) - Notificaciones alerta
    // 10% vencidas (vencidas hace 1-15 días) - Notificaciones alerta

    const random = Math.random();

    if (random < 0.3) {
      // Radicadas - emisión hace 30-90 días, vencimiento hace 1-30 días
      issueDate = new Date(today.getTime() - randomNumber(30, 90) * 24 * 60 * 60 * 1000);
      dueDate = new Date(today.getTime() - randomNumber(1, 30) * 24 * 60 * 60 * 1000);
      status = 'radicada';
    } else if (random < 0.65) {
      // Pendientes normales - emisión hace 1-15 días, vencen en 8-22 días
      issueDate = new Date(today.getTime() - randomNumber(1, 15) * 24 * 60 * 60 * 1000);
      dueDate = new Date(today.getTime() + randomNumber(8, 22) * 24 * 60 * 60 * 1000);
      status = 'pendiente';
    } else if (random < 0.9) {
      // Pendientes críticas - emisión hace 15-30 días, vencen en 1-7 días
      issueDate = new Date(today.getTime() - randomNumber(15, 30) * 24 * 60 * 60 * 1000);
      dueDate = new Date(today.getTime() + randomNumber(1, 7) * 24 * 60 * 60 * 1000);
      status = Math.random() > 0.5 ? 'pendiente' : 'devuelta';
    } else {
      // Vencidas - emisión hace 30-60 días, vencidas hace 1-15 días
      issueDate = new Date(today.getTime() - randomNumber(30, 60) * 24 * 60 * 60 * 1000);
      dueDate = new Date(today.getTime() - randomNumber(1, 15) * 24 * 60 * 60 * 1000);
      status = 'vencida';
    }

    const invoiceData = {
      invoice_number: `INV-${String(i + 1).padStart(5, '0')}`,
      user_id: userId,
      erp_company_id: erpCompanyId,
      total_amount: randomNumber(500000, 50000000),
      invoice_status: status,
      issue_date: issueDate.toISOString(),
      due_date: dueDate.toISOString(),
      Invoicecol: `COL-${randomNumber(1000, 9999)}`
    };

    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.INVOICE), invoiceData);
      createdInvoices.push({ id: docRef.id, ...invoiceData });
      console.log(`Factura creada: ${invoiceData.invoice_number} - ${invoiceData.invoice_status}`);
    } catch (error) {
      console.error('Error al crear factura:', error);
    }
  }

  return createdInvoices;
};

/**
 * Genera notificaciones basadas en facturas próximas a vencer
 */
export const generateNotifications = async (invoices = null, count = 15) => {
  const createdNotifications = [];

  // Si no se pasan facturas, generar notificaciones genéricas
  if (!invoices || invoices.length === 0) {
    for (let i = 0; i < count; i++) {
      const userId = randomElement(USER_UIDS);
      const types = ['info', 'alerta'];
      const type = randomElement(types);

      const messages = [
        `La factura INV-${String(randomNumber(1, 100)).padStart(5, '0')} vence en ${randomNumber(1, 10)} días`,
        `Recordatorio: Tienes ${randomNumber(1, 5)} facturas pendientes de revisión`,
        `La factura INV-${String(randomNumber(1, 100)).padStart(5, '0')} ha sido devuelta`,
        `Nueva factura asignada: INV-${String(randomNumber(1, 100)).padStart(5, '0')}`,
        `Factura INV-${String(randomNumber(1, 100)).padStart(5, '0')} próxima a vencer`
      ];

      const notificationData = {
        user_id: userId,
        message: randomElement(messages),
        type: type,
        is_read: Math.random() > 0.3, // 70% leídas, 30% sin leer
        sent_date: randomDate(new Date(2024, 9, 1), new Date()).toISOString()
      };

      try {
        const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATION), notificationData);
        createdNotifications.push({ id: docRef.id, ...notificationData });
        console.log(`Notificación creada: ${notificationData.message}`);
      } catch (error) {
        console.error('Error al crear notificación:', error);
      }
    }
  } else {
    // Generar notificaciones basadas en facturas que están por vencer
    const today = new Date();

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.due_date);
      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

      // Crear notificación si la factura vence en menos de 10 días o ya venció
      if (daysUntilDue >= -5 && daysUntilDue <= 10) {
        let message;
        if (daysUntilDue < 0) {
          message = `La factura ${invoice.invoice_number} está vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;
        } else if (daysUntilDue === 0) {
          message = `La factura ${invoice.invoice_number} vence hoy`;
        } else {
          message = `La factura ${invoice.invoice_number} vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`;
        }

        const notificationData = {
          user_id: invoice.user_id,
          message: message,
          type: daysUntilDue <= 3 ? 'alerta' : 'info',
          is_read: false,
          sent_date: new Date().toISOString(),
          invoice_id: invoice.id
        };

        try {
          const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATION), notificationData);
          createdNotifications.push({ id: docRef.id, ...notificationData });
          console.log(`Notificación creada: ${notificationData.message}`);
        } catch (error) {
          console.error('Error al crear notificación:', error);
        }
      }
    }
  }

  return createdNotifications;
};

/**
 * Función principal para generar todos los datos dummy
 */
export const seedAllData = async () => {
  console.log('🌱 Iniciando seed de datos...');

  const results = {
    companies: [],
    invoices: []
  };

  try {
    // Generar empresas ERP (3 nuevas)
    console.log('\n📦 Generando empresas ERP...');
    results.companies = await generateErpCompanies(3);
    console.log(`✅ ${results.companies.length} empresas ERP creadas`);

    // Generar facturas (20)
    console.log('\n📄 Generando facturas...');
    results.invoices = await generateInvoices(20);
    console.log(`✅ ${results.invoices.length} facturas creadas`);

    // Las notificaciones se generan automáticamente cuando el usuario entra al dashboard
    console.log('\nℹ️  Las notificaciones se generarán automáticamente al iniciar sesión');

    console.log('\n✨ Seed completado exitosamente!');
    console.log('Resumen:');
    console.log(`  - Empresas ERP: ${results.companies.length}`);
    console.log(`  - Facturas: ${results.invoices.length}`);

    return results;
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
};
