// Set the require.js configuration for your application.
require.config({

    // Initialize the application with the main application file and the JamJS
    // generated configuration file.
    deps: ["main"],
    // Packeges defined at jam/require.config.js required by shim libraries
    "packages": [
        {

        }
    ],
    paths: {
        // Put paths here.
        // libs
        "Api":          'api',
        "cache":        'cache',
        "lib":          'lib',
        "chats":        'chats',
        // Plug-ins.
        "jquery":       'https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min',
        "bootstrap":    'plugins/bootstrap.min',
        "socketio":     '/socket.io/socket.io',
        "toastr":       'plugins/toastr.min'
    },
    "shim": {
        "bootstrap": {
            "deps": ["jquery"]
        },
        'socketio': {
            exports: 'io'
        }
    }
});