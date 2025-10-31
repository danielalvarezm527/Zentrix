import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from './constants';

/**
 * Obtiene los datos de un usuario por su UID
 * @param {string} uid - UID del usuario en Firebase Auth
 * @returns {Promise<Object|null>} Datos del usuario o null si no existe
 */
export const getUserById = async (uid) => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No se encontró el usuario');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

/**
 * Crea o actualiza los datos de un usuario en Firestore
 * @param {string} uid - UID del usuario en Firebase Auth
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<void>}
 */
export const saveUserData = async (uid, userData) => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    await setDoc(docRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('Datos del usuario guardados correctamente');
  } catch (error) {
    console.error('Error al guardar datos del usuario:', error);
    throw error;
  }
};

/**
 * Actualiza los datos de un usuario
 * @param {string} uid - UID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<void>}
 */
export const updateUser = async (uid, userData) => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    await updateDoc(docRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    });
    console.log('Usuario actualizado correctamente');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

/**
 * Elimina un usuario de Firestore
 * @param {string} uid - UID del usuario
 * @returns {Promise<void>}
 */
export const deleteUser = async (uid) => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    await deleteDoc(docRef);
    console.log('Usuario eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

/**
 * Obtiene el rol de un usuario
 * @param {string} uid - UID del usuario
 * @returns {Promise<string|null>} Rol del usuario o null si no existe
 */
export const getUserRole = async (uid) => {
  try {
    const userData = await getUserById(uid);
    return userData ? userData.rol : null;
  } catch (error) {
    console.error('Error al obtener rol del usuario:', error);
    throw error;
  }
};
