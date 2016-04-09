var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var User = require('./user.js');
var Video = require('./video.js');
var youtube = require('youtube-api');
var ReadJson = require("r-json");
const CREDENTIALS = ReadJson("./client_secret.json");


passport.use(new GoogleStrategy({
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
                "part": "snippet",
                "maxResults": 50
            }, function(err, playlist_data) {
                if(err) {
                console.log('playlist err ' + err )} else {
                user_videos = []
                JSON.stringify(playlist_data);
                playlist_data.items.forEach(function(item){
                    user_videos.push(item.snippet.resourceId.videoId)
                })
                console.log('upstream user videos: ' + user_videos)
                Video.find({'googleID': profile.id},
                  function(err, videos) {
                  if(err) {console.log('table not found')}
                  else {
                      videos_indb = videos
                      JSON.stringify(videos_indb)
                      console.log('videos found in db: ' + videos_indb)
                      if(videos.length>0){
                      to_delete = videos.filter(function(item) {
                          return user_videos.indexOf(item['videoid']) < 0
                      }
                      )
                      console.log('videos to remove from db' + to_delete)
                      to_delete.forEach(function(item) {
                          item.remove()
                      });
                      }
                  }});
                  playlist_data.items.forEach(function(item) {
                        Video.findOne({ videoid: item.snippet.resourceId.videoId},
                          function (err, video){
                          if(err) {console.log(err)}
                          if (!err && video !==null) {
                              video.title = item.snippet.title
                              video.description = item.snippet.description
                              video.publish_date = item.snippet.publishedAt
                              video.googleID = profile.id
                          } else {
                              video = new Video({
                                  googleID: profile.id,
                                  title: item.snippet.title,
                                  description: item.snippet.description,
                                  publish_date: item.snippet.publishedAt,
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
          accesstoken: accessToken,
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
