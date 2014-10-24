var Cheerio = require('cheerio');
var WebDriver = require('selenium-webdriver');
var Mongoose   = require('mongoose'); //mongoose ORM for mongo-node
var Scriptlets = require('../app/models/scriptlets'); //dedicated mongo schema for fruits model

/*findDriverEl finds an element inside driver using the string saved inside recorded html script*/
function findDriverEl(target) {
	if(target.indexOf('id') == 0) { //for string id=<id>
		return {
				'el':WebDriver.By.id(target.substr(target.indexOf('=')+1)),
				'arg':target.substr(target.indexOf('=')+1)
			};
	} else if (target.indexOf('name') == 0){ //for string name=<name>
		return {
				'el':WebDriver.By.name(target.substr(target.indexOf('=')+1)),
				'arg':target.substr(target.indexOf('=')+1)
			};
	} else if (target.indexOf('class') == 0){ //for string class=<class>
		return {
				'el':WebDriver.By.className(target.substr(target.indexOf('=')+1)),
				'arg':target.substr(target.indexOf('=')+1)
			};
	} else if (target.indexOf('css') == 0){ //for string class=<class>
		return {
				'el':WebDriver.By.css(target.substr(target.indexOf('=')+1)),
				'arg':target.substr(target.indexOf('=')+1)
			};
	} else {
		return {
				'el':WebDriver.By.css('#' + target + ', [name=' + target + ']'),
				'arg':target
			};
	}	
}

module.exports = {
	createDriver: function() {
		return new WebDriver.Builder().withCapabilities(WebDriver.Capabilities.chrome()).build();
	},
	//getExecutionSteps gets "steps" objects for a particular script with id=<id> & callbacks <func> on completion
	getExecutionSteps: function(id, func) {
		Scriptlets.findOne({'_id':id}, function (err, scriptlet) {
			var $ = Cheerio.load(scriptlet.htmlScript);
			var steps = {};
			steps.commands = [];
			steps.base = $('link[rel=selenium\\.base]').attr('href');
			$('table tbody tr').each(function() {
				var command = {};
				
				command.name = $('td', this).eq(0).text().toUpperCase();
				command.target = $('td', this).eq(1).text();
				command.arg = $('td', this).eq(2).text();
				
				steps.commands.push(command);
			});
			if(func) {
				func(steps);
			}
		})
	},
	//executeSteps executes driver for executing <steps> "steps" object
	executeSteps: function(driver, steps) {
		for(var s = 0; s < steps.commands.length; s++) {
			var command = steps.commands[s];
			switch(command.name) {
				case 'OPEN':
					driver.get(steps.base + command.target);
					break;
				case 'TYPE':
					driver.findElement(findDriverEl(command.target).el).clear();
					driver.findElement(findDriverEl(command.target).el).sendKeys(command.arg);
					break;
				case 'CLICK':
					driver.findElement(findDriverEl(command.target).el).click();
					if(s == steps.commands.length - 1) {
						break;
					} else {
						var strNextTarget = findDriverEl(steps.commands[s+1].target);
						var strNextCommand = steps.commands[s+1].name;
						driver.wait(function(strNextTarget, strNextCommand) {
							return function() {
								if(strNextCommand == 'SELECTWINDOW') {
									driver.switchTo().defaultContent();
								}
								return driver.isElementPresent(strNextTarget.el);
							}
						}(strNextTarget, strNextCommand));
					}
					break;
				case 'CLICKANDWAIT':
					driver.findElement(findDriverEl(command.target).el).click();
					if(s == steps.commands.length - 1) {
						break;
					} else {
						var strNextTarget = findDriverEl(steps.commands[s+1].target);
						var strNextCommand = steps.commands[s+1].name;
						driver.wait(function(strNextTarget, strNextCommand) {
							return function() {
								if(strNextCommand == 'SELECTWINDOW') {
									driver.switchTo().defaultContent();
								}
								return driver.isElementPresent(strNextTarget.el);
							}
						}(strNextTarget, strNextCommand));
					}
					break;
				case 'SELECTFRAME':
					driver.switchTo().frame(findDriverEl(command.target).arg);
					break;
				case 'SELECTWINDOW':
					driver.switchTo().frame(findDriverEl(command.target).arg);
					break;	
			}
		}
		
	}
}
