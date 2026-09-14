import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import { analyticsAPI } from '../../api/analytics';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import DateRangePicker, { getDateParams, getDefaultDateRange } from '../../components/common/DateRangePicker';
import RefreshControls from '../../components/common/RefreshControls';
import RelativeTime from '../../components/common/RelativeTime';
import useDashboardCache from '../../hooks/useDashboardCache';
import useInterval from '../../hooks/useInterval';
import AnalyticsSkeleton from '../../components/analytics/AnalyticsSkeleton';
import { DollarSign, Package, Users, BarChart3, Clock, Check, CreditCard } from 'lucide-react';

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#ef4444', '#78716c', '#fbbf24', '#06b6d4', '#292524'];
const PIE_COLORS = ['#f59e0b', '#22c55e', '#888888', '#ef4444', '#d97706', '#fbbf24', '#06b6d4'];

// ── Module-level defaults (stable reference, prevents stale cache restoration) ──
const ANALYTICS_DEFAULTS = {
  sales: null,
  revenue: [],
  categories: [],
  orderStatus: [],
  topCustomers: [],
  dashboardSummary: null,
  dailySales: [],
  hourlyData: [],
  revenueComparison: null,
  customerGrowth: [],
  conversionMetrics: null,
  paymentMethodTrends: [],
  topProducts: [],
  userAnalytics: null,
};

/**
 * Shown instead of a chart when the API returned no rows for the selected range.
 * Never substitute placeholder numbers — an empty period must look empty.
 */
function ChartEmpty({ icon: Icon = BarChart3, message, height = 220 }) {
  return (
    <div style={{
      height, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.8rem',
    }}>
      <Icon size={28} style={{ opacity: 0.3 }} />
      <p>{message}</p>
    </div>
  );
}

/**
 * Total days covered by a { start, end } range, clamped to sane bounds.
 * The analytics endpoints filter by `days`, so without this the date-range
 * picker on this page silently changed nothing.
 */
function rangeToDays(range) {
  const start = range?.start ? new Date(range.start) : null;
  const end = range?.end ? new Date(range.end) : null;
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 30;
  const days = Math.round((end - start) / 86400000);
  return Math.min(365, Math.max(1, days));
}

/** Unwrap an axios response down to the Laravel `data` payload. */
function unwrapPayload(res) {
  return res?.data?.data ?? res?.data ?? null;
}

function toArrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

/** Order-status rows arrive as raw counts; the UI renders percentages. */
function normalizeOrderStatus(payload) {
  const rows = toArrayOrEmpty(payload);
  if (rows.length === 0) return [];
  const total = rows.reduce((sum, row) => sum + Number(row?.value ?? 0), 0);
  if (total <= 0) return [{ name: 'No Orders', value: 100 }];
  return rows.map(row => ({
    name: row.name,
    value: Math.round((Number(row.value) / total) * 100),
  }));
}

function normalizeHourly(payload) {
  return toArrayOrEmpty(payload).map(h => {
    const raw = h?.hour;
    // getHourlyDistribution already returns a formatted label ("14:00"); only
    // pad a bare hour number, otherwise the axis read "14:00:00".
    const hour = typeof raw === 'number'
      ? `${String(raw).padStart(2, '0')}:00`
      : (raw != null ? String(raw) : '');
    return {
      hour,
      orders: num(h?.orders),
      revenue: num(h?.revenue),
    };
  });
}

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Revenue trend rows come back as { date, revenue } (a daily series), not the
 * { month, revenue } shape the chart was originally written against.
 */
function normalizeRevenueTrend(payload) {
  return toArrayOrEmpty(payload?.trends ?? payload).map(row => ({
    date: row?.date ?? row?.month ?? '',
    revenue: num(row?.revenue),
  }));
}

/**
 * Category rows are raw Category models: revenue lives in `total_revenue` and
 * units in `total_sold`. Mapping here keeps the chart's dataKeys meaningful.
 */
function normalizeCategories(payload) {
  return toArrayOrEmpty(payload?.categories ?? payload).map(row => ({
    name: row?.name ?? '—',
    revenue: num(row?.total_revenue ?? row?.revenue),
    orders: num(row?.total_sold ?? row?.orders),
  }));
}

/**
 * Top customers are raw User models: name is split, spend is `orders_sum_total`
 * and the count is `orders_count`.
 */
function normalizeTopCustomers(payload) {
  return toArrayOrEmpty(payload?.customers ?? payload).map(row => {
    const name = [row?.first_name ?? row?.firstName, row?.last_name ?? row?.lastName]
      .filter(Boolean).join(' ').trim();
    const spent = num(row?.orders_sum_total ?? row?.totalSpent);
    return {
      id: row?.id,
      name: name || row?.email || '—',
      email: row?.email ?? '',
      totalSpent: spent,
      orderCount: num(row?.orders_count ?? row?.orderCount),
      ltv: num(row?.ltv ?? spent),
    };
  });
}

/**
 * Payment rows exist in two shapes:
 *   aggregate  -> { method, percentage, count, total }
 *   per-day    -> { payment_method, date, count, total }
 * Both are normalised to what the pie/bar/table render.
 */
function normalizePaymentMethods(payload) {
  const rows = toArrayOrEmpty(payload);
  if (rows.length === 0) return [];

  // Already aggregated
  if (rows[0]?.method !== undefined) {
    return rows.map(p => ({
      method: p.method,
      count: num(p.count),
      revenue: num(p.total ?? p.revenue),
      percentage: num(p.percentage),
    }));
  }

  const byMethod = new Map();
  rows.forEach(r => {
    const key = r?.payment_method ?? 'Unknown';
    const entry = byMethod.get(key) ?? { method: key, count: 0, revenue: 0, percentage: 0 };
    entry.count += num(r?.count);
    entry.revenue += num(r?.total ?? r?.revenue);
    byMethod.set(key, entry);
  });

  const list = [...byMethod.values()];
  const grandTotal = list.reduce((sum, entry) => sum + entry.revenue, 0);
  list.forEach(entry => {
    entry.percentage = grandTotal > 0 ? Math.round((entry.revenue / grandTotal) * 1000) / 10 : 0;
  });

  return list.sort((a, b) => b.revenue - a.revenue);
}

/**
 * `sales` is a daily series (date, order_count, revenue, avg_order_value), but
 * the stat cards treat it as a summary — so derive the summary here and keep
 * the daily AOV available for the Daily Sales chart's AOV line.
 */
function normalizeSalesSummary(payload) {
  const rows = toArrayOrEmpty(payload);
  if (rows.length === 0) return { summary: null, aovByDate: {} };

  const totalRevenue = rows.reduce((sum, row) => sum + num(row?.revenue), 0);
  const totalOrders = rows.reduce((sum, row) => sum + num(row?.order_count ?? row?.orders), 0);
  const aovByDate = {};
  rows.forEach(row => {
    if (row?.date) aovByDate[row.date] = num(row?.avg_order_value);
  });

  return {
    summary: {
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    },
    aovByDate,
  };
}

/**
 * Map an analytics payload onto this page's state shape.
 *
 * Used by both the consolidated and the individual-call paths so they can never
 * drift apart again — the frontend previously read field names the API has never
 * returned (which is why several charts silently rendered zeros).
 */
function buildAnalyticsSnapshot(raw) {
  const { summary: sales, aovByDate } = normalizeSalesSummary(raw?.sales);
  const comparison = raw?.revenueComparison ?? null;
  const userAnalytics = raw?.userAnalytics ?? null;
  const metrics = raw?.dashboardSummary?.metrics ?? null;

  return {
    sales,
    revenue: normalizeRevenueTrend(raw?.revenueTrends),
    categories: normalizeCategories(raw?.categoryPerformance),
    orderStatus: normalizeOrderStatus(raw?.orderStatus),
    topCustomers: normalizeTopCustomers(raw?.topCustomers),
    dashboardSummary: raw?.dashboardSummary ?? null,
    dailySales: toArrayOrEmpty(raw?.dailySales).map(row => ({
      ...row,
      aov: num(row?.aov ?? aovByDate[row?.date]),
    })),
    hourlyData: normalizeHourly(raw?.hourlyDistribution),
    revenueComparison: comparison
      ? {
        ...comparison,
        // The UI renders these two totals; the API calls them thisMonth/lastMonth.
        currentTotal: num(comparison.currentTotal ?? comparison.thisMonth),
        previousTotal: num(comparison.previousTotal ?? comparison.lastMonth),
      }
      : null,
    customerGrowth: toArrayOrEmpty(raw?.customerGrowth),
    conversionMetrics: raw?.conversionMetrics ?? null,
    // Prefer the aggregate breakdown; fall back to aggregating the daily series.
    paymentMethodTrends: normalizePaymentMethods(raw?.paymentMethods ?? raw?.paymentTrends),
    topProducts: toArrayOrEmpty(raw?.topProducts).slice(0, 10).map(p => ({
      productId: p?.productId ?? p?.id,
      productName: p?.productName ?? p?.name ?? '—',
      unitsSold: num(p?.unitsSold ?? p?.sales_count),
      revenue: num(p?.revenue),
    })),
    // userAnalytics carries no revenue/new-user fields — borrow them from the
    // dashboard metrics so the customer cards aren't permanently zero.
    userAnalytics: userAnalytics
      ? {
        ...userAnalytics,
        newUsers: userAnalytics.newUsers ?? metrics?.newUsers ?? 0,
        totalRevenue: userAnalytics.totalRevenue ?? metrics?.totalRevenue ?? 0,
        averageOrderValue: userAnalytics.averageOrderValue ?? metrics?.avgOrderValue ?? 0,
      }
      : null,
  };
}

// Set to false the first time the consolidated endpoint reports "not deployed"
// (404/405/501) so we don't pay for a doomed request before every fallback.
let consolidatedEndpointSupported = true;

function analyticsReducer(state, action) {
  switch (action.type) {
    case 'SET_MULTIPLE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export default function AnalyticsAdminPage() {
  const cache = useDashboardCache(10, 'analytics');
  // Monotonic request id — only the newest request is allowed to write state.
  // Without this, switching date ranges mid-flight lets a slow older response
  // overwrite the newer one (and clear the loading state too early).
  const requestIdRef = useRef(0);
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [state, dispatch] = useReducer(analyticsReducer, ANALYTICS_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [tab, setTab] = useState('overview');
  const [chartsReady, setChartsReady] = useState(false);

  // Destructure all analytics fields from state
  const {
    sales, revenue, categories, orderStatus, topCustomers,
    dashboardSummary, dailySales, hourlyData, revenueComparison,
    customerGrowth, conversionMetrics, paymentMethodTrends, topProducts, userAnalytics,
  } = state;

  // ── Cache restore is now a single dispatch ──
  const loadAnalytics = useCallback(async (range, { skipCache = false, isBackground = false } = {}) => {
    const requestId = ++requestIdRef.current;

    if (!skipCache) {
      const cached = cache.get(range);
      if (cached) {
        dispatch({ type: 'SET_MULTIPLE', payload: { ...ANALYTICS_DEFAULTS, ...cached } });
        setLoading(false);
        return;
      }
    }

    if (!isBackground) setLoading(true);
    const dateParams = getDateParams(range);

    // ── PRIMARY: the consolidated endpoint (1 request instead of 14) ──
    // Every section it returns is the same value the individual endpoints
    // return, so this is a drop-in replacement that removes 13 round trips.
    try {
      if (!consolidatedEndpointSupported) throw new Error('consolidated endpoint unavailable');

      const fullRes = await analyticsAPI.getFullAnalytics({ ...dateParams, days: rangeToDays(range) });
      const full = unwrapPayload(fullRes);
      if (full && typeof full === 'object') {
        const snapshot = buildAnalyticsSnapshot(full);
        if (requestId !== requestIdRef.current) return;
        cache.set(range, snapshot);
        dispatch({ type: 'SET_MULTIPLE', payload: snapshot });
        setLastRefreshed(new Date());
        if (!isBackground) setLoading(false);
        return;
      }
    } catch (err) {
      // Consolidated endpoint unavailable — fall back to the individual calls.
      // 404/405/501 mean it isn't deployed, so stop retrying it this session.
      const status = err?.response?.status;
      if (status === 404 || status === 405 || status === 501) {
        consolidatedEndpointSupported = false;
      }
    }

    // ── FALLBACK: individual API calls, normalised through the same snapshot
    // builder so both paths can never return different shapes ──
    const [
      salesRes,
      revenueTrendsRes,
      categoryPerfRes,
      orderStatusRes,
      topCustomersRes,
      dashboardSummaryRes,
      dailySalesRes,
      hourlyDistRes,
      revenueCompRes,
      customerGrowthRes,
      conversionRes,
      paymentMethodsRes,
      productsRes,
      usersRes,
    ] = await Promise.allSettled([
      analyticsAPI.getSales(dateParams),
      analyticsAPI.getRevenueTrends(dateParams),
      analyticsAPI.getCategoryPerformance(dateParams),
      analyticsAPI.getOrderStatus(dateParams),
      analyticsAPI.getTopCustomers(dateParams),
      analyticsAPI.getDashboardSummary(dateParams),
      analyticsAPI.getDailySales(dateParams),
      analyticsAPI.getHourlyDistribution(dateParams),
      analyticsAPI.getRevenueComparison(dateParams),
      analyticsAPI.getCustomerGrowth(dateParams),
      analyticsAPI.getConversionMetrics(dateParams),
      // Aggregate per-method stats — the per-day series can't drive the pie/table.
      analyticsAPI.getPaymentMethods(dateParams),
      analyticsAPI.getProducts(dateParams),
      analyticsAPI.getUsers(dateParams),
    ]);

    const settledPayload = (settled) => (settled.status === 'fulfilled' ? unwrapPayload(settled.value) : null);
    const apiNames = ['Sales', 'Revenue trends', 'Category performance', 'Order status', 'Top customers',
      'Dashboard summary', 'Daily sales', 'Hourly distribution', 'Revenue comparison', 'Customer growth',
      'Conversion metrics', 'Payment methods', 'Products', 'Users'];
    const settledResults = [salesRes, revenueTrendsRes, categoryPerfRes, orderStatusRes, topCustomersRes,
      dashboardSummaryRes, dailySalesRes, hourlyDistRes, revenueCompRes, customerGrowthRes,
      conversionRes, paymentMethodsRes, productsRes, usersRes];
    const failedNames = settledResults.map((r, i) => (r.status === 'rejected' ? apiNames[i] : null)).filter(Boolean);
    if (failedNames.length > 0) {
      console.warn(`Analytics API(s) failed (non-critical): ${failedNames.join(', ')}`);
    }

    const fetched = buildAnalyticsSnapshot({
      sales: settledPayload(salesRes),
      revenueTrends: settledPayload(revenueTrendsRes),
      categoryPerformance: settledPayload(categoryPerfRes),
      orderStatus: settledPayload(orderStatusRes),
      topCustomers: settledPayload(topCustomersRes),
      dashboardSummary: settledPayload(dashboardSummaryRes),
      dailySales: settledPayload(dailySalesRes),
      hourlyDistribution: settledPayload(hourlyDistRes),
      revenueComparison: settledPayload(revenueCompRes),
      customerGrowth: settledPayload(customerGrowthRes),
      conversionMetrics: settledPayload(conversionRes),
      paymentMethods: settledPayload(paymentMethodsRes),
      topProducts: settledPayload(productsRes),
      userAnalytics: settledPayload(usersRes),
    });

    // A newer request superseded this one — drop the stale payload.
    if (requestId !== requestIdRef.current) return;

    // Cache the result and dispatch once (React 18+ batches into a single render)
    cache.set(range, fetched);
    dispatch({ type: 'SET_MULTIPLE', payload: fetched });

    setLastRefreshed(new Date());
    if (!isBackground) setLoading(false);
  }, [cache]);

  // --- Manual refresh (bypasses cache) ---
  const handleManualRefresh = useCallback(() => {
    loadAnalytics(dateRange, { skipCache: true });
  }, [dateRange, loadAnalytics]);

  // --- Clear cache and refresh ---
  const handleClearCache = useCallback(() => {
    cache.clear();
    loadAnalytics(dateRange, { skipCache: true });
  }, [cache, dateRange, loadAnalytics]);

  useEffect(() => {
    loadAnalytics(dateRange);
  }, [dateRange, loadAnalytics]);

  // Delay chart rendering until after layout is computed — prevents recharts -1 width/height
  useEffect(() => {
    if (loading) return;
    const raf = requestAnimationFrame(() => setChartsReady(true));
    return () => cancelAnimationFrame(raf);
  }, [loading]);

  // --- Auto-refresh interval ---
  useInterval(() => {
    loadAnalytics(dateRange, { skipCache: true, isBackground: true });
  }, refreshInterval);

  // ── Derived data with useMemo (stable references) ──
  // Read the `current`/`previous` series outside the memo — accessing a `.current`
  // property inside one makes React Compiler treat it as a ref and skip optimizing.
  const comparisonCurrent = revenueComparison?.current;
  const comparisonPrevious = revenueComparison?.previous;

  // The two series are consecutive periods (this month vs last month), so their
  // dates never overlap — matching on the date string would plot each series in
  // its own region of the chart instead of comparing them. Pair by day index.
  const comparisonChartData = useMemo(() => {
    const current = Array.isArray(comparisonCurrent) ? comparisonCurrent : [];
    const previous = Array.isArray(comparisonPrevious) ? comparisonPrevious : [];
    const length = Math.max(current.length, previous.length);

    return Array.from({ length }, (_, i) => ({
      day: 'Day ' + (i + 1),
      'Current Period': Number(current[i]?.revenue) || 0,
      'Previous Period': Number(previous[i]?.revenue) || 0,
    }));
  }, [comparisonCurrent, comparisonPrevious]);

  const growthDisplay = useMemo(() =>
    customerGrowth.length > 0 ? customerGrowth.slice(-14) : [],
    [customerGrowth]
  );

  const topProductsChart = useMemo(() => topProducts.slice(0, 8), [topProducts]);

  const paymentPieData = useMemo(() =>
    paymentMethodTrends.map(p => ({ name: p.method, value: p.percentage })),
    [paymentMethodTrends]
  );

  return (
    <div>
      <div className="admin-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 600, color: 'var(--charcoal)', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>Analytics</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Track performance across all channels</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <RefreshControls
            interval={refreshInterval}
            onIntervalChange={setRefreshInterval}
            onManualRefresh={handleManualRefresh}
            onClearCache={handleClearCache}
            loading={loading}
          />
          <RelativeTime
            date={lastRefreshed}
            prefix="Updated "
            className="text-xs text-text-muted font-medium whitespace-nowrap"
          />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      <div className="admin-tabs-wrap" style={{ marginBottom: '1.5rem' }}>
        <button className={`admin-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`admin-tab ${tab === 'sales' ? 'active' : ''}`} onClick={() => setTab('sales')}>Sales</button>
        <button className={`admin-tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Products</button>
        <button className={`admin-tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>Payments</button>
        <button className={`admin-tab ${tab === 'customers' ? 'active' : ''}`} onClick={() => setTab('customers')}>Customers</button>
      </div>          {loading && (
        <div className="mb-4">
          <div className="flex items-center justify-center gap-3 py-3 mb-4 text-sm text-text-muted bg-white border border-border rounded-2xl shadow-soft">
            <div className="spinner w-4 h-4" style={{ borderWidth: '2px' }} />
            <span>Loading analytics data...</span>
          </div>
          <AnalyticsSkeleton />
        </div>
      )}

      {/* Tab content with fade-in when skeleton disappears */}
      {!loading && (
      <div className="dashboard-content-enter">
      {!chartsReady && <div style={{ height: 800 }} />}
      {chartsReady && (
      <>

      {/* ========== OVERVIEW TAB ========== */}
      {tab === 'overview' && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-icon revenue"><DollarSign size={20} /></div><div className="stat-label">Total Revenue</div><div className="stat-val">{formatCurrency(dashboardSummary?.metrics?.totalRevenue || sales?.totalRevenue || sales?.revenue || sales?.total_revenue || 0)}</div>{revenueComparison && <div className={(revenueComparison.changePercent ?? 0) >= 0 ? 'stat-change stat-up' : 'stat-change stat-down'}>{(revenueComparison.changePercent ?? 0) >= 0 ? '↑ ' : '↓ '}{Math.abs(revenueComparison.changePercent ?? 0).toFixed(1)}% vs prev</div>}</div>
            <div className="stat-card"><div className="stat-icon orders"><Package size={20} /></div><div className="stat-label">Total Orders</div><div className="stat-val">{formatNumber(dashboardSummary?.metrics?.totalOrders || sales?.totalOrders || sales?.orders || sales?.total_orders || 0)}</div><div className="stat-change stat-up">↑ {conversionMetrics ? conversionMetrics.completedOrders : 0} completed</div></div>
            <div className="stat-card"><div className="stat-icon users"><Users size={20} /></div><div className="stat-label">Total Customers</div><div className="stat-val">{formatNumber(userAnalytics?.totalUsers || dashboardSummary?.metrics?.totalUsers || dashboardSummary?.totalCustomers || 0)}</div><div className="stat-change">{userAnalytics?.newUsers ? '↑ ' + userAnalytics.newUsers + ' new' : ''}</div></div>
            <div className="stat-card"><div className="stat-icon revenue"><BarChart3 size={20} /></div><div className="stat-label">AOV</div><div className="stat-val">{formatCurrency(dashboardSummary?.metrics?.avgOrderValue || dashboardSummary?.avgOrderValue || sales?.avgOrderValue || sales?.aov || sales?.average_order_value || 0)}</div><div className="stat-change">{conversionMetrics ? (conversionMetrics.conversionRate ?? 0).toFixed(1) + '% conv.' : ''}</div></div>
          </div>

          {/* Conversion Metrics Row */}
          {conversionMetrics && (
            <div className="chart-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Conversion Rate', value: (conversionMetrics.conversionRate ?? 0).toFixed(1) + '%', change: conversionMetrics.completedOrders + ' orders' },
                    { label: 'Completed Orders', value: conversionMetrics.completedOrders, change: 'Successfully processed' },
                    { label: 'Abandoned Carts', value: conversionMetrics.abandonedCarts, change: 'Did not convert' },
                    { label: 'Total Carts', value: conversionMetrics.totalCarts, change: 'In this period' },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '1rem 0.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{item.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--charcoal)' }}>{item.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{item.change}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-title">Revenue Trend</div>
              {revenue.length > 0 ? (
              <div style={{ width: '100%', height: 250, minWidth: '1px', minHeight: '1px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue} isAnimationActive={false}>
                  <defs><linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="100%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v ? v.slice(5) : '')} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E8E2D9', fontSize: '0.8rem' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revenueTrendFill)" />
                </AreaChart>
              </ResponsiveContainer>
              </div>
              ) : (
                <ChartEmpty icon={DollarSign} message="No revenue data for this period" height={250} />
              )}
            </div>
            <div className="chart-card">
              <div className="chart-title">Order Distribution</div>
              {orderStatus.length > 0 ? (
                <>
              <div style={{ width: '100%', height: 180, minWidth: '1px', minHeight: '1px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart isAnimationActive={false}>
                  <Pie data={orderStatus} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {orderStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              </div>
              <div style={{ padding: '0 0.5rem' }}>
                {orderStatus.map((s, i) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ flex: 1, color: 'var(--muted)' }}>{s.name}</span><strong>{s.value}%</strong>
                  </div>
                ))}
              </div>
                </>
              ) : (
                <ChartEmpty icon={Package} message="No order data for this period" height={260} />
              )}
            </div>
          </div>

          {/* Revenue Comparison */}
          <div className="chart-card" style={{ marginTop: '1.5rem' }}>
            <div className="chart-title" style={{ marginBottom: '0.25rem' }}>Revenue Comparison (Current vs Previous Period)</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              {revenueComparison ? (
                <>Change: <span style={{ color: revenueComparison.changePercent >= 0 ? '#27AE60' : '#E74C3C', fontWeight: 700 }}>{(revenueComparison.changePercent ?? 0) >= 0 ? '+' : ''}{(revenueComparison.changePercent ?? 0).toFixed(1)}%</span> &middot; Current: {formatCurrency(revenueComparison.currentTotal)} vs Previous: {formatCurrency(revenueComparison.previousTotal)}</>
              ) : 'Comparing revenue across two equal-length periods'}
            </p>
            <div style={{ width: '100%', height: 250, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + v/1000 + 'k'} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Current Period" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="Previous Period" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={16} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Growth */}
          <div className="chart-card" style={{ marginTop: '1.5rem' }}>
            <div className="chart-title">Customer Growth</div>
            <div style={{ width: '100%', height: 220, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthDisplay} isAnimationActive={false}>
                <defs><linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2980B9" stopOpacity={0.2} /><stop offset="100%" stopColor="#2980B9" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v ? v.slice(5) : ''} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="totalUsers" stroke="#2980B9" strokeWidth={2} fill="url(#custGrad)" name="Total Users" />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>
        </>
      )}


      {/* ========== SALES TAB ========== */}
      {tab === 'sales' && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card"><div className="stat-icon revenue"><DollarSign size={20} /></div><div className="stat-label">Total Revenue</div><div className="stat-val">{formatCurrency(dashboardSummary?.metrics?.totalRevenue || sales?.totalRevenue || sales?.revenue || 0)}</div><div className="stat-change stat-up">Revenue in this period</div></div>
            <div className="stat-card"><div className="stat-icon orders"><Package size={20} /></div><div className="stat-label">Total Orders</div><div className="stat-val">{formatNumber(dashboardSummary?.metrics?.totalOrders || sales?.totalOrders || sales?.orders || 0)}</div><div className="stat-change">{sales?.averageOrderValue ? 'AOV: ' + formatCurrency(sales.averageOrderValue) : ''}</div></div>
            <div className="stat-card"><div className="stat-icon revenue"><BarChart3 size={20} /></div><div className="stat-label">Daily Avg Revenue</div><div className="stat-val">{formatCurrency(dailySales.length > 0 ? dailySales.reduce((s, d) => s + d.revenue, 0) / dailySales.length : 0)}</div><div className="stat-change">Across {dailySales.length} days</div></div>
            <div className="stat-card"><div className="stat-icon users"><Clock size={20} /></div><div className="stat-label">Peak Hour</div><div className="stat-val">{hourlyData.length > 0 ? (() => { const peak = [...hourlyData].sort((a, b) => b.orders - a.orders)[0]; return peak ? peak.hour : 'N/A'; })() : 'N/A'}</div><div className="stat-change">Most orders placed</div></div>
          </div>

          {/* Daily Sales Trend */}
          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-title">Daily Sales</div>
            <div style={{ width: '100%', height: 280, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySales} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v ? v.slice(5) : ''} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + v/1000 + 'k'} />
                <Tooltip formatter={(v, name) => name === 'revenue' || name === 'aov' ? formatCurrency(v) : v} contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line type="monotone" dataKey="aov" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2 }} name="AOV" />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-title">Hourly Order Distribution</div>
            <div style={{ width: '100%', height: 250, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="orders" fill="#1a1a1a" radius={[3, 3, 0, 0]} maxBarSize={14} name="Orders" />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={14} name="Revenue" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Metrics */}
          {conversionMetrics && (
            <div className="chart-card">
              <div className="chart-title">Conversion Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#27AE60' }}>{(conversionMetrics.conversionRate ?? 0).toFixed(1)}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Conversion Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--charcoal)' }}>{conversionMetrics.completedOrders}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Completed Orders</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#E74C3C' }}>{conversionMetrics.abandonedCarts}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Abandoned Carts</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3498DB' }}>{conversionMetrics.totalCarts}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Total Carts</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}


      {/* ========== PRODUCTS TAB ========== */}
      {tab === 'products' && (
        <>
          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-title">Top Products by Revenue</div>
            {topProductsChart.length > 0 ? (
            <div style={{ width: '100%', height: 350, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsChart} layout="vertical" margin={{ left: 100, right: 20 }} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + v/1000 + 'k'} />
                <YAxis dataKey="productName" type="category" tick={{ fontSize: 11, width: 100 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={24} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
            </div>
            ) : <ChartEmpty icon={Package} message="No product sales in this period" height={350} />}
          </div>

          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-title">Top Products by Units Sold</div>
            {topProductsChart.length > 0 ? (
            <div style={{ width: '100%', height: 300, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsChart} layout="vertical" margin={{ left: 100, right: 20 }} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="productName" type="category" tick={{ fontSize: 11, width: 100 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Bar dataKey="unitsSold" fill="#2980B9" radius={[0, 4, 4, 0]} maxBarSize={24} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
            </div>
            ) : <ChartEmpty icon={Package} message="No product sales in this period" height={300} />}
          </div>

          {/* Category Performance */}
          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-title">Category Performance</div>
            {categories.length > 0 ? (
            <div style={{ width: '100%', height: 280, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="orders" fill="#27AE60" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
            </div>
            ) : <ChartEmpty message="No category data in this period" height={280} />}
          </div>

          <div className="table-card">
            <div className="table-head"><h3>Product & Category Breakdown</h3></div>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Product / Category</th><th>Revenue</th><th>Units Sold</th><th>Unit Price</th></tr></thead>
              <tbody>
                {topProductsChart.map((p, i) => (
                  <tr key={p.productId || i}>
                    <td><span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : 'var(--off-white)', color: i === 0 ? '#fff' : 'var(--muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{i + 1}</span></td>
                    <td><strong>{p.productName || p.name}</strong></td>
                    <td><strong>{formatCurrency(p.revenue)}</strong></td>
                    <td>{p.unitsSold || p.orders || p.sales || 0}</td>
                    <td>{formatCurrency(p.unitsSold ? p.revenue / p.unitsSold : 0)}</td>
                  </tr>
                ))}
                {(topProducts.length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon"><Package size={40} /></div><h3>No data yet</h3><p>Product analytics will appear once you have orders.</p></div></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}


      {/* ========== PAYMENTS TAB ========== */}
      {tab === 'payments' && (
        <>
          <div className="chart-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-card">
              <div className="chart-title">Payment Methods Distribution</div>
              {paymentPieData.length > 0 ? (
              <div style={{ width: '100%', height: 220, minWidth: '1px', minHeight: '1px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart isAnimationActive={false}>
                  <Pie data={paymentPieData}
                    innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {paymentPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => (v ?? 0).toFixed(1) + '%'} contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
              </div>
              ) : <ChartEmpty icon={CreditCard} message="No payment data in this period" height={220} />}
            </div>
            <div className="chart-card">
              <div className="chart-title">Payment Methods by Revenue</div>
              {paymentMethodTrends.length > 0 ? (
              <div style={{ width: '100%', height: 220, minWidth: '1px', minHeight: '1px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodTrends} layout="vertical" margin={{ left: 60, right: 10 }} isAnimationActive={false}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '₹' + v/1000 + 'k'} />
                  <YAxis dataKey="method" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={20} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
              </div>
              ) : <ChartEmpty icon={CreditCard} message="No payment data in this period" height={220} />}
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: '1.5rem' }}>
            <div className="table-head"><h3>Payment Method Details</h3></div>
            <table className="admin-table">
              <thead><tr><th>Method</th><th>Transactions</th><th>Revenue</th><th>Share</th><th>Avg per Transaction</th></tr></thead>
              <tbody>
                {paymentMethodTrends.map((p, i) => (
                  <tr key={p.method || i}>
                    <td><strong>{p.method}</strong></td>
                    <td>{p.count}</td>
                    <td><strong>{formatCurrency(p.revenue)}</strong></td>
                    <td>{(p.percentage ?? 0).toFixed(1)}%</td>
                    <td>{formatCurrency(p.count ? p.revenue / p.count : 0)}</td>
                  </tr>
                ))}
                {paymentMethodTrends.length === 0 && (
                  <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon"><CreditCard size={40} /></div><h3>No payment data yet</h3><p>Payment analytics will appear once you have orders.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Hourly Sales for Payments tab */}
          <div className="chart-card">
            <div className="chart-title">Hourly Sales (Order Volume)</div>
            <div style={{ width: '100%', height: 250, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} isAnimationActive={false}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="revenue" fill="#f59e0b" stroke="#f59e0b" strokeWidth={2} fillOpacity={0.1} name="Revenue" />
                <Bar dataKey="orders" fill="#1a1a1a" radius={[3, 3, 0, 0]} maxBarSize={12} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </>
      )}


      {/* ========== CUSTOMERS TAB ========== */}
      {tab === 'customers' && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card"><div className="stat-icon users"><Users size={20} /></div><div className="stat-label">Total Users</div><div className="stat-val">{formatNumber(userAnalytics?.totalUsers || dashboardSummary?.metrics?.totalUsers || dashboardSummary?.totalCustomers || 0)}</div><div className="stat-change">{userAnalytics?.newUsers ? formatNumber(userAnalytics.newUsers) + ' new in period' : ''}</div></div>
            <div className="stat-card"><div className="stat-icon users"><Check size={20} /></div><div className="stat-label">Active Users</div><div className="stat-val">{formatNumber(userAnalytics?.activeUsers || 0)}</div><div className="stat-change">Recently logged in</div></div>
            <div className="stat-card"><div className="stat-icon revenue"><DollarSign size={20} /></div><div className="stat-label">Total Customer Revenue</div><div className="stat-val">{formatCurrency(userAnalytics?.totalRevenue || 0)}</div></div>
            <div className="stat-card"><div className="stat-icon revenue"><BarChart3 size={20} /></div><div className="stat-label">Customer AOV</div><div className="stat-val">{formatCurrency(userAnalytics?.averageOrderValue || 0)}</div></div>
          </div>

          {/* Customer Growth Chart */}
          <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
            <div className="chart-title">Customer Growth Trend</div>
            <div style={{ width: '100%', height: 280, minWidth: '1px', minHeight: '1px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthDisplay} isAnimationActive={false}>
                <defs><linearGradient id="custGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2980B9" stopOpacity={0.3} /><stop offset="100%" stopColor="#2980B9" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v ? v.slice(5) : ''} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="totalUsers" stroke="#2980B9" strokeWidth={2} fill="url(#custGrad2)" name="Total Users" />
                <Bar dataKey="newUsers" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={8} name="New Users" opacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Top Customers Table */}
          <div className="table-card">
            <div className="table-head"><h3>Top Customers</h3></div>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Customer</th><th>Total Spent</th><th>Orders</th><th>LTV</th></tr></thead>
              <tbody>
                {topCustomers.length ? topCustomers.map((c, i) => (
                  <tr key={c.id || i}>
                    <td><span style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : 'var(--off-white)', color: i === 0 ? '#fff' : 'var(--muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{i + 1}</span></td>
                    <td><strong>{c.name || c.email || '—'}</strong></td>
                    <td><strong>{formatCurrency(c.totalSpent)}</strong></td>
                    <td>{c.orderCount || c.orders || 0}</td>
                    <td>{formatCurrency(c.ltv || c.totalSpent)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon"><Users size={40} /></div><h3>No data yet</h3><p>Customer insights will appear once you have orders.</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      </>
      )}
      </div>
      )}
    </div>
  );
}
