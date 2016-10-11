var express  = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var expressValidator = require('express-validator');

var app = express();

// public static files
app.use(express.static(__dirname + '/public'));
// log http requests
app.use(logger('dev'));

// parse application/x-www-form-urlencoded                                    
app.use(bodyParser.urlencoded({'extended':'true'}));
// parse application/json          
app.use(bodyParser.json());
// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(expressValidator());
app.use(methodOverride());
 
 // including routes
var index = require('./routes/index');

app.use('/', index);

// Define a porta onde será executada nossa aplicação
var port = process.env.port || 5000;
app.listen(port);
// Imprime uma mensagem no console
console.log("Aplicação executada na porta ", port);