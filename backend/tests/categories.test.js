require('./setup');
const request = require('supertest');
const app = require('../src/index');

describe('Categories API', () => {
  test('GET /api/categories — returns empty array initially', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/categories — creates a category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Electronics' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Electronics');
    expect(res.body._id).toBeDefined();
  });

  test('POST /api/categories — rejects missing name', async () => {
    const res = await request(app).post('/api/categories').send({});
    expect(res.status).toBe(400);
  });

  test('GET /api/categories — lists created categories', async () => {
    await request(app).post('/api/categories').send({ name: 'Books' });
    await request(app).post('/api/categories').send({ name: 'Clothing' });
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('PUT /api/categories/:id — updates name', async () => {
    const created = await request(app)
      .post('/api/categories')
      .send({ name: 'Oldname' });
    const res = await request(app)
      .put(`/api/categories/${created.body._id}`)
      .send({ name: 'Newname' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Newname');
  });

  test('DELETE /api/categories/:id — deletes category', async () => {
    const created = await request(app)
      .post('/api/categories')
      .send({ name: 'ToDelete' });
    const del = await request(app).delete(`/api/categories/${created.body._id}`);
    expect(del.status).toBe(200);
    const list = await request(app).get('/api/categories');
    expect(list.body.length).toBe(0);
  });

  test('DELETE /api/categories/:id — 404 for unknown id', async () => {
    const res = await request(app).delete('/api/categories/64aaaaaaaaaaaaaaaaaaaaa1');
    expect(res.status).toBe(404);
  });
});
