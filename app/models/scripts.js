var Mongoose = require('mongoose');

var Schema = Mongoose.Schema;

var ScriptsSchema = new Schema({name: String, createdBy: String, scriptletIds: [String]});

module.exports = Mongoose.model('Scripts', ScriptsSchema);