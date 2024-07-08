const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const { pool } = require('../models/User');
const { JWT_SECRET } = process.env;

beforeAll(async () => {
  try {
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE organisations RESTART IDENTITY CASCADE');
  } catch (err) {
    console.error('Error in beforeAll setup:', err);
  }
});

describe('User Registration', () => {
  it('should register a user successfully', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.user.firstName).toBe('John');
    expect(res.body.data.user).toHaveProperty('userId');
    expect(res.body.data.user).toHaveProperty('email');
    expect(res.body.data.user).toHaveProperty('phone');
    expect(res.body.data).toHaveProperty('accessToken');

    const orgRes = await pool.query(
      'SELECT * FROM organisations WHERE userId = $1',
      [res.body.data.user.userId]
    );
    expect(orgRes.rows[0].name).toBe("John's Organisation");
  });

  it('should fail if required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
  });

  it('should fail if email is duplicate', async () => {
    await request(app).post('/auth/register').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    const res = await request(app).post('/auth/register').send({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    expect(res.statusCode).toEqual(422);
  });
});

describe('User Login', () => {
  it('should login a user successfully', async () => {
    await request(app).post('/auth/register').send({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    const res = await request(app).post('/auth/login').send({
      email: 'john.doe@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
  });

  it('should fail with incorrect credentials', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'john.doe@example.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toEqual(401);
  });
});

describe('Token Generation', () => {
  it('should generate a valid JWT token on registration', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    const { accessToken } = res.body.data;
    const decodedToken = jwt.verify(accessToken, JWT_SECRET);

    expect(decodedToken).toHaveProperty('userId');
    expect(decodedToken).toHaveProperty('email', 'alice.smith@example.com');
  });

  it('should expire token correctly', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Bob',
      lastName: 'Brown',
      email: 'bob.brown@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    const { accessToken } = res.body.data;
    const decodedToken = jwt.verify(accessToken, JWT_SECRET);

    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decodedToken.exp;
    expect(expirationTime - currentTime).toBeLessThanOrEqual(3600);
  });
});

describe('Organisation Access', () => {
  it('should not allow access to organisations user does not belong to', async () => {
    const user1 = await request(app).post('/auth/register').send({
      firstName: 'Charlie',
      lastName: 'Day',
      email: 'charlie.day@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    const user2 = await request(app).post('/auth/register').send({
      firstName: 'Dennis',
      lastName: 'Reynolds',
      email: 'dennis.reynolds@example.com',
      password: 'password123',
      phone: '1234567890',
    });

    const orgRes = await request(app)
      .get('/api/organisations')
      .set('Authorization', `Bearer ${user1.body.data.accessToken}`);

    const orgId = orgRes.body.data.organisations[0].orgId;

    const forbiddenOrgRes = await request(app)
      .get(`/api/organisations/${orgId}`)
      .set('Authorization', `Bearer ${user2.body.data.accessToken}`);

    expect(forbiddenOrgRes.statusCode).toEqual(403);
  });
});
