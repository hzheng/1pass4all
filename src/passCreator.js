/**
 * A password generator inspired by SuperGenPass(http://supergenpass.com)
 */

var app = {
    name: "1Pass4All",
    version: "0.1x" // will be updated by make
};
var debug = true; // will be turned off by make

Function.prototype.bind = function(object, moreArguments) {
    var __method__ = this;
    var prependArgs = [];
    for (var i = 1; i < arguments.length; ++i) {
        prependArgs.push(arguments[i]);
    }
    return function() {
        var args = [];
        for (var i = 0; i < prependArgs.length; ++i) {
            args.push(prependArgs[i]);
        }
        for (i = 0; i < arguments.length; ++i) {
            args.push(arguments[i]);
        }
        return __method__.apply(object, args);
    };
}; 

// utilities
function extend(destProps, srcProps) {
    if (!srcProps) {return destProps;}

    for (var i in srcProps) {
        if (srcProps.hasOwnProperty(i)) {
            var prop = srcProps[i];
            if (prop !== undefined) {
                destProps[i] = prop;
            }
        }
    }
    return destProps;
}

function log(msg) {
    if (debug) {
        try {
            console.log(msg);
        } catch (e) {
            alert(msg);
        }
    }
}

function handleError(e, context) {
    var msg = e.message || "NO_MSG";
    log("exception happened(" + context + "): " + msg);
    alert(msg);
}

function isVisible(e) {
    if (e.offsetWidth === 0 || e.offsetHeight === 0) {return false;}

    while (e.nodeName.toLowerCase() != 'body' &&
            (!e.style.display || e.style.display.toLowerCase() != 'none') &&
            (!e.style.visibility || e.style.visibility.toLowerCase() != 'hidden')) {
        e = e.parentNode;
    }
    return e.nodeName.toLowerCase() == 'body';
}
 
function setStyles(e, styles) {
    function camelize(attr) {
        return attr.replace(/-([a-z])/gi, function(s, letter) {
            return letter.toUpperCase();
        });
    }

    for (var i in styles) {
        if (styles.hasOwnProperty(i)) {
            e.style[camelize(i)] = styles[i];
            if (i == 'cssFloat') {
                e.style.styleFloat = styles[i]; // for IE
            }
        }
    }
}

function setAttributes(e, attrs) {
    for (var i in attrs) {
        if (attrs.hasOwnProperty(i)) {
            e.setAttribute(i, attrs[i]);
        }
    }
}

function createElement(tagName, parent, htm, styles, attrs) {
    var el = tagName || "div";
    if (attrs && ("type" in attrs) && document.all) { // IE cannot change type
        el = "<" + el + " type=" + attrs.type + "/>";
        delete attrs.type;
    }
    var e = document.createElement(el);
    (parent || document.body).appendChild(e);
    if (htm) {e.innerHTML = htm;}
    if (styles) {setStyles(e, styles);}
    if (attrs) {setAttributes(e, attrs);}
    return e;
}

function clearFloat(parent, extraStyle) {
    createElement('div', parent, null, extend({clear: "both"}, extraStyle));
}

function addCss(cssText) {
    var css = document.createElement("style");
    css.type = "text/css";
    if (css.styleSheet) { // IE
        css.styleSheet.cssText = cssText;
    } else {
        css.appendChild(document.createTextNode(cssText));
        //css.innerHTML = cssText;
    }
    document.body.appendChild(css);
}

// messages in different languages
var messages = {
    lang: window.navigator.userLanguage || window.navigator.language,

    _msgs: {
        cmd_gen_pass: {
            en: "Generate password",
            zh: "生成密码"
        },
        cmd_clear_pass: {
            en: "Clear password",
            zh: "清除密码"
        },
        label_domain: {
            en: "Domain(*):",
            zh: "域名（*）："
        },
        label_user: {
            en: "Username:",
            zh: "用户名："
        },
        label_master_pass: {
            en: "Master password(*):",
            zh: "主密码（*）："
        },
        label_pass_len: {
            en: "Password length:",
            zh: "密码长度："
        },
        label_iteration: {
            en: "Iteration:",
            zh: "迭代次数："
        },
        label_salt: {
            en: "Salt:",
            zh: "盐（salt）："
        },
        label_result: {
            en: "Acutual password:",
            zh: "实际密码："
        },
        error_no_domain: {
            en: "No domain found",
            zh: "未找到域名"
        },
        error_empty_domain: {
            en: "Domain is empty",
            zh: "域名为空"
        },
        error_empty_pass: {
            en: "Password is empty",
            zh: "密码为空"
        },
        error_masterpass_too_short: {
            en: "Master password is too short(less than 6)",
            zh: "主密码过短（小于6位）"
        },
        error_empty_user: {
            en: "User field is empty",
            zh: "用户名为空"
        },
        error_iteration_not_number: {
            en: "Hash iteration is not a number",
            zh: "hash迭代次数应为数字"
        }
    },

    add: function(newMsgs) {
        extend(this._msgs, newMsgs);
    },

    get: function(msgId) {
        var msg = this._msgs[msgId] || "";
        if (msg) {
            var lang = this.lang;
            var hyphen = lang.indexOf("-");
            if (hyphen > 0) { // currently, just ignore the country part
                lang = lang.substring(0, hyphen);
            }
            msg = msg[lang] || msg.en;
        }
        return msg;
    }
};

// password generator
var passCreator = {
    // constants
    PANEL_ID: "_1pass4all",
    MIN_PASS_LEN: 8,
    MAX_PASS_LEN: 26,
    VALID_PASS_RETRY: 100,

    /** Validate password */
    validate: function(pwd) {
        log("validating password " + pwd);
        if (!this._pwdPattern) {
            this._pwdPattern = new RegExp("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{" +
                    this.MIN_PASS_LEN + "," + this.MAX_PASS_LEN + "}$");
        }
        return this._pwdPattern.test(pwd);
    },

    /** Generate password(the core function) */
    generate: function(masterPwd, info, len, iteration, salt) {
        log("pwd=" + masterPwd + ";info=" + info + ";len=" + len +
                ";iteration=" + iteration + ";salt=" + salt);
        if (!len) {
            len = this.settings.passLen;
        }
        if (len < this.MIN_PASS_LEN) {
            len = this.MIN_PASS_LEN;
        } else if (len > this.MAX_PASS_LEN) {
            len = this.MAX_PASS_LEN;
        }
        masterPwd += (salt || this.settings.salt || "");
        log("salted master pass: " + masterPwd);
        info = hasher.sha224In94(info);
        log("hashed info: " + info);

        var pwd = "";
        var hashTimes = iteration || this.settings.iteration;
        log("hash " + hashTimes + " times...");
        for (var i = hashTimes - 1; i > 0; --i) { // 1 hash remaining
            pwd = hasher.hmacSha224In94(pwd + masterPwd, info);
        }
        for (var retry = 0; ; ++retry) {
            pwd = hasher.hmacSha224In94(pwd + masterPwd, info);
            log("retry " + retry + "; generated pass len=" + pwd.length);
            var subPwd = pwd.substring(0, len);
            if ((retry > this.VALID_PASS_RETRY) ||
                    (pwd.length >= len && this.validate(subPwd))) {
                return subPwd;
            }
        }
    },

    createPasswordPanel: function(container, settings, pwdValues) {
        var isBookmarkelet = (arguments.length > 2);
        var cssText = "#" + this.PANEL_ID + " {" + settings.panelCss + "}";
        cssText += "#" + this.PANEL_ID + " label{" + settings.labelCss + "}";
        cssText += "#" + this.PANEL_ID + " input{" + settings.inputCss + "}";
        cssText += "#" + this.PANEL_ID + " button{" + settings.buttonCss + "}";
        addCss(cssText);
        var panel = createElement(null, container, null, null, {id: this.PANEL_ID});
        this._panel = panel;
        if (isBookmarkelet) {
            var titleBar = createElement('div', panel, null, settings.titleBarStyle);
            // add title text and close button
            createElement('span', titleBar, this.settings.title, settings.titleStyle);
            var hideBtn = createElement('a', titleBar, "&times", settings.topBtnStyle);
            hideBtn.onclick = this._hide.bind(this);
            var moreBtn = createElement('a', titleBar, "+", settings.topBtnStyle);
            this._moreBtn = moreBtn;
            moreBtn.onclick = this._toggleMore.bind(this);
            clearFloat(titleBar);
        }
        var inputRegion = createElement('div', panel, null, settings.inputRegionStyle);
        createElement('label', inputRegion, messages.get('label_domain'));
        this._domainField = createElement('input', inputRegion, null, null,
                {value: pwdValues && pwdValues.domain || ""});
        clearFloat(inputRegion, settings.fldSepStyle);
        createElement('label', inputRegion, messages.get('label_user'));
        this._userField = createElement('input', inputRegion, null, null,
                {value: pwdValues && pwdValues.user || ""});
        clearFloat(inputRegion, settings.fldSepStyle);
        createElement('label', inputRegion, messages.get('label_master_pass'));
        this._masterPassField = createElement('input', inputRegion, null, null,
                {type: "password", value: pwdValues && pwdValues.pass || ""});
        clearFloat(inputRegion, settings.fldSepStyle);
        createElement('label', inputRegion, messages.get('label_pass_len'));
        var passLenSelect = createElement('select', inputRegion);
        this._passLenSelect = passLenSelect;
        var passLen = pwdValues && pwdValues.passLen || this.settings.passLen;
        for (var i = this.MIN_PASS_LEN; i <= this.MAX_PASS_LEN; ++i) {
            var option = createElement('option', passLenSelect, i, null, {value: i});
            if (i == passLen) {
                option.setAttribute('selected', "true");
            }
        }
        clearFloat(inputRegion, settings.fldSepStyle);
        var advancedDiv = createElement('div', inputRegion, null, settings.advancedDivStyle); 
        this._advancedDiv = advancedDiv; 
        createElement('label', advancedDiv, messages.get('label_iteration'));
        this._iterationField = createElement('input', advancedDiv, null, null,
                {value: pwdValues && pwdValues.iteration || this.settings.iteration});
        clearFloat(advancedDiv, settings.fldSepStyle);
        createElement('label', advancedDiv, messages.get('label_salt'));
        this._saltField = createElement('input', advancedDiv, null, null,
                {value: pwdValues && pwdValues.salt || this.settings.salt});

        var cmdDiv = createElement('div', panel, null, settings.cmdDivStyle);
        var genBtn = createElement('button', cmdDiv, messages.get('cmd_gen_pass'),
                settings.genBtnStyle);
        genBtn.onclick = this._genPass.bind(this);
        var clearBtn = createElement('button', cmdDiv, messages.get('cmd_clear_pass'),
                settings.clearBtnStyle);
        clearBtn.onclick = this._clearPass.bind(this);
        clearFloat(cmdDiv);
        var resultDiv = createElement('div', panel, null, settings.resultDivStyle);
        this._resultDiv = resultDiv;
        createElement('label', resultDiv, messages.get('label_result'));
        this._genPassField = createElement('input', resultDiv, null, 
                settings.genpassStyle, {readonly: "true"});
        this._errorDiv = createElement('div', panel, null, settings.errorDivStyle);
    },

    _toggleMore: function() {
        var e = this._advancedDiv;
        if (e.style.display == "none") {
            e.style.display = "block";
            this._moreBtn.innerHTML = "-";
        } else {
            e.style.display = "none";
            this._moreBtn.innerHTML = "+";
        }
    },

    _hide: function() {
        if (this._panel) {
            this._panel.style.display = "none";
        }
    },

    _genPass: function() {
        var domain = this._domainField.value;
        if (!domain) {
            this.showError('error_empty_domain');
            return;
        }
        var masterPwd = this._masterPassField.value;
        if (masterPwd.length < 6) {
            this.showError('error_masterpass_too_short');
            return;
        }
        var iteration = this._iterationField.value;
        if (isNaN(iteration)) {
            this.showError('error_iteration_not_number');
            return;
        }

        this.hideError();
        this._genPassField.value = this.generate(masterPwd,
                this.getInfo(domain, this._userField.value),
                this._passLenSelect.value, parseInt(iteration, 10), this._saltField.value);
        this._resultDiv.style.display = "block";
    },

    getInfo: function(domain, user, otherArgs) {
        var info = "";
        for (var i = 0; i < arguments.length; ++i) {
            info += arguments[i] || "";
        }
        return info;
    },

    _clearPass: function() {
        this._genPassField.value = "";
        this._resultDiv.style.display = "none";
    },

    showError: function(msgId) {
        this._resultDiv.style.display = "none";
        this._errorDiv.innerHTML = messages.get(msgId);
        this._errorDiv.style.display = "block";
    },

    hideError: function() {
        this._errorDiv.style.display = "none";
    },

    // customizable settings
    settings: {
        title: app.name + " " + app.version,
        // the following may be modified by Makefile
        passLen: 10,
        iteration: 100,
        salt: "QMrxUarMQcNvW9n4MKtsM0hY5iNlzriO"
    }
};
