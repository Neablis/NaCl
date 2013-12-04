define([
    // Libraries.
    'jquery',
    'cache',
    'toastr',
    'cryptoped',
    'bootstrap'
], function ($, cache, toastr, cryptoped) {

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "positionClass": "toast-top-full-width",
        "onclick": null,
        "showDuration": "1000",
        "hideDuration": "1000",
        "timeOut": "1000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }


    var login = function (user, return_user, password) {
        cache.sync('user', user);
        var wordArray = cryptoped.pbkdf2(password, user, 4096, 128, cryptoped.sha256);
        var hashword = cryptoped.wordsToHexString(wordArray);
        console.log(hashword);
        cache.sync('password', hashword);

        $.when(

            ).then(function (profile) {
                if (!return_user) {
                    toastr.info('Welcome to NaCl ' + user);
                } else {
                    toastr.info('Welcome back ' + user);
                }
                $chat_client.show();
                $login.hide();
                $user_name.val('');

                require(["chats"], function (chats) {
                    chats.init();
                });

            }).fail(function (xhr, status, message) {
                toastr.error(message, 'error')
                $user_name.val('');
            });
    };

    var check_credentials = function () {

    };

    var logout = function () {
        cache.destroy();
        cache.sync('logout', 'Hope to see you again')
        location.reload(false);
    };

    var $user_name = $('#user_name'),
        $login = $("#login"),
        $password = $("#password"),
        $chat_client = $('#chat_client');

    $('.login').click(function (e) {
        e.preventDefault();
        if (!$user_name.val().length) {
            toastr.error('User Name required', 'error');
        }
        if (!$password.val().length) {
            toastr.error('Password required', 'error');
        }
        return login($user_name.val(), false, $password.val());
    });

    $('.logout').click(function (e) {
        e.preventDefault();
        logout();
    });


    var node = document.createElement("IFRAME");
    node.async = "true";
    node.src = "http://nodeknockout.com/iframe/nodesferatu";
    node.width = '115px';
    node.height = '25px';
    node.frameBorder = "0";
    node.scrolling = "no";
    document.getElementById('vote').appendChild(node);

    if (cache.fetch('user') !== undefined && cache.fetch('password') !== undefined) {
        login(cache.fetch('user'), true, cache.fetch('password'));
    } else {
        $login.show();
        if (cache.fetch('logout') !== undefined) {
            toastr.info(cache.fetch('logout'));
            cache.delete('logout');
        }
    }


});