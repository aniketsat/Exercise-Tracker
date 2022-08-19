const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MONGODB"))
  .catch((err) => console.log(err.message));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  log: [
    {
      date: String,
      duration: Number,
      description: String,
    },
  ],
  count: Number,
});
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const user = new User({ username, count: 0 });
  user.save((err, data) => {
    if (err) {
      res.json({ message: err.message });
    }
    res.json(data);
  });
});

app.get("/api/users", (req, res) => {
  User.find((err, data) => {
    if (data) {
      res.json(data);
    }
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = req.body.date
    ? new Date(req.body.date).toDateString()
    : new Date().toDateString();
  const id = req.params._id;

  const exercise = {
    description,
    duration,
    date,
  };

  User.findByIdAndUpdate(
    id,
    {
      $push: {
        log: exercise,
      },
      $inc: { count: 1 },
    },
    { new: true },
    (err, user) => {
      if (user) {
        const updatedExercise = {
          _id: id,
          username: user.username,
          ...exercise,
        };
        res.json(updatedExercise);
      }
    }
  );
});

app.get("/api/users/:_id/logs", (req, res) => {
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  // let result = {};
  let logs = [];
  User.findById(req.params._id, (err, user) => {
    if (user) {
      logs = [...user.log];
      if (from || to) {
        from = Date.parse(new Date(from));
        to = Date.parse(new Date(to));
        // console.log(from, to);
        // console.log(logs);
        logs = logs.filter((log) => {
          const temp = Date.parse(new Date(log.date));
          // console.log(temp);
          // console.log("log " + (temp >= from && temp <= to));
          return temp >= from && temp <= to;
        });
        console.log(logs);
      }
      if (limit) {
        logs = logs.slice(0, limit);
      }
      user.log = logs;
      res.json(user);
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
