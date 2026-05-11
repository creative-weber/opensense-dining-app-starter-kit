import { useEffect, useState } from 'react';
import api from '../api';
import { handleApiError, handleSuccess } from '../utils/errorHandler';
import type { TableRow, QRData } from '../types';
import QRCard from '../components/QRCard';
import { Plus, QrCode, Trash2 } from 'lucide-react';

export default function TablesPage() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<QRData | null>(null);

  const loadTables = () =>
    api.get<TableRow[]>('/admin/tables')
      .then(({ data }) => setTables(data))
      .catch((err) => {
        handleApiError(err, { operation: 'fetch tables', page: 'TablesPage' });
      })
      .finally(() => setLoading(false));

  useEffect(() => { void loadTables(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      await api.post('/admin/tables', { tableNumber, capacity });
      setTableNumber('');
      setCapacity(4);
      handleSuccess('Table added successfully');
      await loadTables();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'add table', page: 'TablesPage' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    try {
      await api.delete(`/admin/tables/${id}`);
      handleSuccess('Table deleted successfully');
      await loadTables();
    } catch (err: unknown) {
      handleApiError(err, { operation: 'delete table', page: 'TablesPage' });
    }
  };

  const handleViewQR = async (table: TableRow) => {
    try {
      const { data } = await api.get<QRData>(`/admin/tables/${table.id}/qr`);
      setQrModal(data);
    } catch (err: unknown) {
      handleApiError(err, { operation: 'fetch QR code', page: 'TablesPage' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tables &amp; QR Codes</h1>

      {/* Add table form */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h2 className="font-bold text-gray-900 mb-3">Add New Table</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label htmlFor="tnum" className="block text-base font-medium text-gray-600 mb-1">
              Table Number / Name
            </label>
            <input id="tnum" type="text" required value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="e.g. 1, A1, Terrace"
              className="border border-border rounded-xl px-3 py-2.5 text-base w-40
                         focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label htmlFor="cap" className="block text-base font-medium text-gray-600 mb-1">Capacity</label>
            <input id="cap" type="number" min={1} max={50} value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="border border-border rounded-xl px-3 py-2.5 text-base w-24
                         focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <button type="submit" disabled={adding}
            className="flex items-center gap-1.5 bg-brand text-white text-base font-semibold
                       px-4 py-2.5 rounded-xl hover:bg-brand-dark disabled:opacity-60 transition-colors">
            <Plus className="w-4 h-4" aria-hidden="true" />
            {adding ? 'Adding…' : 'Add Table'}
          </button>
        </form>
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>

      {/* Tables list */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <h2 className="font-bold text-gray-900 mb-3">All Tables</h2>
        {loading && (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-20 rounded-xl bg-gray-200 animate-pulse" />
            <div className="h-20 rounded-xl bg-gray-200 animate-pulse" />
          </div>
        )}
        {!loading && tables.length === 0 && (
          <p className="text-base text-muted">No tables yet. Add your first table above.</p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {tables.map((table) => (
            <div key={table.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-brand/30 transition-colors">
              <div>
                <p className="font-bold text-gray-900">Table {table.table_number}</p>
                <p className="text-base text-muted">Seats {table.capacity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => void handleViewQR(table)}
                  className="flex items-center gap-1.5 bg-brand/10 text-brand text-base font-semibold
                             px-4 py-2.5 rounded-lg hover:bg-brand hover:text-white transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                  QR Code
                </button>
                <button onClick={() => void handleDelete(table.id)} aria-label="Delete table"
                  className="h-11 w-11 flex items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {qrModal && <QRCard data={qrModal} onClose={() => setQrModal(null)} />}
    </div>
  );
}
