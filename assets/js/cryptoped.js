define([], function () {

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = cryptoped;
        }
        exports.cryptoped = cryptoped;
    } else {
        this.cryptoped = cryptoped;
    }

    var _K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

    sha256.wordsHasher = _sha256Words;
    sha256.outputSize = 256;
    cryptoped.sha256 = sha256;
    sha1.wordsHasher = _sha1Words;
    sha1.outputSize = 160;
    cryptoped.sha1 = sha1;
    hmac.wordsHasher = _hmacWords;
    cryptoped.hmac = hmac;
    cryptoped.pbkdf2 = pbkdf2;
    cryptoped.hexStringToWords = hexStringToWords;
    cryptoped.wordsToHexString = wordsToHexString;

    function cryptoped() {
    }

    function pbkdf2(password, salt, iterations, keyLength, hasher) {
        var keyWords = hexStringToWords(password);
        var output = [];
        var keys = Math.ceil(8 * keyLength / hasher.outputSize);
        for (var keyIndex = 1; keyIndex <= keys; keyIndex++) {
            var message = salt + String.fromCharCode((keyIndex >>> 24) & 0xff) + String.fromCharCode((keyIndex >>> 16) & 0xff) + String.fromCharCode((keyIndex >>> 8) & 0xff) + String.fromCharCode((keyIndex >>> 0) & 0xff);
            var u = hmac.wordsHasher(keyWords, hexStringToWords(message + "\x80"), message.length * 8, hasher);
            var ui = u;
            for (var i = 1; i < iterations; i++) {
                ui = hmac.wordsHasher(keyWords, ui.concat(0x80000000), hasher.outputSize, hasher);
                for (var j = 0; j < u.length; j++) {
                    u[j] ^= ui[j];
                }
            }
            output = output.concat(u);
        }
        return output;
    }

    function hmac(key, message, hasher) {
        if (key.length >= 64) {
            return hmac.wordsHasher(hasher(key), hexStringToWords(message + "\x80"), message.length * 8, hasher);
        } else {
            return hmac.wordsHasher(hexStringToWords(key), hexStringToWords(message + "\x80"), message.length * 8, hasher);
        }
    }

    function sha256(message) {
        return sha256.wordsHasher(hexStringToWords(message + "\x80"), message.length * 8);
    }

    function sha1(message) {
        return sha1.wordsHasher(hexStringToWords(message + "\x80"), message.length * 8);
    }

    function _hmacWords(keyWords, messageWords, messageBits, hasher) {
        while (keyWords.length < 16) keyWords.push(0);
        var oKeyPad = [];
        var iKeyPad = [];
        for (var i = 0; i < 16; i++) {
            var keyWord = keyWords[i] >>> 0;
            oKeyPad[i] = (keyWord ^ 0x5c5c5c5c);
            iKeyPad[i] = (keyWord ^ 0x36363636);
        }
        var innerHash = hasher.wordsHasher(iKeyPad.concat(messageWords), 512 + messageBits);
        return hasher.wordsHasher(oKeyPad.concat(innerHash, 0x80000000), 512 + hasher.outputSize);
    }

    function _sha256Words(words, bits) {
        words.concat([0, 0]);
        while (words.length % 16) words.push(0);
        words[words.length - 2] = (Math.floor(bits / 0x100000000));
        words[words.length - 1] = (bits >>> 0);
        var a = 0x6a09e667;
        var b = 0xbb67ae85;
        var c = 0x3c6ef372;
        var d = 0xa54ff53a;
        var e = 0x510e527f;
        var f = 0x9b05688c;
        var g = 0x1f83d9ab;
        var h = 0x5be0cd19;
        var chunks = [];
        var i;
        for (i = 0; i < words.length; i += 16) {
            chunks.push(words.slice(i, i + 16));
        }
        var chunksLength = words.length / 16;
        for (var chunkIndex = 0; chunkIndex < chunksLength; chunkIndex++) {
            var chunk = chunks[chunkIndex];
            for (i = 16; i < 64; i++) {
                var w0 = chunk[i - 15] >>> 0;
                var s0 = (w0 >>> 7 | w0 << 25) ^ (w0 >>> 18 | w0 << 14) ^ (w0 >>> 3);
                var w1 = chunk[i - 2] >>> 0;
                var s1 = (w1 >>> 17 | w1 << 15) ^ (w1 >>> 19 | w1 << 13) ^ (w1 >>> 10);
                chunk[i] = chunk[i - 16] + s0 + chunk[i - 7] + s1;
            }
            var ai = a >>> 0;
            var bi = b;
            var ci = c;
            var di = d >>> 0;
            var ei = e >>> 0;
            var fi = f >>> 0;
            var gi = g >>> 0;
            var hi = h >>> 0;
            for (i = 0; i < 64; i++) {
                var S0 = (ai >>> 2 | ai << 30) ^ (ai >>> 13 | ai << 19) ^ (ai >>> 22 | ai << 10);
                var maj = (ai & bi) ^ (ai & ci) ^ (bi & ci);
                var t2 = (S0 + maj);
                var S1 = (ei >>> 6 | ei << 26) ^ (ei >>> 11 | ei << 21) ^ (ei >>> 25 | ei << 7);
                var ch = (ei & fi) ^ (~ei & gi);
                var t1 = (hi + S1 + ch + _K[i] + chunk[i]) >>> 0;
                hi = gi;
                gi = fi;
                fi = ei;
                ei = (di + t1);
                di = ci;
                ci = bi;
                bi = ai;
                ai = (t1 + t2);
            }
            a = (a + ai);
            b = (b + bi);
            c = (c + ci);
            d = (d + di);
            e = (e + ei);
            f = (f + fi);
            g = (g + gi);
            h = (h + hi);
        }
        return [a, b, c, d, e, f, g, h];
    }

    function _sha1Words(words, bits) {
        words.concat([0, 0]);
        while (words.length % 16) words.push(0);
        words[words.length - 2] = (Math.floor(bits / 0x100000000));
        words[words.length - 1] = (bits >>> 0);
        var h0 = 0x67452301;
        var h1 = 0xefcdab89;
        var h2 = 0x98badcfe;
        var h3 = 0x10325476;
        var h4 = 0xc3d2e1f0;
        var chunks = [];
        var i;
        for (i = 0; i < words.length; i += 16) {
            chunks.push(words.slice(i, i + 16));
        }
        var chunksLength = words.length / 16;
        for (var chunkIndex = 0; chunkIndex < chunksLength; chunkIndex++) {
            var chunk = chunks[chunkIndex];
            var a = h0;
            var b = h1;
            var c = h2 >>> 0;
            var d = h3;
            var e = h4;
            for (i = 0; i < 80; i++) {
                var temp;
                if (i < 16) {
                    temp = (a >>> 27 | a << 5) + e + chunk[i];
                } else {
                    var w = chunk[i - 3] ^ chunk[i - 8] ^ chunk[i - 14] ^ chunk[i - 16];
                    w = w >>> 31 | w << 1;
                    chunk[i] = w;
                    temp = (a >>> 27 | a << 5) + e + w;
                }
                if (i < 20) {
                    temp += ((b & c) | (~b & d)) + 0x5a827999;
                } else if (i < 40) {
                    temp += (b ^ c ^ d) + 0x6ed9eba1;
                } else if (i < 60) {
                    temp += ((b & c) | (b & d) | (c & d)) + 0x8f1bbcdc;
                } else {
                    temp += (b ^ c ^ d) + 0xca62c1d6;
                }

                e = d;
                d = c;
                c = b >>> 2 | b << 30;
                b = a;
                a = temp;
            }
            h0 += a;
            h1 += b;
            h2 += c;
            h3 += d;
            h4 += e;
        }
        return [h0, h1, h2, h3, h4];
    }

    function hexStringToWords(hexString) {
        while (hexString.length % 4) hexString += "\x00";
        var words = [];
        for (var i = 0; i < hexString.length; i += 4) {
            words.push(hexString.charCodeAt(i) << 24 | hexString.charCodeAt(i + 1) << 16 | hexString.charCodeAt(i + 2) << 8 | hexString.charCodeAt(i + 3));
        }
        return words;
    }

    function wordsToHexString(words) {
        var hexString = "";
        for (var i = 0; i < words.length; i++) {
            var hex = (words[i] >>> 0).toString(16);
            while (hex.length < 8) hex = "0" + hex;
            hexString += hex;
        }
        return hexString;
    }

    return cryptoped;

});