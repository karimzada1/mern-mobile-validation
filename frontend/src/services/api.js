import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Items
export const getItems = () => api.get('/items').then(r => r.data);
export const createItem = (data) => api.post('/items', data).then(r => r.data);
export const updateItem = (id, data) => api.put(`/items/${id}`, data).then(r => r.data);
export const deleteItem = (id) => api.delete(`/items/${id}`).then(r => r.data);

// Categories
export const getCategories = () => api.get('/categories').then(r => r.data);
export const createCategory = (data) => api.post('/categories', data).then(r => r.data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then(r => r.data);
