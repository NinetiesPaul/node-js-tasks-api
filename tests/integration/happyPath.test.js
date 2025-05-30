const request = require('supertest');
const app = require('../../app.js');

let token = "";
let secondaryToken = "";
let taskId = 0;
let assignmentId = 0;
let commentId = 0;
let firstUser = null;
let secondUser = null;

describe('Happy path set up', () => {
  it('should get a list of user', async () => {
    const res = await request(app).get('/api/users/list');

    firstUser = res.body.data.users[0];
    secondUser = res.body.data.users[1];
  });

  it('should authenticate a user', async () => {
    const res = await request(app).post('/login').send({
      username: firstUser['email'],
      password: "123456"
    });

    token = res.body.token;
  });

  it('should authenticate a second user', async () => {
    const res = await request(app).post('/login').send({
      username: secondUser['email'],
      password: "123456"
    });

    secondaryToken = res.body.token;
  });
});

describe('POST /api/task/create', () => {
  let closedBy = null;
  let closedOn = null;
  let status = "";

  it('should create a task', async () => {
    const res = await request(app).post('/api/task/create').send({
      title: "Task title",
      description: "This is the task description",
      type: "feature"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);

    closedBy = res.body.data.closed_by;
    closedOn = res.body.data.closed_on;
    status = res.body.data.status;
    taskId = res.body.data.id;
  });

  it('the task should be open', async () => {
    expect(closedBy).toBe(null);
    expect(closedOn).toBe(null);
    expect(status).toBe("open");
  });
});

describe('PUT /api/task/update', () => {
  let type = "";
  let status = "";

  it('should update a task', async () => {
    const res = await request(app).put('/api/task/update/' + taskId).send({
      type: "hotfix",
      status: "in_qa"
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);

    status = res.body.data.status;
    type = res.body.data.type;
  });

  it('the task should be different', async () => {
    expect(status).toBe("in_qa");
    expect(type).toBe("hotfix");
  });
});

describe('GET /api/task/view', () => {
  it('the task history should list the update changes', async () => {
    const res = await request(app).get('/api/task/view/' + taskId).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);

    let history = res.body.data.history;
    history.forEach((entry)=>{
      if (entry['field'] == "type") {
        expect(entry['changed_from']).toBe("feature");
        expect(entry['changed_to']).toBe("hotfix");
      }

      if (entry['field'] == "status") {
        expect(entry['changed_from']).toBe("open");
        expect(entry['changed_to']).toBe("in_qa");
      }
    })
  });
});

describe('POST /api/task/assign', () => {
  it('should assign the task to user', async () => {
    const res = await request(app).post('/api/task/assign/' + taskId).send({
      assigned_to: firstUser["id"],
    }).set('Authorization', `Bearer ${secondaryToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.assigned_to.name).toEqual(firstUser['name']);
    expect(res.body.data.assigned_by.name).toEqual(secondUser['name']);
    
    assignmentId = res.body.data.id;
  });
});

describe('GET /api/task/view', () => {
  it('the task history should list the added assignee change', async () => {
    const res = await request(app).get('/api/task/view/' + taskId).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);

    let history = res.body.data.history;
    history.forEach((entry)=>{
      if (entry['field'] == "added_assignee") {
        expect(entry['changed_by']['name']).toBe(secondUser["name"]);
        expect(entry['changed_to']).toBe(firstUser["name"]);
      }
    })
  });
});

describe('DELETE /api/task/unassign', () => {
  it('should unassign the task fromuser', async () => {
    const res = await request(app).delete('/api/task/unassign/' + assignmentId).set('Authorization', `Bearer ${secondaryToken}`);
    expect(res.statusCode).toEqual(200);
  });
});

describe('GET /api/task/view', () => {
  it('the task history should list the removed assignee change', async () => {
    const res = await request(app).get('/api/task/view/' + taskId).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);

    let history = res.body.data.history;
    history.forEach((entry)=>{
      if (entry['field'] == "removed_assignee") {
        expect(entry['changed_by']['name']).toBe(secondUser["name"]);
        expect(entry['changed_to']).toBe(firstUser["name"]);
      }
    })
  });
});

describe('POST /api/task/assign', () => {
  it('should create a new comment', async () => {
    const res = await request(app).post('/api/task/comment/' + taskId).send({
      text: "First comment",
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    
    commentId = res.body.data.id;
  });
  it('should create a second comment', async () => {
    const res = await request(app).post('/api/task/comment/' + taskId).send({
      text: "Second comment",
    }).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
  });
});

describe('DELETE /api/task/comment', () => {
  it('should remove the comment', async () => {
    const res = await request(app).delete('/api/task/comment/' + commentId).set('Authorization', `Bearer ${secondaryToken}`);
    expect(res.statusCode).toEqual(200);
  });
});

describe('GET /api/task/view', () => {
  it('the task should have a single comment', async () => {
    const res = await request(app).get('/api/task/view/' + taskId).set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);

    let comments = res.body.data.comments;
    expect(comments.length).toEqual(1);
    expect(comments[0]["comment_text"]).toEqual("Second comment");
  });
});

describe('PUT /api/task/close', () => {
  it('should close the task', async () => {
    const res = await request(app).put('/api/task/close/' + taskId).set('Authorization', `Bearer ${secondaryToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.closed_by.name).toEqual(secondUser["name"]);
  });
});