var db;

module.exports = {
    init: function (callback) {
        var dbConn = require('mongodb').MongoClient;
        dbConn.connect('mongodb://naclDBUser:mBpSRlg1LqdxRoXPZrxwADxSQThnUfWsPzfRtcIkekgpOZXbgYARD7QLIFTc@ds053788.mongolab.com:53788/nacl', function (err, inDB) {
            if (err) {
                console.log(err.message);
            }
            db = inDB;
            if(callback) callback();
        });
        /*, function (err, db) {
            if (err) {
                // ummm let's log an error ?
                console.log(err.message);
            }
            userUUID
            dblib.userExists(db, 'dylan', function (doesExist) {
                console.log(doesExist);
            });
            userUUID
            dblib.createUser(db, 'dylan', function (success) {
                console.log(success);
            });
            userUUID
            dblib.removeUser(db, 'dylan', function (success) {
                console.log(success);
            });
            isSend, message, domain, senderUUID, recipientUUID
            dblib.logMessage(db, true, 'this be my message', 'google.com', 'dylanwuzhere', 'davidwuzthere', function (success) {
                console.log(success);
            });
            userUUID, dateFrom
            dblib.retrieveMessages(db, 'dylanwuzhere', new Date(2013, 01, 01), function (jsonResponse) {
                console.log(jsonResponse);
            });
        });*/
    },

    // returns true if user creation successful
    createUser: function (user, callback) {
        var success = false;
        db.collection('users').insert({uuid: user}, {w: 1}, function (err, objects) {
            if (err)
                console.log(err.message);
            else
                success = true;
            return callback(success);
        });
    },
    // returns true if user removal successful
    removeUser: function (user, callback) {
        var success = false;
        db.collection('users').remove({uuid: user}, function (err, objects) {
            if (err) {
                console.log(err.message);
            }
            else {
                success = true;
            }
            return callback(success);
        });
    },
    // returns true if user exists
    userExists: function (user, callback) {
        var exists = false;
        db.collection('users').find({uuid: user}).count(function (err, count) {
            if (err) {
                console.log(err.message);
            }
            else {
                if (count > 0)
                    exists = true;
            }
            return callback(exists);
        });
    },
    // returns true if message created
    logMessage: function (isSend, message, domain, senderUUID, recipientUUID, callback) {
        var success = false;
        db.collection('messages').insert({isSend: isSend, message: message, domain: domain,
                senderUUID: senderUUID,
                recipientUUID: recipientUUID,
                timestamp: new Date()}, {w: 1},
            function (err, objects) {
                if (err)
                    console.log(err.message);
                else
                    success = true;
                return callback(success);
            });
    },
    // returns all message since date to/from user
    retrieveMessages: function (user, fromDate, curDomain, callback) {
        var response = {docs: [], error: false, count: 0};
        db.collection('messages').find({timestamp: {"$gte": fromDate},
            $or: [
                {isSend: true, $or: [
                    {senderUUID: user},
                    {recipientUUID: user, domain: curDomain}
                ]},
                {isSend: false, $or: [
                    {recipientUUID: user},
                    {senderUUID: user, domain: curDomain}
                ]}
            ]})
            .toArray(function (err, docs) {
                if (err) {
                    console.log(err.message);
                    response.error = true;
                }
                else {
                    response.docs = docs;
                    response.count = docs.length;
                }
                return callback(response);
            });
    },
    // returns all message to recipientUUID from senderUUID
    retrieveAllMessages: function (recipientUUID, recipientDomain, senderUUID, callback) {
        var response = {messages: [], error: false, count: 0};
        db.collection('messages').find({
            $or: [
                {isSend: true, senderUUID: senderUUID, recipientUUID: recipientUUID, domain: recipientDomain},
                {isSend: false, recipientUUID: senderUUID}
            ]})
            .toArray(function (err, messages) {
                if (err) {
                    console.log(err.message);
                    response.error = true;
                }
                else {
                    response.messages = messages;
                    response.count = messages.length;
                }
                return callback(response);
            });
    },
    // returns all message since date to/from user
    retrieveAllUsers: function (callback) {
        var response = {users: [], error: false, count: 0};
        db.collection('users').find({},{_id:0}).sort({uuid:1})
            .toArray(function (err, users) {
                if (err) {
                    console.log(err.message);
                    response.error = true;
                }
                else {
                    response.users = users;
                    response.count = users.length;
                }
                return callback(response);
            });
    }
};
