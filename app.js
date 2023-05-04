const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");

const initializedBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializedBAndServer();

//API 1 with 4 scenarios
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const requestQuery = request.query;
  const { search_q = "", priority, status } = request.query;

  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }
  console.log(requestQuery);
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getQuery = `
        SELECT 
        * 
        FROM 
        todo
        WHERE
        id = ${todoId}; 
    `;
  const todoArr = await db.get(getQuery);
  response.send(todoArr);
});

//API 3 POST
app.post("/todos/", async (request, response) => {
  const requestBody = request.body;
  const { id, todo, priority, status } = requestBody;

  const postQuery = `
        INSERT INTO 
        todo(id,todo,priority,status)
        VALUES(
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );
    `;
  const dbResponse = await db.run(postQuery);
  const todoId = dbResponse.lastID;
  console.log(todoId);
  response.send("Todo Successfully Added");
});

//API 5 DELETE
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
        DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

//API 4 3 Scenarios
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";

  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
        SELECT 
        *
        FROM 
        todo 
        WHERE 
        id = ${todoId};
    `;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = requestBody;

  const updateQuery = `
    UPDATE 
        todo 
    SET 
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE 
    id = ${todoId};
  `;
  console.log(updateColumn);
  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

module.exports = app;
