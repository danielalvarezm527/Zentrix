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
