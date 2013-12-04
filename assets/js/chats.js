/*jslint browser: true*/
define([

    // Libraries.
    'jquery',
    'cache',
    'api',
    'lib'
], function ($, cache, api, lib) {

    var chats = {};
    window.chats = chats;

    chats.init = function () {
        console.log('success');


        chats.attributes = [];
        chats.favorites = [];
        chats.$chat_list = $('#chat_client #chats_list');
        chats.$friends_list = $('#chat_client #friends_list');
        chats.$active_chat = $('#chat_client #chat');
        chats.$selector = $('#selector');

        chats.$selector.find('#all').trigger('click');

        $("#selector").on("click", chats.sort);

        $.when(
            api.Directory()
        ).then(function (directory) {
            $.each(directory, function( index, value ) {
                chats.create_chat(value);
            });

            chats.create_chat_list();
        }).fail(function (xhr, status, message) {

        });

        api.init(cache.fetch('user'), cache.fetch('password'));
    };

    chats.sort = function (e) {
        if (e.target.childNodes[1].id === 'all'){
            chats.create_chat_list();
        } else {
            chats.create_friends_list();
        }
    }

    chats.create_chat_list = function () {
        var dom = '<ul>';
        for (var key in this.attributes) {
            var obj = this.attributes[key];
            dom += '<li name="' + key + '">' + obj.get_name() + '</li>';
        }
        dom += '</ul>';

        $(this.$chat_list).empty();

        $(this.$chat_list).append( function () {
            return $(dom).click(chats.handle_click);
        });
        $(this.$friends_list).hide();
        $(this.$chat_list).show();
    };

    chats.create_friends_list = function () {
        var dom = '<ul>';
        for (var key in this.favorites) {
            var obj = this.favorites[key];
            dom += '<li name="' + key + '">' + obj.get_name() + '</li>';
        }
        dom += '</ul>';

        $(this.$friends_list).empty();

        $(this.$friends_list).append( function () {
            return $(dom).click(chats.handle_click);
        });

        $(this.$friends_list).show();
        $(this.$chat_list).hide();
    };

    chats.handle_click = function (e) {
        var guid = $(e.target).attr('name');

        if (guid !== undefined) {
            if ($(chats.$active_chat).find("[name='" + guid + "']").length !== 0) {

            } else {
                if (chats.favorites[guid] === undefined) {
                    chats.favorites[guid] = chats.attributes[guid];
                }
                $(chats.$active_chat).empty();
                $('.active').removeClass('active');
                $(e.target).addClass('active');
                chats.show_chat($(e.target).attr('name'));
            }
        }

    };

    chats.create_chat = function (name) {
        var guid = lib.generateUid();

        while(this.attributes.hasOwnProperty(guid)) {
            guid = lib.generateUid();
        }

        this.attributes[guid] = new chat(guid, name);

        return this.attributes[guid];
    };

    chats.show_chat = function (guid) {
        var chat = this.attributes[guid];

        if (chat != undefined) {
            if (!chat.initialized) {
                chat.init();
            }
            chat.show();
        }
    }

    chats.close_chat = function () {
        $(chats.$active_chat).empty();
    }

    chats.favorite = function () {
        var guid = $(chats.$active_chat.children()[0]).attr('name');
        this.favorites[guid] = chats.attributes[guid];
    }

    var chat = function (guid, name) {

        this.name = name || 'unknown';
        this.messages = [];
        this.guid = guid;
        this.dom = '';
        this.initialized = false;
        this.socket = '';

        this.init = function () {
            var that = this;
            that.socket = api.getPartner(that.name);

            that.socket.on('body', function (data) {
                var message = that.add_message(that.name, data);
                var last_message = that.dom.find('.messages');

                last_message.append(message.create_dom());

                last_message.scrollTop(last_message.prop("scrollHeight"));
            });
        }

        this.get_name = function () {
            return this.name;
        }

        this.get_messages = function () {
            return this.messages;
        }

        this.add_message = function(person, text, time){
            var tmp = new message(person, text, time);
            this.messages.push(tmp);
            return tmp;
        }

        this.show = function () {
            var that = this;
            this.dom = $(chats.$active_chat).append( function () {
                return $(that.create_dom());
            });

            this.dom.find('button').click({context: that}, that.send_message);
            this.dom.find('.close_dialog').click(function () {
                chats.close_chat();
            });

            this.dom.find('.favorite_dialog').click(function () {
                chats.favorite();
            });

            this.dom.find('.minimize_dialog').click(function (e) {
                e.preventDefault();
                var $element =  $(this);
                if ($element.hasClass('glyphicon-minus')) {
                    $element.parent().css({height: 20});
                    $element.parent().find('.input').hide();
                } else {
                    $element.parent().css({height: 400});
                    $element.parent().find('.input').show();
                }

                $element.toggleClass('glyphicon glyphicon-minus');
                $element.toggleClass('glyphicon glyphicon-fullscreen');
            });

            if (this.messages.length === 0) {
                var that = this;
                $.when(
                    api.Get_Messages(cache.fetch('user'), this.name)
                ).then(function (Messages) {
                    var last_message = that.dom.find('.messages');
                    $.each(Messages, function( index, value ) {
                        var tmp = '';
                        if (value.s) {
                            tmp = that.add_message(cache.fetch('user'), value.m, value.t);
                        } else {
                            tmp = that.add_message(that.name,value.m, value.t);
                        }
                        last_message.append(tmp.create_dom());
                    });
                }).fail(function (xhr, status, message) {

                });
            }

        }

        this.create_dom = function () {
            var dom = '<div class="chat" name="' + guid + '">';
            /*
            dom += '<span class="glyphicon glyphicon-minus minimize_dialog"></span>' +
                '<span class="glyphicon glyphicon-heart favorite_dialog"></span>' +
                '</span><span class="glyphicon glyphicon-remove close_dialog"></span>';
*/
            dom += '<div class="messages">';

            for( var x = 0; x < this.messages.length; x++) {
                dom += this.messages[x].create_dom();
            }

            dom += '</div>'
            dom += '<div class="input">' +
                        '<form class="form-inline" role="form">' +
                            '<label class="sr-only" for="message_input">Message</label>' +
                            '<input type="name" class="form-control" id="message_input" placeholder="Message">' +
                            '<button type="submit" class="btn btn-default">Send Message</button>' +
                        '</form>';
            dom += "</div></div>";
            return dom;
        }

        this.send_message = function (e) {
            e.preventDefault();
            var input = $(e.target).prev(),
                value = input.val();

            if (value.length !== 0) {
                var message = e.data.context.add_message(cache.fetch('user'), value);
                var last_message = e.data.context.dom.find('.messages');

                last_message.append(message.create_dom());

                last_message.scrollTop(last_message.prop("scrollHeight"));
                e.data.context.socket.send(value);

                input.val('');
            }
        }

        return this;
    };

    var message = function (person, text, time) {
        var options = {
            weekday: "long", year: "numeric", month: "short",
            day: "numeric", hour: "2-digit", minute: "2-digit"
        };

        this.text = text || 'unknown';
        this.person = person || 'unkown';

        if (time) {
            this.time = new Date(time).timeNow();
        } else {
            this.time = (new Date()).timeNow();
        }

        this.getPerson = function () {
            return this.person;
        }

        this.getMessage = function () {
            return this.text;
        }

        this.create_dom = function () {
            if (person === cache.fetch('user')) {
                return '<p class="message triangle-right left self">' +
                    this.person + ": " +
                    this.text +
                    '<br>' + this.time +
                    '</p>';
            } else {
                return '<p class="message triangle-right left">' +
                    this.person + ": " +
                    this.text +
                    '<br>' + this.time +
                    '</p>';
            }
        }

        return this;
    };

    return chats;

});