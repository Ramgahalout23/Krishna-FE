import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api/admin';
import { analyticsAPI } from '../../api/analytics';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ORDER_STATUSES } from '../../utils/constants';
import toast from '../../utils/toast';
import { useOrderStatusUpdates, useOrderCreated } from '../../hooks/useSocket';
import useAsyncExport from '../../hooks/useAsyncExport';
import ExportCSVModal from '../../components/admin/ExportCSVModal';
import Pagination from '../../components/admin/Pagination';
import AdminPageShell from '../../components/admin/AdminPageShell';

export default function OrdersAdminPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  // Only the newest listing request may write state — socket-driven refreshes
  // and rapid filter changes would otherwise let a slow response win.
  const loadRequestIdRef = useRef(0);
  // Store-wide per-status totals (the table only holds one page).
  const [statusCounts, setStatusCounts] = useState({});
  const countsTimerRef = useRef(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 25, 50, 100];

  // Search debouncing
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // CSV Export state (async job-based, shared hook)
  const [showExportModal, setShowExportModal] = useState(false);
  const { runExport, exporting, exportStatus, exportError, resetExport } = useAsyncExport();

  const ORDER_COLUMNS = [
    { key: 'orderNumber', label: 'Order Number' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'email', label: 'Customer Email' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'createdAt', label: 'Date' },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleExportCSV = (selectedColumns) => runExport({
    type: 'orders',
    filters: { status: statusFilter !== 'ALL' ? statusFilter : undefined, search: debouncedSearch || undefined },
    columns: selectedColumns,
    filename: `orders-export-${new Date().toISOString().slice(0, 10)}.csv`,
  });

  // Auto-close the modal shortly after a successful export.
  useEffect(() => {
    if (exportStatus !== 'completed') return;
    const t = setTimeout(() => {
      setShowExportModal(false);
      resetExport();
    }, 1500);
    return () => clearTimeout(t);
  }, [exportStatus, resetExport]);

  /**
   * Store-wide per-status counts. The table only holds the current page, so
   * deriving counts from `orders` displayed at most `pageSize` per status and
   * showed "0" for any status that happened to fall on another page.
   */
  const loadCounts = useCallback(async () => {
    try {
      const r = await analyticsAPI.getOrderStatus();
      const rows = r.data?.data || r.data || [];
      if (!Array.isArray(rows)) return;
      const next = {};
      rows.forEach(row => {
        if (row?.name) next[row.name] = Number(row.value) || 0;
      });
      setStatusCounts(next);
    } catch (err) {
      // Counts are advisory — the table and filters remain usable.
      console.warn('Failed to load order status counts:', err);
    }
  }, []);

  // Coalesce socket-driven count refreshes into one request per second.
  const scheduleCountsRefresh = useCallback(() => {
    if (countsTimerRef.current) return;
    countsTimerRef.current = setTimeout(() => {
      countsTimerRef.current = null;
      loadCounts();
    }, 1000);
  }, [loadCounts]);

  useEffect(() => {
    loadCounts();
    return () => { if (countsTimerRef.current) clearTimeout(countsTimerRef.current); };
  }, [loadCounts]);

  const load = async (page = 1) => {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: debouncedSearch || undefined
      };

      const r = await adminAPI.getOrders(params);
      if (requestId !== loadRequestIdRef.current) return;

      const list = r.data?.data?.orders || r.data?.orders || r.data?.data || [];
      setOrders(Array.isArray(list) ? list : []);

      const pag = r.data?.pagination || r.data?.data?.pagination || {};
      setCurrentPage(pag.page || page);
      setTotalPages(pag.pages || Math.ceil((pag.total || list.length) / pageSize) || 1);
      setTotalItems(pag.total || list.length);
    } catch (err) {
      if (requestId !== loadRequestIdRef.current) return;
      console.error('Failed to load orders:', err);
      toast.error('Failed to load orders');
    } finally {
      if (requestId === loadRequestIdRef.current) setLoading(false);
    }
  };

  // Always call the latest `load` from socket callbacks. The socket handlers are
  // memoized on `[currentPage]`, so without this they would keep using the
  // closure captured before the last search/filter change.
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });

  // Reset page when search, statusFilter, or page size changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      load(1);
    }
  }, [debouncedSearch, statusFilter, pageSize]);

  // Load when currentPage changes
  useEffect(() => {
    load(currentPage);
  }, [currentPage]);

  // Real-time order updates via WebSocket
  const handleOrderUpdate = useCallback((data) => {
    console.debug('[Realtime] Order update:', data);
    loadRef.current(currentPage);
    scheduleCountsRefresh();
    if (data.status) {
      toast(
        `Order ${data.orderNumber || data.orderId?.slice(0, 8)} → ${ORDER_STATUSES[data.status]?.label || data.status}`,
        { icon: '\u{1F504}', duration: 4000 }
      );
    }
  }, [currentPage, scheduleCountsRefresh]);

  useOrderStatusUpdates(handleOrderUpdate, [currentPage]);

  // Handle new order created events — auto-refresh list + show notification
  const handleOrderCreated = useCallback((data) => {
    console.debug('[Realtime] New order:', data);
    loadRef.current(currentPage);
    scheduleCountsRefresh();
    toast.success(
      `\u{1F195} New order ${data.orderNumber ? `#${data.orderNumber}` : ''} \u2014 ${formatCurrency(data.summary?.total ?? data.total ?? 0)}`,
      { duration: 6000 }
    );
  }, [currentPage, scheduleCountsRefresh]);

  useOrderCreated(handleOrderCreated, [currentPage]);

  const handleStatus = async (id, status) => {
    try {
      await adminAPI.updateOrderStatus(id, { status });
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Status updated to ${ORDER_STATUSES[status]?.label || status}`);
      await load(currentPage);
      loadCounts();
    } catch { toast.error('Failed to update status'); }
  };

  const counts = Object.fromEntries(
    Object.keys(ORDER_STATUSES).map(s => [s, statusCounts[s] ?? 0])
  );

  return (
    <AdminPageShell
      title="Orders"
      subtitle={`Track and manage customer orders (${totalItems} total)`}
      loading={loading}
      page="orders"
    >
      {/* Quick Stats */}
      <div className="stats-grid">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}>
            <div className="stat-label">{ORDER_STATUSES[status]?.label || status}</div>
            <div className="stat-val" style={{ color: ({ PENDING: 'var(--warning)', CONFIRMED: 'var(--info)', PROCESSING: 'var(--primary)', SHIPPED: 'var(--info)', DELIVERED: 'var(--success)', CANCELLED: 'var(--danger)', RETURN_REQUESTED: 'var(--warning)', RETURNED: 'var(--danger)' })[status] || 'var(--muted)' }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-toolbar">
          <input className="table-search" placeholder="Search by order ID or customer..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="table-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            {Object.keys(ORDER_STATUSES).map(s => <option key={s} value={s}>{ORDER_STATUSES[s].label}</option>)}
          </select>
          <button className="btn-ghost btn-sm" onClick={() => setShowExportModal(true)}>
            📥 Export CSV
          </button>
          <span className="table-count">{totalItems} orders</span>
        </div>
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">{'\uD83D\uDCCB'}</div><h3>No orders found</h3></div></td></tr>
            ) : orders.map(o => (
              <tr key={o.id}>
                <td><strong style={{ fontFamily: 'monospace' }}>#{o.id?.slice(0, 8)}</strong></td>
                <td>{o.customerName || o.userId || '\u2014'}</td>
                <td><strong>{formatCurrency(o.total || o.totalAmount)}</strong></td>
                <td><span className={`status-badge ${ORDER_STATUSES[o.status]?.class || 'status-pending'}`}>{ORDER_STATUSES[o.status]?.label || o.status}</span></td>
                <td>{formatDate(o.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn-view" onClick={() => navigate(`/admin/orders/${o.id}`)}>View</button>
                    <select className="table-filter" style={{ padding: '0.25rem 0.4rem', fontSize: '0.7rem' }} value={o.status} onChange={e => handleStatus(o.id, e.target.value)}>
                      {Object.keys(ORDER_STATUSES).map(s => <option key={s} value={s}>{ORDER_STATUSES[s].label}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          itemLabel="order"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          pageSizeOptions={pageSizeOptions}
        />
      </div>

      {/* CSV Export Modal */}
      <ExportCSVModal
        isOpen={showExportModal}
        onClose={() => { setShowExportModal(false); resetExport(); }}
        columns={ORDER_COLUMNS}
        onExport={handleExportCSV}
        exporting={exporting}
        exportStatus={exportStatus}
        exportError={exportError}
        filename={`orders-export-${new Date().toISOString().slice(0, 10)}.csv`}
      />
    </AdminPageShell>
  );
}
