var mongoose = require('mongoose');

// create a user model
var User = mongoose.model('User', {
  googleID: Number,
  name: String,
  created: Date,
  email: String,
  accesstoken: String
});


module.exports = User;
