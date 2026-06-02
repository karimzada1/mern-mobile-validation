import { useState } from 'react';
import { createCategory, deleteCategory } from '../services/api';

export default function CategoryManager({ categories, onRefresh }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    setError('');
    try { await createCategory({ name }); setName(''); onRefresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to create category'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    await deleteCategory(id); onRefresh();
  };

  return (
    <div className="cat-bar">
      <div className="cat-bar-head">
        <span className="cat-bar-title">Categories</span>
      </div>

      <form onSubmit={add} className="inline-form">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New category…" required />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

      {categories.length > 0 && (
        <div className="chip-list">
          {categories.map(c => (
            <span key={c._id} className="chip">
              {c.name}
              <button className="chip-del" onClick={() => remove(c._id)}>✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
