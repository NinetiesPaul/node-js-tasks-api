const request = require('supertest');
const app = require('../../app.js');

let token = "";

describe('Test set up', () => {
  let firstUser = null;

  it('should get a list of user', async () => {
    const res = await request(app).get('/api/users/list');
    firstUser = res.body.data.users[0];
  });

  it('should authenticate a user', async () => {
    const res = await request(app).post('/login').send({
      username: firstUser['email'],
      password: "123456"
    });

    token = res.body.token;
  });
});

describe('Missing Fields', () => {
  it('should try to create task with missing fields', async () => {
    const res = await request(app).post('/api/task/create').send({}).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("MISSING_TITLE")).toBe(true);
    expect(res.body.message.includes("MISSING_DESCRIPTION")).toBe(true);
    expect(res.body.message.includes("MISSING_TYPE")).toBe(true);
  });
});

describe('Invalid fields', () => {
  it('should try to create task with invalid fields', async () => {
    const res = await request(app).post('/api/task/create').send({
      title: 99,
      description: 99,
      type: 99
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("TITLE_NOT_STRING")).toBe(true);
    expect(res.body.message.includes("DESCRIPTION_NOT_STRING")).toBe(true);
    expect(res.body.message.includes("TYPE_NOT_STRING")).toBe(true);
  });
});

describe('Empty fields', () => {
  it('should try to create task with empty fields', async () => {
    const res = await request(app).post('/api/task/create').send({
      title: "",
      description: "",
      type: ""
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMPTY_TITLE")).toBe(true);
    expect(res.body.message.includes("EMPTY_DESCRIPTION")).toBe(true);
    expect(res.body.message.includes("EMPTY_TYPE")).toBe(true);
  });
});
/*
describe('Invalid Email', () => {
  it('should try to create task with an invalid email', async () => {
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
  it('should try to create task with email already taken', async () => {
    const res = await request(app).post('/register').send({
      "name": "John Doe",
      "email": "s.dante@lcn.com",
      "password": "password"
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMAIL_ALREADY_TAKEN")).toBe(true);
  });
});*/
