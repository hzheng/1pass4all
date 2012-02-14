/**
 *  Secure hash functions(currently support SHA256 and SHA224)
 *  and HMAC(currently support HMAC-SHA256 and HMAC-SHA224)
 *
 * Reference:
 * http://en.wikipedia.org/wiki/SHA-2
 * http://en.wikipedia.org/wiki/HMAC
 */

// utilities
/** Convert a string to binary format(i.e. array of big-endian 32-bit words).
 *  The result is right padded with 0's.
 */
function str2bin(str) {
    var bin = [];
    for(var i = 0, len = str.length << 3; i < len; i += 8) {
        bin[i >> 5] |= (str.charCodeAt(i >> 3) & 0xFF) << (24 - (i & 0x1F));
    }
    return bin;
}

/** Convert a binary format(i.e. array of big-endian 32-bit words) to a hex string.
 */
function bin2hex(bin) {
    var table = "0123456789abcdef";
    var hex = "";
    for(var i = 0, len = bin.length << 2; i < len; ++i) {
        hex += table.charAt((bin[i >> 2] >> (((3 - (i & 3)) << 3) + 4)) & 0xF);
        hex += table.charAt((bin[i >> 2] >> ((3 - (i & 3)) << 3)) & 0xF);
    }
    return hex;
}

/** Repack bit blocks from a larger unit to a small one.
 *  Packing starts from the lower bits.
 *  If pad is true, input will be right padded when necessary.
 *  Note: input may be modified in the process.
 */
function shortenBitBlock(bitBlocks, longBits, shortBits, pad) {
    if (pad) {
        var gcd = function(a, b) {
            return b === 0 ? a : gcd(b, a % b);
        };
        var modulo = shortBits / gcd(longBits, shortBits);
        var leftover = bitBlocks.length % modulo;
        if (leftover) {
            for (var i = modulo - leftover; i > 0; --i) {
                bitBlocks.push(0);
            }
        }
    }
    var result = [];
    var mask = (1 << shortBits) - 1;
    var bits = longBits;
    for (var index = bitBlocks.length - 1; index >= 0; ) {
        var n = bitBlocks[index];
        var shift = shortBits;
        if (bits < shortBits && --index >= 0) { // borrow from higher long-bit
            n |= ((bitBlocks[index] & ((1 << (shortBits - bits)) - 1)) << bits);
            shift -= bits;
            bits += longBits;
        }
        result.unshift(n & mask);
        if (index < 0) {break;}
        bitBlocks[index] >>>= shift;
        bits -= shortBits;
        if (bits <= 0) { // actually '==' is OK
            --index;
            bits += longBits;
        }
    }
    return result;
}

/** Lossy base94: chop from 32-bit chunks into 7-bit chunks, whose value range
 *  from 0 to 127, then filter out those larger than 94.
 */
function base94(_32bitBlocks, pad) {
    var _7bitBlocks = shortenBitBlock(_32bitBlocks, 32, 7, pad);
    _7bitBlocks = _7bitBlocks.map(function(n) {return n < 94 ? String.fromCharCode(33 + n) : "";});
    return _7bitBlocks.join("");
}

/** Lossless base64: chop from 32-bit chunks into 6-bit chunks, then use
 *  Base64 table. 
 */
function base64(_32bitBlocks, pad) {
    var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var _6bitBlocks = shortenBitBlock(_32bitBlocks, 32, 6, pad);
    _6bitBlocks = _6bitBlocks.map(function(n) {return charSet[n];});
    return _6bitBlocks.join("");
}

/** Standard Base64 algorithm. 
 */
function base64_str(str) {
    var len = str.length;
    var padding = "";
    switch (len % 3) {
        case 1: len += 2; padding = "=="; break;
        case 2: len += 1; padding = "="; break;
    }
    var code = base64(str2bin(str), true);
    // Or:
    // for (var i = (96 - len * 8 % 96) / 8; i > 0; --i) {str += "\0";}
    // var code = base64(str2bin(str), false);
    return code.substring(0, len * 4 / 3 - padding.length) + padding;
}

/** Lossy base62: chop from 32-bit chunks into 6-bit chunks, then use
 *  Base64 table excluding "+" and "/", namely, alphanumeric charset.
 */
function base62(_32bitBlocks, pad) {
    var charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var _6bitBlocks = shortenBitBlock(_32bitBlocks, 32, 6, pad);
    _6bitBlocks = _6bitBlocks.map(function(n) {return n < 62 ? charSet[n] : "";});
    return _6bitBlocks.join("");
}

/** Lossy base10: chop from 32-bit chunks into 4-bit chunks, whose value range
 *  from 0 to 16, then filter out those larger than 10.
 */
function base10(_32bitBlocks, pad) {
    var _4bitBlocks = shortenBitBlock(_32bitBlocks, 32, 4, pad);
    _4bitBlocks = _4bitBlocks.map(function(n) {return n < 10 ? "" + n : "";});
    return _4bitBlocks.join("");
}

/** 32-bit unsigned integer addition which handles overflow properly.
 */
function add(x, y) {
    return (x & 0x7FFFFFFF) + (y & 0x7FFFFFFF) ^ (x & 0x80000000) ^ (y & 0x80000000);
}

/** Right rotate bits.
 */
function rightRotate(n, bits) {
    return (n >>> bits) | (n << (32 - bits)); 
}

if (!Array.prototype.map) { // for IE
    Array.prototype.map = function(fun, thisObj) {
        var res = [];
        var scope = thisObj || window;
        for (var i = 0; i < this.length; ++i) {
            if (i in this) {
                res[i] = fun.call(scope, this[i], i, this);
            }
        }
        return res;
    };
}

// hashers
var hasher = {
    sha256: function(message, is224) {
        return this._sha256Hash(str2bin(message), message.length << 3, is224);
    },

    _sha256Hash: function(message, bitlen, is224) {
        var H = is224 ? [0xC1059ED8, 0x367CD507, 0x3070DD17, 0xF70E5939,
                         0xFFC00B31, 0x68581511, 0x64F98FA7, 0xBEFA4FA4] :
                        [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
                         0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
        var K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
                 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
                 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
                 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
                 0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
                 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
                 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
                 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
                 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
                 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
                 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
                 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
                 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
                 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
                 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
                 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];
        var w = [];
        // pre-processing
        message[bitlen >> 5] |= 0x80 << (24 - (bitlen & 0x1F));
        message[((bitlen + 64 >> 9) << 4) + 15] = bitlen;
        // process the message in successive 512-bit chunks
        for (var msgIndex = 0; msgIndex < message.length; msgIndex += 16) {
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];
            var e = H[4];
            var f = H[5];
            var g = H[6];
            var h = H[7];
            for (var i = 0; i < 64; ++i) {
                if (i < 16) { // original words
                    w[i] = message[i + msgIndex];
                } else { // extended words
                    var s0 = rightRotate(w[i - 15], 7) ^
                             rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
                    var s1 = rightRotate(w[i - 2], 17) ^
                             rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
                    w[i] = add(add(add(s1, w[i - 7]), s0), w[i - 16]);
                }
                // start shuffling
                s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
                var maj = (a & b) ^ (a & c) ^ (b & c);
                var t2 = add(s0, maj);
                s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
                var ch = (e & f) ^ ((~e) & g);
                var t1 = add(add(add(add(h, s1), ch), K[i]), w[i]);
                h = g;
                g = f;
                f = e;
                e = add(d, t1);
                d = c;
                c = b;
                b = a;
                a = add(t1, t2);
            }
            H[0] = add(a, H[0]);
            H[1] = add(b, H[1]);
            H[2] = add(c, H[2]);
            H[3] = add(d, H[3]);
            H[4] = add(e, H[4]);
            H[5] = add(f, H[5]);
            H[6] = add(g, H[6]);
            H[7] = add(h, H[7]);
        }
        return is224 ? H.slice(0, 7) : H;
    },

    sha256InHex: function(message, is224) {
        return bin2hex(this.sha256(message, is224));
    },

    sha224In94: function(message) {
        return base94(this.sha256(message, true));
    },

    hmacSha256: function(key, msg, is224) {
        return this._hmacSha256(str2bin(key), key.length << 3, str2bin(msg), msg.length << 3, is224);
    },

    _hmacSha256: function(key, keyBitLen, msg, msgBitLen, is224) {
        var blockSize = 16; // in 32-bit word
        var blockBits = blockSize << 5;
        if (keyBitLen > blockBits) {
            key = this._sha256Hash(key, keyBitLen, is224);
        }

        var innerPadded = [], outerPadded = [];
        for (var i = 0; i < blockSize; ++i) {
            innerPadded[i] = key[i] ^ 0x36363636;
            outerPadded[i] = key[i] ^ 0x5C5C5C5C;
        }
        var hash = this._sha256Hash(innerPadded.concat(msg), blockBits + msgBitLen, is224);
        return this._sha256Hash(outerPadded.concat(hash), blockBits + (is224 ? 224 : 256), is224);
    },

    hmacSha256InHex: function(key, msg, is224) {
        return bin2hex(this.hmacSha256(key, msg, is224));
    },

    hmacSha224In10: function(key, msg) {
        return base10(this.hmacSha256(key, msg, true), true);
    },

    hmacSha224In62: function(key, msg) {
        return base62(this.hmacSha256(key, msg, true), true);
    },

    hmacSha224In64: function(key, msg) {
        return base64(this.hmacSha256(key, msg, true), true);
    },

    hmacSha224In94: function(key, msg) {
        return base94(this.hmacSha256(key, msg, true));
    }
};

