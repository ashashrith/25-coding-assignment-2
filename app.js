const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "twitterClone.db");
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
    console.log(`Server DB: '${e.message}';`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    const createUserQuery = `INSERT INTO user 
      (name, username, password, gender) VALUES (
          '${name}',
          '${username}',
          '${hashedPassword}',
          '${gender}');`;
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const dbResponse = await db.run(createUserQuery);
      const userId = dbResponse.lastID;
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const payload = { username: username };
      const jwtToken = await jwt.sign(payload, "ashrith");
      response.status(200);
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

const authenticationToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "ashrith", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.get(
  "/user/tweets/feed/",
  authenticationToken,
  async (request, response) => {
    const getUserTweetsQuery = `SELECT username, tweet, date_time as dateTime
      FROM user INNER JOIN tweet ON user.user_id = tweet.user_id ORDER_BY 
      date_time ASC LIMIT 4;`;
    const dbResponse = await db.all(getUserTweetsQuery);
    response.send(dbResponse);
  }
);

app.get("/user/following/", authenticationToken, async (request, response) => {
  const getFollowerQuery = `SELECT name FROM user INNER JOIN follower ON
    user.user_id = follower.follower_user__id WHERE
    follower.follower_user_id = ${user.user_id};`;

  const dbFollower = await db.all(getFollowerQuery);
  response.send(dbFollower);
});

app.get("/user/followers/", authenticationToken, async (request, response) => {
  const getFollowsQuery = `SELECT name FROM user INNER JOIN follower ON
    user.user_id = follower.following_user_id WHERE
    follower.following_user_id = ${user.user_id};`;

  const dbFollowsResponse = await db.all(getFollowsQuery);
  response.send(dbFollowsResponse);
});

app.get("/tweets/:tweetId/", authenticationToken, async (request, response) => {
  const { tweetId } = request.params;
  const getTweetQuery = `SELECT `;
});

module.exports = app;
