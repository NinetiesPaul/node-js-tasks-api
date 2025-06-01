const request = require('supertest');
const app = require('../../app.js');

let token = "";
let tasksOpen = 0;
let tasksClosed = 0;
let tasksHotfix = 0;
let tasksFeature = 0;
let taskAssigned = 0;
let taskUnassigned = 0;


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

describe('Summarize tasks', () => {
  it('should try to list all tasks and summarize them', async () => {
    const res = await request(app).get('/api/task/list').set('Authorization', `Bearer ${token}`);

    res.body.data.tasks.forEach((task) => {
      if (task.status == "open") {
        tasksOpen += 1;
      }

      if (task.status == "closed") {
        tasksClosed += 1;
      }

      if (task.type == "hotfix") {
        tasksHotfix += 1;
      }

      if (task.type == "feature") {
        tasksFeature += 1;
      }

      if (task.assignees.length == 0) {
        taskUnassigned += 1;
      } else {
        taskAssigned += 1;
      }
    });
  });
});

describe('Count open Tasks', () => {
  it('should try to list all tasks and assert the number of tasks', async () => {
    const res = await request(app).get('/api/task/list?status=open').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.total).toBe(tasksOpen);
  });
});

describe('Count closed Tasks', () => {
  it('should try to list all tasks and assert the number of tasks', async () => {
    const res = await request(app).get('/api/task/list?status=closed').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.total).toBe(tasksClosed);
  });
});

describe('Count Hotfix Tasks', () => {
  it('should try to list all tasks and assert the number of tasks', async () => {
    const res = await request(app).get('/api/task/list?type=hotfix').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.total).toBe(tasksHotfix);
  });
});

describe('Count Feature Tasks', () => {
  it('should try to list all tasks and assert the number of tasks', async () => {
    const res = await request(app).get('/api/task/list?type=feature').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.total).toBe(tasksFeature);
  });
});

describe('Count Assigned Tasks', () => {
  it('should try to list all tasks and assert the number of tasks', async () => {
    const res = await request(app).get('/api/task/list?assigned=true').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.total).toBe(taskAssigned);
  });
});

describe('Count Unassigned Tasks', () => {
  it('should try to list all tasks and assert the number of tasks', async () => {
    const res = await request(app).get('/api/task/list?assigned=false').set('Authorization', `Bearer ${token}`);

    expect(res.body.data.total).toBe(taskUnassigned);
  });
});

describe('Validate bad query params', () => {
  it('should try to list all tasks using invalid parameters and throw error messages', async () => {
    const res = await request(app).get('/api/task/list?type=type&status=status&created_by=999999').set('Authorization', `Bearer ${token}`);

    expect(res.body.message.includes("INVALID_TYPE")).toBe(true);
    expect(res.body.message.includes("INVALID_STATUS")).toBe(true);
    expect(res.body.message.includes("USER_NOT_FOUND")).toBe(true);
  });
});

/*
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
*/