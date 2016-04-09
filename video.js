var mongoose = require('mongoose');

// create a user model
var VideoSchema = new mongoose.Schema({
  videoid: String,
  title: String,
  description: String,
  publish_date: {type: Date, default: Date.now},
  googleID: Number
});


module.exports = mongoose.model('Video', VideoSchema);
