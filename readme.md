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
Having NPM and Node installed and configured on your device, git clone this rep then cd into the project's folder.
First you need to create a copy of the config.json file. Run the following:
```
cp config/config.json.local config/config.json
```
And on this file, fill out the database connection information, such as:
```
{
  "development": {
    "username": "root",
    "password": "root",
    "database": "tasks_application",
    "host": "localhost",
    "dialect": "mysql"
  }
}
```
Now create a local copy of the .env file with
```
cp .env.example .env
```
Like the config.json, fill out the database connection information:
```
DB_DATABASE=tasks_application
DB_USERNAME=root
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=3306
```
After that run the npm's installation command: 
```
npm install
```
Before you run the app, you must migrate the app's database structure. Create the database with:
```
npx sequelize-cli db:create
```
And them create the tables with:
```
npx sequelize-cli db:migrate
```
Now start the service with:
```
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
curl --location 'http://localhost:3000/api/task/create' \
--header 'x-access-token: {token}' \
--header 'Content-Type: application/json' \
--data '{
    "title": "My new Task",
    "description": "This is a task",
    "type": "feature"
}'
```

#### Listing all Tasks
Replace ```{created_by}``` with a User Id  
Replace ```{status}``` with any of the following: new, in_qa, in_dev, blocked, closed  
Replace ```{type}``` with any of the following: feature, bugfix, hotfix  
If none of these filters are present this endpoint will retrieve all existing Tasks
```
curl --location 'http://localhost:3000/api/task/list?owner={created_by}&status={status}&type={type}' \
--header 'x-access-token: {token}'
```

#### Selecting a single Task
```
curl --location 'http://localhost:3000/api/task/view/{task_id}' \
--header 'x-access-token: {token}'
```

#### Updating a Task
```
curl --location --request PUT 'http://localhost:3000/api/task/update/{task_id}' \
--header 'x-access-token: {token}' \
--header 'Content-Type: application/json' \
--data '{
    "description": "a different description",
    "status": "blocked"
}'
```

#### Deleting a Task
```
curl --location --request DELETE 'http://localhost:3000/api/task/delete/{task_id}' \
--header 'x-access-token: {token}'
```

#### Closing a Task
```
curl --location --request PUT 'http://localhost:3000/api/task/close/{task_id}' \
--header 'x-access-token: {token}'
```