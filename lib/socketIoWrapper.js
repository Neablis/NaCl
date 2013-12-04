var socketIo = require('socket.io');

var lookup = {};

exports.wrap = function (app) {
    var io = socketIo.listen(app, { log: false });
    io.sockets.on('connection', function (socket) {
        var verified = false;
        console.log("socket connected");
        setTimeout(function () {
            if (!verified) {
                socket.disconnect('unauthorized');
            }
        }, 2000);
        socket.on('message', function (data) {
            if (data.auth) {
                verified = true;
                socket.removeAllListeners('message');
                mapSocket(data.auth, socket);
            }
            console.log("data:", data);
        });
    });
}


function mapSocket(auth, socket) {
    if (!lookup[auth]) {
        lookup[auth] = [];
    }
    var mappings = lookup[auth];
    var mapping = {
        auth: auth,
        socket: socket
    }
    mappings.push(mapping);
    socket.on('message', function (data) {
        if (data.body) {
            console.log("noise on unrouted socket body:", data.body);
            socket.emit("message", {error: "noise on unrouted socket - " + data.body.toUpperCase()});
        } else if (data.talkto) {
            if(lookup[data.talkto] && lookup[data.talkto].length) {
                mappings.splice(mappings.indexOf(mapping), 1);
                var otherMapping = lookup[data.talkto].shift();
                otherMapping.socket.emit('message', data);
                makePipelike(mapping, otherMapping);
            }
        }
    });
    socket.on('disconnect', function () {
        mappings.splice(mappings.indexOf(mapping), 1);
    });
    announceNewPerson(auth);
}


function announceNewPerson(auth) {
    for (var name in lookup) {
        var mappings = lookup[name];
        if (mappings.length) {
            mappings[0].socket.emit("new person", {id: auth})
        }
    }
}

function makePipelike(a, b) {
    a.socket.removeAllListeners('message');
    b.socket.removeAllListeners('message');
    a.socket.on('message', function (data) {
        b.socket.emit('message', data);
    });
    b.socket.on('message', function (data) {
        a.socket.emit('message', data);
    });
}