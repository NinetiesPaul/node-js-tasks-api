const request = require('supertest');
const app = require('../../app.js');

let token = "";
let taskId = "";

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
  it('should try to assign a task with missing fields', async () => {
    const res = await request(app).post('/api/task/assign/' + taskId).send({}).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("MISSING_ASSIGNED_TO")).toBe(true);
  });
});

describe('Invalid fields', () => {
  it('should try to assign a task with invalid fields', async () => {
    const res = await request(app).post('/api/task/assign/' + taskId).send({
      assigned_to: "assigned_to"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("ASSIGNED_TO_NOT_INTEGER")).toBe(true);
  });
});

describe('Task not found', () => {
  it('should try to assign a task with invalid task id', async () => {
    const res = await request(app).post('/api/task/assign/999').send({
      assigned_to: 1
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message.includes("TASK_NOT_FOUND")).toBe(true);
  });
});

describe('User not found', () => {
  it('should try to assign a task with invalid user id', async () => {
    const res = await request(app).post('/api/task/assign/' + taskId).send({
      assigned_to: 999
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message.includes("USER_NOT_FOUND")).toBe(true);
  });
});

describe('Assignment not found', () => {
  it('should try to unassign with invalid assignment id', async () => {
    const res = await request(app).delete('/api/task/UNassign/999').send({
      assigned_to: 1
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message.includes("ASSIGNMENT_NOT_FOUND")).toBe(true);
  });
});
