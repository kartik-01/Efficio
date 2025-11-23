const request = require('./setup');
const User = require('../models/User');

describe('Users API (integration)', () => {
  // These tests assume JWT middleware is bypassed in test env or we mock req.user. For now just test the route existence.
  test('GET /api/users/me without auth returns 401', async () => {
    const res = await request.get('/api/users/me');
    expect([401, 403]).toContain(res.status);
  });

  test('GET /api/users/ returns 200', async () => {
    const res = await request.get('/api/users');
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
  });
});
