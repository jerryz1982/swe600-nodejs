var mongoose = require('mongoose');

// create a user model
var User = mongoose.model('User', {
  twitterID: Number,
  handle: String,
  name: String,
  created: Date,
  accesstoken: String
});


module.exports = User;
