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
 * Crea un nuevo rol
 * @param {Object} roleData - Datos del rol
 * @param {string} roleData.name - Nombre del rol
 * @returns {Promise<string>} ID del documento creado
 */
export const createRole = async (roleData) => {
  try {
    const colRef = collection(db, COLLECTIONS.ROLE);
    const docRef = await addDoc(colRef, {
      name: roleData.name
    });
    console.log('Rol creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear rol:', error);
    throw error;
  }
};

/**
 * Obtiene un rol por su ID
 * @param {string} roleId - ID del documento
 * @returns {Promise<Object|null>} Datos del rol o null si no existe
 */
export const getRoleById = async (roleId) => {
  try {
    const docRef = doc(db, COLLECTIONS.ROLE, roleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No se encontró el rol');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener rol:', error);
    throw error;
  }
};

/**
 * Obtiene todos los roles
 * @returns {Promise<Array>} Array de roles
 */
export const getAllRoles = async () => {
  try {
    const colRef = collection(db, COLLECTIONS.ROLE);
    const querySnapshot = await getDocs(colRef);

    const roles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return roles;
  } catch (error) {
    console.error('Error al obtener roles:', error);
    throw error;
  }
};

/**
 * Busca un rol por nombre
 * @param {string} name - Nombre del rol a buscar
 * @returns {Promise<Array>} Array de roles que coinciden
 */
export const getRoleByName = async (name) => {
  try {
    const colRef = collection(db, COLLECTIONS.ROLE);
    const q = query(colRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);

    const roles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return roles;
  } catch (error) {
    console.error('Error al buscar rol por nombre:', error);
    throw error;
  }
};

/**
 * Verifica si un rol existe por nombre
 * @param {string} name - Nombre del rol a verificar
 * @returns {Promise<boolean>} true si existe, false si no existe
 */
export const roleExists = async (name) => {
  try {
    const roles = await getRoleByName(name);
    return roles.length > 0;
  } catch (error) {
    console.error('Error al verificar existencia del rol:', error);
    throw error;
  }
};

/**
 * Actualiza un rol existente
 * @param {string} roleId - ID del documento a actualizar
 * @param {Object} roleData - Datos a actualizar (solo los campos que se modifican)
 * @returns {Promise<void>}
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const docRef = doc(db, COLLECTIONS.ROLE, roleId);
    await updateDoc(docRef, roleData);
    console.log('Rol actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    throw error;
  }
};

/**
 * Elimina un rol
 * @param {string} roleId - ID del documento a eliminar
 * @returns {Promise<void>}
 */
export const deleteRole = async (roleId) => {
  try {
    const docRef = doc(db, COLLECTIONS.ROLE, roleId);
    await deleteDoc(docRef);
    console.log('Rol eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    throw error;
  }
};
