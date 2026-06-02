import { useState, useEffect, useCallback } from 'react';
import { getItems, createItem, updateItem, deleteItem, getCategories } from './services/api';
import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import CategoryManager from './components/CategoryManager';

export default function App() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const fetchItems = useCallback(async () => {
    try { setItems(await getItems()); }
    catch { setGlobalError('Could not load items. Is the backend running?'); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try { setCategories(await getCategories()); } catch {}
  }, []);

  useEffect(() => { fetchItems(); fetchCategories(); }, [fetchItems, fetchCategories]);

  const handleAdd    = async (data) => { await createItem(data); fetchItems(); };
  const handleUpdate = async (data) => { await updateItem(editTarget._id, data); setEditTarget(null); fetchItems(); };
  const handleDelete = async (id)   => {
    if (!window.confirm('Delete this item?')) return;
    await deleteItem(id); fetchItems();
  };

  const withMobile    = items.filter(i => i.mobileNumber).length;
  const withCategory  = items.filter(i => i.category).length;

  return (
    <div className="app">
      <nav className="topnav">
        <div className="topnav-brand">
          <div className="brand-dot">IM</div>
          <div>
            <div className="topnav h1">Item Manager</div>
            <div className="topnav-sub">MERN Stack Application</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowCategories(v => !v)}>
          {showCategories ? 'Hide categories' : 'Manage categories'}
        </button>
      </nav>

      {globalError && <div className="alert alert-error">{globalError}</div>}

      {showCategories && (
        <CategoryManager categories={categories} onRefresh={fetchCategories} />
      )}

      <div className="page-grid">
        {/* ── Left panel: form ── */}
        <aside>
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">{editTarget ? 'Edit item' : 'Add item'}</span>
              {editTarget && (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget(null)}>
                  Cancel
                </button>
              )}
            </div>
            <div className="panel-body">
              <ItemForm
                initial={editTarget}
                categories={categories}
                onSubmit={editTarget ? handleUpdate : handleAdd}
                onCancel={editTarget ? () => setEditTarget(null) : null}
              />
            </div>
          </div>
        </aside>

        {/* ── Right: stats + table ── */}
        <div className="main-content">
          <div className="stats-bar">
            <div className="stat-card">
              <div className="stat-label">Total Items</div>
              <div className="stat-value">{items.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">With Mobile</div>
              <div className="stat-value">{withMobile}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Categorised</div>
              <div className="stat-value">{withCategory}</div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <span className="table-card-title">All Items</span>
            </div>
            <ItemList items={items} onEdit={setEditTarget} onDelete={handleDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}
