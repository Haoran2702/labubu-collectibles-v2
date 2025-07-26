import request from 'supertest';
import app from '../app';

describe('Orders API', () => {
  let token: string;
  let orderId: string;

  beforeAll(async () => {
    // Register and login a user
    const email = `orderuser_${Date.now()}@example.com`;
    await request(app)
      .post('/api/auth/register')
      .send({
        email,
        password: 'password123',
        firstName: 'Order',
        lastName: 'User'
      });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    token = res.body.token;
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should create an order with valid data', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ id: 1, quantity: 1, price: 10 }], // Use seeded product ID 1
        total: 10,
        shippingInfo: { name: 'Test', address: '123 Main St' },
        orderDate: new Date().toISOString()
      });
    console.log('Order creation response:', res.status, res.body); // Log for debugging
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    if (res.status === 201) {
      orderId = res.body.id;
    }
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .send();
    expect(res.status).toBe(401);
  });

  it('should get the created order', async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
  });

  it('should return 404 for non-existent order', async () => {
    const res = await request(app)
      .get('/api/orders/nonexistentid')
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res.status).toBe(404);
  });
}); 