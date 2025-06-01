const request = require('supertest');
const app = require('../../app.js');

let token = "";
let taskId = 0;
let closedTaskId = 0;
let firstUser = null;

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

  it('should create a task to have an assignment', async () => {
    const res = await request(app).post('/api/task/create').send({
      title: "Task title",
      description: "Task description",
      type: "hotfix"
    }).set('Authorization', `Bearer ${token}`);

    taskId = res.body.data.id;
  });

  it('should assign the task to someone', async () => {
    const res = await request(app).post('/api/task/assign/' + taskId).send({
      assigned_to: firstUser['id'],
    }).set('Authorization', `Bearer ${token}`);
  });

  it('should create a task and then closed it have an assignment', async () => {
    const res = await request(app).post('/api/task/create').send({
      title: "Task title",
      description: "Task description",
      type: "hotfix"
    }).set('Authorization', `Bearer ${token}`);

    closedTaskId = res.body.data.id;

    await request(app).put('/api/task/close/' + closedTaskId).send({}).set('Authorization', `Bearer ${token}`);
  });
});

describe('Reassign same user fails', () => {
  it('should try to assign a task to someone who already is assigned to it', async () => {
    const res = await request(app).post('/api/task/assign/' + taskId).send({
      assigned_to: firstUser['id']
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(202);
    expect(res.body.message.includes("USER_ALREADY_ASSIGNED")).toBe(true);
  });
});

describe('Update to close with /update fails', () => {
  it('should try to close a task with /update', async () => {
    const res = await request(app).put('/api/task/update/' + taskId).send({
      status: "closed"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("CAN_NOT_UPDATE_TO_CLOSE")).toBe(true);
  });
});

describe('Update closed task fails', () => {
  it('should try to update a task that is closed', async () => {
    const res = await request(app).put('/api/task/update/' + closedTaskId).send({
      type: "hotfix"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("TASK_CLOSED")).toBe(true);
  });
});

describe('Close task already closed fails', () => {
  it('should try to close a task already closed', async () => {
    const res = await request(app).put('/api/task/close/' + closedTaskId).send({}).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message.includes("TASK_ALREADY_CLOSED")).toBe(true);
  });
});
