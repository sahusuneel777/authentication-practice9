const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const usernameCheckQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}'`;

  const addUser = await db.get(usernameCheckQuery);
  if (addUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);

      const addUserQuery = `
        INSERT INTO user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        );`;
      await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

///login API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const dbUserQuery = `
   SELECT *
   FROM user
   WHERE username = '${username}';`;
  const dbUser = await db.get(dbUserQuery);
  ///console.log(dbUser);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.send("Invalid password");
      response.status(400);
    }
  }
});

///change Password API
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const dbUserQuery = `
   SELECT *
   FROM user
   WHERE username = '${username}';`;
  const dbUser = await db.get(dbUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateUserPasswordQuery = `
        UPDATE user
        SET 
            password = '${hashedPassword}';
        WHERE username = '${username}';`;
        db.run(updateUserPasswordQuery);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});

module.exports = app;
