const request = require('supertest');
const app = require('../../app.js');

let token = "";
let taskId = "";

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

  it('should create a task', async () => {
    const res = await request(app).post('/api/task/create').send({
      title: "Task title",
      description: "Task description",
      type: "hotfix"
    }).set('Authorization', `Bearer ${token}`);

    taskId = res.body.data.id;
  });
});

describe('Invalid fields', () => {
  it('should try to update task with invalid fields', async () => {
    const res = await request(app).put('/api/task/update/' + taskId).send({
      title: 99,
      description: 99,
      type: 99,
      status: 99
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("TITLE_NOT_STRING")).toBe(true);
    expect(res.body.message.includes("DESCRIPTION_NOT_STRING")).toBe(true);
    expect(res.body.message.includes("TYPE_NOT_STRING")).toBe(true);
    expect(res.body.message.includes("STATUS_NOT_STRING")).toBe(true);
  });
});

describe('Empty fields', () => {
  it('should try to update task with empty fields', async () => {
    const res = await request(app).put('/api/task/update/' + taskId).send({
      title: "",
      description: "",
      type: "",
      status: ""
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMPTY_TITLE")).toBe(true);
    expect(res.body.message.includes("EMPTY_DESCRIPTION")).toBe(true);
    expect(res.body.message.includes("EMPTY_TYPE")).toBe(true);
    expect(res.body.message.includes("EMPTY_STATUS")).toBe(true);
  });
});

describe('Task not found', () => {
  it('should try to update task with an invalid task id', async () => {
    const res = await request(app).put('/api/task/update/999').send({
      title: "New title",
      description: "New description"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.body.message.includes("TASK_NOT_FOUND")).toBe(true);
  });
});

describe('Task not found on close', () => {
  it('should try to close a task with an invalid task id', async () => {
    const res = await request(app).put('/api/task/close/999').send({
      title: "New title",
      description: "New description"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.body.message.includes("TASK_NOT_FOUND")).toBe(true);
  });
});
