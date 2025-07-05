const path = require('path');

const express = require('express');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session');

const { ObjectId } = require("mongodb");
const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

const mongodbSession = mongodbStore(session)

app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: false,
  store: new mongodbSession({
    uri: 'mongodb://localhost:27017/auth-demo',
    collection: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

app.use(async function(req, res, next){
  const user = req.session.user;
  const isAuth = req.session.isAuthenticated;

  if(!user || !isAuth){
    return next();
  }

  const userDetails = await db.getDb().collection('users').findOne({ _id: ObjectId.createFromHexString(user.id) });
  const isAdmin = userDetails ? userDetails.isAdmin : false;

  //locals is a way to pass variables to the all view templates
  res.locals.isAuth = isAuth;
  res.locals.isAdmin = isAdmin;

  next();
});

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
