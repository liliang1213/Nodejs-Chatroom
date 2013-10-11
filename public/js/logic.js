var user = {}, ws, defaultIcon = 'img/icon/1.jpg', socket, touser = 'all';
user.icon = defaultIcon;
var upperHeight = document.documentElement.clientHeight - 233;
$('#upper-container').height(upperHeight);
$('.inner-overflow-div').height(upperHeight);
var toolfuns = {
    'getType' : function(oObject) {
        var _t;
        return (( _t = typeof (oObject)) == "object" ? oObject == null && "null" || Object.prototype.toString.call(oObject).slice(8, -1) : _t).toLowerCase();
    }
};
var Storage = {
    'setItem' : function(key, value, isSession) {
        var storage = isSession ? sessionStorage : localStorage;
        if (toolfuns.getType(value) == 'object') {
            value = JSON.stringify(value);
        }
        storage.setItem(key, value);
    },
    'getItem' : function(key, isSession) {
        var storage = isSession ? sessionStorage : localStorage;
        return storage.getItem(key);
    }
};

function updateUserList(data) {
    $('#userList').html('');
    for (var i in data) {
        renderName(data[i]);
    }
}

function renderMsgList(data) {
    $('#msg-tbody').html('');
    for (var i = 0; i < data.length; i++) {
        if (!data[i]) {
            continue;
        }
        renderMsg(data[i].user, data[i].date, data[i].content);
    }
}

function renderName(user) {
    var newTr = '<tr><td><a user-id="" user-name="' + user.name + '" user-icon="' + user.icon + '" class="user user-list-link" href="javascript:void(0)"><img height="21" width="21" src="' + user.icon + '">  ' + user.name + '</a></td></tr>';
    $('#userList').append(newTr);
}


$('#loginModal').css("display", 'none');
socket = io.connect("http://10.210.215.113:3000");
socket.on('loginFromSession', function(user) {
    login(user);
});

socket.on('regularLogin', function() {
    $('#loginModal').modal('show');
    $('#icon-thumbnails a').click(function() {
        $('#icon-thumbnails a').each(function(index, el) {
            if ($(el).hasClass('active')) {
                $(el).removeClass('active');
                return;
            }
        });
        user.icon = $(this).attr('index');
        $(this).addClass('active');
    });

    $('#nameInput').tooltip({
        'trigger' : 'manual',
        'delay' : 5000,
        'placement' : 'top',
        'title':'请输入昵称'
    });
    $('#loginBtn').click(function() {
        if ($.trim($('#nameInput').val()) == '') {
            $('#nameInput').tooltip('show');
        } else {
            user.name = $.trim($('#nameInput').val());
            socket.emit('login', {
                user : user
            });
            socket.on('alreadyExist', function() {
                $('#nameInput').tooltip('destroy');
                $('#nameInput').tooltip({
                    'trigger' : 'manual',
                    'delay' : 5000,
                    'placement' : 'top',
                    'title' : '这个昵称已被别人用了，换一个昵称吧'
                });
                $('#nameInput').tooltip('show');
            });
            socket.on('canLogin',function(){
                login(user);
            $(window).unbind("keydown");
            });
        }
    });
    $('#nameInput').click(function() {
        $('#nameInput').tooltip('hide');
    });
    $(window).keydown(function(event) {
        if (event.keyCode == 13) {
            $('#loginBtn').trigger('click');
        }
    });
});

function login(user) {
    $('#loginModal').modal('hide');
    $('#userIcon')[0].src = user.icon;
    $('#userName').html(user.name);
    setTimeout(function() {
        $('section#main-container').css('display', '');
        editor.setContent('');
    }, 500);

    socket.on('loginRender', function(data) {
        user.id = data.id;
        renderMsgList(data.msgList);
    });
    socket.on('updateuserlist', function(data) {
        updateUserList(data.userList);
    });
    socket.on('systeminfo', function(data) {
        renderMsg(null, data.date, data.content);
    });
    socket.on('receiveMsg', function(data) {
        renderMsg(data.user, data.date, data.content);
    });
    socket.on('disconnect', function() {
        socket.emit('disconnect');
    });

}

function toFixedTwo(num) {
    if (num < 10) {
        return '0' + num;
    } else
        return num;
}

function sendMsg(content) {
    if (content == '') {
        $('#sendBtn').tooltip('show');
        setTimeout(function() {
            $('#sendBtn').tooltip('hide');
        }, 2000);
        return;
    }
    var date = new Date();
    var dateString = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '  ' + toFixedTwo(date.getHours()) + ':' + toFixedTwo(date.getMinutes()) + ':' + toFixedTwo(date.getSeconds());

    renderMsg(user, dateString, content, touser);
    socket.emit('sendMsg', {
        user : user,
        date : date,
        content : content
    });
}

function renderMsg(user, date, content, touser) {
    date = new Date(date);
    date = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + '  ' + toFixedTwo(date.getHours()) + ':' + toFixedTwo(date.getMinutes()) + ':' + toFixedTwo(date.getSeconds());
    var newTr = document.createElement('tr');
    if (!user) {
        newTr.innerHTML = '<tr ><td>' + content + '</td></tr>';
    } else {
        newTr.innerHTML = '<tr ><td><div class="nameplate"><a class=" user-link " href="/users/thenuisance"> <img class="avatar" src="' + user.icon + '" height="21" width="21" /> ' + user.name + '</a> ' + date + ' </div>' + content + '</td></tr>';
    }
    $('#msg-tbody')[0].appendChild(newTr);
    $('[js-node=scrolltop]')[0].scrollTop = $('[js-node=scrolltop]')[0].scrollHeight - $('[js-node=scrolltop]')[0].clientHeight;
    editor.setContent('');
}


$('.send-btn').live('click', function() {
    sendMsg(editor.getContent());
});
