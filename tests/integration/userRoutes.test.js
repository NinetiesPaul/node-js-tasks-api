const request = require('supertest');
const app = require('../../app.js');

let randomName = "";

describe('POST /register', () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomName += characters.charAt(randomIndex);
  }

  it('should register a user', async () => {
    const res = await request(app).post('/register').send({
      name: randomName + "_fake", email: randomName + "@fakeuser.com", password: "123456"
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/users/list', () => {
  let users = [];

  it('should return a list of users', async () => {
    const res = await request(app).get('/api/users/list');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.total).toBe("number");
    expect(typeof res.body.data.users).toBe("object");

    users = res.body.data.users
  });

  it('returned list of users should be greater than 1', async () => {
    expect(users.length).toBeGreaterThan(0);
  });
});

describe('POST /login', () => {
  it('should authenticate a user', async () => {
    const res = await request(app).post('/login').send({
      username: randomName + "@fakeuser.com",
      password: "123456"
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
  });
});
