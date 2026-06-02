require('./setup');
const request = require('supertest');
const axios = require('axios');
const app = require('../src/index');

// Mock the mobile validation microservice so tests don't need it running
jest.mock('axios');

const VALID_MOBILE_RESPONSE = {
  data: {
    valid: true,
    countryCode: '+1',
    countryName: 'United States',
    operatorName: 'AT&T',
  },
};

const INVALID_MOBILE_RESPONSE = {
  data: { valid: false, error: 'Invalid number' },
};

beforeEach(() => {
  axios.post.mockReset();
});

describe('Items API — basic CRUD', () => {
  test('GET /api/items — returns empty array initially', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/items — creates item without mobile number', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Widget', description: 'A nice widget' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Widget');
    expect(res.body.description).toBe('A nice widget');
    expect(res.body.mobileNumber).toBeNull();
    expect(res.body.mobileDetails).toBeNull();
  });

  test('POST /api/items — rejects missing name', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ description: 'No name item' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /api/items — rejects missing description', async () => {
    const res = await request(app)
      .post('/api/items')
      .send({ name: 'Item without desc' });
    expect(res.status).toBe(400);
  });

  test('GET /api/items — lists created items', async () => {
    await request(app).post('/api/items').send({ name: 'A', description: 'desc A' });
    await request(app).post('/api/items').send({ name: 'B', description: 'desc B' });
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('PUT /api/items/:id — updates item fields', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'Old name', description: 'Old desc' });
    const res = await request(app)
      .put(`/api/items/${created.body._id}`)
      .send({ name: 'New name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New name');
    expect(res.body.description).toBe('Old desc'); // unchanged
  });

  test('PUT /api/items/:id — 404 for unknown id', async () => {
    const res = await request(app)
      .put('/api/items/64aaaaaaaaaaaaaaaaaaaaa1')
      .send({ name: 'x' });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/items/:id — deletes item', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'ToDelete', description: 'desc' });
    const del = await request(app).delete(`/api/items/${created.body._id}`);
    expect(del.status).toBe(200);
    const list = await request(app).get('/api/items');
    expect(list.body.length).toBe(0);
  });

  test('DELETE /api/items/:id — 404 for unknown id', async () => {
    const res = await request(app).delete('/api/items/64aaaaaaaaaaaaaaaaaaaaa1');
    expect(res.status).toBe(404);
  });
});

describe('Items API — mobile number validation', () => {
  test('accepts item with valid mobile number and stores details', async () => {
    axios.post.mockResolvedValueOnce(VALID_MOBILE_RESPONSE);
    const res = await request(app).post('/api/items').send({
      name: 'Mobile Item',
      description: 'has a phone',
      mobileNumber: '+12025551234',
    });
    expect(res.status).toBe(201);
    expect(res.body.mobileNumber).toBe('+12025551234');
    expect(res.body.mobileDetails.countryCode).toBe('+1');
    expect(res.body.mobileDetails.countryName).toBe('United States');
    expect(res.body.mobileDetails.operatorName).toBe('AT&T');
  });

  test('rejects item with invalid mobile number', async () => {
    axios.post.mockResolvedValueOnce(INVALID_MOBILE_RESPONSE);
    const res = await request(app).post('/api/items').send({
      name: 'Bad phone',
      description: 'invalid phone',
      mobileNumber: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid mobile number');
  });

  test('returns 503 when validation service is unreachable', async () => {
    axios.post.mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app).post('/api/items').send({
      name: 'Service down',
      description: 'service is down',
      mobileNumber: '+12025551234',
    });
    expect(res.status).toBe(503);
  });

  test('can update mobile number on an existing item', async () => {
    const created = await request(app)
      .post('/api/items')
      .send({ name: 'Item', description: 'desc' });

    axios.post.mockResolvedValueOnce(VALID_MOBILE_RESPONSE);
    const res = await request(app)
      .put(`/api/items/${created.body._id}`)
      .send({ mobileNumber: '+12025551234' });
    expect(res.status).toBe(200);
    expect(res.body.mobileDetails.operatorName).toBe('AT&T');
  });

  test('can clear mobile number by passing null', async () => {
    axios.post.mockResolvedValueOnce(VALID_MOBILE_RESPONSE);
    const created = await request(app).post('/api/items').send({
      name: 'Has phone',
      description: 'desc',
      mobileNumber: '+12025551234',
    });

    const res = await request(app)
      .put(`/api/items/${created.body._id}`)
      .send({ mobileNumber: null });
    expect(res.status).toBe(200);
    expect(res.body.mobileNumber).toBeNull();
    expect(res.body.mobileDetails).toBeNull();
  });
});

describe('Items API — category association', () => {
  test('creates item linked to a category', async () => {
    const cat = await request(app)
      .post('/api/categories')
      .send({ name: 'Gadgets' });

    const res = await request(app).post('/api/items').send({
      name: 'Phone',
      description: 'A phone',
      categoryId: cat.body._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.category._id).toBe(cat.body._id);
    expect(res.body.category.name).toBe('Gadgets');
  });
});
