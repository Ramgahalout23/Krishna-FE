import { Upload, X, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { adminAPI } from '../../api/admin';
import toast from '../../utils/toast';
import { getImageUrl, getVideoUrl } from '../../utils/formatters';

const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";

/**
 * Safely normalizes value into an array of URL strings.
 * Handles arrays, objects, comma-separated strings, JSON array strings, and empty/null.
 */
function normalizeUrls(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map(item => (typeof item === 'object' ? item?.url : item)).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(item => (typeof item === 'object' ? item?.url : item)).filter(Boolean);
        }
      } catch {}
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export default function ImageUploadZone({
  label = 'Upload Image',
  value = '',
  onChange,
  multiple = false,
  maxFiles = 10,
  accept = 'image/*',
  acceptHint = 'PNG, JPG, JPEG, WEBP or AVIF (Max 10MB)',
  isVideo = false
}) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingPreviews, setPendingPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // In-memory map from server URLs to local blob URLs for instant, crystal-clear display
  const blobMapRef = useRef({});

  // Cleanup created blob URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      Object.values(blobMapRef.current).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handleFileChange = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const files = multiple ? rawFiles : [rawFiles[0]];

    // Max size check: 40MB for videos, 10MB for images
    const maxBytes = isVideo ? 40 * 1024 * 1024 : 10 * 1024 * 1024;
    const oversized = files.find(f => f.size > maxBytes);
    if (oversized) {
      toast.error(`"${oversized.name}" exceeds maximum allowed size (${isVideo ? '40MB' : '10MB'})`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // ── Instant Client-Side Preview (0ms latency, user immediately sees exact photo) ──
    const localPreviews = files.map(file => {
      const blobUrl = URL.createObjectURL(file);
      blobMapRef.current[blobUrl] = blobUrl;
      return { file, blobUrl, name: file.name };
    });

    setPendingPreviews(localPreviews);
    setUploading(true);
    const formData = new FormData();

    try {
      if (multiple) {
        files.forEach(file => formData.append('files[]', file));
        const res = await adminAPI.uploadMultipleFiles(formData);
        const dataObj = res.data?.data || res.data || {};
        const fileList = dataObj.files || (Array.isArray(dataObj) ? dataObj : []);
        const urls = fileList.map(f => (typeof f === 'object' ? f?.url : f)).filter(Boolean);

        if (urls.length === 0 && dataObj.url) {
          urls.push(dataObj.url);
        }

        // Link returned server URLs to the local blob previews
        urls.forEach((serverUrl, idx) => {
          if (localPreviews[idx]?.blobUrl) {
            blobMapRef.current[serverUrl] = localPreviews[idx].blobUrl;
          }
        });

        // Combine existing images with newly uploaded ones
        const currentUrls = normalizeUrls(value);
        const nextUrls = [...currentUrls, ...urls].slice(0, maxFiles);

        onChange(nextUrls.join(', '));
        toast.success(`Uploaded ${urls.length || files.length} image(s)!`);
      } else {
        formData.append('file', files[0]);
        const res = await adminAPI.uploadFile(formData);
        const dataObj = res.data?.data || res.data || {};
        const url = dataObj.url || (typeof dataObj === 'string' ? dataObj : '');

        if (url && localPreviews[0]?.blobUrl) {
          blobMapRef.current[url] = localPreviews[0].blobUrl;
        }

        onChange(url);
        toast.success('Uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to upload asset');
    } finally {
      setPendingPreviews([]);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (urlToRemove) => {
    if (multiple) {
      const currentUrls = normalizeUrls(value);
      const nextUrls = currentUrls.filter(u => u !== urlToRemove);
      onChange(nextUrls.join(', '));
    } else {
      onChange('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const event = { target: { files } };
    handleFileChange(event);
  };

  const images = isVideo ? [] : normalizeUrls(value);

  return (
    <div className="w-full flex flex-col gap-2" style={{ width: '100%' }}>
      {label && (
        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider" style={{ display: 'block' }}>
          {label}
        </label>
      )}

      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[110px] ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-white hover:border-black'
        } group ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        style={{
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          accept={accept}
          className="hidden"
        />

        {uploading ? (
          <Loader2 className="w-7 h-7 text-text-primary animate-spin" />
        ) : (
          <Upload className="w-7 h-7 text-text-muted group-hover:text-text-primary transition-colors" />
        )}

        <div className="text-xs font-semibold text-text-secondary">
          {uploading ? 'Uploading asset(s)...' : 'Drag & Drop or Click to Upload'}
        </div>
        <p className="text-[10px] text-text-muted" style={{ margin: 0 }}>{acceptHint}</p>
      </div>

      {/* Preview Section */}
      {isVideo && (value || pendingPreviews[0]) ? (
        <div className="relative rounded-lg overflow-hidden border border-border bg-black mt-1.5" style={{ position: 'relative' }}>
          <video
            src={pendingPreviews[0]?.blobUrl || blobMapRef.current[value] || getVideoUrl(value)}
            controls
            className="w-full max-h-44 object-contain bg-black"
          />
          <button
            type="button"
            onClick={() => handleRemove(value)}
            className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center shadow transition-colors"
            style={{ position: 'absolute', top: 6, right: 6 }}
            title="Remove video"
          >
            <X size={14} />
          </button>
        </div>
      ) : (images.length > 0 || pendingPreviews.length > 0) ? (
        <div
          className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-1.5"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: '0.625rem',
            marginTop: '0.375rem'
          }}
        >
          {/* Confirmed / Saved Images */}
          {images.map((imgUrl, idx) => {
            // Prefer local high-res blob preview if available; fallback to getImageUrl
            const displaySrc = blobMapRef.current[imgUrl] || getImageUrl(imgUrl);

            return (
              <div
                key={`${idx}-${imgUrl}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-white shadow-sm"
                title={imgUrl}
                style={{
                  position: 'relative',
                  aspectRatio: '1 / 1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border, #e2e8f0)',
                  background: '#fff'
                }}
              >
                <img
                  loading="lazy"
                  src={displaySrc}
                  alt={`Asset preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    const currentSrc = e.currentTarget.src || '';
                    // 1. If loaded from frontend host (dotoydo.com) instead of api host, retry against api.dotoydo.com
                    if (!currentSrc.includes('api.dotoydo.com') && (imgUrl.includes('/storage/') || imgUrl.includes('storage/'))) {
                      const storagePath = imgUrl.replace(/^.*storage\//, 'storage/');
                      const retryUrl = `https://api.dotoydo.com/${storagePath}`;
                      if (currentSrc !== retryUrl) {
                        e.currentTarget.src = retryUrl;
                        return;
                      }
                    }
                    // 2. If blocked due to http on https, upgrade to https
                    if (currentSrc.startsWith('http://')) {
                      e.currentTarget.src = currentSrc.replace(/^http:\/\//, 'https://');
                      return;
                    }
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(imgUrl);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center shadow transition-colors"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                  title="Remove image"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}

          {/* Pending / In-flight Upload Previews */}
          {pendingPreviews.map((item, idx) => (
            <div
              key={`pending-${idx}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-blue-400 bg-gray-50 shadow-sm"
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '2px dashed #3b82f6',
                background: '#f8fafc'
              }}
            >
              <img
                src={item.blobUrl}
                alt="Uploading..."
                className="w-full h-full object-cover opacity-60"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.6 }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.25)'
                }}
              >
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
