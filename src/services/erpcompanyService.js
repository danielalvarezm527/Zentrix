import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Crea una nueva empresa ERP
 * @param {Object} companyData - Datos de la empresa
 * @param {string} companyData.address - Dirección de la empresa
 * @param {string} companyData.company_name - Nombre de la empresa
 * @param {string} companyData.email - Email de la empresa
 * @param {string} companyData.nit - NIT de la empresa
 * @returns {Promise<string>} ID del documento creado
 */
export const createErpCompany = async (companyData) => {
  try {
    const colRef = collection(db, COLLECTIONS.ERPCOMPANY);
    const docRef = await addDoc(colRef, {
      address: companyData.address,
      company_name: companyData.company_name,
      email: companyData.email,
      nit: companyData.nit
    });
    console.log('Empresa creada con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear empresa:', error);
    throw error;
  }
};

/**
 * Obtiene una empresa por su ID
 * @param {string} companyId - ID del documento
 * @returns {Promise<Object|null>} Datos de la empresa o null si no existe
 */
export const getErpCompanyById = async (companyId) => {
  try {
    const docRef = doc(db, COLLECTIONS.ERPCOMPANY, companyId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No se encontró la empresa');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener empresa:', error);
    throw error;
  }
};

/**
 * Obtiene todas las empresas
 * @returns {Promise<Array>} Array de empresas
 */
export const getAllErpCompanies = async () => {
  try {
    const colRef = collection(db, COLLECTIONS.ERPCOMPANY);
    const querySnapshot = await getDocs(colRef);

    const companies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return companies;
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    throw error;
  }
};

/**
 * Busca empresas por email
 * @param {string} email - Email a buscar
 * @returns {Promise<Array>} Array de empresas que coinciden
 */
export const getErpCompaniesByEmail = async (email) => {
  try {
    const colRef = collection(db, COLLECTIONS.ERPCOMPANY);
    const q = query(colRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    const companies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return companies;
  } catch (error) {
    console.error('Error al buscar empresas por email:', error);
    throw error;
  }
};

/**
 * Busca empresas por NIT
 * @param {string} nit - NIT a buscar
 * @returns {Promise<Array>} Array de empresas que coinciden
 */
export const getErpCompaniesByNit = async (nit) => {
  try {
    const colRef = collection(db, COLLECTIONS.ERPCOMPANY);
    const q = query(colRef, where('nit', '==', nit));
    const querySnapshot = await getDocs(q);

    const companies = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return companies;
  } catch (error) {
    console.error('Error al buscar empresas por NIT:', error);
    throw error;
  }
};

/**
 * Actualiza una empresa existente
 * @param {string} companyId - ID del documento a actualizar
 * @param {Object} companyData - Datos a actualizar (solo los campos que se modifican)
 * @returns {Promise<void>}
 */
export const updateErpCompany = async (companyId, companyData) => {
  try {
    const docRef = doc(db, COLLECTIONS.ERPCOMPANY, companyId);
    await updateDoc(docRef, companyData);
    console.log('Empresa actualizada correctamente');
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    throw error;
  }
};

/**
 * Elimina una empresa
 * @param {string} companyId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
export const deleteErpCompany = async (companyId) => {
  try {
    const docRef = doc(db, COLLECTIONS.ERPCOMPANY, companyId);
    await deleteDoc(docRef);
    console.log('Empresa eliminada correctamente');
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    throw error;
  }
};
