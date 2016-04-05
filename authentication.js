var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var Google = require("googleapis");
var OAuth2 = Google.auth.OAuth2;
var User = require('./user.js');
var Video = require('./video.js');
var youtube = require('youtube-api');
var ReadJson = require("r-json");
const CREDENTIALS = ReadJson("./client_secret.json");


passport.use(new GoogleStrategy({
//    clientID:  config.google.clientID,
//    clientSecret: config.google.clientSecret,
//    callbackURL: config.google.returnURL,
    clientID: CREDENTIALS.web.client_id,
    clientSecret: CREDENTIALS.web.client_secret,
    callbackURL: CREDENTIALS.web.redirect_uris[0],
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    var oauth = youtube.authenticate({
    type: "oauth",
    client_id: CREDENTIALS.web.client_id,
    client_secret: CREDENTIALS.web.client_secret,
    redirect_url: CREDENTIALS.web.redirect_uris[0]
    });
    oauth.setCredentials({'access_token': accessToken});
    youtube.channels.list(
        {"part": "contentDetails",
         "mine": true
        }, function(err, channel_data) {
            if(err) {
            console.log('channel list err' + err)} else {
            playlist=channel_data.items[0].contentDetails.relatedPlaylists.uploads
            youtube.playlistItems.list({
                "playlistId": playlist,
                "part": "snippet"
            }, function(err, playlist_data) {
                if(err) {
                console.log('playlist err ' + err )} else {
                    playlist_data.items.forEach(function(item) {
                        Video.findOne({ videoid: item.snippet.resourceId.videoId},
                          function (err, video){
                          if(err) {console.log(err)}
                          if (!err && video !==null) {
                              video.title = item.snippet.title
                              video.description = item.snippet.description
                              video.googleID = profile.id
                          } else {
                              video = new Video({
                                  googleID: profile.id,
                                  title: item.snippet.title,
                                  description: item.snippet.description,
                                  videoid: item.snippet.resourceId.videoId
                              })
                          }
                          video.save(function(err) {
                            if(err) {
                              console.log('error saving video ' + err)
                            } else {
                              console.log('saving video: ' + video.videoid)
                            }
                          })
                          });
                    }) 
                }
            })
            }
        }
    );
    User.findOne({ googleID: profile.id }, function (err, user) {
      if(err) {
        console.log(err);  // handle errors!
        done(err, null)
      }
      if (!err && user !== null) {
        user.name = profile.displayName
        user.email = profile.email
        user.accesstoken = accessToken
      } else {
        console.log(profile)
        user = new User({
          googleID: profile.id,
          name: profile.displayName,
          email: profile.email,
          acesstoken: accessToken,
          created: Date.now()
        });}
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            console.log(accessToken);
            done(null, user);
          }
        });
    });
  }
));

/*
passport.use(new GoogleStrategy({
  clientID: config.google.clientID,
  clientSecret: config.google.clientSecret,
  consumerKey: config.google.clientID,
  consumerSecret: config.google.clientSecret,
  returnURL: config.google.returnURL
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOne({ oauthID: profile.id }, function(err, user) {
      if(err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          oauthID: profile.id,
          name: profile.displayName,
          created: Date.now()
        });
        user.save(function(err) {
          if(err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));
*/
