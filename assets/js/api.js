define([
    // Libraries.
    'socketio', 'cache', 'cryptoped', 'BigInt16'
], function (io, cache, cryptoped, BigInt16) {
    var API = {};

    API.post = function (data, options) {
        options = options || {};
        var url, deferred = $.Deferred(),
            post_data = {},
            post_body;


        url = options.url;
        post_body = JSON.stringify(post_data) + "\r\n";

        // POST
        $.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: post_body,
            xhrFields: {
                withCredentials: false
            },
            success: function (data, textStatus, jqXHR) {
                deferred.resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrow) {
                deferred.reject(jqXHR);
            }
        });

        return deferred.promise();
    };

    API.get = function (data, options) {
        options = options || {};
        var url, deferred = $.Deferred();

        url = data.url;

        // POST
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            xhrFields: {
                withCredentials: false
            },
            success: function (data, textStatus, jqXHR) {
                deferred.resolve(data);
            },
            error: function (jqXHR, textStatus, errorThrow) {
                deferred.reject(jqXHR);
            }
        });

        return deferred.promise();
    };

    API.Directory = function () {
        return API.get({url: document.URL + 'directory'});
    }

    API.Get_Messages = function (me, user) {
        return API.get({url: document.URL + 'getMessages/' + me + "/" + user});
    }

    var knownUsers = {};
    var socketPool = [];

//    var base = new BigInt16("1814159566819970307982681716822107016038920170504391457462563485198126916735167260215619523429714031");
//    var divisor = new BigInt16("5371393606024775251256550436773565977406724269152942136415762782810562554131599074907426010737503501");
    var base = new BigInt16("622288097498926496141095869268883999563096063592498055290461");
    var divisor = new BigInt16("610692533270508750441931226384209856405876657993997547171387");


    function checkPoolSize() {
        if(socketPool.length < 2) {
            var socket = io.connect(window.location.href);

            socket.on('connect', function () {
                console.log('connect');
                checkPoolSize()
                socket.emit('message', { auth: user });
            });
            socket.on('connecting', function () {
                console.log('connecting');
            });
            socket.on('disconnect', function () {
                console.log('disconnect');
                checkPoolSize()
            });
            socket.on('connect_failed', function () {
                console.log('connect_failed');
                setTimeout(checkPoolSize, 5000);
            });
            socket.on('error', function () {
                console.log('error');
                setTimeout(checkPoolSize, 5000);
            });
            socket.on('message', function (data) {
                for(var name in data) {
                    console.log("%c      ---event on unrouted socket: '" + name + "', " + data[name] + "---", "color:lightgray");
                }
                if (data.talkto) {
                    console.log("%c      ---talkto event on unrouted socket---", "color:red");
                    socket.emit("message", {iAm: cache.fetch('user')});
                }
                if (data.iAm) {
                    var iAm = data.iAm;
                    if(createUser(iAm) && makeKeys(iAm)) {
                        socket.emit("message", {
                            keyExchange: {
                                user: cache.fetch('user'),
                                publicKey:knownUsers[iAm].publicKey.toString()
                            }
                        });
                    }
                }
                if (data.keyExchange) {
                    var iAm = data.keyExchange.user;
                    var theirPublic = data.keyExchange.publicKey;
                    if(createUser(iAm) && makeKeys(iAm)) {
                        socket.emit("message", {keyExchange: {user: cache.fetch('user'), publicKey:knownUsers[iAm].publicKey.toString()}});
                    }
                    knownUsers[iAm].theirPublic = new BigInt16("0x" + data.keyExchange.publicKey);
                    if(!knownUsers[iAm].sharedKey) {
                        knownUsers[iAm].sharedKey = knownUsers[iAm].theirPublic.aToBModC(knownUsers[iAm].privateKey, divisor);
                        console.log(knownUsers[iAm].sharedKey.toString());
                    }
                }

                function createUser(id) {
                    if(knownUsers[id]) return false;
                    knownUsers[id] = {};
                    return true;
                }
                function makeKeys(id) {
                    var user = knownUsers[id];
                    if(user.privateKey) return false;
                    var wordArray = cryptoped.pbkdf2(cache.fetch('password'), cache.fetch('user') + ":" + id, 4096, 64, cryptoped.sha256);
                    user.privateKey = new BigInt16("0x" + cryptoped.wordsToHexString(wordArray));
                    user.publicKey = base.aToBModC(user.privateKey, divisor);
                    return true;
                }
            });
            socket.on('anything', function (data) {
                console.log('anything', data);
            });
            socket.on('reconnect_failed', function () {
                console.log('reconnect_failed');
                checkPoolSize();
            });
            socket.on('reconnect', function () {
                console.log('reconnect');
            });
            socket.on('reconnecting', function () {
                console.log('reconnecting');
            });


            socket.on('incoming', function (data) {
                console.log('incoming', data);
            });
            socket.on('new person', function (data) {
//                console.log('new person', data);
            });
            socketPool.push(socket);
        }
    }

    API.getPartner = function (talkto) {
        if (!socketPool.length) {
            console.log("!!! no sockets available !!!");
            return null;
        }
        var socket = socketPool.shift();
        checkPoolSize();
        socket.emit('message', {talkto: talkto});
        socket.on('message', function(data) {
            if(data.body) {
                console.log("incoming cryped", data.body);
                data.body = CryptoJS.TripleDES.decrypt(data.body, knownUsers[talkto].sharedKey.toString()).toString(CryptoJS.enc.Latin1);
            }
            for(var name in data) {
                announce(name, data[name]);
            }
        });
        var eventMap = [];
        function announce(eventName, data) {
            console.log("%c      ---event on " + talkto + ": '" + eventName + "', " + data + "---", "color:lightgray");
            if(!eventMap[eventName]) {
                return;
            }
            var listeners = eventMap[eventName];
            for (var i = 0; i < listeners.length; i++) {
                listeners[i](data);
            }
        }
        return {
            send: function(message) {
                var encrypted = CryptoJS.TripleDES.encrypt(message, knownUsers[talkto].sharedKey.toString()).toString();
                console.log("encrytped", encrypted);
                socket.emit('message', {body: encrypted});
            },
            on: function(eventName, listener) {

                if(!eventMap[eventName]) {
                    eventMap[eventName] = [];
                }
                eventMap[eventName].push(listener);
            }
        }
    };

    var user;
    var password;
    API.init = function(inUser, inPassword) {
        user = inUser;
        password = inPassword;
        checkPoolSize();

    };


    return API;
});