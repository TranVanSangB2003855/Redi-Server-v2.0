const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const redi = require("./app/function/rediFunct");
const USER = require("./app/models/user.model.js");
const CHATROOM = require("./app/models/chatRoom.model.js");
const MESSAGE = require("./app/models/message.model.js");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  cookieSession({
    name: "redi-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);

app.get("/", (res, req) => {
  req.json({ message: "Welcome to Redi Chat App." });
})

require('./app/routes/auth.route')(app);
require('./app/routes/user.route')(app);
require('./app/routes/room.route')(app);

app.use((err, req, res, next) => {
  // Middleware xử lý lỗi tập trung.
  // Trong các đoạn code xử lý ở các route, gọi next(error)
  // sẽ chuyển về middleware xử lý lỗi này
  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app
