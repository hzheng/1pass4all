
var passLenSelect = document.getElementById("passLen");
var passBaseSelect = document.getElementById("passBase");
var saltInput = document.getElementById("salt");
var autoSubmitInput = document.getElementById("autoSubmit");

(function () {
    function createElement(tagName, parent, htm) {
        var e = document.createElement(tagName);
        (parent || document.body).appendChild(e);
        if (htm) {e.innerHTML = htm;}
        return e;
    }

    var defaultPassLen = document.getElementById("passLenHidden").value;
    for (var i = 6; i <= 26; ++i) {
        var option = createElement('option', passLenSelect, i);
        option.setAttribute("value", i);
        if (i == defaultPassLen) {
            option.setAttribute('selected', "true");
        }
    }

    var defaultPassBase = document.getElementById("passBaseHidden").value;
    for (i = passBaseSelect.options.length - 1; i >= 0; --i) {
      if (passBaseSelect.options[i].value == defaultPassBase) {
          passBaseSelect.selectedIndex = i;
          break;
      }
    }

    var defaultAutoSubmit = document.getElementById("autoSubmitHidden").value;
    autoSubmitInput.checked = defaultAutoSubmit === "true";
})();

function newSalt(size) {
    // base64 characters
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    var maxCharIndex = chars.length - 1;
    var salts = [];
    for (var i = size || 32; i > 0; --i) {
        salts.push(chars[Math.floor(Math.random() * maxCharIndex)]);
    }
    saltInput.value = salts.join("");
}

function customize(okMsg, statusMsg) {
    var msg = document.getElementById("msg");
    msg.innerHTML = statusMsg || "";
    var bookmarklet = document.getElementById("bookmarklet");
    var bookmarklet_ie = document.getElementById("bookmarklet_ie");

    function updateHref(regex, value) {
        bookmarklet.href = bookmarklet.href.replace(regex, "$1" + value + '"');
        // Safari need unescape
        bookmarklet_ie.href = unescape(bookmarklet_ie.href).
            replace(regex, "$1" + value + '"');
    }

    updateHref(/(passLen:")[^"]*"/, passLenSelect.value);
    updateHref(/(passBase:")[^"]*"/, passBaseSelect.value);

    var iterationInput = document.getElementById("iteration");
    var iteration = parseInt(iterationInput.value, 10);
    if (isNaN(iteration)) {
        iteration = 100;
    }
    iterationInput.value = iteration;
    updateHref(/(iteration:")[^"]*"/, iteration);

    var salt = saltInput.value.replace(/['"]/g, "");
    saltInput.value = salt;
    updateHref(/(salt:")[^"]*"/, salt);

    updateHref(/(autoSubmit:")[^"]*"/, autoSubmitInput.checked ? "true" : "false");
    msg.innerHTML = okMsg;
    setTimeout(function(){msg.innerHTML = "";}, 5000);
}
