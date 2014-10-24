var Mongoose = require('mongoose');

var Schema = Mongoose.Schema;

var ScriptletsSchema = new Schema({name: String, createdBy: String, htmlScript: String});

module.exports = Mongoose.model('Scriptlets', ScriptletsSchema);