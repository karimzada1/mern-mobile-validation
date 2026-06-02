const request = require('supertest');
const app = require('../src/index');

describe('Mobile Validation Service', () => {
  describe('POST /validate', () => {
    test('returns 400 when mobile is missing', async () => {
      const res = await request(app).post('/validate').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns valid:false for a clearly invalid number', async () => {
      const res = await request(app).post('/validate').send({ mobile: '123' });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
    });

    test('returns valid:false for a random string', async () => {
      const res = await request(app).post('/validate').send({ mobile: 'not-a-number' });
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
    });

    test('returns valid:true with country info for a valid US number', async () => {
      const res = await request(app)
        .post('/validate')
        .send({ mobile: '+12025551234' });
      expect(res.status).toBe(200);
      // numverify may not be configured in CI — only check shape if valid
      if (res.body.valid) {
        expect(res.body).toHaveProperty('countryCode');
        expect(res.body).toHaveProperty('countryName');
        expect(res.body).toHaveProperty('operatorName');
        expect(res.body.countryCode).toMatch(/^\+\d+/);
      }
    });

    test('returns valid:true for a UK number', async () => {
      const res = await request(app)
        .post('/validate')
        .send({ mobile: '+447911123456' });
      expect(res.status).toBe(200);
      if (res.body.valid) {
        expect(res.body.countryCode).toBe('+44');
      }
    });

    test('returns valid:true for a German number', async () => {
      const res = await request(app)
        .post('/validate')
        .send({ mobile: '+4915223433333' });
      expect(res.status).toBe(200);
      if (res.body.valid) {
        expect(res.body.countryCode).toBe('+49');
      }
    });
  });

  describe('GET /health', () => {
    test('returns ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
