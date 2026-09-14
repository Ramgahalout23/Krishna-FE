import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAPI } from '../api/admin';
import { downloadBlob } from '../utils/download';
import toast from '../utils/toast';

/** How often (ms) to re-check a dispatched export job. */
const POLL_INTERVAL_MS = 1500;
/** Give up after this many polls (~90s) instead of polling forever. */
const MAX_POLLS = 60;

/**
 * Drives the async CSV export flow used by the admin list pages:
 * dispatch job -> poll status -> download blob.
 *
 * Centralised because every page previously re-implemented this with the same
 * three defects: an unbounded `setTimeout` poll loop that kept running after the
 * page unmounted, a stale `exportStatus` captured in the poll closure (so a
 * failure after the first poll was mis-reported), and no upper bound on the
 * number of attempts.
 *
 * @returns {{
 *   runExport: (job: {type: string, filters?: object, columns?: string[], filename?: string}) => Promise<void>,
 *   exporting: boolean,
 *   exportStatus: 'dispatching'|'processing'|'completed'|'failed'|null,
 *   exportError: string|null,
 *   resetExport: () => void,
 * }}
 */
export default function useAsyncExport() {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [exportError, setExportError] = useState(null);

  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const resetExport = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setExporting(false);
    setExportStatus(null);
    setExportError(null);
  }, []);

  const fail = useCallback((message) => {
    if (!mountedRef.current) return;
    setExportStatus('failed');
    setExportError(message || 'Export failed');
    setExporting(false);
    toast.error('Export failed');
  }, []);

  const runExport = useCallback(async ({ type, filters, columns, filename }) => {
    // Cancel any export still in flight before starting a new one.
    if (timerRef.current) clearTimeout(timerRef.current);

    setExporting(true);
    setExportStatus('dispatching');
    setExportError(null);

    const cleanFilters = { ...(filters || {}) };
    Object.keys(cleanFilters).forEach(k => {
      if (cleanFilters[k] === undefined) delete cleanFilters[k];
    });

    let jobId;
    try {
      const dispatchRes = await adminAPI.dispatchExport({ type, filters: cleanFilters, columns });
      jobId = dispatchRes.data?.data?.id;
      if (!jobId) throw new Error('No job ID returned');
    } catch (err) {
      if (!mountedRef.current) return;
      fail(err.response?.data?.message || err.message || 'Failed to start export');
      return;
    }

    if (!mountedRef.current) return;
    setExportStatus('processing');

    let attempts = 0;

    const poll = async () => {
      if (!mountedRef.current) return;

      if (attempts++ >= MAX_POLLS) {
        fail('Export timed out. Please try again.');
        return;
      }

      try {
        const statusRes = await adminAPI.checkExportStatus(jobId);
        if (!mountedRef.current) return;

        const status = statusRes.data?.data?.status;

        if (status === 'completed') {
          const downloadRes = await adminAPI.downloadExport(jobId);
          if (!mountedRef.current) return;
          const name = statusRes.data?.data?.file_name || filename || 'export.csv';
          downloadBlob(downloadRes, name);
          setExportStatus('completed');
          setExporting(false);
          toast.success('Export ready');
          return;
        }

        if (status === 'failed') {
          fail(statusRes.data?.data?.error_message || 'Export failed');
          return;
        }

        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (!mountedRef.current) return;
        fail(err.response?.data?.message || err.message || 'Export failed');
      }
    };

    timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
  }, [fail]);

  return { runExport, exporting, exportStatus, exportError, resetExport };
}
