const request = require('supertest');
const app = require('../../app.js');

describe('Missing Fields', () => {
  it('should try to register with missing fields', async () => {
    const res = await request(app).post('/register').send({
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("MISSING_NAME")).toBe(true);
    expect(res.body.message.includes("MISSING_EMAIL")).toBe(true);
    expect(res.body.message.includes("MISSING_PASSWORD")).toBe(true);
  });
});

describe('Invalid fields', () => {
  it('should try to register with invalid fields', async () => {
    const res = await request(app).post('/register').send({
      "name": 99,
      "email": 99,
      "password": "password"
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMAIL_NOT_STRING")).toBe(true);
    expect(res.body.message.includes("NAME_NOT_STRING")).toBe(true);
  });
});

describe('Empty fields', () => {
  it('should try to register with empty fields', async () => {
    const res = await request(app).post('/register').send({
      "name": "",
      "email": "",
      "password": ""
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMPTY_NAME")).toBe(true);
    expect(res.body.message.includes("EMPTY_EMAIL")).toBe(true);
    expect(res.body.message.includes("EMPTY_PASSWORD")).toBe(true);
  });
});

describe('Invalid Email', () => {
  it('should try to register with an invalid email', async () => {
    const res = await request(app).post('/register').send({
      "name": "John Doe",
      "email": "j.doemail.com",
      "password": "password"
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("INVALID_EMAIL")).toBe(true);
  });
});

describe('Email taken', () => {
  it('should try to register with email already taken', async () => {
    const res = await request(app).post('/register').send({
      "name": "John Doe",
      "email": "s.dante@lcn.com",
      "password": "password"
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMAIL_ALREADY_TAKEN")).toBe(true);
  });
});
