import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 201 and a token for valid registration', async () => {
      const email = `testuser_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should login successfully after registration', async () => {
      const email = `testlogin_${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(email);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
}); 