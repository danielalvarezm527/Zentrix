import {
  createInvoice,
  getInvoiceById,
  getAllInvoices,
  getInvoicesByNumber,
  getInvoicesByStatus,
  getInvoicesSortedByIssueDate,
  getInvoicesSortedByDueDate,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} from '../invoiceService';
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
  docs: docs.map((d) => ({ id: d.id, data: () => d })),
});

beforeEach(() => {
  jest.clearAllMocks();
  doc.mockReturnValue('mockDocRef');
  collection.mockReturnValue('mockColRef');
  query.mockReturnValue('mockQuery');
  where.mockReturnValue('mockWhere');
  orderBy.mockReturnValue('mockOrderBy');
});

// ─── createInvoice ───────────────────────────────────────────────────────────

describe('createInvoice', () => {
  it('crea una factura y retorna el ID del documento', async () => {
    addDoc.mockResolvedValue({ id: 'inv001' });

    const invoiceData = {
      Invoicecol: 'col1',
      invoice_number: 'F-001',
      invoice_status: 'pendiente',
      issue_date: '2026-01-01',
      due_date: '2026-01-31',
      total_amount: 1500000,
    };

    const id = await createInvoice(invoiceData);

    expect(collection).toHaveBeenCalledWith({}, 'Invoice');
    expect(addDoc).toHaveBeenCalledWith('mockColRef', invoiceData);
    expect(id).toBe('inv001');
  });

  it('lanza error cuando addDoc falla', async () => {
    addDoc.mockRejectedValue(new Error('Error al crear'));

    await expect(createInvoice({})).rejects.toThrow('Error al crear');
  });
});

// ─── getInvoiceById ──────────────────────────────────────────────────────────

describe('getInvoiceById', () => {
  it('retorna los datos de la factura cuando existe', async () => {
    getDoc.mockResolvedValue(
      mockDocSnap(true, 'inv001', { invoice_number: 'F-001', invoice_status: 'pendiente' })
    );

    const result = await getInvoiceById('inv001');

    expect(doc).toHaveBeenCalledWith({}, 'Invoice', 'inv001');
    expect(result).toEqual({ id: 'inv001', invoice_number: 'F-001', invoice_status: 'pendiente' });
  });

  it('retorna null cuando la factura no existe', async () => {
    getDoc.mockResolvedValue(mockDocSnap(false, null, null));

    const result = await getInvoiceById('inv-inexistente');

    expect(result).toBeNull();
  });

  it('lanza error cuando Firestore falla', async () => {
    getDoc.mockRejectedValue(new Error('Error de red'));

    await expect(getInvoiceById('inv001')).rejects.toThrow('Error de red');
  });
});

// ─── getAllInvoices ───────────────────────────────────────────────────────────

describe('getAllInvoices', () => {
  it('retorna todas las facturas', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([
        { id: 'inv001', invoice_number: 'F-001', invoice_status: 'pendiente' },
        { id: 'inv002', invoice_number: 'F-002', invoice_status: 'radicada' },
      ])
    );

    const result = await getAllInvoices();

    expect(collection).toHaveBeenCalledWith({}, 'Invoice');
    expect(result).toHaveLength(2);
    expect(result[0].invoice_number).toBe('F-001');
    expect(result[1].invoice_status).toBe('radicada');
  });

  it('retorna array vacío cuando no hay facturas', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    const result = await getAllInvoices();

    expect(result).toEqual([]);
  });

  it('lanza error cuando Firestore falla', async () => {
    getDocs.mockRejectedValue(new Error('Fallo'));

    await expect(getAllInvoices()).rejects.toThrow('Fallo');
  });
});

// ─── getInvoicesByNumber ─────────────────────────────────────────────────────

describe('getInvoicesByNumber', () => {
  it('filtra facturas por número', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([{ id: 'inv001', invoice_number: 'F-001' }])
    );

    const result = await getInvoicesByNumber('F-001');

    expect(where).toHaveBeenCalledWith('invoice_number', '==', 'F-001');
    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toBe('F-001');
  });

  it('retorna array vacío si no hay coincidencias', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    const result = await getInvoicesByNumber('F-999');

    expect(result).toEqual([]);
  });
});

// ─── getInvoicesByStatus ─────────────────────────────────────────────────────

describe('getInvoicesByStatus', () => {
  it('filtra facturas por estado', async () => {
    getDocs.mockResolvedValue(
      mockQuerySnapshot([
        { id: 'inv001', invoice_status: 'pendiente' },
        { id: 'inv002', invoice_status: 'pendiente' },
      ])
    );

    const result = await getInvoicesByStatus('pendiente');

    expect(where).toHaveBeenCalledWith('invoice_status', '==', 'pendiente');
    expect(result).toHaveLength(2);
  });
});

// ─── getInvoicesSortedByIssueDate ─────────────────────────────────────────────

describe('getInvoicesSortedByIssueDate', () => {
  it('ordena por fecha de emisión descendente por defecto', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await getInvoicesSortedByIssueDate();

    expect(orderBy).toHaveBeenCalledWith('issue_date', 'desc');
  });

  it('ordena ascendente cuando se pasa true', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await getInvoicesSortedByIssueDate(true);

    expect(orderBy).toHaveBeenCalledWith('issue_date', 'asc');
  });
});

// ─── getInvoicesSortedByDueDate ───────────────────────────────────────────────

describe('getInvoicesSortedByDueDate', () => {
  it('ordena por fecha de vencimiento descendente por defecto', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await getInvoicesSortedByDueDate();

    expect(orderBy).toHaveBeenCalledWith('due_date', 'desc');
  });

  it('ordena ascendente cuando se pasa true', async () => {
    getDocs.mockResolvedValue(mockQuerySnapshot([]));

    await getInvoicesSortedByDueDate(true);

    expect(orderBy).toHaveBeenCalledWith('due_date', 'asc');
  });
});

// ─── updateInvoice ────────────────────────────────────────────────────────────

describe('updateInvoice', () => {
  it('actualiza los datos de una factura', async () => {
    updateDoc.mockResolvedValue(undefined);

    await updateInvoice('inv001', { total_amount: 2000000 });

    expect(doc).toHaveBeenCalledWith({}, 'Invoice', 'inv001');
    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', { total_amount: 2000000 });
  });

  it('lanza error cuando updateDoc falla', async () => {
    updateDoc.mockRejectedValue(new Error('Sin permisos'));

    await expect(updateInvoice('inv001', {})).rejects.toThrow('Sin permisos');
  });
});

// ─── updateInvoiceStatus ──────────────────────────────────────────────────────

describe('updateInvoiceStatus', () => {
  it('actualiza el estado de la factura', async () => {
    updateDoc.mockResolvedValue(undefined);

    await updateInvoiceStatus('inv001', 'radicada');

    expect(updateDoc).toHaveBeenCalledWith('mockDocRef', { invoice_status: 'radicada' });
  });
});

// ─── deleteInvoice ────────────────────────────────────────────────────────────

describe('deleteInvoice', () => {
  it('elimina una factura correctamente', async () => {
    deleteDoc.mockResolvedValue(undefined);

    await deleteInvoice('inv001');

    expect(doc).toHaveBeenCalledWith({}, 'Invoice', 'inv001');
    expect(deleteDoc).toHaveBeenCalledWith('mockDocRef');
  });

  it('lanza error cuando deleteDoc falla', async () => {
    deleteDoc.mockRejectedValue(new Error('No encontrado'));

    await expect(deleteInvoice('inv001')).rejects.toThrow('No encontrado');
  });
});
