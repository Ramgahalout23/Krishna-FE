import { Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../api/admin';
import { settingsAPI } from '../../../api/settings';
import toast from '../../../utils/toast';

export default function SizeGuideTab({ settings, setSettings, loading }) {
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Parse current selected categories from settings on mount
  useEffect(() => {
    const saved = settings.category_based_sizing;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedCats(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSelectedCats([]);
      }
    } else {
      setSelectedCats([]);
    }
  }, [settings.category_based_sizing]);

  // Fetch all categories
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setCatsLoading(true);
      try {
        const res = await adminAPI.getCategories({ limit: 200 });
        const data = res.data?.data || res.data || [];
        const cats = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
        if (!cancelled) setAllCategories(cats);
      } catch (err) {
        console.warn('Failed to load categories:', err);
        if (!cancelled) toast.error('Failed to load categories');
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  const toggleCategory = (slug) => {
    setSelectedCats(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      }
      return [...prev, slug];
    });
  };

  // Save directly via API — avoids the parent's fragile state-diff logic
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.updateSetting('category_based_sizing', JSON.stringify(selectedCats));
      // Sync local state so the UI reflects the saved value immediately
      setSettings(prev => ({ ...prev, category_based_sizing: JSON.stringify(selectedCats) }));
      toast.success('Size guide settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save size guide settings');
      console.error('Failed to save size guide settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const isAllSelected = allCategories.length > 0 && selectedCats.length === allCategories.length;
  const isNoneSelected = selectedCats.length === 0;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h3>Category-Based Size Guide</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
          Select which product categories should display a <strong>Size Guide</strong> button on the product detail page.
          Categories with a size guide will let customers view sizing charts and measurement tips.
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className={`btn-sm ${isAllSelected ? 'btn-dark' : 'btn-outline'}`}
          onClick={() => {
            setSelectedCats(allCategories.map(c => c.slug).filter(Boolean));
          }}
          style={{ fontSize: '0.78rem' }}
        >
          {isAllSelected ? '✓ All Selected' : 'Select All'}
        </button>
        <button
          className={`btn-sm ${isNoneSelected ? 'btn-dark' : 'btn-outline'}`}
          onClick={() => setSelectedCats([])}
          style={{ fontSize: '0.78rem' }}
        >
          {isNoneSelected ? '✓ None Selected' : 'Deselect All'}
        </button>
      </div>

      {/* Summary badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.3rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        background: selectedCats.length > 0 ? '#f0fdf4' : '#fef2f2',
        color: selectedCats.length > 0 ? '#16a34a' : '#dc2626',
        border: `1px solid ${selectedCats.length > 0 ? '#bbf7d0' : '#fecaca'}`,
        marginBottom: '1rem',
      }}>
        {selectedCats.length > 0
          ? `🟢 ${selectedCats.length} categor${selectedCats.length === 1 ? 'y' : 'ies'} show the size guide`
          : '🔴 Size guide is hidden for all categories'}
      </div>

      {/* Category List */}
      {catsLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto 0.5rem' }} />
          <p style={{ fontSize: '0.85rem' }}>Loading categories...</p>
        </div>
      ) : allCategories.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontSize: '0.85rem' }}>No categories found. Create categories first.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {allCategories.map(cat => {
            const isSelected = selectedCats.includes(cat.slug);
            return (
              <label
                key={cat.id || cat.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  background: isSelected ? 'var(--off-white)' : 'white',
                  border: `1px solid ${isSelected ? 'var(--border)' : '#f0f0f0'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  border: `2px solid ${isSelected ? '#1a1a1a' : '#d1d5db'}`,
                  background: isSelected ? '#1a1a1a' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}>
                  {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                </div>

                {/* Category icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isSelected ? '#1a1a1a' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  color: isSelected ? 'white' : '#666',
                  transition: 'all 0.15s ease',
                }}>
                  {cat.name?.charAt(0) || '📦'}
                </div>

                {/* Category name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: '#1a1a1a',
                  }}>
                    {cat.name}
                  </div>
                  {cat.slug && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                      {cat.slug}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className={`status-badge ${isSelected ? 'status-active' : 'status-pending'}`}
                  style={{ flexShrink: 0 }}
                >
                  {isSelected ? 'Size Guide ✓' : 'No Guide'}
                </span>

                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(cat.slug)}
                  style={{ display: 'none' }}
                />
              </label>
            );
          })}
        </div>
      )}

      <div className="form-actions" style={{ marginTop: '1.5rem' }}>
        <button
          className="btn-dark btn-sm"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Size Guide Settings'}
        </button>
      </div>
    </div>
  );
}
