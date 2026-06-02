export default function ItemList({ items, onEdit, onDelete }) {
  return (
    <table className="item-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Mobile</th>
          <th>Country / Operator</th>
          <th>Category</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr className="empty-row">
            <td colSpan={6}>No items yet — add one using the form.</td>
          </tr>
        ) : items.map(item => (
          <tr key={item._id}>
            <td><span className="cell-name">{item.name}</span></td>
            <td style={{ maxWidth: 200, color: '#6b7280' }}>{item.description}</td>
            <td>
              {item.mobileNumber
                ? <span className="cell-mono">{item.mobileNumber}</span>
                : <span className="cell-muted">—</span>}
            </td>
            <td>
              {item.mobileDetails ? (
                <div className="badge-stack">
                  <span className="badge badge-blue">{item.mobileDetails.countryName}</span>
                  <span className="badge badge-green">{item.mobileDetails.operatorName}</span>
                </div>
              ) : <span className="cell-muted">—</span>}
            </td>
            <td>
              {item.category
                ? <span className="badge badge-indigo">{item.category.name}</span>
                : <span className="cell-muted">—</span>}
            </td>
            <td>
              <div className="row-actions">
                <button className="btn btn-outline btn-sm" onClick={() => onEdit(item)}>Edit</button>
                <button className="btn btn-danger-ghost btn-sm" onClick={() => onDelete(item._id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
