/*
 * A basic Cache
 */
define([
    // Plugins.
],
function () {
    'use strict';

    var dictionary = {};

    var Cache = {};

    Cache.fetch = function (key) {
        var tmp = null;

        if (!key) {
            return null;
        }


//        tmp = localStorage[key];
        tmp = dictionary[key];
        if (tmp !== undefined) {
            tmp = JSON.parse(tmp);

        }

        if (tmp === "true") {
            tmp = true;
        } else if (tmp === "false") {
            tmp = false;
        }
        return tmp;
    };

    Cache.sync = function (key, data) {

        if (!key || !data) {
            return null;
        }

//        localStorage.setItem(key, JSON.stringify(data));
        dictionary[key] = JSON.stringify(data);
    };
    Cache.delete = function (key) {

        if (!key) {
            return null;
        }
        delete dictionary[key]
//        return localStorage.removeItem(key);

    };

    Cache.destroy = function () {
        dictionary = {};
//        localStorage.clear();
    };

    Cache.all = function () {
        var values, i, value, val;
//        for (i in window.localStorage) {
        for (i in dictionary) {
//            value = val.split(",");
//            values[i] = value[1];
            values[i] = value[dictionary[i]];
        }

        return values;
    };


    return Cache;

});