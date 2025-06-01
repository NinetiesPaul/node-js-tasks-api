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

describe('Missing fields', () => {
  it('should try to create a comment with missing fields', async () => {
    const res = await request(app).post('/api/task/comment/' + taskId).send({}).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("MISSING_TEXT")).toBe(true);
  });
});

describe('Invalid fields', () => {
  it('should try to create a comment with invalid fields', async () => {
    const res = await request(app).post('/api/task/comment/' + taskId).send({
      text: 99
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("TEXT_NOT_STRING")).toBe(true);
  });
});

describe('Empty fields', () => {
  it('should try to create a comment with empty fields', async () => {
    const res = await request(app).post('/api/task/comment/' + taskId).send({
      text: ""
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("EMPTY_TEXT")).toBe(true);
  });
});

describe('Task not found', () => {
  it('should try to create a comment with invalid task id', async () => {
    const res = await request(app).post('/api/task/comment/999').send({
      text: "This is the comment text"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message.includes("TASK_NOT_FOUND")).toBe(true);
  });
});

describe('Comment not found', () => {
  it('should try to delete comment with invalid comment id', async () => {
    const res = await request(app).delete('/api/task/comment/999').send({
      text: "This is the comment text"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message.includes("COMMENT_NOT_FOUND")).toBe(true);
  });
});

