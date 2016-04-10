// dependencies
var express = require('express');
var session = require('express-session');
var User = require('./user.js');
var mongoose = require('mongoose');
var passport = require('passport');
var twitterAuth = require('./authentication.js');
var swig = require('swig');

// connect to the database
mongoose.connect('mongodb://swe600:swe600@ds015770.mlab.com:15770/swe600_video');
var conn2 = mongoose.createConnection('mongodb://swe600:swe600@ds019990.mlab.com:19990/twitter');

var ReadJson = require("r-json")

var app = express();

//app.configure(function() {
  app.set('views', __dirname + '/views');
  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  app.use(new session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(__dirname + '/public'));
//});

// serialize and deserialize
passport.serializeUser(function(user, done) {
  console.log('serializeUser: ' + user._id);
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user){
      console.log('+++++++++deserialize++++++')
      console.log(user);
      if(!err) done(null, user);
      else done(err, null);
    });
});



// routes
app.get('/', function(req, res){
      if (req.isAuthenticated()) {
          User.findById(req.session.passport.user, function(err, user) {
          if(err) {
            console.log(err);  // handle errors
            res.render('404')
           }
          else {
    conn2.db.collection('tag', function (err, collection) {
    if(err) {console.log('error finding table style ' + err)} else {
    collection.count({}, function(err, count) {
        if(err) {console.log('count error' + err)} else {
    style_count = count
    console.log('collection size is ' + style_count)
    random_style_id = Math.floor(Math.random() * style_count) + 1
    console.log('random number is ' + random_style_id )
    random_style = collection.findOne({id: random_style_id}, function(err, style) {
      if(err) {console.log('failed to find style')} else {
        var tag = JSON.stringify(style.tag)
        console.log('random style color is ' + tag)
            //console.log(ctx)
        var newtag = tag.replace("datahere", user.handle)
        console.log('new random style color is ' + newtag)
            res.render('index', {
                user: user,
                req: req,
                tag: newtag
            }); }
    })
    }})
    }
    })
      }});
      }
      else {
            res.render('index', {
                user: {},
                req: req
            });
      }
      
});

app.get('/auth/twitter',
  passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


// port
app.listen(process.env.PORT || 5000, function() {
console.log('server is running on port ' + this.address().port)
});

// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = app;
