const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");
const { ObjectId } = require("mongodb");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      email: "",
      confirmEmail: "",
      errorMessage: "",
      successMessage: "",
    };
  }

  req.session.inputData = null; // Clear session input data after rendering the signup page

  res.render("signup", { inputData: sessionInputData });
});

router.get("/login", function (req, res) {
  let sessionInputData = req.session.inputData;

  if (!sessionInputData) {
    sessionInputData = {
      hasError: false,
      errorMessage: "",
      successMessage: "",
    };
  }

  req.session.inputData = null; // Clear session input data after rendering the login page

  res.render("login", { inputData: sessionInputData });
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const email = userData.email;
  const confirmEmail = userData["confirm-email"]; //since - is not allowed while accessing via .(dot)
  const password = userData.password;

  const inputData = {
    hasError: true,
    email: email,
    confirmEmail: confirmEmail,
  };

  if (!email || !confirmEmail || !password || !email.includes("@")) {
    req.session.inputData = {
      ...inputData,
      errorMessage: "Invalid input!",
      successMessage: null,
    }; // Store input data in session
    req.session.save(function () {
      res.redirect("/signup"); //this return will not allow the code to stop executing after this point
    });
    return;
  }

  if (email !== confirmEmail) {
    req.session.inputData = {
      ...inputData,
      errorMessage: "Email address does not match!",
      successMessage: null,
    }; // Store input data in session
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  if (password.trim().length < 6) {
    req.session.inputData = {
      ...inputData,
      errorMessage: "Password must be at least 6 characters long!",
      successMessage: null,
    }; // Store input data in session
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: email });

  if (existingUser) {
    console.log("User does exist");
    req.session.inputData = {
      ...inputData,
      errorMessage: null,
      successMessage: "User exists!",
    }; // Store input data in session
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  const hashPassword = await bcrypt.hash(password, 12);
  console.log(hashPassword);
  const user = {
    email: email,
    password: hashPassword,
  };

  await db.getDb().collection("users").insertOne(user);
  req.session.inputData = {
    errorMessage: null,
    successMessage: "User created successfully!",
  }; // Store input data in session
  req.session.save(function () {
    return res.redirect("/login");
  });
  return;
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const email = userData.email;
  const password = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: email });

  if (!existingUser) {
    console.log("User does not exist");
    req.session.inputData = {
      hasError: true,
      errorMessage: null,
      successMessage: "User does not exist!",
    }; // Store input data in session
    req.session.save(function () {
      res.redirect("/login");
    });
    return;
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password
  );

  if (!isPasswordCorrect) {
    console.log("Password Incorrect");
    req.session.inputData = {
      hasError: true,
      errorMessage: "Password Incorrect!",
      successMessage: null,
    }; // Store input data in session
    req.session.save(function () {
      res.redirect("/login");
    });
    return;
  }

  req.session.user = {
    id: existingUser._id.toString(),
    email: existingUser.email,
  };
  req.session.isAuthenticated = true;
  req.session.save(function () {
    console.log("User is logged in!");
    res.redirect("/profile");
  }); // Save the session to ensure it is stored in the database
  // return;
});

router.get("/admin", async function (req, res) {
  if (!req.session.isAuthenticated) {
    // (!req.session.user)
    return res.status(401).render("401");
  }

  const user = await db
    .getDb()
    .collection("users")
    .findOne({ _id: ObjectId.createFromHexString(req.session.user.id) });
  
  if(!user || !user.isAdmin){
    return res.status(403).render("403");
  }

  res.render("admin");
});

router.get("/profile", function (req, res) {
  if (!req.session.isAuthenticated) {
    // (!req.session.user)
    return res.status(401).render("401");
  }

  res.render("profile");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false; // Reset the authentication status
  res.redirect("/");
});

module.exports = router;
