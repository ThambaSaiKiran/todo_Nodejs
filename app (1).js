const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Express server gets Started");
  });
};

initializeDBAndServer();

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

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

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
      getTodosQuery = `SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const item = await db.get(getQuery);
  response.send(item);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const query = `INSERT into todo (id, todo, priority, status)
    VALUES(${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const id = request.params;
  const { status = "", priority = "", todo = "" } = request.body;
  if (priority === "" && status === "" && todo !== "") {
    const query = `UPDATE todo SET todo='${todo}';`;
    await db.run(query);
    response.send("Todo Updated");
  } else if (priority === "" && status !== "" && todo === "") {
    const query = `UPDATE todo SET status='${status}';`;
    await db.run(query);
    response.send("Status Updated");
  } else if (priority !== "" && status === "" && todo === "") {
    const query = `UPDATE todo SET priority='${priority}';`;
    await db.run(query);
    response.send("Priority Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `delete from todo where id = ${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});
