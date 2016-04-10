var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('./user.js');
var ReadJson = require("r-json");
const CREDENTIALS = ReadJson("./client_secret_twitter.json");


passport.use(new TwitterStrategy({
    consumerKey: CREDENTIALS.web.consumerkey,
    consumerSecret: CREDENTIALS.web.consumersecret,
    callbackURL: CREDENTIALS.web.callbackurl
  },
  function(request, tokenSecret, profile, done) {
    User.findOne({ twitterID: profile.id }, function (err, user) {
      if(err) {
        console.log(err);  // handle errors!
        done(err, null)
      }
      if (!err && user !== null) {
        user.name = profile.displayName
        user.handle = profile.username
        user.accesstoken = tokenSecret
      } else {
        console.log(profile)
        user = new User({
          twitterID: profile.id,
          name: profile.displayName,
          handle: profile.username,
          accesstoken: tokenSecret,
          created: Date.now()
        });}
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
    });
  }
));
