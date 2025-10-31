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
 * Crea una nueva factura
 * @param {Object} invoiceData - Datos de la factura
 * @param {string} invoiceData.Invoicecol - ID de la colección de factura
 * @param {Date|string} invoiceData.due_date - Fecha de vencimiento
 * @param {string} invoiceData.invoice_number - Número de factura
 * @param {string} invoiceData.invoice_status - Estado de la factura (ej: 'pending', 'paid', 'overdue')
 * @param {Date|string} invoiceData.issue_date - Fecha de emisión
 * @param {number} invoiceData.total_amount - Monto total
 * @returns {Promise<string>} ID del documento creado
 */
export const createInvoice = async (invoiceData) => {
  try {
    const colRef = collection(db, COLLECTIONS.INVOICE);
    const docRef = await addDoc(colRef, {
      Invoicecol: invoiceData.Invoicecol,
      due_date: invoiceData.due_date,
      invoice_number: invoiceData.invoice_number,
      invoice_status: invoiceData.invoice_status,
      issue_date: invoiceData.issue_date,
      total_amount: invoiceData.total_amount
    });
    console.log('Factura creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;
  }
};

/**
 * Obtiene una factura por su ID
 * @param {string} invoiceId - ID del documento
 * @returns {Promise<Object|null>} Datos de la factura o null si no existe
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICE, invoiceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No se encontró la factura');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener factura:', error);
    throw error;
  }
};

/**
 * Obtiene todas las facturas
 * @returns {Promise<Array>} Array de facturas
 */
export const getAllInvoices = async () => {
  try {
    const colRef = collection(db, COLLECTIONS.INVOICE);
    const querySnapshot = await getDocs(colRef);

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invoices;
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    throw error;
  }
};

/**
 * Busca facturas por número de factura
 * @param {string} invoiceNumber - Número de factura a buscar
 * @returns {Promise<Array>} Array de facturas que coinciden
 */
export const getInvoicesByNumber = async (invoiceNumber) => {
  try {
    const colRef = collection(db, COLLECTIONS.INVOICE);
    const q = query(colRef, where('invoice_number', '==', invoiceNumber));
    const querySnapshot = await getDocs(q);

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invoices;
  } catch (error) {
    console.error('Error al buscar facturas por número:', error);
    throw error;
  }
};

/**
 * Busca facturas por estado
 * @param {string} status - Estado de la factura (ej: 'pending', 'paid', 'overdue')
 * @returns {Promise<Array>} Array de facturas que coinciden
 */
export const getInvoicesByStatus = async (status) => {
  try {
    const colRef = collection(db, COLLECTIONS.INVOICE);
    const q = query(colRef, where('invoice_status', '==', status));
    const querySnapshot = await getDocs(q);

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invoices;
  } catch (error) {
    console.error('Error al buscar facturas por estado:', error);
    throw error;
  }
};

/**
 * Obtiene facturas ordenadas por fecha de emisión
 * @param {boolean} ascending - Si es true ordena ascendente, si es false descendente
 * @returns {Promise<Array>} Array de facturas ordenadas
 */
export const getInvoicesSortedByIssueDate = async (ascending = false) => {
  try {
    const colRef = collection(db, COLLECTIONS.INVOICE);
    const q = query(colRef, orderBy('issue_date', ascending ? 'asc' : 'desc'));
    const querySnapshot = await getDocs(q);

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invoices;
  } catch (error) {
    console.error('Error al obtener facturas ordenadas:', error);
    throw error;
  }
};

/**
 * Obtiene facturas ordenadas por fecha de vencimiento
 * @param {boolean} ascending - Si es true ordena ascendente, si es false descendente
 * @returns {Promise<Array>} Array de facturas ordenadas
 */
export const getInvoicesSortedByDueDate = async (ascending = false) => {
  try {
    const colRef = collection(db, COLLECTIONS.INVOICE);
    const q = query(colRef, orderBy('due_date', ascending ? 'asc' : 'desc'));
    const querySnapshot = await getDocs(q);

    const invoices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return invoices;
  } catch (error) {
    console.error('Error al obtener facturas ordenadas:', error);
    throw error;
  }
};

/**
 * Actualiza una factura existente
 * @param {string} invoiceId - ID del documento a actualizar
 * @param {Object} invoiceData - Datos a actualizar (solo los campos que se modifican)
 * @returns {Promise<void>}
 */
export const updateInvoice = async (invoiceId, invoiceData) => {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICE, invoiceId);
    await updateDoc(docRef, invoiceData);
    console.log('Factura actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de una factura
 * @param {string} invoiceId - ID del documento
 * @param {string} newStatus - Nuevo estado de la factura
 * @returns {Promise<void>}
 */
export const updateInvoiceStatus = async (invoiceId, newStatus) => {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICE, invoiceId);
    await updateDoc(docRef, { invoice_status: newStatus });
    console.log('Estado de factura actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar estado de factura:', error);
    throw error;
  }
};

/**
 * Elimina una factura
 * @param {string} invoiceId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
export const deleteInvoice = async (invoiceId) => {
  try {
    const docRef = doc(db, COLLECTIONS.INVOICE, invoiceId);
    await deleteDoc(docRef);
    console.log('Factura eliminada correctamente');
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    throw error;
  }
};
