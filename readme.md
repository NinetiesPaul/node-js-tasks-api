## Tasks API in NodeJS
This is a RESTful API application for managing tasks and issues. The technology used here is NodeJs, and the main purpose of this project is to showcase my understanding of key features under this technology, such as:

- Requests performing CRUD operations
- User registration and authentication using JWT
- Some basics business rules enforced
- Migrations and model relationship
- Authentication configuration
- Routes definitions
- SOLID and KISS principles on a MVC architecture
- Unit/Integration testing

The main tech behind it is NodeJs with the Express framework, to showcase it's cleanliness and simplicity while maintaning a robust architecture. For storaging i'm using relational databases managed with Sequelize

## Environment setup
To run this application you must have installed on your environment:

* `NodeJS` (20.11.0) - For the main application 
* `NPM` (10.4.0) - For library and packages management
* `MySQL` (5.7 or greater) or `PostgreSQL` (15 or greater) - For storaging and accessing data

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

## Tests
To run the integrations tests and verify the application correct operations, run the following command:
```
npm jest
```
It will be created a new folder under `coverage` at the project's root. Open the `index.html` to check the tests coverage results.

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