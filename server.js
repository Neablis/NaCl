// https://github.com/nko4/website/blob/master/module/README.md#nodejs-knockout-deploy-check-ins
require('nko')('8DySvvl0ISkh45FF');

var isProduction = (process.env.NODE_ENV === 'production');
var shouldForward = false;//!isProduction;
var port = (isProduction ? 80 : 8000);

var fileServer = require('./lib/fileServer');
var db = require('./lib/db');
var net = require('net');
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var socketIoWrapper = require('./lib/socketIoWrapper');

db.init(function() {
    console.log("db ready?...");
});

var app = http.createServer(server(__dirname)).listen(7999);
socketIoWrapper.wrap(app)
net.createServer(router).listen(port);


function router(socket) {
    socket.on('data', function (dataRaw) {
        socket.removeAllListeners('data');
        var data = dataRaw.toString();
        var header = data.split(/\r\n\r\n/)[0].split(/\r\n|\r|\n/);
        var headerFields = {};
        for (var i = 0; i < header.length; i++) {
            var nv = header[i].split(/:\s*/);
            var name = nv.shift().toLowerCase();
            var value = nv.join(":");
            headerFields[name] = value;
        }
//        console.log(headerFields);
        var webConnection = net.connect(7999, "0.0.0.0", function () {
            webConnection.pipe(socket).pipe(webConnection);
            webConnection.write(dataRaw);
        });

    });
}


function server(rootDir) {
    return function (req, res) {
        var uri = url.parse(req.url).pathname;
        var uriParts = uri.match(/^\/([^\/]*)\/?(.*)/);
        if (uriParts) {
            if (uriParts[1] === "directory") {
                if (shouldForward) {
                    pipeToNKO(req, res);
                    return;
                }
                 db.retrieveAllUsers(function(data) {
					var users = [];
					for (var i = 0; i < data.users.length; i++) {
						users.push(data.users[i].uuid);
					}
					res.writeHead(200, {'Content-Type': 'application/json'});
					res.end(JSON.stringify(users));
				});
				return;
            }
            else if (uriParts[1] === "getMessages") {
                if (shouldForward) {
                    pipeToNKO(req, res);
                    return;
                }
                var infoParts = uriParts[2].split('/');
                var senderUUID = infoParts[0];
                var recipientUUID = infoParts[1];
                var messages = [];
                db.retrieveAllMessages(recipientUUID, 'google.com', senderUUID, function(data) {
					for (var i = 0; i < data.messages.length; i++) {
						messages.push({s:data.messages[i].isSend,
										t:data.messages[i].timestamp,
										m:data.messages[i].message});
					}
					res.writeHead(200, {'Content-Type': 'application/json'});
					res.end(JSON.stringify(messages));
				});
                return;
            }
        }
        var filename = path.join(rootDir, uri);
        fileServer.serveFile(filename, res);
    }
}

function pipeToNKO(req, res) {
    var options = {
        hostname: "nodesferatu.2013.nodeknockout.com",
        port: 80,
        path: req.url,
        method: req.method
    };
    var connector = http.request(options, function (response) {
        response.pipe(res);
    });
    req.pipe(connector);
}


