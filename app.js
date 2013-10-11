var http = require('http');
var path = require('path');
var connect = require('connect');
var express = require('express');
var routes = require("./routes");

// var SessionSockets = require('session.socket.io');

var cookieParser = express.cookieParser('liliang');
var sessionStore = new connect.middleware.session.MemoryStore();

var app = express();
var usersWS = {};
var index = 0, mongodb = require('mongodb'), praviteRoom = [], userList = [];
var dbserver = new mongodb.Server('localhost', 27017, {
    auto_reconnect : true
}), db = new mongodb.Db('chat', dbserver, {
    safe : true
});
app.configure(function() {
    app.set('views', path.resolve('views'));
    app.set('view engine', 'ejs');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(cookieParser);
    app.use(express.session({
        store : sessionStore
    }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);
});

routes(app);

var server = http.createServer(app);
var io = require('socket.io').listen(server).set('log level', 1);
/*var sessionSocket = new SessionSockets(io, sessionStore, cookieParser);

 sessionSocket.on('connection', function(err, socket, session) {
 socket.emit('news', { hello: 'world' });
 socket.on('my other event', function (data) {
 console.log(1)
 console.log(data);
 });
 });
 */
io.sockets.on('connection', function(socket) {
    var id=socket.id;
    console.log(id)
   socket.emit('news', {
        hello : 'world'
   });
    
  socket.on('disconnect', function (data) {
   console.log(id)
  });
});

server.listen(process.env.PORT || 3000);
