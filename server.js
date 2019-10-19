const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const decorator = require('./db/decorator');
const session = require('express-session'); // keeps track of user's session
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);

const PORT = 8080;
const saltRounds = 12;
const User = require('./db/models/User');

require('dotenv').config();

const client = redis.createClient({ url: process.env.REDIS_URL });
const app = express();

app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.use(decorator);

app.use(
  session({
    store: new RedisStore({ client }),
    secret: process.env.REDIS_SECRET, // encrypted string
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session()); // must come after app.use(session...)

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.redirect('/login.html');
  }
}

passport.use(
  new LocalStrategy(function(username, password, done) {
    return new User({ username: username })
      .fetch()
      .then(user => {
        console.log(user);

        if (user === null) {
          return done(null, false, { message: 'bad username or password' });
        } else {
          user = user.toJSON();

          bcrypt.compare(password, user.password).then(res => {
            // Happy route: username exists, password matches
            if (res) {
              return done(null, user); // this is the user that goes to serializeUser
            }
            // Error Route: Username exists, password does not match
            else {
              return done(null, false, { message: 'bad username or password' });
            }
          });
        }
      })
      .catch(err => {
        console.log('error: ', err);
        return done(err);
      });
  })
);

passport.serializeUser(function(user, done) {
  // happens once when you first log in
  // console.log('serializing');

  return done(null, { id: user.id, username: user.username });
});

passport.deserializeUser(function(user, done) {
  // applies stripped down user object to every request after logged in
  // strips down user object to just id and username
  // console.log('deserializing');
  // console.log(user);
  return done(null, user);
});

app.use(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/secret',
    failureRedirect: '/login.html'
  })
);

app.post('/register', (req, res) => {
  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      console.log(err);
    } // return 500

    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) {
        console.log(err);
      } // return 500

      return new User({
        username: req.body.username,
        password: hash
      })
        .save()
        .then(user => {
          console.log(user);
          return res.redirect('/login.html');
        })
        .catch(err => {
          console.log(err);
          return res.send('Error creating account');
        });
    });
  });
});

app.get('/secret', isAuthenticated, (req, res) => {
  return res.send('You found the secret!');
});

app.get('/logout', (req, res) => {
  req.logout();
  res.send('logged out');
});

app.get('/', (req, res) => {
  res.render('home');
});

const galleryRoutes = require('./routes/gallery');

app.use('/gallery', galleryRoutes);

app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});
