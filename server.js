//server.js
//Base setup
//=====================
var Express = require('express'); //call express
var Multer = require('multer'); //middleware for handling multipart/form-data
var Mongoose   = require('mongoose'); //mongoose ORM for mongo-node
var FileStream = require('fs'); //fs module for reading uploaded file
var Scriptlets = require('./app/models/scriptlets'); //dedicated mongo schema for scriptlets model
var Scripts = require('./app/models/scripts'); //dedicated mongo schema for scriptlets model
var Engine = require('./engine/engine');

Mongoose.connect('mongodb://localhost/test'); // connect to local database

var app = Express(); //define our app using express
app.use(Multer());


//set the server port
var port = process.env.PORT || 3000;

//request for our API
var router = Express.Router();

router.use(function (req, res, next) {
    // do logging
    console.log('I see you ping me');
    next(); // make sure we go to the next routes and don't stop here
});

//route /scriptlets starts
router
	.route('/scriptlets')
	.post(function(req, res) {		
		var ScriptletObj = new Scriptlets();
		
		ScriptletObj.name = req.body.name; 
        ScriptletObj.createdBy = 'admin';

        FileStream.readFile(req.files.htmlScript.path, function (err, data) {				
			ScriptletObj.htmlScript = data;			
			ScriptletObj.save(function(err) {
				if (err)
					res.send(err);
				res.json({ message: 'Scriptlet saved!' });
			});
		});
		
	})
	.get(function(req, res) {
		Scriptlets.find(function(err, scriptlets) {
			if (err)
				res.send(err);
			res.json(scriptlets);
		});
	});
//route scriptlets ends



//route /scripts starts
router
	.route('/scripts')
	.post(function(req, res) {		
		var ScriptObj = new Scripts();
		
		ScriptObj.name = req.body.name; 
        ScriptObj.createdBy = 'admin';        				
		ScriptObj.scriptletIds = req.body.scriptletIds.split('|');		
		ScriptObj.save(function(err) {
			if (err)
				res.send(err);
			res.json({ message: 'Script saved!' });
		});
		
	})
	.get(function(req, res) {
		Scripts.find(function(err, scripts) {
			if (err)
				res.send(err);
			res.json(scripts);
		});
	});
//route /scripts ends

//route /scriptlets/execute/:id starts
router
	.route('/scripts/execute/:id')
    .get(function (req, res) {
		var driver = Engine.createDriver();
		Scripts.findOne({'_id':req.param('id')}, function (err, script) {
			for(var x = 0; x < script.scriptletIds.length; x++) {				
				Engine.getExecutionSteps(script.scriptletIds[x], function(steps){
					Engine.executeSteps(driver, steps);
				});
			}
		});
		res.json({ message: 'Script execution submitted!' });
    });
//route /scriptlets/execute/:id ends


app.use('/api',router);
app.listen(port);