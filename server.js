var http = require('http');
var path = require('path');
var connect = require('connect');
var express = require('express');
var routes = require("./routes");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/chat');

var userSchema = new Schema({
    name : String,
    icon : String
});

var messageSchema = new Schema({
    user : Object,
    date : {
        type : Date
    },
    content : String
});

var User = mongoose.model('User', userSchema);
var Message = mongoose.model('Message', messageSchema);
var SessionSockets = require('session.socket.io');
var cookieParser = express.cookieParser('liliang');
var sessionStore = new connect.middleware.session.MemoryStore();

var app = express();
var usersWS = {};
var index = 0, praviteRoom = [], userList = {};
var userLoginCount = {};
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
var sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

sessionSockets.on('connection', function(err, socket, session) {
    var login = function(data, fromSession) {
        if (session) {
            session.user = data.user;
            session.save();
        }
        var newUser = new User(data.user);

        socket.username = data.user.name;
        if (!userLoginCount[socket.username]) {
            userLoginCount[socket.username] = 1;
        } else {
            userLoginCount[socket.username]++;
        }
        userList[socket.username] = newUser;
        if (fromSession) {
            socket.emit('updateuserlist', {
                userList : userList
            });
        } else {
            io.sockets.emit('updateuserlist', {
                userList : userList
            });
        }
        var date = new Date();
        var today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        Message.find().where('date').gte(today).exec(function(err, docs) {
            socket.emit('loginRender', {
                id : socket.username,
                msgList : docs
            });
            var content = '<div style="color:red">欢迎 <a class=" user-link " href="/users/thenuisance" >  ' + newUser.name + ' </a> 加入聊天室!</div>';
            var message = new Message({
                content : content
            });
            if(!fromSession){
                io.sockets.emit('systeminfo', message);
            }
        });
    }
    if (session && session.user) {
        socket.emit('loginFromSession', session.user);
        setTimeout(function() {
            login(session, "fromSession");
        }, 300);
    } else {
        socket.emit('regularLogin');
    }
    socket.on('login', function(data) {
        setTimeout(function() {
            if(userList[data.user.name]){
                socket.emit('alreadyExist');
                console.log('already')
                return;
            }else{
                socket.emit('canLogin');
                login(data);
            }
        }, 300);
    });
    socket.on('sendMsg', function(data) {
        var message = new Message(data);
        message.save(function(err) {
            if (err)// TODO handle the error
                console.log(err)
        });
        socket.broadcast.emit('receiveMsg', data);
    });
    socket.on('disconnect', function() {
        if (!socket.username) {
            return;
        }
        userLoginCount[socket.username]--;
        if (userLoginCount[socket.username] == 0) {
            var content = '<div style="color:red"><a class=" user-link " href="/users/thenuisance" >  ' + newUser.name + ' </a> 离开了</div>';
            var message = new Message({
                content : content
            });
            io.sockets.emit('systeminfo', message);
            delete userLoginCount[socket.username];
            delete userList[socket.username];
        }
        socket.broadcast.emit('updateuserlist', {
            userList : userList
        });
    });
    socket.on('chatInPravite', onChatInPravite);
});

var onChatInPravite = function(data) {
    praviteRoom[index].socket = [];
    var joinData = {
        user : data.user,
        objuser : data.objuser,
        roomId : index
    }
    userList[data.user.id].socket.emit('joinRoom', joinData);
    userList[data.objuser.id].socket.emit('joinRoom', joinData);
    praviteRoom[index].socket.push(userList[data.user.id].socket);
    praviteRoom[index].socket.push(userList[data.objuser.id].socket);
    index++;
}

server.listen(process.env.PORT || 3000);
