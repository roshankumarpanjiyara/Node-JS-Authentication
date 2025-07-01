const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  res.render("signup");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const email = userData.email;
  const confirmEmail = userData["confirm-email"]; //since - is not allowed while accessing via .(dot)
  const password = userData.password;

  if (!email || !confirmEmail || !password || !email.includes("@")) {
    return res.render("signup", { errorMessage: "Invalid inputs!" });
  }

  if (email !== confirmEmail) {
    return res.render("signup", {
      errorMessage: "Email address does not match!"
    });
  }

  if (password.length < 6) {
    return res.render("signup", {
      errorMessage: "Password must be at least 6 characters long!"
    });
  }

  const hashPassword = await bcrypt.hash(password, 12);
  console.log(hashPassword);
  const user = {
    email: email,
    password: hashPassword,
  };

  await db.getDb().collection("users").insertOne(user);
  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const email = userData.email;
  const password = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: email });

  // if (!existingUser) {
  //   console.log("User does not exist");
  //   return res.redirect("login", { errorMessage: "User does not exist!" });
  // }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password
  );

  // if (!isPasswordCorrect) {
  //   console.log("Password Incorrect");
  //   return res.redirect("login", { errorMessage: "Password Incorrect!" });
  // }

  console.log("User is logged in!");
  res.redirect("/admin");
});

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.post("/logout", function (req, res) {});

module.exports = router;
