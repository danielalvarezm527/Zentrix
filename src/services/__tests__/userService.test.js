import {
  getUserById,
  getAllUsers,
  saveUserData,
  updateUser,
  deleteUser,
  getUserRole,
  toggleUserStatus,
  isUserActive,
} from '../userService';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('../../firebase', () => ({ db: {} }));

const mockDocSnap = (exists, id, data) => ({
  exists: () => exists,
  id,
  data: () => data,
});

const mockQuerySnapshot = (docs) => ({
  docs: docs.map((d) => ({ id: d.id, data: () => d })),
});

beforeEach(() => {
  jest.clearAllMocks();
  doc.mockReturnValue('mockDocRef');
  collection.mockReturnValue('mockColRef');
});

// ─── getUserById ────────────────────────────────────────────────────────────

describe('getUserById', () => {
  it('retorna los datos del usuario cuando existe', async () => {
    getDoc.mockResolvedValue(
      mockDocSnap(true, 'uid1', { nombre: 'Ana', email: 'ana@test.com', rol: 'User' })
    );

    const result = await getUserById('uid1');

    expect(doc).toHaveBeenCalledWith({}, 'users', 'uid1');
    expect(result).toEqual({ id: 'uid1', nombre: 'Ana', email: 'ana@test.com', rol: 'User' });
  });

  it('retorna null cuando el usuario no existe', async () => {
    getDoc.mockResolvedValue(mockDocSnap(false, null, null));

    const result = await getUserById('uid-inexistente');

    expect(result).toBeNull();
  });

  it('lanza error cuando Firestore falla', async () => {
    getDoc.mockRejectedValue(new Error('Error de red'));

    await expect(getUserById('uid1')).rejects.toThrow('Error de red');
  });
});

// ─── getAllUsers ─────────────────────────────────────────────────────────────

describe('getAllUsers', () => {
  it('retorna un array con todos los usuarios', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([
        { id: 'uid1', nombre: 'Ana', rol: 'User' },
        { id: 'uid2', nombre: 'Luis', rol: 'Admin' },
      ])
    );

    const result = await getAllUsers();

    expect(collection).toHaveBeenCalledWith({}, 'users');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'uid1', nombre: 'Ana', rol: 'User' });
    expect(result[1]).toEqual({ id: 'uid2', nombre: 'Luis', rol: 'Admin' });
  });

  it('retorna array vacío cuando no hay usuarios', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    const result = await getAllUsers();

    expect(result).toEqual([]);
  });

  it('lanza error cuando Firestore falla', async () => {
    getDocs.mockRejectedValue(new Error('Error de conexión'));

    await expect(getAllUsers()).rejects.toThrow('Error de conexión');
  });
});

// ─── saveUserData ────────────────────────────────────────────────────────────

describe('saveUserData', () => {
  it('llama a setDoc con los datos correctos', async () => {
    setDoc.mockResolvedValue(undefined);

    const userData = { nombre: 'Pedro', email: 'pedro@test.com', rol: 'User' };
    await saveUserData('uid1', userData);

    expect(doc).toHaveBeenCalledWith({}, 'users', 'uid1');
    expect(setDoc).toHaveBeenCalledWith(
      'mockDocRef',
      expect.objectContaining({ nombre: 'Pedro', email: 'pedro@test.com', rol: 'User', updatedAt: expect.any(String) }),
      { merge: true }
    );
  });

  it('lanza error cuando setDoc falla', async () => {
    setDoc.mockRejectedValue(new Error('Permiso denegado'));

    await expect(saveUserData('uid1', {})).rejects.toThrow('Permiso denegado');
  });
});

// ─── updateUser ──────────────────────────────────────────────────────────────

describe('updateUser', () => {
  it('llama a updateDoc con los datos del usuario', async () => {
    updateDoc.mockResolvedValue(undefined);

    await updateUser('uid1', { nombre: 'Ana Actualizada' });

    expect(updateDoc).toHaveBeenCalledWith(
      'mockDocRef',
      expect.objectContaining({ nombre: 'Ana Actualizada', updatedAt: expect.any(String) })
    );
  });

  it('lanza error cuando updateDoc falla', async () => {
    updateDoc.mockRejectedValue(new Error('Sin permisos'));

    await expect(updateUser('uid1', {})).rejects.toThrow('Sin permisos');
  });
});

// ─── deleteUser ──────────────────────────────────────────────────────────────

describe('deleteUser', () => {
  it('llama a deleteDoc con la referencia correcta', async () => {
    deleteDoc.mockResolvedValue(undefined);

    await deleteUser('uid1');

    expect(doc).toHaveBeenCalledWith({}, 'users', 'uid1');
    expect(deleteDoc).toHaveBeenCalledWith('mockDocRef');
  });

  it('lanza error cuando deleteDoc falla', async () => {
    deleteDoc.mockRejectedValue(new Error('Documento no encontrado'));

    await expect(deleteUser('uid1')).rejects.toThrow('Documento no encontrado');
  });
});

// ─── getUserRole ─────────────────────────────────────────────────────────────

describe('getUserRole', () => {
  it('retorna el rol del usuario cuando existe', async () => {
    getDoc.mockResolvedValue(mockDocSnap(true, 'uid1', { rol: 'Admin' }));

    const role = await getUserRole('uid1');

    expect(role).toBe('Admin');
  });

  it('retorna null cuando el usuario no existe', async () => {
    getDoc.mockResolvedValue(mockDocSnap(false, null, null));

    const role = await getUserRole('uid-inexistente');

    expect(role).toBeNull();
  });
});

// ─── toggleUserStatus ────────────────────────────────────────────────────────

describe('toggleUserStatus', () => {
  it('habilita un usuario (isActive = true)', async () => {
    updateDoc.mockResolvedValue(undefined);

    await toggleUserStatus('uid1', true);

    expect(updateDoc).toHaveBeenCalledWith(
      'mockDocRef',
      expect.objectContaining({ isActive: true })
    );
  });

  it('inhabilita un usuario (isActive = false)', async () => {
    updateDoc.mockResolvedValue(undefined);

    await toggleUserStatus('uid1', false);

    expect(updateDoc).toHaveBeenCalledWith(
      'mockDocRef',
      expect.objectContaining({ isActive: false })
    );
  });

  it('lanza error cuando falla', async () => {
    updateDoc.mockRejectedValue(new Error('Error'));

    await expect(toggleUserStatus('uid1', true)).rejects.toThrow('Error');
  });
});

// ─── isUserActive ────────────────────────────────────────────────────────────

describe('isUserActive', () => {
  it('retorna true cuando isActive es true', async () => {
    getDoc.mockResolvedValue(mockDocSnap(true, 'uid1', { isActive: true }));

    const result = await isUserActive('uid1');

    expect(result).toBe(true);
  });

  it('retorna false cuando isActive es false', async () => {
    getDoc.mockResolvedValue(mockDocSnap(true, 'uid1', { isActive: false }));

    const result = await isUserActive('uid1');

    expect(result).toBe(false);
  });

  it('retorna true cuando isActive no está definido (retrocompatibilidad)', async () => {
    getDoc.mockResolvedValue(mockDocSnap(true, 'uid1', {}));

    const result = await isUserActive('uid1');

    expect(result).toBe(true);
  });

  it('retorna false cuando el usuario no existe', async () => {
    getDoc.mockResolvedValue(mockDocSnap(false, null, null));

    const result = await isUserActive('uid-inexistente');

    expect(result).toBe(false);
  });
});
