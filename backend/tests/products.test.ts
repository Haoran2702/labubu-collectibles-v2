import request from 'supertest';
import app from '../app';

describe('Products API', () => {
  it('should get all products', async () => {
    const res = await request(app)
      .get('/api/products')
      .send();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('should return 404 for non-existent product', async () => {
    const res = await request(app)
      .get('/api/products/999999')
      .send();
    expect(res.status).toBe(404);
  });
}); 