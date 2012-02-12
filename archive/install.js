var saltInput = document.getElementById("salt");

function createSalt(size) {
    // base64 characters
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    var maxCharIndex = chars.length - 1;
    var salts = [];
    for (var i = size || 32; i > 0; --i) {
        salts.push(chars[Math.floor(Math.random() * maxCharIndex)]);
    }
    saltInput.value = salts.join("");
}

function changeSalt() {
    var salt = saltInput.value.replace(/['"]/g, "");
    var saltRegex = /(salt:")[^"]*"/;
    var bookmarklet1 = document.getElementById("bookmarklet1");
    bookmarklet1.href = bookmarklet1.href.replace(saltRegex, "$1" + salt + '"');
    var bookmarklet2 = document.getElementById("bookmarklet2");
    // Safari need unescape
    bookmarklet2.href = unescape(bookmarklet2.href).replace(saltRegex, "$1" + salt + '"');
}
