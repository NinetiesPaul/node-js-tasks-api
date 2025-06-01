const request = require('supertest');
const app = require('../../app.js');

let token = "";

function generateName() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomName = "";
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomName += characters.charAt(randomIndex);
  }

  return randomName;
}

describe('Test set up', () => {
  let firstUser = null;

  it('should get a list of user', async () => {
    const res = await request(app).get('/api/users/list');
    firstUser = res.body.data.users[0];

    if (firstUser === undefined) {
      let randomUser = generateName();
      const res = await request(app).post('/register').send({
        name: randomUser + "_fake", email: randomUser + "@fakeuser.com", password: "123456"
      });

      firstUser = res.body.data;
    }
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
