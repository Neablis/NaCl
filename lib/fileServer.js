var url = require('url');
var path = require('path');
var fs = require('fs');

var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "ico": "image/x-icon",
    "js": "text/javascript",
    "css": "text/css"};


function fileServer(rootDir) {
    return function(req, res) {
        var uri = url.parse(req.url).pathname;
        var filename = path.join(rootDir, uri);
        serveFile(filename, res);
    }
}

function serveFile(filename, res) {
    fs.stat(filename, function (err, stats) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write('404 Not Found\n');
            res.end();
            console.log("404", filename);
            return;
        }
        if (stats.isFile()) {
            var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
            res.writeHead(200, {'Content-Type': mimeType});
            var fileStream = fs.createReadStream(filename);
            fileStream.pipe(res);
//            console.log("200", filename);
        } else if (stats.isDirectory()) {
            serveFile(path.join(filename, "index.html"), res);
        } else {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.write('500 Internal server error\n');
            res.end();
            console.log("500", filename);
        }
    });
}

exports.fileServer = fileServer;
exports.serveFile = serveFile;