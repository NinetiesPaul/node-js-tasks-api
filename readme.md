## Tasks API in NodeJS
A simple API in NodeJS. It has some basic functions, like:

- User registration and authentication using JWT
- Perform CRUD operations of Tasks
- Some basics business rules enforced

My main goal is to showcase some concepts, such as:

- Migrations and model relationship
- Authentication configuration
- Routes definitions
- SOLID and KISS principles on a MVC architecture

The main tech behind it is NodeJs and also some others Js libraries. For storaging, i'm using MySQL relational database

## Environment setup
To run this application you must have installed on your environment:

* `NodeJS` - For the main application 
* `NPM` - For library and packages management
* `MySQL` - For storaging and accessing data

## Installation and Configuration
Once you set up all the necessary software, run
```
cp config/config.json.local config/config.json
```
and fill out the bracketed values on that new copy's ```DATABASE_URL``` with your connection information. Don't forget to set up a crypt hash for the ```TOKEN_SECRET```

Having npm and node installed and configured in your machine, git clone this rep then cd into the project's folder and run
```
npm install
npm start
````
If you see ```Server Started at 3000``` as the last message then the app is good to go!

## Usage

### __Users__
#### User creation

```
curl --location 'http://localhost:3000/register' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Philip Leotardo",
    "email": "p.leotardo@mail.com",
    "password": "123456"
}'
```

#### User authentication
```
curl --location 'http://localhost:3000/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username": "p.leotardo@mail.com",
    "password": "123456"
}'
```

### __Tasks__
For the following requests, replace the ```{token}``` with the Token retrieved on the /login response payload, under the "token" attribute  
Replace ```{task_id}``` with a Task Id
#### Creating a Task
```
curl --location 'http://localhost:3000/api/task' \
--header 'x-access-token: {token}' \
--header 'Content-Type: application/json' \
--data '{
    "title": "My new Task",
    "description": "This is a task",
    "status": "open",
    "type": "new_feature"
}'
```

#### Listing all Tasks
Replace ```{owner_id}``` with a User Id  
Replace ```{status}``` with any of the following: new, in_dev, blocked, closed  
Replace ```{type}``` with any of the following: new_feature, bugfix, hotfix  
If none of these filters are present this endpoint will retrieve all existing Tasks
```
curl --location 'http://localhost:3000/api/task/list?owner={owner_id}&status={status}&type={type}' \
--header 'x-access-token: {token}'
```

#### Selecting a single Task
```
curl --location 'http://localhost:3000/api/task/view/{task_id}' \
--header 'x-access-token: {token}'
```

#### Updating a Task
```
curl --location --request PATCH 'http://localhost:3000/api/task/{taskId}' \
--header 'x-access-token: {token}' \
--header 'Content-Type: application/json' \
--data '{
    "status": "closed"
}'
```

#### Deleting a Task
```
curl --location --request DELETE 'http://localhost:3000/api/task/{taskId}' \
--header 'x-access-token: {token}'
```
