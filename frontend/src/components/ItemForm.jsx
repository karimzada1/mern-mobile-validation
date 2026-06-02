import { useState, useEffect } from 'react';

const EMPTY = { name: '', description: '', mobileNumber: '', categoryId: '' };

export default function ItemForm({ initial, categories, onSubmit, onCancel }) {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    setForm(initial ? {
      name:         initial.name          || '',
      description:  initial.description   || '',
      mobileNumber: initial.mobileNumber  || '',
      categoryId:   initial.category?._id || '',
    } : EMPTY);
    setError('');
  }, [initial]);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        name:         form.name,
        description:  form.description,
        mobileNumber: form.mobileNumber || null,
        categoryId:   form.categoryId   || null,
      });
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="field">
        <label>Name</label>
        <input name="name" value={form.name} onChange={handle} required placeholder="Item name" />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handle} required rows={3} placeholder="What is this item?" />
      </div>

      <div className="field">
        <label>Mobile number</label>
        <input name="mobileNumber" value={form.mobileNumber} onChange={handle} required placeholder="+1 415 555 2671" />
        <span className="hint">Include country code, e.g. +20 for Egypt</span>
      </div>

      <div className="field">
        <label>Category <span className="opt-label">(optional)</span></label>
        <select name="categoryId" value={form.categoryId} onChange={handle}>
          <option value="">No category</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      <div className="form-footer">
        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Add item'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}
