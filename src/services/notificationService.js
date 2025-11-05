import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Crea una nueva notificación
 * @param {Object} notificationData - Datos de la notificación
 * @param {boolean} notificationData.is_read - Si la notificación ha sido leída
 * @param {string} notificationData.message - Mensaje de la notificación
 * @param {Date|string} notificationData.sent_date - Fecha de envío
 * @param {string} notificationData.type - Tipo de notificación (ej: 'info', 'warning', 'success', 'error')
 * @returns {Promise<string>} ID del documento creado
 */
export const createNotification = async (notificationData) => {
  try {
    const colRef = collection(db, COLLECTIONS.NOTIFICATION);
    const docRef = await addDoc(colRef, {
      is_read: notificationData.is_read || false,
      message: notificationData.message,
      sent_date: notificationData.sent_date || new Date(),
      type: notificationData.type
    });
    console.log('Notificación creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

/**
 * Obtiene una notificación por su ID
 * @param {string} notificationId - ID del documento
 * @returns {Promise<Object|null>} Datos de la notificación o null si no existe
 */
export const getNotificationById = async (notificationId) => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATION, notificationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No se encontró la notificación');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener notificación:', error);
    throw error;
  }
};

/**
 * Obtiene todas las notificaciones
 * @returns {Promise<Array>} Array de notificaciones
 */
export const getAllNotifications = async () => {
  try {
    const colRef = collection(db, COLLECTIONS.NOTIFICATION);
    const querySnapshot = await getDocs(colRef);

    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return notifications;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

/**
 * Obtiene notificaciones no leídas
 * @returns {Promise<Array>} Array de notificaciones no leídas
 */
export const getUnreadNotifications = async () => {
  try {
    const colRef = collection(db, COLLECTIONS.NOTIFICATION);
    const q = query(colRef, where('is_read', '==', false));
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return notifications;
  } catch (error) {
    console.error('Error al obtener notificaciones no leídas:', error);
    throw error;
  }
};

/**
 * Obtiene notificaciones por tipo
 * @param {string} type - Tipo de notificación (ej: 'info', 'warning', 'success', 'error')
 * @returns {Promise<Array>} Array de notificaciones que coinciden
 */
export const getNotificationsByType = async (type) => {
  try {
    const colRef = collection(db, COLLECTIONS.NOTIFICATION);
    const q = query(colRef, where('type', '==', type));
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return notifications;
  } catch (error) {
    console.error('Error al buscar notificaciones por tipo:', error);
    throw error;
  }
};

/**
 * Obtiene notificaciones ordenadas por fecha de envío
 * @param {boolean} ascending - Si es true ordena ascendente, si es false descendente
 * @returns {Promise<Array>} Array de notificaciones ordenadas
 */
export const getNotificationsSortedByDate = async (ascending = false) => {
  try {
    const colRef = collection(db, COLLECTIONS.NOTIFICATION);
    const q = query(colRef, orderBy('sent_date', ascending ? 'asc' : 'desc'));
    const querySnapshot = await getDocs(q);

    const notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return notifications;
  } catch (error) {
    console.error('Error al obtener notificaciones ordenadas:', error);
    throw error;
  }
};

/**
 * Actualiza una notificación existente
 * @param {string} notificationId - ID del documento a actualizar
 * @param {Object} notificationData - Datos a actualizar (solo los campos que se modifican)
 * @returns {Promise<void>}
 */
export const updateNotification = async (notificationId, notificationData) => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATION, notificationId);
    await updateDoc(docRef, notificationData);
    console.log('Notificación actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar notificación:', error);
    throw error;
  }
};

/**
 * Marca una notificación como leída
 * @param {string} notificationId - ID del documento
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATION, notificationId);
    await updateDoc(docRef, { is_read: true });
    console.log('Notificación marcada como leída');
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

/**
 * Marca todas las notificaciones como leídas
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const unreadNotifications = await getUnreadNotifications();

    const updatePromises = unreadNotifications.map(notification =>
      markNotificationAsRead(notification.id)
    );

    await Promise.all(updatePromises);
    console.log('Todas las notificaciones marcadas como leídas');
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    throw error;
  }
};

/**
 * Elimina una notificación
 * @param {string} notificationId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATION, notificationId);
    await deleteDoc(docRef);
    console.log('Notificación eliminada correctamente');
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

/**
 * Elimina todas las notificaciones leídas
 * @returns {Promise<void>}
 */
export const deleteReadNotifications = async () => {
  try {
    const colRef = collection(db, COLLECTIONS.NOTIFICATION);
    const q = query(colRef, where('is_read', '==', true));
    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map(doc =>
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
    console.log('Todas las notificaciones leídas eliminadas');
  } catch (error) {
    console.error('Error al eliminar notificaciones leídas:', error);
    throw error;
  }
};

/**
 * Genera notificaciones automáticas basadas en facturas del usuario
 * Solo genera para facturas que NO están radicadas
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Array de notificaciones generadas
 */
export const generateUserNotifications = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche

    // Obtener todas las facturas del usuario que NO están radicadas
    const invoicesRef = collection(db, COLLECTIONS.INVOICE);
    const q = query(invoicesRef, where('user_id', '==', userId));
    const invoicesSnapshot = await getDocs(q);

    const generatedNotifications = [];

    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoice = { id: invoiceDoc.id, ...invoiceDoc.data() };

      // Saltar facturas radicadas
      if (invoice.invoice_status === 'radicada') {
        continue;
      }

      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0); // Normalizar a medianoche

      const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

      // Generar notificaciones para facturas dentro del plazo de radicación (22 días) o vencidas
      if (daysUntilDue >= -15 && daysUntilDue <= 22) {
        // Verificar si ya existe una notificación para esta factura hoy
        // Usamos una consulta simple y filtramos en memoria para evitar necesitar índices compuestos
        const notificationsRef = collection(db, COLLECTIONS.NOTIFICATION);
        const existingNotifQuery = query(
          notificationsRef,
          where('user_id', '==', userId),
          where('invoice_id', '==', invoice.id)
        );

        const existingNotifSnapshot = await getDocs(existingNotifQuery);

        // Filtrar en memoria por fecha de hoy
        const todayStart = new Date(today);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const existsToday = existingNotifSnapshot.docs.some(doc => {
          const notifDate = new Date(doc.data().sent_date);
          return notifDate >= todayStart && notifDate <= todayEnd;
        });

        // Si ya existe una notificación para esta factura hoy, no crear otra
        if (existsToday) {
          console.log(`Notificación ya existe para factura ${invoice.invoice_number}`);
          continue;
        }

        // Generar mensaje según días faltantes
        // Plazo de radicación: 22 días
        // Normal (info): 22 a 8 días
        // Crítica (alerta): 7 a 0 días y vencidas
        let message;
        let type;

        if (daysUntilDue < 0) {
          message = `La factura ${invoice.invoice_number} está vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`;
          type = 'alerta';
        } else if (daysUntilDue === 0) {
          message = `La factura ${invoice.invoice_number} vence hoy - ¡URGENTE!`;
          type = 'alerta';
        } else if (daysUntilDue <= 7) {
          message = `La factura ${invoice.invoice_number} vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''} - Crítica`;
          type = 'alerta';
        } else if (daysUntilDue <= 22) {
          message = `La factura ${invoice.invoice_number} vence en ${daysUntilDue} día${daysUntilDue !== 1 ? 's' : ''}`;
          type = 'info';
        }

        // Crear la notificación
        const notificationData = {
          user_id: userId,
          invoice_id: invoice.id,
          message: message,
          type: type,
          is_read: false,
          sent_date: new Date().toISOString()
        };

        const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATION), notificationData);
        generatedNotifications.push({ id: docRef.id, ...notificationData });
        console.log(`Notificación creada: ${message}`);
      }
    }

    console.log(`Total de notificaciones generadas para usuario ${userId}: ${generatedNotifications.length}`);
    return generatedNotifications;
  } catch (error) {
    console.error('Error al generar notificaciones automáticas:', error);
    throw error;
  }
};
