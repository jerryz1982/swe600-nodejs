// dependencies
var fs = require('fs');
var bodyParser = require('body-parser');
var express = require('express');
var session = require('express-session');
var path = require('path');
var User = require('./user.js');
var Video = require('./video.js');
var mongoose = require('mongoose');
var passport = require('passport');
var fbAuth = require('./authentication.js');
//var TwitterStrategy = require('passport-twitter').Strategy;
//var GithubStrategy = require('passport-github2').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
//var LinkedinStrategy = require("passport-linkedin").Strategy;
//var InstagramStrategy = require('passport-instagram').Strategy;

var swig = require('swig');
var youtube = require("youtube-api");
var Fs = require("fs")
var Google = require("googleapis");
var GoogleYoutube = Google.youtube("v3");
// connect to the database
mongoose.connect('mongodb://swe600:swe600@ds015770.mlab.com:15770/swe600_video');

var ReadJson = require("r-json")
const CREDENTIALS = ReadJson("./client_secret.json");

var app = express();

//app.configure(function() {
  app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  app.engine('html', swig.renderFile);
  app.set('view engine', 'html');
  //app.use(express.logger());
  //app.use(express.cookieParser());
  //app.use(express.bodyParser());
  //app.use(express.methodOverride());
  app.use(new session({ secret: 'my_precious' }));
  app.use(passport.initialize());
  app.use(passport.session());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(bodyParser());
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

var domain = require('domain');
var rid = 1;
// Centralized context object
function Context() {
    this.reqId = rid;
    rid += 1;
}
Context.getCurrent = function() {
    return process.domain.context;
}

app.use(function(req, res, next) {
    // create a domain for every request
    var d = domain.create();
    d.context = new Context();
    // req and res are created before the d domain is created,
    // so we have to add them to the domain manually.
    // newly created EventEmitter or other async constructs are
    // automatically added to the current domain.
    d.add(req);
    d.add(res);
    // run next in the created domain
    d.run(function() {
        next();
    })
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
            Video.find({'googleID': user.googleID},
              function(err, videos) {
                if(err) {console.log(err)} else {
                console.log('videos: ' + videos)
                }
            //console.log(ctx)
            res.render('index', {
                user: user,
                req: req,
                videos: videos
            }); })
      }});}
      else {
            res.render('index', {
                user: {},
                req: req
            });
      }
      }
      );

app.post('/upload_video', ensureAuthenticated, function(req, res){
    console.log(req.body)
    var oauth = youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: CREDENTIALS.web.redirect_uris[0]
    });
    oauth.setCredentials({'access_token': req.user.accesstoken});
    youtube.videos.insert({
        resource: {
            // Video title and description
            snippet: {
                title: req.body["title"],
                description: req.body["desc"]
                },
            // I don't want to spam my subscribers
            status: {
                privacyStatus: "public"
            }
            },
            // This is for the callback function
        part: "snippet,status",

            // Create the readable stream to upload the video
        media: {
            body: Fs.createReadStream(req.body["path"])
        }
    }, function (err, data) {
        if(err) {
            console.log('upload error');
            console.log(err);
            //res.render('upload_error');
        } else {
            console.log(data)
            res.redirect('/')
            //res.render('result', {
            //    data: data
            //})
            //res.render('index', {
            //    data: data
            }
        }
     );

});

//app.get('/display', routes.display);
app.get('/account', ensureAuthenticated, function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);  // handle errors
    } else {
      //res.render('account', { user: user});
        swig.renderFile('views/index.html', {
            req: req,
            user: user
    });
    }
  });
});


app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube'
  ] }
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/404.html' }),
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
