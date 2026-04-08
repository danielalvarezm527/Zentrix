import {
  createNotification,
  getNotificationById,
  getAllNotifications,
  getUnreadNotifications,
  getNotificationsByType,
  getNotificationsSortedByDate,
  updateNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  generateUserNotifications,
} from '../notificationService';
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
  orderBy,
} from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('../../firebase', () => ({ db: {} }));

const mockDocSnap = (exists, id, data) => ({
  exists: () => exists,
  id,
  data: () => data,
});

const mockQuerySnapshot = (docs) => ({
  docs: docs.map((d) => ({ id: d.id, ref: `ref-${d.id}`, data: () => d })),
});

beforeEach(() => {
  jest.clearAllMocks();
  doc.mockReturnValue('mockDocRef');
  collection.mockReturnValue('mockColRef');
  query.mockReturnValue('mockQuery');
  where.mockReturnValue('mockWhere');
  orderBy.mockReturnValue('mockOrderBy');
});

// ─── createNotification ───────────────────────────────────────────────────────

describe('createNotification', () => {
  it('crea una notificación y retorna el ID', async () => {
    addDoc.mockResolvedValue({ id: 'notif001' });

    const data = { message: 'Factura por vencer', type: 'info', is_read: false };
    const id = await createNotification(data);

    expect(collection).toHaveBeenCalledWith({}, 'Notification');
    expect(addDoc).toHaveBeenCalledWith(
      'mockColRef',
      expect.objectContaining({ message: 'Factura por vencer', type: 'info', is_read: false })
    );
    expect(id).toBe('notif001');
  });

  it('asigna is_read = false por defecto', async () => {
    addDoc.mockResolvedValue({ id: 'notif002' });

    await createNotification({ message: 'Test', type: 'info' });

    expect(addDoc).toHaveBeenCalledWith(
      'mockColRef',
      expect.objectContaining({ is_read: false })
    );
  });

  it('lanza error cuando addDoc falla', async () => {
    addDoc.mockRejectedValue(new Error('Error'));

    await expect(createNotification({})).rejects.toThrow('Error');
  });
});

// ─── getNotificationById ─────────────────────────────────────────────────────

describe('getNotificationById', () => {
  it('retorna la notificación cuando existe', async () => {
    getDoc.mockResolvedValue(
      mockDocSnap(true, 'notif001', { message: 'Test', type: 'info', is_read: false })
    );

    const result = await getNotificationById('notif001');

    expect(result).toEqual({ id: 'notif001', message: 'Test', type: 'info', is_read: false });
  });

  it('retorna null cuando no existe', async () => {
    getDoc.mockResolvedValue(mockDocSnap(false, null, null));

    const result = await getNotificationById('notif-inexistente');

    expect(result).toBeNull();
  });
});

// ─── getAllNotifications ──────────────────────────────────────────────────────

describe('getAllNotifications', () => {
  it('retorna todas las notificaciones', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([
        { id: 'n1', message: 'Msg1', type: 'info', is_read: false },
        { id: 'n2', message: 'Msg2', type: 'alerta', is_read: true },
      ])
    );

    const result = await getAllNotifications();

    expect(result).toHaveLength(2);
    expect(result[0].message).toBe('Msg1');
  });

  it('retorna array vacío cuando no hay notificaciones', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    const result = await getAllNotifications();

    expect(result).toEqual([]);
  });
});

// ─── getUnreadNotifications ───────────────────────────────────────────────────

describe('getUnreadNotifications', () => {
  it('filtra solo notificaciones no leídas', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([{ id: 'n1', is_read: false, message: 'Pendiente' }])
    );

    const result = await getUnreadNotifications();

    expect(where).toHaveBeenCalledWith('is_read', '==', false);
    expect(result).toHaveLength(1);
  });
});

// ─── getNotificationsByType ───────────────────────────────────────────────────

describe('getNotificationsByType', () => {
  it('filtra notificaciones por tipo', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([{ id: 'n1', type: 'alerta', message: 'Urgente' }])
    );

    const result = await getNotificationsByType('alerta');

    expect(where).toHaveBeenCalledWith('type', '==', 'alerta');
    expect(result[0].type).toBe('alerta');
  });
});

// ─── getNotificationsSortedByDate ─────────────────────────────────────────────

describe('getNotificationsSortedByDate', () => {
  it('ordena descendente por defecto', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await getNotificationsSortedByDate();

    expect(orderBy).toHaveBeenCalledWith('sent_date', 'desc');
  });

  it('ordena ascendente cuando se pasa true', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await getNotificationsSortedByDate(true);

    expect(orderBy).toHaveBeenCalledWith('sent_date', 'asc');
  });
});

// ─── markNotificationAsRead ───────────────────────────────────────────────────

describe('markNotificationAsRead', () => {
  it('actualiza is_read a true', async () => {
    updateDoc.mockResolvedValue(undefined);

    await markNotificationAsRead('notif001');

    expect(doc).toHaveBeenCalledWith({}, 'Notification', 'notif001');
    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', { is_read: true });
  });
});

// ─── markAllNotificationsAsRead ───────────────────────────────────────────────

describe('markAllNotificationsAsRead', () => {
  it('marca todas las notificaciones no leídas como leídas', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([
        { id: 'n1', is_read: false },
        { id: 'n2', is_read: false },
      ])
    );
    updateDoc.mockResolvedValue(undefined);

    await markAllNotificationsAsRead();

    expect(updateDoc).toHaveBeenCalledTimes(2);
  });

  it('no llama updateDoc si no hay notificaciones sin leer', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await markAllNotificationsAsRead();

    expect(updateDoc).not.toHaveBeenCalled();
  });
});

// ─── deleteNotification ───────────────────────────────────────────────────────

describe('deleteNotification', () => {
  it('elimina una notificación por ID', async () => {
    deleteDoc.mockResolvedValue(undefined);

    await deleteNotification('notif001');

    expect(doc).toHaveBeenCalledWith({}, 'Notification', 'notif001');
    expect(deleteDoc).toHaveBeenCalledWith('mockDocRef');
  });
});

// ─── deleteReadNotifications ─────────────────────────────────────────────────

describe('deleteReadNotifications', () => {
  it('elimina todas las notificaciones leídas', async () => {
    const mockRef1 = 'ref-n1';
    const mockRef2 = 'ref-n2';
    getDocs.mockResolvedValue({
      docs: [
        { id: 'n1', ref: mockRef1, data: () => ({ is_read: true }) },
        { id: 'n2', ref: mockRef2, data: () => ({ is_read: true }) },
      ],
    });
    deleteDoc.mockResolvedValue(undefined);

    await deleteReadNotifications();

    expect(where).toHaveBeenCalledWith('is_read', '==', true);
    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(deleteDoc).toHaveBeenCalledWith(mockRef1);
    expect(deleteDoc).toHaveBeenCalledWith(mockRef2);
  });
});

// ─── updateNotification ───────────────────────────────────────────────────────

describe('updateNotification', () => {
  it('actualiza los datos de una notificación', async () => {
    updateDoc.mockResolvedValue(undefined);

    await updateNotification('notif001', { message: 'Actualizado' });

    expect(doc).toHaveBeenCalledWith({}, 'Notification', 'notif001');
    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', { message: 'Actualizado' });
  });
});

// ─── generateUserNotifications ────────────────────────────────────────────────

describe('generateUserNotifications', () => {
  const TODAY = new Date('2026-04-06T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(TODAY);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const makeInvoiceSnapshot = (invoices) => ({
    docs: invoices.map((inv) => ({ id: inv.id, data: () => inv })),
  });

  const emptyNotifSnapshot = { docs: [] };

  it('retorna array vacío cuando el usuario no tiene facturas', async () => {
    getDocs.mockResolvedValueOnce(makeInvoiceSnapshot([]));

    const result = await generateUserNotifications('user1');

    expect(result).toEqual([]);
  });

  it('omite facturas con estado radicada', async () => {
    getDocs.mockResolvedValueOnce(
      makeInvoiceSnapshot([
        { id: 'inv1', invoice_number: 'F-001', invoice_status: 'radicada', due_date: '2026-04-10' },
      ])
    );

    const result = await generateUserNotifications('user1');

    expect(result).toEqual([]);
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('crea notificación tipo "alerta" para factura vencida', async () => {
    getDocs
      .mockResolvedValueOnce(
        makeInvoiceSnapshot([
          { id: 'inv1', invoice_number: 'F-001', invoice_status: 'pendiente', due_date: '2026-04-01' },
        ])
      )
      .mockResolvedValueOnce(emptyNotifSnapshot);

    addDoc.mockResolvedValue({ id: 'notif-new' });

    const result = await generateUserNotifications('user1');

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('alerta');
    expect(result[0].message).toContain('vencida');
  });

  it('crea notificación tipo "alerta" para factura que vence hoy', async () => {
    // Usar ISO completo para que new Date(due_date) y setHours(0,0,0,0) den el mismo día local
    const todayISO = new Date().toISOString();

    getDocs
      .mockResolvedValueOnce(
        makeInvoiceSnapshot([
          { id: 'inv1', invoice_number: 'F-001', invoice_status: 'pendiente', due_date: todayISO },
        ])
      )
      .mockResolvedValueOnce(emptyNotifSnapshot);

    addDoc.mockResolvedValue({ id: 'notif-new' });

    const result = await generateUserNotifications('user1');

    expect(result[0].type).toBe('alerta');
    expect(result[0].message).toContain('URGENTE');
  });

  it('crea notificación tipo "alerta" para factura que vence en <= 7 días', async () => {
    getDocs
      .mockResolvedValueOnce(
        makeInvoiceSnapshot([
          { id: 'inv1', invoice_number: 'F-001', invoice_status: 'pendiente', due_date: '2026-04-10' },
        ])
      )
      .mockResolvedValueOnce(emptyNotifSnapshot);

    addDoc.mockResolvedValue({ id: 'notif-new' });

    const result = await generateUserNotifications('user1');

    expect(result[0].type).toBe('alerta');
    expect(result[0].message).toContain('Crítica');
  });

  it('crea notificación tipo "info" para factura que vence en 8-22 días', async () => {
    getDocs
      .mockResolvedValueOnce(
        makeInvoiceSnapshot([
          { id: 'inv1', invoice_number: 'F-001', invoice_status: 'pendiente', due_date: '2026-04-20' },
        ])
      )
      .mockResolvedValueOnce(emptyNotifSnapshot);

    addDoc.mockResolvedValue({ id: 'notif-new' });

    const result = await generateUserNotifications('user1');

    expect(result[0].type).toBe('info');
  });

  it('no crea notificación si ya existe una para esa factura hoy', async () => {
    const todayISO = new Date('2026-04-06T10:00:00.000Z').toISOString();

    getDocs
      .mockResolvedValueOnce(
        makeInvoiceSnapshot([
          { id: 'inv1', invoice_number: 'F-001', invoice_status: 'pendiente', due_date: '2026-04-10' },
        ])
      )
      .mockResolvedValueOnce({
        docs: [{ id: 'existing', data: () => ({ sent_date: todayISO }) }],
      });

    const result = await generateUserNotifications('user1');

    expect(result).toEqual([]);
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('omite facturas fuera del rango -15 a 22 días', async () => {
    getDocs.mockResolvedValueOnce(
      makeInvoiceSnapshot([
        { id: 'inv1', invoice_number: 'F-001', invoice_status: 'pendiente', due_date: '2026-05-10' },
      ])
    );

    const result = await generateUserNotifications('user1');

    expect(result).toEqual([]);
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('lanza error cuando Firestore falla', async () => {
    getDocs.mockRejectedValue(new Error('Error Firestore'));

    await expect(generateUserNotifications('user1')).rejects.toThrow('Error Firestore');
  });
});
